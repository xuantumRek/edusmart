import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Swal from 'sweetalert2';

const QuizResult = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/student/sessions/${sessionId}/result`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
        setFeedback(data.feedback);
      } else {
        Swal.fire('Gagal mengambil hasil kuis.');
        navigate('/student');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [sessionId, navigate]);

  // If AI feedback is still pending, poll every 5 seconds
  useEffect(() => {
    if (feedback && feedback.status === 'pending') {
      const timer = setInterval(() => {
        fetchResult();
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [feedback]);

  if (loading) return <div className="p-8 text-text-secondary">Memuat hasil kuis...</div>;
  if (!result) return null;

  return (
    <div className="max-w-[800px] mx-auto py-8">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl text-text-primary mb-2">Hasil Kuis Selesai!</h1>
        <p className="text-text-secondary">Anda telah menyelesaikan kuis ini. Berikut adalah rangkuman performa Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-surface border border-border rounded-[8px] text-center flex flex-col items-center justify-center">
          <h3 className="text-text-secondary text-sm mb-2">Skor Akhir</h3>
          <div className="text-5xl font-display text-accent mb-1">{result.score_percentage.toFixed(0)}</div>
          <p className="text-xs text-text-secondary">Dari 100</p>
        </div>
        <div className="p-6 bg-surface border border-border rounded-[8px] text-center flex flex-col items-center justify-center">
          <h3 className="text-text-secondary text-sm mb-2">Predikat</h3>
          <div className={`text-5xl font-display ${result.grade_category === 'A' ? 'text-success' : result.grade_category === 'B' ? 'text-[#3B82F6]' : result.grade_category === 'C' ? 'text-[#F59E0B]' : 'text-danger'}`}>
            {result.grade_category}
          </div>
        </div>
        <div className="p-6 bg-surface border border-border rounded-[8px] flex flex-col items-center justify-center">
          <h3 className="text-text-secondary text-sm mb-4">Statistik Jawaban</h3>
          <div className="flex gap-6 w-full justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{result.total_correct}</div>
              <div className="text-xs text-text-secondary uppercase mt-1">Benar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger">{result.total_wrong}</div>
              <div className="text-xs text-text-secondary uppercase mt-1">Salah</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-surface-raised border border-accent/30 rounded-[12px] mb-8 relative overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.1)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent to-[#D946EF]"></div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(139,92,246,0.4)]">
            ✨
          </div>
          <h2 className="font-display text-2xl text-text-primary bg-clip-text text-transparent bg-gradient-to-r from-accent to-[#D946EF]">
            Google Gemini AI Feedback
          </h2>
        </div>
        
        {feedback?.status === 'pending' ? (
          <div className="flex flex-col items-center py-10 bg-bg/50 rounded-lg border border-border/50">
            <div className="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin mb-4"></div>
            <p className="text-text-secondary text-center">AI sedang menganalisis jawaban Anda secara mendalam<br/>dan menyusun umpan balik yang personal...</p>
          </div>
        ) : feedback?.status === 'failed' ? (
          <div className="p-4 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
            Gagal mendapatkan feedback AI. Silakan coba muat ulang halaman.
          </div>
        ) : (
          <div className="text-text-secondary text-lg leading-relaxed">
            {feedback?.feedback_text ? (
              <div className="flex flex-col gap-4">
                {feedback.feedback_text.split('\n').filter(p => p.trim() !== '').map((paragraph, idx) => (
                  <p key={idx} className="bg-bg/40 p-4 rounded-lg border border-border/30 text-text-primary/90">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="italic text-center py-6">Tidak ada umpan balik khusus. Anda menjawab semua soal dengan sempurna! Luar biasa!</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Button onClick={() => navigate('/student')} variant="secondary" className="px-8 py-3">
          Kembali ke Dasbor
        </Button>
      </div>
    </div>
  );
};

export default QuizResult;
