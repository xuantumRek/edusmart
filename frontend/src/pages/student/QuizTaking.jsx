import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Swal from 'sweetalert2';

const QuizTaking = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/student/sessions/${sessionId}/questions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          if (data.session.status === 'submitted') {
            navigate(`/student/sessions/${sessionId}/result`);
            return;
          }
          setSession(data.session);
          setQuiz(data.quiz);
          setQuestions(data.questions || []);
          
          // Calculate time left
          const startedAt = new Date(data.session.started_at).getTime();
          const limitMs = data.quiz.time_limit_minutes * 60 * 1000;
          const endAt = startedAt + limitMs;
          const now = new Date().getTime();
          setTimeLeft(Math.max(0, Math.floor((endAt - now) / 1000)));
        } else {
          Swal.fire('Sesi kuis tidak ditemukan.');
          navigate('/student');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId, navigate]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOptionSelect = (qId, oId) => {
    setAnswers(prev => ({ ...prev, [qId]: oId }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/student/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ answers })
      });
      if (res.ok) {
        navigate(`/student/sessions/${sessionId}/result`);
      } else {
        const data = await res.json();
        Swal.fire(data.error || 'Gagal mengirim jawaban.');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Terjadi kesalahan koneksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div className="p-8 text-text-secondary">Menyiapkan kuis...</div>;
  if (!quiz) return null;

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="sticky top-0 z-10 bg-bg pt-4 pb-6 border-b border-border flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-2xl text-text-primary">{quiz.title}</h1>
          <p className="text-sm text-text-secondary mt-1">{questions.length} Soal · Topik: {quiz.topic}</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold font-mono text-xl border ${timeLeft < 60 ? 'bg-danger/10 text-danger border-danger/30' : 'bg-surface border-border text-text-primary'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex flex-col gap-8 mb-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-6 bg-surface border border-border rounded-[8px]">
            <h3 className="font-medium text-lg text-text-primary mb-4">
              <span className="text-text-secondary mr-2">{idx + 1}.</span> 
              {q.question_text}
            </h3>
            <div className="flex flex-col gap-3">
              {q.options && q.options.map((opt, oIdx) => {
                const isSelected = answers[q.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(q.id, opt.id)}
                    className={`text-left p-4 rounded-[6px] border transition-all ${
                      isSelected 
                        ? 'border-accent bg-accent/5 text-text-primary' 
                        : 'border-border bg-bg text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    <span className="mr-3 font-bold opacity-70">{String.fromCharCode(65 + oIdx)}.</span> 
                    {opt.option_text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end border-t border-border pt-6 pb-20">
        <Button onClick={handleSubmit} disabled={submitting} variant="primary" className="px-8 py-3 text-lg">
          {submitting ? 'Menyimpan...' : 'Kumpulkan Kuis'}
        </Button>
      </div>
    </div>
  );
};

export default QuizTaking;
