import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Swal from 'sweetalert2';

const QuizEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualQuestion, setManualQuestion] = useState({ text: '', options: ['', '', '', ''], correctIndex: 0 });

  const fetchQuizDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/teacher/quizzes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizDetails();
  }, [id]);

  const handleGenerateAI = async () => {
    if (!quiz) return;
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/teacher/quizzes/${id}/ai-generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          topic: quiz.topic,
          count: 5,
          difficulty: 'medium'
        })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Berhasil meng-generate soal dengan AI!');
        fetchQuizDetails();
      } else {
        Swal.fire(data.error || 'Gagal generate soal');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Terjadi kesalahan koneksi');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/teacher/quizzes/${id}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        Swal.fire('Kuis berhasil dipublikasikan!');
        navigate('/teacher');
      } else {
        const data = await res.json();
        Swal.fire(data.error || 'Gagal mempublikasikan kuis');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveManual = async () => {
    if (!manualQuestion.text || manualQuestion.options.some(o => !o)) {
      Swal.fire("Soal dan 4 opsi jawaban wajib diisi!");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/teacher/quizzes/${id}/questions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          question_text: manualQuestion.text,
          options: manualQuestion.options,
          correct_index: manualQuestion.correctIndex
        })
      });
      if (res.ok) {
        setManualQuestion({ text: '', options: ['', '', '', ''], correctIndex: 0 });
        setShowManualForm(false);
        fetchQuizDetails();
      } else {
        const data = await res.json();
        Swal.fire(data.error || 'Gagal menyimpan soal manual');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-text-secondary">Memuat data kuis...</div>;
  if (!quiz) return <div className="p-8 text-danger">Kuis tidak ditemukan.</div>;

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/teacher')} className="text-text-secondary hover:text-text-primary">← Kembali</button>
          <div>
            <h1 className="font-display text-2xl text-text-primary">{quiz.title}</h1>
            <p className="text-text-secondary text-sm mt-1">{quiz.topic.toUpperCase()} · {quiz.time_limit_minutes} Menit · Status: {quiz.status}</p>
          </div>
        </div>
        {quiz.status === 'draft' && (
          <Button onClick={handlePublish} variant="primary">Publikasikan Kuis</Button>
        )}
      </div>

      <div className="flex justify-between items-end mb-6">
        <h2 className="font-display text-xl">Daftar Soal ({questions.length})</h2>
        {quiz.status === 'draft' && (
          <div className="flex gap-3">
            <Button onClick={() => setShowManualForm(!showManualForm)} variant="secondary">
              {showManualForm ? 'Tutup Form' : '✍️ Tambah Manual'}
            </Button>
            <Button onClick={handleGenerateAI} variant="secondary" disabled={isGenerating}>
              {isGenerating ? 'AI Sedang Berpikir...' : '✨ Generate AI (5 Soal)'}
            </Button>
          </div>
        )}
      </div>

      {showManualForm && (
        <div className="p-6 bg-surface-hover border border-accent rounded-[6px] mb-8">
          <h3 className="font-display text-lg mb-4 text-accent">Tambah Soal Baru</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Pertanyaan</label>
              <textarea 
                className="w-full bg-bg border border-border p-3 rounded text-text-primary focus:border-accent outline-none h-24"
                value={manualQuestion.text}
                onChange={e => setManualQuestion({...manualQuestion, text: e.target.value})}
                placeholder="Tuliskan soal di sini..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {manualQuestion.options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    type="radio" 
                    name="correctIndex" 
                    checked={manualQuestion.correctIndex === idx}
                    onChange={() => setManualQuestion({...manualQuestion, correctIndex: idx})}
                  />
                  <input 
                    className={`flex-1 bg-bg border p-2 rounded text-text-primary focus:border-accent outline-none ${manualQuestion.correctIndex === idx ? 'border-success' : 'border-border'}`}
                    value={opt}
                    onChange={e => {
                      const newOpts = [...manualQuestion.options];
                      newOpts[idx] = e.target.value;
                      setManualQuestion({...manualQuestion, options: newOpts});
                    }}
                    placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Button onClick={handleSaveManual} variant="primary">Simpan Soal</Button>
            </div>
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-[6px]">
          <p className="text-text-secondary mb-4">Belum ada soal untuk kuis ini.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-5 bg-surface border border-border rounded-[6px]">
              <div className="flex justify-between mb-4">
                <span className="font-medium text-accent">Soal {idx + 1}</span>
                <span className="text-xs bg-surface-raised px-2 py-1 rounded text-text-secondary">{q.source}</span>
              </div>
              <p className="mb-4 text-text-primary">{q.question_text}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options && q.options.map((opt, oIdx) => (
                  <div key={opt.id} className={`p-3 rounded-[4px] border ${opt.is_correct ? 'border-success bg-success/10 text-success' : 'border-border bg-bg text-text-secondary'}`}>
                    <span className="mr-2 font-bold">{String.fromCharCode(65 + oIdx)}.</span> {opt.option_text}
                    {opt.is_correct && <span className="float-right text-xs uppercase font-bold tracking-wider">Jawaban Benar</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizEdit;
