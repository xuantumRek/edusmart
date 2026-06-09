import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const StudentHistory = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/student/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setResults(data.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-3xl text-text-primary">Riwayat Kuis</h1>
          <p className="text-text-secondary mt-2">Daftar kuis yang telah Anda selesaikan beserta hasilnya.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary">Memuat riwayat...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          Belum ada riwayat kuis. Anda belum menyelesaikan kuis apapun.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {results.map((result) => (
            <div key={result.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-surface border border-border rounded-[6px] hover:border-[#3E3E3E] transition-colors">
              <div className="mb-4 md:mb-0">
                <div className="editorial-label mb-2 text-text-secondary">
                  DIKERJAKAN PADA {new Date(result.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <h3 className="font-display text-xl text-text-primary mb-1">
                  {result.quiz ? result.quiz.title : "Kuis Tidak Dikenal"}
                </h3>
                <p className="text-sm text-text-secondary">
                  Benar: {result.total_correct} | Salah: {result.total_wrong}
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Skor</div>
                  <div className="font-display text-2xl text-text-primary">{result.score_percentage.toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Grade</div>
                  <div className={`font-display text-2xl ${result.grade_category === 'A' ? 'text-success' : 'text-accent'}`}>{result.grade_category}</div>
                </div>
                <Link to={`/student/sessions/${result.session_id}/result`} className="text-accent hover:underline text-sm font-medium mt-2 md:mt-0">
                  Lihat Detail →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentHistory;
