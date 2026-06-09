import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Swal from 'sweetalert2';

const TeacherDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/teacher/quizzes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handlePublish = async (quizId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/teacher/quizzes/${quizId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchQuizzes(); // reload list
      } else {
        const data = await response.json();
        Swal.fire(data.error || 'Gagal mempublikasikan kuis');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnpublish = async (quizId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/teacher/quizzes/${quizId}/unpublish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchQuizzes();
      } else {
        const data = await response.json();
        Swal.fire(data.error || 'Gagal membatalkan publikasi kuis');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Kuis?',
      text: "Yakin ingin menghapus kuis ini permanen?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/teacher/quizzes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== id));
        Swal.fire('Terhapus!', 'Kuis berhasil dihapus.', 'success');
      } else {
        const data = await res.json();
        Swal.fire('Error', data.error || 'Gagal menghapus kuis', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-3xl text-text-primary">Kuis Saya</h1>
          <p className="text-text-secondary mt-2">Kelola kuis yang telah Anda buat.</p>
        </div>
        <Link to="/teacher/quizzes/create" className="btn btn-primary">
          + Buat Kuis
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-surface rounded-[6px] border border-border">
          <h3 className="text-sm text-text-secondary mb-1">Total Kuis</h3>
          <p className="font-display text-3xl text-text-primary">{quizzes.length}</p>
        </div>
        <div className="p-6 bg-surface rounded-[6px] border border-border">
          <h3 className="text-sm text-text-secondary mb-1">Kuis Aktif (Published)</h3>
          <p className="font-display text-3xl text-text-primary">{quizzes.filter(q => q.status === 'published').length}</p>
        </div>
        <div className="p-6 bg-surface rounded-[6px] border border-border">
          <h3 className="text-sm text-text-secondary mb-1">Draft</h3>
          <p className="font-display text-3xl text-text-primary">{quizzes.filter(q => q.status === 'draft').length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary">Memuat kuis...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          Belum ada kuis. Klik "Buat Kuis" untuk memulai.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="flex justify-between items-center p-5 border-b border-border hover:bg-surface-hover transition-colors">
              <div>
                <div className="editorial-label mb-2 flex items-center gap-3">
                  {quiz.topic.toUpperCase()} · {quiz.time_limit_minutes} MENIT
                  {quiz.status === 'published' ? (
                    <span className="text-[10px] bg-success-dim text-success px-2 py-0.5 rounded-[2px] border border-success/30">PUBLISHED</span>
                  ) : (
                    <span className="text-[10px] bg-surface-raised text-text-secondary px-2 py-0.5 rounded-[2px] border border-border">DRAFT</span>
                  )}
                </div>
                <h3 className="font-display text-xl text-text-primary">{quiz.title}</h3>
              </div>
              <div className="flex gap-3">
                {quiz.status === 'draft' && (
                  <button onClick={() => handlePublish(quiz.id)} className="text-sm font-medium text-accent hover:underline">Publikasikan</button>
                )}
                {quiz.status === 'published' && (
                  <button onClick={() => handleUnpublish(quiz.id)} className="text-sm font-medium text-[#F59E0B] hover:underline">Unpublish</button>
                )}
                {quiz.status === 'published' && (
                  <Link to={`/teacher/quizzes/${quiz.id}/results`} className="text-sm font-medium text-success hover:underline">Lihat Nilai</Link>
                )}
                <Link to={`/teacher/quizzes/${quiz.id}/edit`} className="text-sm font-medium text-text-secondary hover:text-text-primary">Edit / Detail</Link>
                <button onClick={() => handleDelete(quiz.id)} className="text-sm font-medium text-danger hover:underline">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
