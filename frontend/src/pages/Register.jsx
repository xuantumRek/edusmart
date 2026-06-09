import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrasi gagal');
      }

      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="font-display text-[40px] text-text-primary">EduSmart</h1>
          <p className="text-xl text-text-secondary mt-2">Daftar akun baru</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          <Input 
            label="Nama Lengkap" 
            type="text" 
            placeholder="John Doe" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input 
            label="Email" 
            type="email" 
            placeholder="nama@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Minimal 6 karakter" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          
          {/* Role Toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">Daftar Sebagai</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2 rounded-[3px] text-sm font-medium transition-colors ${role === 'student' ? 'bg-accent-dim border border-accent text-accent' : 'bg-surface-raised border border-transparent text-text-secondary hover:text-text-primary'}`}
              >
                Siswa
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex-1 py-2 rounded-[3px] text-sm font-medium transition-colors ${role === 'teacher' ? 'bg-accent-dim border border-accent text-accent' : 'bg-surface-raised border border-transparent text-text-secondary hover:text-text-primary'}`}
              >
                Guru
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-danger bg-danger-dim p-3 rounded-[3px] border border-danger/30">{error}</div>}

          <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary">
            Sudah punya akun? <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
