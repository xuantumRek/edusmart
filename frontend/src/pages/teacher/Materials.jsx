import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { IT_SUBJECTS } from '../../constants/subjects';
import Swal from 'sweetalert2';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Form
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    file: null
  });

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = new URL((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/teacher/materials');
      url.searchParams.append('page', page);
      if (subjectFilter) url.searchParams.append('subject', subjectFilter);
      if (searchFilter) url.searchParams.append('search', searchFilter);

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMaterials(data.data.materials || []);
        setTotalPages(data.data.pagination.total_pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [page, subjectFilter, searchFilter]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Materi?',
      text: "Yakin ingin menghapus materi ini? File PDF juga akan terhapus secara permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + `/teacher/materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        Swal.fire('Terhapus!', 'Materi berhasil dihapus.', 'success');
        fetchMaterials();
      } else {
        const data = await res.json();
        Swal.fire('Error', data.message || 'Gagal menghapus materi', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Terjadi kesalahan', 'error');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file || !formData.title || !formData.subject) {
      Swal.fire('Judul, mata pelajaran, dan file PDF wajib diisi');
      return;
    }

    if (formData.file.size > 20 * 1024 * 1024) {
      Swal.fire('Ukuran file maksimal 20MB');
      return;
    }

    setUploading(true);
    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('subject', formData.subject);
    payload.append('description', formData.description);
    payload.append('file', formData.file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/teacher/materials', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', subject: '', description: '', file: null });
        fetchMaterials();
      } else {
        Swal.fire(data.message || 'Gagal mengupload materi');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl text-text-primary mb-2">Manajemen Materi</h1>
          <p className="text-text-secondary">Upload materi dalam format PDF agar dapat diakses oleh siswa.</p>
        </div>
        <Button onClick={() => setShowModal(true)} variant="primary">+ Upload Materi</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input 
          placeholder="Cari judul..." 
          value={searchFilter}
          onChange={(e) => {setSearchFilter(e.target.value); setPage(1);}}
          className="max-w-[250px]"
        />
        <select
          value={subjectFilter}
          onChange={(e) => {setSubjectFilter(e.target.value); setPage(1);}}
          className="w-full p-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent max-w-[250px]"
        >
          <option value="">Semua Mata Pelajaran</option>
          {IT_SUBJECTS.map(subj => (
            <option key={subj} value={subj}>{subj}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-text-secondary">Memuat data...</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-10 bg-surface border border-border rounded-[8px]">
          <p className="text-text-secondary mb-4">Belum ada materi yang diupload.</p>
          <Button onClick={() => setShowModal(true)} variant="outline">Upload Sekarang</Button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-raised border-b border-border">
              <tr>
                <th className="p-4 text-sm font-medium text-text-secondary">Judul Materi</th>
                <th className="p-4 text-sm font-medium text-text-secondary">Mata Pelajaran</th>
                <th className="p-4 text-sm font-medium text-text-secondary">Ukuran</th>
                <th className="p-4 text-sm font-medium text-text-secondary text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-surface-raised transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-text-primary">{m.title}</div>
                    <div className="text-xs text-text-secondary mt-1 line-clamp-1">{m.description || '-'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded border border-accent/20">
                      {m.subject}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-secondary">{m.file_size_kb} KB</td>
                  <td className="p-4 text-right">
                    <a href={m.file_url} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-accent mr-4 text-sm">
                      Lihat
                    </a>
                    <button onClick={() => handleDelete(m.id)} className="text-danger hover:text-danger/80 text-sm">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex justify-between items-center bg-surface-raised">
              <Button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                variant="outline"
              >
                Sebelumnya
              </Button>
              <span className="text-text-secondary text-sm">Halaman {page} dari {totalPages}</span>
              <Button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                variant="outline"
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-[500px] rounded-[12px] shadow-2xl p-6">
            <h2 className="text-2xl font-display text-text-primary mb-6">Upload Materi Baru</h2>
            
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Judul Materi *</label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Contoh: Modul 1 Jaringan Komputer"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Mata Pelajaran *</label>
                <select
                  required
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full p-2 bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>-- Pilih Mata Pelajaran --</option>
                  {IT_SUBJECTS.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Deskripsi (Opsional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 bg-bg border border-border rounded text-text-primary focus:outline-none focus:border-accent resize-none h-24"
                  placeholder="Deskripsi singkat mengenai materi ini..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">File PDF * (Maks 20MB)</label>
                <input 
                  type="file" 
                  accept="application/pdf"
                  required
                  onChange={e => setFormData({...formData, file: e.target.files[0]})}
                  className="w-full p-2 bg-bg border border-border rounded text-text-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-accent file:text-white hover:file:bg-accent/80"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" onClick={() => setShowModal(false)} variant="outline" disabled={uploading}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={uploading}>
                  {uploading ? 'Mengupload...' : 'Upload Materi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
