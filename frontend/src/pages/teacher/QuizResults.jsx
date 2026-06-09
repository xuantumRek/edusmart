import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const TeacherQuizResults = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/teacher/quizzes/${id}/results`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setQuiz(data.quiz);
          setResults(data.results || []);
        } else {
          Swal.fire(data.error || 'Gagal memuat hasil kuis');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) return <div className="p-8 text-text-secondary">Memuat hasil kuis...</div>;
  if (!quiz) return <div className="p-8 text-danger">Kuis tidak ditemukan.</div>;

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
        <div>
          <Link to="/teacher" className="text-sm text-text-secondary hover:text-text-primary mb-2 inline-block">← Kembali ke Dasbor</Link>
          <h1 className="font-display text-3xl text-text-primary">Hasil: {quiz.title}</h1>
          <p className="text-text-secondary mt-2">Daftar siswa yang telah menyelesaikan kuis ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-surface rounded-[6px] border border-border">
          <h3 className="text-sm text-text-secondary mb-1">Total Pengerjaan</h3>
          <p className="font-display text-3xl text-text-primary">{results.length}</p>
        </div>
        <div className="p-6 bg-surface rounded-[6px] border border-border">
          <h3 className="text-sm text-text-secondary mb-1">Rata-rata Skor</h3>
          <p className="font-display text-3xl text-text-primary">
            {results.length > 0 
              ? (results.reduce((acc, curr) => acc + curr.score_percentage, 0) / results.length).toFixed(1) + '%' 
              : '0%'}
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-[6px]">
          <p className="text-text-secondary">Belum ada siswa yang mengerjakan kuis ini.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-[6px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-hover border-b border-border text-sm text-text-secondary uppercase tracking-wider">
                <th className="p-4 font-medium">Nama Siswa</th>
                <th className="p-4 font-medium text-center">Benar / Salah</th>
                <th className="p-4 font-medium text-center">Skor</th>
                <th className="p-4 font-medium text-center">Grade</th>
                <th className="p-4 font-medium text-right">Waktu Penyelesaian</th>
              </tr>
            </thead>
            <tbody className="bg-surface">
              {results.map((r, idx) => (
                <tr key={r.id} className={`border-b border-border hover:bg-surface-hover ${idx % 2 === 0 ? 'bg-surface' : 'bg-bg'}`}>
                  <td className="p-4">
                    <div className="font-medium text-text-primary">{r.student?.name || 'Siswa Dihapus'}</div>
                    <div className="text-xs text-text-secondary">{r.student?.email || ''}</div>
                  </td>
                  <td className="p-4 text-center text-text-secondary">
                    <span className="text-success">{r.total_correct}</span> / <span className="text-danger">{r.total_wrong}</span>
                  </td>
                  <td className="p-4 text-center font-display text-xl">{r.score_percentage.toFixed(0)}%</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-[4px] text-sm font-bold border ${
                      r.grade_category === 'A' ? 'bg-success-dim text-success border-success/30' :
                      r.grade_category === 'B' ? 'bg-accent/10 text-accent border-accent/30' :
                      r.grade_category === 'C' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30' :
                      'bg-danger/10 text-danger border-danger/30'
                    }`}>
                      {r.grade_category}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-text-secondary">
                    {new Date(r.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherQuizResults;
