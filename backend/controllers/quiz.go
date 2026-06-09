package controllers

import (
	"edusmart/models"
	"edusmart/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QuizController struct {
	DB *gorm.DB
}

type CreateQuizInput struct {
	Title            string `json:"title" binding:"required"`
	Description      string `json:"description"`
	Topic            string `json:"topic" binding:"required"`
	TimeLimitMinutes int    `json:"time_limit_minutes" binding:"required,min=1"`
}

type AIGenerateInput struct {
	Topic      string `json:"topic" binding:"required"`
	Count      int    `json:"count" binding:"required,min=1,max=10"`
	Difficulty string `json:"difficulty" binding:"required,oneof=easy medium hard"`
}

// Teacher routes
func (qc *QuizController) CreateQuiz(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)

	var input CreateQuizInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	quiz := models.Quiz{
		TeacherID:        teacherID,
		Title:            input.Title,
		Description:      input.Description,
		Topic:            input.Topic,
		TimeLimitMinutes: input.TimeLimitMinutes,
		Status:           "draft",
	}

	if err := qc.DB.Create(&quiz).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create quiz"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Quiz created successfully", "quiz": quiz})
}

func (qc *QuizController) GetTeacherQuizzes(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)

	var quizzes []models.Quiz
	qc.DB.Where("teacher_id = ?", teacherID).Find(&quizzes)
	c.JSON(http.StatusOK, gin.H{"quizzes": quizzes})
}

func (qc *QuizController) GetQuizDetails(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)
	quizID := c.Param("id")

	var quiz models.Quiz
	if err := qc.DB.Where("id = ? AND teacher_id = ?", quizID, teacherID).First(&quiz).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
		return
	}

	var questions []models.Question
	qc.DB.Preload("Options").Where("quiz_id = ?", quizID).Find(&questions)

	c.JSON(http.StatusOK, gin.H{
		"quiz":      quiz,
		"questions": questions,
	})
}

func (qc *QuizController) PublishQuiz(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)
	quizID := c.Param("id")
	
	// Ensure quiz has at least 1 question
	var count int64
	qc.DB.Model(&models.Question{}).Where("quiz_id = ?", quizID).Count(&count)
	if count == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot publish quiz without questions"})
		return
	}

	if err := qc.DB.Model(&models.Quiz{}).Where("id = ? AND teacher_id = ?", quizID, teacherID).Update("status", "published").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish quiz"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiz published successfully"})
}

func (qc *QuizController) UnpublishQuiz(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)
	quizID := c.Param("id")

	if err := qc.DB.Model(&models.Quiz{}).Where("id = ? AND teacher_id = ?", quizID, teacherID).Update("status", "draft").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unpublish quiz"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiz unpublished successfully"})
}

func (qc *QuizController) DeleteQuiz(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)
	quizID := c.Param("id")

	tx := qc.DB.Begin()

	// Hapus StudentAnswer dan QuizSession
	var sessions []models.QuizSession
	tx.Where("quiz_id = ?", quizID).Find(&sessions)
	for _, s := range sessions {
		tx.Where("session_id = ?", s.ID).Delete(&models.StudentAnswer{})
	}
	tx.Where("quiz_id = ?", quizID).Delete(&models.QuizSession{})

	// Hapus AIFeedback dan QuizResult
	var results []models.QuizResult
	tx.Where("quiz_id = ?", quizID).Find(&results)
	for _, r := range results {
		tx.Where("result_id = ?", r.ID).Delete(&models.AIFeedback{})
	}
	tx.Where("quiz_id = ?", quizID).Delete(&models.QuizResult{})

	// Hapus Option dan Question
	var questions []models.Question
	tx.Where("quiz_id = ?", quizID).Find(&questions)
	for _, q := range questions {
		tx.Where("question_id = ?", q.ID).Delete(&models.Option{})
	}
	tx.Where("quiz_id = ?", quizID).Delete(&models.Question{})

	// Hapus Quiz
	if err := tx.Where("id = ? AND teacher_id = ?", quizID, teacherID).Delete(&models.Quiz{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete quiz"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Quiz deleted successfully"})
}

type AddQuestionInput struct {
	QuestionText string   `json:"question_text" binding:"required"`
	Options      []string `json:"options" binding:"required,len=4"`
	CorrectIndex int      `json:"correct_index" binding:"min=0,max=3"`
}

func (qc *QuizController) AddManualQuestion(c *gin.Context) {
	quizIDStr := c.Param("id")
	quizID, err := uuid.Parse(quizIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	var input AddQuestionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := qc.DB.Begin()

	question := models.Question{
		QuizID:       quizID,
		QuestionText: input.QuestionText,
		Source:       "manual",
	}
	if err := tx.Create(&question).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save question"})
		return
	}

	for i, optText := range input.Options {
		isCorrect := (i == input.CorrectIndex)
		opt := models.Option{
			QuestionID: question.ID,
			OptionText: optText,
			IsCorrect:  isCorrect,
		}
		if err := tx.Create(&opt).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save option"})
			return
		}
	}
	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{"message": "Manual question added successfully", "question": question})
}

func (qc *QuizController) GetQuizResults(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	teacherID := userIDStr.(uuid.UUID)
	quizID := c.Param("id")

	// Verify quiz belongs to teacher
	var quiz models.Quiz
	if err := qc.DB.Where("id = ? AND teacher_id = ?", quizID, teacherID).First(&quiz).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found or unauthorized"})
		return
	}

	var results []models.QuizResult
	if err := qc.DB.Preload("Student").Where("quiz_id = ?", quizID).Order("created_at desc").Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch results"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"quiz":    quiz,
		"results": results,
	})
}

func (qc *QuizController) GenerateAIQuestions(c *gin.Context) {
	quizIDStr := c.Param("id")
	quizID, err := uuid.Parse(quizIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	var input AIGenerateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	questions, err := utils.GenerateQuizQuestions(input.Topic, input.Count, input.Difficulty)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Begin transaction to save generated questions
	tx := qc.DB.Begin()
	for _, q := range questions {
		question := models.Question{
			QuizID:       quizID,
			QuestionText: q.QuestionText,
			Source:       "ai_generated",
		}
		if err := tx.Create(&question).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save question"})
			return
		}

		for i, optText := range q.Options {
			isCorrect := (i == q.CorrectIndex)
			opt := models.Option{
				QuestionID: question.ID,
				OptionText: optText,
				IsCorrect:  isCorrect,
			}
			if err := tx.Create(&opt).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save option"})
				return
			}
		}
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "AI questions generated and saved", "count": len(questions)})
}

// Student routes
func (qc *QuizController) GetPublishedQuizzes(c *gin.Context) {
	var quizzes []models.Quiz
	qc.DB.Preload("Teacher").Where("status = ?", "published").Find(&quizzes)
	
	// Create a safe response without sensitive teacher data
	type QuizResponse struct {
		ID               uuid.UUID `json:"id"`
		Title            string    `json:"title"`
		Topic            string    `json:"topic"`
		TimeLimitMinutes int       `json:"time_limit_minutes"`
		TeacherName      string    `json:"teacher_name"`
	}

	var response []QuizResponse
	for _, q := range quizzes {
		response = append(response, QuizResponse{
			ID:               q.ID,
			Title:            q.Title,
			Topic:            q.Topic,
			TimeLimitMinutes: q.TimeLimitMinutes,
			TeacherName:      q.Teacher.Name,
		})
	}

	c.JSON(http.StatusOK, gin.H{"quizzes": response})
}
