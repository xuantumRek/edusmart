package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name         string    `gorm:"type:varchar(255);not null" json:"name"`
	Email        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Role         string    `gorm:"type:varchar(20);not null" json:"role"` // 'student', 'teacher'
	AvatarURL    *string   `gorm:"type:text" json:"avatar_url"`
	CreatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

type Quiz struct {
	ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TeacherID        uuid.UUID `gorm:"type:uuid;not null" json:"teacher_id"`
	Title            string    `gorm:"type:varchar(255);not null" json:"title"`
	Description      string    `gorm:"type:text" json:"description"`
	Topic            string    `gorm:"type:varchar(255);not null" json:"topic"`
	TimeLimitMinutes int       `gorm:"not null" json:"time_limit_minutes"`
	Status           string    `gorm:"type:varchar(20);default:'draft'" json:"status"` // 'draft', 'published'
	CreatedAt        time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt        time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	Teacher User `gorm:"foreignKey:TeacherID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"teacher"`
}

type Question struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	QuizID       uuid.UUID `gorm:"type:uuid;not null" json:"quiz_id"`
	QuestionText string    `gorm:"type:text;not null" json:"question_text"`
	Source       string    `gorm:"type:varchar(50);default:'manual'" json:"source"` // 'manual', 'ai_generated'
	CreatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	Quiz    Quiz     `gorm:"foreignKey:QuizID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Options []Option `gorm:"foreignKey:QuestionID" json:"options"`
}

type Option struct {
	ID         uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	QuestionID uuid.UUID `gorm:"type:uuid;not null" json:"question_id"`
	OptionText string    `gorm:"type:varchar(500);not null" json:"option_text"`
	IsCorrect  bool      `gorm:"not null" json:"is_correct"`

	Question Question `gorm:"foreignKey:QuestionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

type QuizSession struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	StudentID uuid.UUID  `gorm:"type:uuid;not null" json:"student_id"`
	QuizID    uuid.UUID  `gorm:"type:uuid;not null" json:"quiz_id"`
	Status    string     `gorm:"type:varchar(20);default:'ongoing'" json:"status"` // 'ongoing', 'submitted'
	StartedAt time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"started_at"`
	EndedAt   *time.Time `json:"ended_at"`

	Student User `gorm:"foreignKey:StudentID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"student"`
	Quiz    Quiz `gorm:"foreignKey:QuizID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"quiz"`
}

type StudentAnswer struct {
	ID               uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	SessionID        uuid.UUID  `gorm:"type:uuid;not null" json:"session_id"`
	QuestionID       uuid.UUID  `gorm:"type:uuid;not null" json:"question_id"`
	SelectedOptionID *uuid.UUID `gorm:"type:uuid" json:"selected_option_id"`

	Session  QuizSession `gorm:"foreignKey:SessionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Question Question    `gorm:"foreignKey:QuestionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Option   *Option     `gorm:"foreignKey:SelectedOptionID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"-"`
}

type QuizResult struct {
	ID              uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	SessionID       uuid.UUID `gorm:"type:uuid;not null" json:"session_id"`
	StudentID       uuid.UUID `gorm:"type:uuid;not null" json:"student_id"`
	QuizID          uuid.UUID `gorm:"type:uuid;not null" json:"quiz_id"`
	ScorePercentage float64   `gorm:"not null" json:"score_percentage"`
	GradeCategory   string    `gorm:"type:varchar(1);not null" json:"grade_category"`
	TotalCorrect    int       `gorm:"not null" json:"total_correct"`
	TotalWrong      int       `gorm:"not null" json:"total_wrong"`
	CreatedAt       time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`

	Session QuizSession `gorm:"foreignKey:SessionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Student User        `gorm:"foreignKey:StudentID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"student"`
	Quiz    Quiz        `gorm:"foreignKey:QuizID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"-"`
}

type AIFeedback struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ResultID     uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"result_id"`
	FeedbackText *string   `gorm:"type:text" json:"feedback_text"`
	Status       string    `gorm:"type:varchar(20);default:'pending'" json:"status"` // 'pending', 'success', 'failed'
	CreatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	Result QuizResult `gorm:"foreignKey:ResultID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

type Material struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TeacherID   uuid.UUID `gorm:"type:uuid;not null" json:"teacher_id"`
	Title       string    `gorm:"type:varchar(255);not null" json:"title"`
	Subject     string    `gorm:"type:varchar(100);not null" json:"subject"`
	Description string    `gorm:"type:text" json:"description"`
	FileURL     string    `gorm:"type:text;not null" json:"file_url"`
	FileName    string    `gorm:"type:varchar(255);not null" json:"file_name"`
	FileSizeKB  int       `gorm:"not null" json:"file_size_kb"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	Teacher User `gorm:"foreignKey:TeacherID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Quiz{},
		&Question{},
		&Option{},
		&QuizSession{},
		&StudentAnswer{},
		&QuizResult{},
		&AIFeedback{},
		&Material{},
	)
}
