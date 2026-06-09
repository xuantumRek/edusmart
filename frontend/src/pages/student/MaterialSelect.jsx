import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { IT_SUBJECTS } from '../../constants/subjects';

const MaterialSelect = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const toggleSubject = (subj) => {
    if (selected.includes(subj)) {
      setSelected(selected.filter(s => s !== subj));
    } else {
      setSelected([...selected, subj]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === IT_SUBJECTS.length) {
      setSelected([]);
    } else {
      setSelected([...IT_SUBJECTS]);
    }
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    const query = new URLSearchParams();
    query.set('subjects', selected.join(','));
    navigate(`/student/materials/list?${query.toString()}`);
  };

  return (
    <div className="max-w-[1000px] mx-auto py-8">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl text-text-primary mb-3">Pilih Topik Materi</h1>
        <p className="text-text-secondary text-lg">Pilih satu atau lebih mata pelajaran IT yang ingin Anda pelajari hari ini.</p>
      </div>

      <div className="flex justify-between items-center mb-6 px-2">
        <span className="text-text-secondary font-medium">
          {selected.length} dari {IT_SUBJECTS.length} dipilih
        </span>
        <button 
          onClick={handleSelectAll}
          className="text-accent hover:underline text-sm font-medium"
        >
          {selected.length === IT_SUBJECTS.length ? 'Batalkan Semua' : 'Pilih Semua'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {IT_SUBJECTS.map((subj) => (
          <label 
            key={subj} 
            className={`
              cursor-pointer flex items-center p-4 rounded-[8px] border-2 transition-all duration-200
              ${selected.includes(subj) 
                ? 'border-accent bg-accent/10 shadow-[0_0_10px_rgba(139,92,246,0.15)]' 
                : 'border-border bg-surface hover:border-text-secondary/50'}
            `}
          >
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-border text-accent focus:ring-accent focus:ring-offset-bg bg-bg"
                checked={selected.includes(subj)}
                onChange={() => toggleSubject(subj)}
              />
            </div>
            <span className={`ml-3 font-medium ${selected.includes(subj) ? 'text-accent' : 'text-text-primary'}`}>
              {subj}
            </span>
          </label>
        ))}
      </div>

      <div className="flex justify-center pt-6 border-t border-border">
        <Button 
          onClick={handleContinue} 
          disabled={selected.length === 0}
          variant={selected.length > 0 ? "primary" : "secondary"}
          className="px-10 py-3 text-lg shadow-lg"
        >
          Lihat Materi →
        </Button>
      </div>
    </div>
  );
};

export default MaterialSelect;
