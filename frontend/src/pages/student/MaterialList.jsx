import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const MaterialList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjects = searchParams.get('subjects');
  
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // PDF Viewer Modal
  const [activeMaterial, setActiveMaterial] = useState(null);

  useEffect(() => {
    if (!subjects) {
      navigate('/student/materials');
      return;
    }
    fetchMaterials();
  }, [subjects, page, search]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = new URL((import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1') + '/student/materials');
      url.searchParams.append('page', page);
      if (subjects) url.searchParams.append('subjects', subjects);
      if (search) url.searchParams.append('search', search);

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

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback
      window.open(fileUrl, '_blank');
    }
  };

  const subjectList = subjects ? subjects.split(',') : [];

  return (
    <div className="py-4">
      <div className="mb-8">
        <Link to="/student/materials" className="text-text-secondary hover:text-accent mb-4 inline-block">
          ← Ubah Pilihan Mata Pelajaran
        </Link>
        <h1 className="font-display text-3xl text-text-primary mb-3">Materi Pembelajaran</h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {subjectList.map(subj => (
            <span key={subj} className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-sm font-medium">
              {subj}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Input 
          placeholder="Cari judul materi..." 
          value={search}
          onChange={(e) => {setSearch(e.target.value); setPage(1);}}
          className="max-w-[300px]"
        />
        <div className="text-text-secondary text-sm">
          Menampilkan halaman {page} dari {totalPages}
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary py-10 text-center">Mencari materi...</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-[12px]">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-display text-text-primary mb-2">Belum ada materi</h3>
          <p className="text-text-secondary">Tidak ada materi yang sesuai dengan pencarian atau filter Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <div key={m.id} className="bg-surface border border-border rounded-[12px] p-5 hover:border-accent/50 transition-colors flex flex-col h-full">
              <div className="mb-auto">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-surface-raised border border-border text-text-secondary text-xs rounded uppercase font-medium">
                    {m.subject}
                  </span>
                  <span className="text-xs text-text-secondary">{m.file_size_kb} KB</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">{m.title}</h3>
                <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                  {m.description || 'Tidak ada deskripsi.'}
                </p>
              </div>
              
              <div className="pt-4 border-t border-border/50 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                    {m.teacher_name ? m.teacher_name.charAt(0) : 'T'}
                  </div>
                  <span className="text-xs text-text-secondary">{m.teacher_name}</span>
                </div>
                
                <Button 
                  onClick={() => setActiveMaterial(m)} 
                  variant="outline" 
                  className="px-3 py-1 text-sm border-accent/30 text-accent hover:bg-accent hover:text-white hover:border-accent"
                >
                  Buka PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="secondary">
            ← Prev
          </Button>
          <span className="text-text-primary font-medium">{page} / {totalPages}</span>
          <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="secondary">
            Next →
          </Button>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {activeMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm p-2 md:p-6">
          <div className="bg-surface border border-border w-full h-full max-w-[1200px] flex flex-col rounded-[12px] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-border bg-surface-raised">
              <div>
                <h3 className="font-display text-xl text-text-primary">{activeMaterial.title}</h3>
                <p className="text-sm text-text-secondary">{activeMaterial.subject} • {activeMaterial.teacher_name}</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleDownload(activeMaterial.file_url, activeMaterial.file_name)}
                  variant="primary"
                >
                  ↓ Download
                </Button>
                <Button 
                  onClick={() => setActiveMaterial(null)}
                  variant="outline"
                >
                  ✕ Tutup
                </Button>
              </div>
            </div>
            
            {/* Modal Body - PDF Iframe */}
            <div className="flex-1 bg-bg relative">
              <iframe
                src={`${activeMaterial.file_url}#toolbar=0&navpanes=0`}
                title={activeMaterial.title}
                className="w-full h-full absolute inset-0 border-none"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MaterialList;
