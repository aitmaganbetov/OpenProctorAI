// src/components/LoginPage.tsx
import { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  login: (email: string, password: string, role: 'student' | 'teacher') => Promise<any>;
  loading?: boolean;
  error?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, login, loading = false, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, role);
      onLoginSuccess();
    } catch {
      // Error is handled by useAuth hook
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">University Proctoring</h1>
          <p className="text-gray-400">AI-Powered Exam Monitoring System</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Role</label>
              <div className="flex gap-3">
                {(['student', 'teacher'] as const).map((r) => (
                  <label
                    key={r}
                    className="flex-1 flex items-center cursor-pointer p-3 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: role === r ? '#3b82f6' : '#475569',
                      backgroundColor: role === r ? '#1e3a8a' : '#1e293b',
                    }}
                  >
                    <input
                      type="radio"
                      value={r}
                      checked={role === r}
                      onChange={(e) => setRole(e.target.value as typeof role)}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 capitalize text-white font-medium">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-gray-400 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-gray-400">
              <p>
                <strong>Student:</strong> student@university.edu / password123
              </p>
              <p>
                <strong>Teacher:</strong> teacher@university.edu / password123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Secure. Private. Reliable.</p>
        </div>
      </div>
    </div>
  );
};
