package controllers

import (
	"edusmart/models"
	"edusmart/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserController struct {
	DB *gorm.DB
}

func (uc *UserController) GetProfile(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID := userIDStr.(uuid.UUID)

	var user models.User
	if err := uc.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":        user.ID,
			"name":      user.Name,
			"email":     user.Email,
			"role":      user.Role,
			"avatar_url": user.AvatarURL,
		},
	})
}

func (uc *UserController) UploadAvatar(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID := userIDStr.(uuid.UUID)

	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No avatar file provided"})
		return
	}
	defer file.Close()

	// Check file size (max 2MB)
	if header.Size > 2*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds 2MB limit"})
		return
	}

	// Upload to Azure
	publicURL, err := utils.UploadAvatar(file, header)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update user in DB
	if err := uc.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", publicURL).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user avatar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Avatar uploaded successfully",
		"avatar_url": publicURL,
	})
}
