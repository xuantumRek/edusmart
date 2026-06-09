import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const StudentDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingQuizId, setStartingQuizId] = useState(null);
  const [stats, setStats] = useState({ total: 0, avg: 0, points: 0, grade: 'None' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzesAndStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [quizRes, historyRes] = await Promise.all([
          fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/student/quizzes', { headers }),
          fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/student/history', { headers })
        ]);

        if (quizRes.ok) {
          const quizData = await quizRes.json();
          setQuizzes(quizData.quizzes || []);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          const results = historyData.results || [];
          
          if (results.length > 0) {
            const total = results.length;
            const avg = results.reduce((acc, curr) => acc + curr.score_percentage, 0) / total;
            const points = results.reduce((acc, curr) => acc + (curr.total_correct * 10), 0);
            
            let grade = 'D';
            if (avg >= 80) grade = 'A';
            else if (avg >= 60) grade = 'B';
            else if (avg >= 40) grade = 'C';

            setStats({ total, avg: avg.toFixed(1), points, grade });
          }
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzesAndStats();
  }, []);

  const handleStartQuiz = async (quizId) => {
    if (startingQuizId) return;
    setStartingQuizId(quizId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/student/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/student/sessions/${data.session_id}`);
      } else if (res.status === 409) {
        // Already attempted
        Swal.fire('Anda sudah pernah mengerjakan kuis ini. Mengarahkan ke hasil...');
        navigate(`/student/sessions/${data.session_id}/result`);
      } else {
        Swal.fire(data.error || 'Gagal memulai kuis');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Terjadi kesalahan.');
    } finally {
      setStartingQuizId(null);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-3xl text-text-primary">Kuis Tersedia</h1>
          <p className="text-text-secondary mt-2">Daftar kuis yang bisa Anda kerjakan saat ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-surface rounded-[6px] border border-border">
          <h3 className="text-sm text-text-secondary mb-1">Kuis Diselesaikan</h3>
          <p className="font-display text-3xl text-text-primary">{stats.total}</p>
        </div>
        <div className="p-6 bg-surface rounded-[6px] border border-border">
          <h3 className="text-sm text-text-secondary mb-1">Rata-rata Skor</h3>
          <p className="font-display text-3xl text-text-primary">{stats.total > 0 ? `${stats.avg}%` : '0%'}</p>
        </div>
        <div className="p-6 bg-surface rounded-[6px] border border-border">
          <h3 className="text-sm text-text-secondary mb-1">Total Poin</h3>
          <p className="font-display text-3xl text-text-primary">{stats.points}</p>
        </div>
        <div className="p-6 bg-surface rounded-[6px] border border-border">
          <h3 className="text-sm text-text-secondary mb-1">Predikat</h3>
          <p className={`font-display text-3xl ${stats.grade === 'A' ? 'text-success' : stats.grade === 'None' ? 'text-text-secondary' : 'text-accent'}`}>{stats.grade}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary">Memuat kuis...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          Belum ada kuis tersedia saat ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-surface border border-border p-5 rounded-[6px] hover:bg-surface-hover hover:border-[#3E3E3E] transition-colors flex flex-col">
              <div className="editorial-label mb-3">
                {quiz.topic.toUpperCase()} · {quiz.time_limit_minutes} MENIT
              </div>
              <div className="h-[1px] w-full bg-border mb-4"></div>
              
              <h3 className="font-display text-xl text-text-primary mb-2 line-clamp-2">{quiz.title}</h3>
              <p className="text-sm text-text-secondary mb-6 flex-1">
                Oleh: {quiz.teacher_name}
              </p>
              
              <button 
                onClick={() => handleStartQuiz(quiz.id)}
                disabled={startingQuizId === quiz.id}
                className="text-accent font-medium text-[15px] group flex items-center justify-start w-fit disabled:opacity-50"
              >
                {startingQuizId === quiz.id ? 'Memulai...' : 'Kerjakan Kuis'}
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
