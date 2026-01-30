// src/App.tsx
import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const [refreshAuth, setRefreshAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setRefreshAuth(!refreshAuth);
        }}
      />
    );
  }

  return (
    <>
      {user?.role === 'teacher' && <TeacherDashboard />}
      {user?.role === 'student' && <StudentDashboard />}
    </>
  );
}

export default App;
