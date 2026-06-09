import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = role === 'teacher' ? [
    { name: 'Dashboard', path: '/teacher' },
    { name: 'Buat Kuis', path: '/teacher/quizzes/create' },
    { name: 'Materi', path: '/teacher/materials' },
    { name: 'Profil', path: '/teacher/profile' },
  ] : [
    { name: 'Kuis Tersedia', path: '/student' },
    { name: 'Materi', path: '/student/materials' },
    { name: 'Riwayat Kuis', path: '/student/history' },
    { name: 'Profil', path: '/student/profile' },
  ];

  return (
    <aside className="w-[240px] border-r border-border bg-surface h-screen fixed left-0 top-0 flex flex-col hidden md:flex">
      <div className="p-6 border-b border-border">
        <h2 className="font-display text-xl text-text-primary">EduSmart</h2>
      </div>
      
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== `/${role}` && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`px-4 py-2.5 rounded-[3px] text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-surface-raised border-l-2 border-accent text-text-primary' 
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 rounded-[3px] text-sm font-medium text-danger hover:bg-danger-dim transition-colors"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
};

export const DashboardLayout = ({ children, role }) => {
  return (
    <div className="min-h-screen bg-bg text-text-primary flex">
      <Sidebar role={role} />
      <main className="flex-1 ml-0 md:ml-[240px] p-6 md:p-12">
        {children}
      </main>
    </div>
  );
};
