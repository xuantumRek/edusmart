import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Swal from 'sweetalert2';

const QuizCreate = () => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const navigate = useNavigate();

  const handleSaveDraft = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/teacher/quizzes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title, topic, time_limit_minutes: parseInt(timeLimit) }),
      });
      const data = await response.json();
      if (response.ok && data.quiz) {
        navigate(`/teacher/quizzes/${data.quiz.id}/edit`);
      } else {
        Swal.fire(data.error || 'Failed to create quiz');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex items-center gap-4 mb-8 border-b border-border pb-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary">← Kembali</button>
        <h1 className="font-display text-2xl text-text-primary">Buat Kuis Baru</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="flex flex-col gap-6">
          <Input label="Judul Kuis" value={title} onChange={e => setTitle(e.target.value)} placeholder="Misal: Ujian Tengah Semester" />
          <Input label="Topik" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Misal: Persamaan Linear" />
          <Input label="Batas Waktu (Menit)" type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} />
          
          <div className="flex gap-4 mt-4">
            <Button onClick={handleSaveDraft} variant="primary">Simpan Draft & Lanjut Buat Soal ➔</Button>
          </div>
        </div>

        <div className="border border-border bg-surface p-6 rounded-[6px] flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4 opacity-50">📝</div>
          <h3 className="font-display text-xl mb-2">Langkah 1: Simpan Judul Kuis</h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Silakan lengkapi formulir di sebelah kiri dan klik <strong>"Simpan Draft"</strong> untuk melanjutkan ke editor kuis. 
            <br/><br/>
            Di sana, Anda akan dapat:
            <br/>✨ <i>Generate soal otomatis dengan AI</i>
            <br/>✍️ <i>Menambah soal secara manual</i>
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizCreate;
