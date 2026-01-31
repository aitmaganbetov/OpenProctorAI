// src/App.tsx
import { useEffect, useState } from 'react';
import { Suspense, lazy } from 'react';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './hooks/useAuth';

const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard })));
const StudentDashboard = lazy(() => import('./components/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard })));

function App() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();
  const [lang] = useState<'ru' | 'en' | 'kk'>(() => (localStorage.getItem('lang') as any) || 'ru');
  const [isDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new Event('app:lang-change'));
  }, [lang]);

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
          // User is now logged in, App will re-render automatically
        }}
        login={login}
        loading={loading}
        error={user ? undefined : undefined}
      />
    );
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        }
      >
        {user?.role === 'admin' && <AdminPanel onLogout={logout} />}
        {user?.role === 'teacher' && <TeacherDashboard onLogout={logout} />}
        {user?.role === 'student' && <StudentDashboard onLogout={logout} />}
      </Suspense>
    </>
  );
}

export default App;
