package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"google.golang.org/genai"
)

var (
	geminiClient *genai.Client
	geminiModel  string
)

func InitGemini() {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Println("GEMINI_API_KEY is not set. AI features will not work.")
		return
	}

	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-2.5-flash"
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatalf("Failed to initialize Gemini Client: %v", err)
	}

	geminiClient = client
	geminiModel = model
	log.Println("Gemini Client initialized successfully with model:", model)
}

type GeneratedQuestion struct {
	QuestionText string   `json:"question_text"`
	Options      []string `json:"options"` // Always 4 options
	CorrectIndex int      `json:"correct_index"` // 0-3
}

type GeneratedQuizResult struct {
	Questions []GeneratedQuestion `json:"questions"`
}

func GenerateQuizQuestions(topic string, count int, difficulty string) ([]GeneratedQuestion, error) {
	if geminiClient == nil {
		return nil, fmt.Errorf("gemini client is not initialized")
	}

	prompt := fmt.Sprintf(`Kamu adalah pembuat soal ujian profesional untuk siswa.
Buat %d soal pilihan ganda tentang topik "%s" dengan tingkat kesulitan "%s".

ATURAN KETAT:
1. Setiap soal HARUS memiliki tepat 4 pilihan jawaban.
2. Tepat 1 pilihan harus menjadi jawaban yang benar.
3. Bahasa Indonesia yang baik dan benar.
4. Jangan tambahkan penjelasan atau teks di luar format JSON.

Kembalikan HANYA JSON dengan format berikut, tanpa markdown, tanpa backtick, tanpa teks tambahan:
{
  "questions": [
    {
      "question_text": "Pertanyaan soal di sini",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correct_index": 0
    }
  ]
}`, count, topic, difficulty)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	rawText, err := generateWithRetry(ctx, prompt)
	if err != nil {
		return nil, err
	}

	cleaned := cleanJSONResponse(rawText)

	var result GeneratedQuizResult
	if err := json.Unmarshal([]byte(cleaned), &result); err != nil {
		return nil, fmt.Errorf("failed to parse JSON from Gemini: %v\nRaw response: %s", err, rawText)
	}

	if len(result.Questions) == 0 {
		return nil, fmt.Errorf("gemini mengembalikan 0 soal")
	}

	return result.Questions, nil
}

func GenerateFeedback(topic string, incorrectQuestions []string) (string, error) {
	if geminiClient == nil {
		return "", fmt.Errorf("gemini client is not initialized")
	}

	wrongDetails := ""
	for i, q := range incorrectQuestions {
		wrongDetails += fmt.Sprintf("%d. %s\n", i+1, q)
	}

	var prompt string
	if len(incorrectQuestions) == 0 {
		prompt = fmt.Sprintf(`Siswa berhasil menjawab semua soal kuis tentang "%s" dengan benar.
Berikan pesan singkat apresiasi dan saran untuk terus belajar lebih dalam tentang topik ini.
Gunakan 1-2 paragraf, bahasa Indonesia yang ramah dan memotivasi.`, topic)
	} else {
		prompt = fmt.Sprintf(`Kamu adalah tutor pendidikan yang membantu siswa memahami materi yang belum dikuasai.
Siswa baru saja menyelesaikan kuis tentang topik "%s" dan menjawab salah pada soal-soal berikut:

%s

Buat ringkasan materi singkat (2-3 paragraf) yang menjelaskan konsep-konsep yang terkait dengan soal yang dijawab salah tersebut.
Fokus pada pemahaman konsep, bukan sekadar memberikan jawaban.
Gunakan bahasa Indonesia yang ramah. Akhiri dengan satu kalimat motivasi.
Kembalikan HANYA teks ringkasan materi, tanpa judul, tanpa markdown.`, topic, wrongDetails)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	rawText, err := generateWithRetry(ctx, prompt)
	if err != nil {
		return "", err
	}

	feedback := strings.TrimSpace(rawText)
	if feedback == "" {
		return "", fmt.Errorf("gemini mengembalikan teks kosong")
	}

	return feedback, nil
}

// generateWithRetry menangani error 429 dan 503 dari Gemini free tier dengan exponential backoff
func generateWithRetry(ctx context.Context, prompt string) (string, error) {
	maxRetries := 3
	baseDelay := 5 * time.Second

	contents := []*genai.Content{
		{
			Parts: []*genai.Part{
				{Text: prompt},
			},
			Role: "user",
		},
	}

	config := &genai.GenerateContentConfig{
		Temperature:     genai.Ptr[float32](0.7),
	}

	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			delay := baseDelay * time.Duration(1<<uint(attempt-1))
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return "", ctx.Err()
			}
		}

		result, err := geminiClient.Models.GenerateContent(ctx, geminiModel, contents, config)
		if err != nil {
			lastErr = err
			errStr := err.Error()

			if strings.Contains(errStr, "429") || strings.Contains(errStr, "RESOURCE_EXHAUSTED") || strings.Contains(errStr, "503") || strings.Contains(errStr, "SERVICE_UNAVAILABLE") {
				if attempt < maxRetries {
					continue
				}
			}

			if strings.Contains(errStr, "403") || strings.Contains(errStr, "PERMISSION_DENIED") || strings.Contains(errStr, "400") || strings.Contains(errStr, "BAD_REQUEST") {
				return "", fmt.Errorf("fatal gemini error: %w", err)
			}

			if attempt < maxRetries {
				continue
			}
			return "", fmt.Errorf("gemini error: %w", err)
		}

		if result == nil || len(result.Candidates) == 0 {
			lastErr = fmt.Errorf("gemini mengembalikan response kosong")
			continue
		}

		candidate := result.Candidates[0]
		if candidate.Content == nil || len(candidate.Content.Parts) == 0 {
			lastErr = fmt.Errorf("gemini content kosong")
			continue
		}

		// The parts in the new SDK are usually string, or some struct.
		// genai.Part is a struct with Text field.
		part := candidate.Content.Parts[0]
		if part.Text == "" {
			lastErr = fmt.Errorf("gemini mengembalikan teks kosong")
			continue
		}

		return part.Text, nil
	}

	return "", fmt.Errorf("semua percobaan gagal: %w", lastErr)
}

func cleanJSONResponse(raw string) string {
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "```json")
	raw = strings.TrimPrefix(raw, "```")
	raw = strings.TrimSuffix(raw, "```")
	return strings.TrimSpace(raw)
}
