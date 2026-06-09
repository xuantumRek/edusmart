package routes

import (
	"edusmart/controllers"
	"edusmart/middlewares"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	authController := &controllers.AuthController{DB: db}
	userController := &controllers.UserController{DB: db}
	quizController := &controllers.QuizController{DB: db}
	sessionController := &controllers.SessionController{DB: db}
	materialController := &controllers.MaterialController{DB: db}

	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authController.Register)
			auth.POST("/login", authController.Login)
		}

		protected := v1.Group("/")
		protected.Use(middlewares.AuthMiddleware())
		{
			protected.GET("/profile", userController.GetProfile)
			protected.POST("/profile/avatar", userController.UploadAvatar)

			// General protected routes
			protected.GET("/materials/:id", materialController.GetMaterialDetail)

			// Teacher routes
			teacher := protected.Group("/teacher")
			teacher.Use(middlewares.RoleMiddleware("teacher"))
			{
				teacher.POST("/quizzes", quizController.CreateQuiz)
				teacher.GET("/quizzes", quizController.GetTeacherQuizzes)
				teacher.GET("/quizzes/:id", quizController.GetQuizDetails)
				teacher.GET("/quizzes/:id/results", quizController.GetQuizResults)
				teacher.DELETE("/quizzes/:id", quizController.DeleteQuiz)
				teacher.POST("/quizzes/:id/publish", quizController.PublishQuiz)
				teacher.POST("/quizzes/:id/unpublish", quizController.UnpublishQuiz)
				teacher.POST("/quizzes/:id/questions", quizController.AddManualQuestion)
				teacher.POST("/quizzes/:id/ai-generate", quizController.GenerateAIQuestions)

				// Material routes
				teacher.POST("/materials", materialController.UploadMaterial)
				teacher.GET("/materials", materialController.GetTeacherMaterials)
				teacher.DELETE("/materials/:id", materialController.DeleteMaterial)
			}

			// Student routes
			student := protected.Group("/student")
			student.Use(middlewares.RoleMiddleware("student"))
			{
				student.GET("/quizzes", quizController.GetPublishedQuizzes)
				student.POST("/quizzes/:id/start", sessionController.StartQuiz)
				student.GET("/sessions/:sessionId/questions", sessionController.GetSessionQuestions)
				student.POST("/sessions/:sessionId/submit", sessionController.SubmitQuiz)
				student.GET("/sessions/:sessionId/result", sessionController.GetSessionResult)
				student.GET("/history", sessionController.GetHistory)

				// Material routes
				student.GET("/materials", materialController.GetStudentMaterials)
			}
		}
	}
}
