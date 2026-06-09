import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
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
          <p className="text-xl text-text-secondary mt-2">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
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
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <div className="text-sm text-danger bg-danger-dim p-3 rounded-[3px] border border-danger/30">{error}</div>}

          <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary">
            Belum punya akun? <Link to="/register" className="text-accent hover:text-accent-hover transition-colors font-medium">Daftar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
