import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Navbar Minimal */}
      <nav className="w-full max-w-[1100px] mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
        <h1 className="font-display text-2xl text-text-primary tracking-wide">EduSmart</h1>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Masuk</Link>
          <Link to="/register" className="text-sm font-medium text-accent hover:text-accent-hover transition-colors">Daftar</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-[800px] mx-auto mt-12 mb-16">
        <h2 className="font-display text-[40px] md:text-[72px] leading-[1.1] text-text-primary mb-6">
          Platform Kuis Berbasis AI untuk Kelas <span className="text-accent">Modern</span>
        </h2>
        <p className="text-lg text-text-secondary mb-10 max-w-[600px] mx-auto leading-relaxed">
          Dirancang untuk guru yang ingin berinovasi. Buat soal secara otomatis dengan AI, jalankan sesi kuis interaktif, dan biarkan sistem memberikan umpan balik personal untuk setiap siswa.
        </p>
        <div className="flex gap-4">
          <Link to="/register" className="btn btn-primary">Mulai Sekarang</Link>
          <Link to="/login" className="btn btn-secondary">Masuk Dashboard</Link>
        </div>
      </main>

      {/* Feature Section */}
      <section className="w-full max-w-[1100px] mx-auto px-6 md:px-12 py-20 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="editorial-label mb-4">UNTUK GURU</h3>
            <p className="text-base text-text-primary leading-relaxed">
              Buat kuis secara manual atau manfaatkan generator AI terintegrasi untuk menyusun puluhan soal dalam hitungan detik.
            </p>
          </div>
          <div>
            <h3 className="editorial-label mb-4">UNTUK SISWA</h3>
            <p className="text-base text-text-primary leading-relaxed">
              Kerjakan kuis dengan antarmuka yang bebas distraksi. Waktu diatur dengan presisi untuk memastikan kejujuran.
            </p>
          </div>
          <div>
            <h3 className="editorial-label mb-4">AI POWERED</h3>
            <p className="text-base text-text-primary leading-relaxed">
              Dapatkan ringkasan materi dan evaluasi instan dari Google Gemini AI berdasarkan soal yang salah dijawab.
            </p>
          </div>
        </div>
      </section>

      {/* Testimoni */}
      <footer className="w-full py-16 bg-surface border-t border-border mt-auto">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <p className="font-display text-2xl text-text-primary italic leading-relaxed mb-6">
            "EduSmart membantu saya membuat soal 10x lebih cepat tanpa harus mengorbankan kualitas materi ajar."
          </p>
          <p className="text-sm font-medium text-text-secondary">— Guru Matematika, SMA Budi Mulia</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
