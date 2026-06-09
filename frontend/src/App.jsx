import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import { DashboardLayout } from './components/layout/Sidebar';
import StudentDashboard from './pages/student/Dashboard';
import StudentHistory from './pages/student/History';
import TeacherDashboard from './pages/teacher/Dashboard';
import QuizCreate from './pages/teacher/QuizCreate';
import QuizEdit from './pages/teacher/QuizEdit';
import TeacherQuizResults from './pages/teacher/QuizResults';
import QuizTaking from './pages/student/QuizTaking';
import QuizResult from './pages/student/QuizResult';
import Profile from './pages/Profile';
import Materials from './pages/teacher/Materials';
import MaterialSelect from './pages/student/MaterialSelect';
import MaterialList from './pages/student/MaterialList';

// Protected Route Wrapper (simplified for now)
const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/" replace />;
  
  return children;
};

// (Layout component defined in Sidebar.jsx)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/student/*" element={
          <ProtectedRoute role="student">
            <DashboardLayout role="student">
              <Routes>
                <Route path="/" element={<StudentDashboard />} />
                <Route path="/sessions/:sessionId" element={<QuizTaking />} />
                <Route path="/sessions/:sessionId/result" element={<QuizResult />} />
                <Route path="/history" element={<StudentHistory />} />
                <Route path="/materials" element={<MaterialSelect />} />
                <Route path="/materials/list" element={<MaterialList />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/teacher/*" element={
          <ProtectedRoute role="teacher">
            <DashboardLayout role="teacher">
              <Routes>
                <Route path="/" element={<TeacherDashboard />} />
                <Route path="quizzes/create" element={<QuizCreate />} />
                <Route path="quizzes/:id/edit" element={<QuizEdit />} />
                <Route path="quizzes/:id/results" element={<TeacherQuizResults />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
