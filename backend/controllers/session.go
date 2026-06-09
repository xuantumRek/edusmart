package controllers

import (
	"edusmart/models"
	"edusmart/utils"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SessionController struct {
	DB *gorm.DB
}

type SubmitAnswerInput struct {
	Answers map[string]string `json:"answers"` // map[questionID]optionID
}

func (sc *SessionController) StartQuiz(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	studentID := userIDStr.(uuid.UUID)

	quizIDStr := c.Param("id")
	quizID, err := uuid.Parse(quizIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	// Check if already attempted
	var existingSession models.QuizSession
	if err := sc.DB.Where("student_id = ? AND quiz_id = ?", studentID, quizID).First(&existingSession).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already attempted this quiz", "session_id": existingSession.ID})
		return
	}

	session := models.QuizSession{
		StudentID: studentID,
		QuizID:    quizID,
		Status:    "ongoing",
	}

	if err := sc.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start session"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Quiz started", "session_id": session.ID})
}

func (sc *SessionController) SubmitQuiz(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	studentID := userIDStr.(uuid.UUID)

	sessionIDStr := c.Param("sessionId")
	
	var input SubmitAnswerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var session models.QuizSession
	if err := sc.DB.Preload("Quiz").First(&session, "id = ? AND student_id = ?", sessionIDStr, studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	if session.Status == "submitted" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Quiz already submitted"})
		return
	}

	// Calculate scores
	var questions []models.Question
	sc.DB.Preload("Options").Where("quiz_id = ?", session.QuizID).Find(&questions)

	totalQuestions := len(questions)
	totalCorrect := 0
	var incorrectQuestionsText []string

	tx := sc.DB.Begin()

	now := time.Now()
	session.Status = "submitted"
	session.EndedAt = &now
	tx.Save(&session)

	for _, q := range questions {
		selectedOptStr, answered := input.Answers[q.ID.String()]
		var selectedOptID *uuid.UUID

		isCorrect := false
		if answered && selectedOptStr != "" {
			parsedID, err := uuid.Parse(selectedOptStr)
			if err == nil {
				selectedOptID = &parsedID
				// check if correct
				for _, opt := range q.Options {
					if opt.ID == parsedID && opt.IsCorrect {
						isCorrect = true
						totalCorrect++
						break
					}
				}
			}
		}

		if !isCorrect {
			incorrectQuestionsText = append(incorrectQuestionsText, q.QuestionText)
		}

		studentAnswer := models.StudentAnswer{
			SessionID:        session.ID,
			QuestionID:       q.ID,
			SelectedOptionID: selectedOptID,
		}
		tx.Create(&studentAnswer)
	}

	scorePercentage := float64(totalCorrect) / float64(totalQuestions) * 100
	grade := "D"
	if scorePercentage >= 80 {
		grade = "A"
	} else if scorePercentage >= 60 {
		grade = "B"
	} else if scorePercentage >= 40 {
		grade = "C"
	}

	quizResult := models.QuizResult{
		SessionID:       session.ID,
		StudentID:       studentID,
		QuizID:          session.QuizID,
		ScorePercentage: scorePercentage,
		GradeCategory:   grade,
		TotalCorrect:    totalCorrect,
		TotalWrong:      totalQuestions - totalCorrect,
	}
	tx.Create(&quizResult)

	aiFeedback := models.AIFeedback{
		ResultID: quizResult.ID,
		Status:   "pending",
	}
	tx.Create(&aiFeedback)

	tx.Commit()

	// Trigger async AI Feedback generation
	go func(topic string, wrongQs []string, feedbackID uuid.UUID) {
		// Needs its own DB connection/context usually, but we reuse db pointer here (safe in GORM for simple updates)
		feedbackText, err := utils.GenerateFeedback(topic, wrongQs)
		
		status := "success"
		if err != nil {
			fmt.Printf("AI Feedback error: %v\n", err)
			status = "failed"
		}

		sc.DB.Model(&models.AIFeedback{}).Where("id = ?", feedbackID).Updates(map[string]interface{}{
			"feedback_text": feedbackText,
			"status":        status,
			"updated_at":    time.Now(),
		})
	}(session.Quiz.Topic, incorrectQuestionsText, aiFeedback.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Quiz submitted successfully",
		"result": gin.H{
			"score_percentage": scorePercentage,
			"grade":            grade,
		},
	})
}

func (sc *SessionController) GetSessionQuestions(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	studentID := userIDStr.(uuid.UUID)
	sessionIDStr := c.Param("sessionId")

	var session models.QuizSession
	if err := sc.DB.Preload("Quiz").First(&session, "id = ? AND student_id = ?", sessionIDStr, studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	var questions []models.Question
	sc.DB.Preload("Options").Where("quiz_id = ?", session.QuizID).Find(&questions)

	// Remove IsCorrect from options so students can't cheat
	type SafeOption struct {
		ID         uuid.UUID `json:"id"`
		OptionText string    `json:"option_text"`
	}
	type SafeQuestion struct {
		ID           uuid.UUID    `json:"id"`
		QuestionText string       `json:"question_text"`
		Options      []SafeOption `json:"options"`
	}

	var safeQuestions []SafeQuestion
	for _, q := range questions {
		var safeOpts []SafeOption
		for _, o := range q.Options {
			safeOpts = append(safeOpts, SafeOption{
				ID:         o.ID,
				OptionText: o.OptionText,
			})
		}
		safeQuestions = append(safeQuestions, SafeQuestion{
			ID:           q.ID,
			QuestionText: q.QuestionText,
			Options:      safeOpts,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"quiz":      session.Quiz,
		"session":   session,
		"questions": safeQuestions,
	})
}

func (sc *SessionController) GetSessionResult(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	studentID := userIDStr.(uuid.UUID)
	sessionIDStr := c.Param("sessionId")

	var result models.QuizResult
	if err := sc.DB.Preload("Quiz").Preload("Session").First(&result, "session_id = ? AND student_id = ?", sessionIDStr, studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Result not found"})
		return
	}

	var feedback models.AIFeedback
	sc.DB.Where("result_id = ?", result.ID).First(&feedback)

	c.JSON(http.StatusOK, gin.H{
		"result":   result,
		"feedback": feedback,
	})
}

func (sc *SessionController) GetHistory(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	studentID := userIDStr.(uuid.UUID)

	var results []models.QuizResult
	if err := sc.DB.Preload("Quiz").Preload("Session").Where("student_id = ?", studentID).Order("created_at desc").Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"results": results,
	})
}
