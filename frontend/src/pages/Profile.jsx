import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Swal from 'sweetalert2';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        if (data.user.avatar_url) {
          setPreview(data.user.avatar_url);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      
      // Kompres otomatis jika lebih dari 2MB
      if (selected.size > 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.readAsDataURL(selected);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              const compressedFile = new File([blob], selected.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              setFile(compressedFile);
              setPreview(URL.createObjectURL(compressedFile));
              Swal.fire('Gambar terlalu besar (> 2MB), otomatis dikompresi sistem.');
            }, 'image/jpeg', 0.8);
          };
        };
      } else {
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/profile/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Foto profil berhasil diunggah ke Azure Blob Storage!');
        fetchProfile(); // reload
        setFile(null); // clear file input
      } else {
        Swal.fire(data.error || 'Gagal mengunggah foto');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Terjadi kesalahan koneksi');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-text-secondary">Memuat profil...</div>;
  if (!profile) return null;

  return (
    <div className="max-w-[700px] mx-auto py-8">
      <div className="flex items-center gap-4 mb-8 border-b border-border pb-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary">← Kembali</button>
        <h1 className="font-display text-3xl text-text-primary">Pengaturan Profil</h1>
      </div>

      <div className="bg-surface border border-border p-8 rounded-[8px] flex flex-col md:flex-row gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-40 h-40 rounded-full border-4 border-bg overflow-hidden shadow-lg bg-bg flex items-center justify-center">
            {preview ? (
              <img 
                src={preview} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.onerror = null; // prevent infinite loop
                  e.target.style.display = 'none'; // hide broken image icon
                  setPreview(null); // fallback to initials
                }}
              />
            ) : (
              <span className="text-4xl text-text-secondary uppercase">{profile.name.charAt(0)}</span>
            )}
          </div>
          
          <label className="cursor-pointer">
            <span className="text-sm text-accent hover:underline font-medium">Pilih Foto Baru</span>
            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />
          </label>
          
          {file && (
            <Button onClick={handleUpload} disabled={uploading} variant="primary" className="w-full">
              {uploading ? 'Mengunggah...' : 'Simpan Foto'}
            </Button>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div>
            <h3 className="text-sm text-text-secondary mb-1">Nama Lengkap</h3>
            <p className="text-lg text-text-primary font-medium">{profile.name}</p>
          </div>
          <div>
            <h3 className="text-sm text-text-secondary mb-1">Email</h3>
            <p className="text-lg text-text-primary font-medium">{profile.email}</p>
          </div>
          <div>
            <h3 className="text-sm text-text-secondary mb-1">Peran (Role)</h3>
            <span className="px-3 py-1 bg-surface-raised border border-border rounded text-sm text-text-primary capitalize">
              {profile.role}
            </span>
          </div>
          
          <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-[6px]">
            <p className="text-sm text-text-secondary">
              Foto profil Anda disimpan dengan aman menggunakan <span className="text-accent font-semibold">Microsoft Azure Blob Storage</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
