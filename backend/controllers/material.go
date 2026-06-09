package controllers

import (
	"edusmart/models"
	"edusmart/utils"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MaterialController struct {
	DB *gorm.DB
}

var ValidSubjects = map[string]bool{
	"Pemrograman Dasar":         true,
	"Pemrograman Web":           true,
	"Pemrograman Mobile":        true,
	"Basis Data":                true,
	"Jaringan Komputer":         true,
	"Sistem Operasi":            true,
	"Keamanan Jaringan":         true,
	"Algoritma & Struktur Data": true,
	"Rekayasa Perangkat Lunak":  true,
	"Cloud Computing":           true,
	"Kecerdasan Buatan":         true,
	"Analisis & Desain Sistem":  true,
}

// Teacher: Upload Material
func (mc *MaterialController) UploadMaterial(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "File is required"})
		return
	}
	defer file.Close()

	title := c.PostForm("title")
	subject := c.PostForm("subject")
	description := c.PostForm("description")

	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Title is required"})
		return
	}

	if !ValidSubjects[subject] {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid subject"})
		return
	}

	contentType := header.Header.Get("Content-Type")
	if contentType != "application/pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Only PDF files are allowed"})
		return
	}

	// max 20MB
	if header.Size > 20*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "File size exceeds 20MB limit"})
		return
	}

	fileURL, err := utils.UploadMaterial(file, teacherID.String())
	if err != nil {
		log.Printf("Azure upload error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to upload file to storage"})
		return
	}

	material := models.Material{
		TeacherID:   teacherID,
		Title:       title,
		Subject:     subject,
		Description: description,
		FileURL:     fileURL,
		FileName:    header.Filename,
		FileSizeKB:  int(header.Size / 1024),
	}

	if err := mc.DB.Create(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to save material to database"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Materi berhasil diupload",
		"data":    material,
	})
}

// Teacher: Get Materials
func (mc *MaterialController) GetTeacherMaterials(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)

	subject := c.Query("subject")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query := mc.DB.Where("teacher_id = ?", teacherID)

	if subject != "" {
		query = query.Where("subject = ?", subject)
	}
	if search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}

	var totalItems int64
	query.Model(&models.Material{}).Count(&totalItems)

	var materials []models.Material
	query.Order("created_at desc").Offset(offset).Limit(limit).Find(&materials)

	totalPages := int(totalItems) / limit
	if int(totalItems)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"materials": materials,
			"pagination": gin.H{
				"current_page": page,
				"total_pages":  totalPages,
				"total_items":  totalItems,
				"limit":        limit,
			},
		},
	})
}

// Teacher: Delete Material
func (mc *MaterialController) DeleteMaterial(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)
	materialID := c.Param("id")

	var material models.Material
	if err := mc.DB.Where("id = ? AND teacher_id = ?", materialID, teacherID).First(&material).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"status": "error", "message": "Anda tidak memiliki izin atau materi tidak ditemukan"})
		return
	}

	// Delete from Azure Storage
	err := utils.DeleteMaterialBlob(material.FileURL)
	if err != nil {
		log.Printf("Warning: Failed to delete blob %s: %v", material.FileURL, err)
		// Continue to delete from DB even if blob deletion fails
	}

	if err := mc.DB.Delete(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to delete material from database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Materi berhasil dihapus",
	})
}

// Student: Get Filtered Materials
func (mc *MaterialController) GetStudentMaterials(c *gin.Context) {
	subjectsParam := c.Query("subjects")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))
	offset := (page - 1) * limit

	query := mc.DB.Model(&models.Material{}).Preload("Teacher")

	if subjectsParam != "" {
		subjectsList := strings.Split(subjectsParam, ",")
		query = query.Where("subject IN ?", subjectsList)
	}

	if search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}

	var totalItems int64
	query.Count(&totalItems)

	var materials []models.Material
	query.Order("created_at desc").Offset(offset).Limit(limit).Find(&materials)

	totalPages := int(totalItems) / limit
	if int(totalItems)%limit != 0 {
		totalPages++
	}

	type MaterialResponse struct {
		ID          uuid.UUID `json:"id"`
		Title       string    `json:"title"`
		Subject     string    `json:"subject"`
		Description string    `json:"description"`
		FileURL     string    `json:"file_url"`
		FileName    string    `json:"file_name"`
		FileSizeKB  int       `json:"file_size_kb"`
		TeacherName string    `json:"teacher_name"`
		CreatedAt   string    `json:"created_at"`
	}

	var response []MaterialResponse
	for _, m := range materials {
		response = append(response, MaterialResponse{
			ID:          m.ID,
			Title:       m.Title,
			Subject:     m.Subject,
			Description: m.Description,
			FileURL:     m.FileURL,
			FileName:    m.FileName,
			FileSizeKB:  m.FileSizeKB,
			TeacherName: m.Teacher.Name,
			CreatedAt:   m.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"materials": response,
			"pagination": gin.H{
				"current_page": page,
				"total_pages":  totalPages,
				"total_items":  totalItems,
				"limit":        limit,
			},
		},
	})
}

// Student/Teacher: Get Material Detail
func (mc *MaterialController) GetMaterialDetail(c *gin.Context) {
	materialID := c.Param("id")

	var material models.Material
	if err := mc.DB.Preload("Teacher").Where("id = ?", materialID).First(&material).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Material not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"id":           material.ID,
			"title":        material.Title,
			"subject":      material.Subject,
			"description":  material.Description,
			"file_url":     material.FileURL,
			"file_name":    material.FileName,
			"file_size_kb": material.FileSizeKB,
			"teacher_name": material.Teacher.Name,
			"teacher_id":   material.TeacherID,
			"created_at":   material.CreatedAt,
			"updated_at":   material.UpdatedAt,
		},
	})
}
