// src/components/LoginPage.tsx
import { useState } from 'react';
import {
  Lock,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  UserCircle,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  login: (email: string, password: string, role: 'student' | 'teacher') => Promise<any>;
  loading?: boolean;
  error?: string | null;
}

const translations = {
  kk: {
    welcome: 'Қош келдіңіз',
    login: 'Логин / Email',
    password: 'Құпия сөз',
    auth: 'Авторизация',
    consent: 'Жүйеге кіру арқылы сіз нейрожелілік сессия мониторингіне келісесіз.',
    student: 'Студент',
    teacher: 'Оқытушы',
    admin: 'Админ',
  },
  ru: {
    welcome: 'Добро пожаловать',
    login: 'Логин / Email',
    password: 'Пароль доступа',
    auth: 'Авторизация',
    consent: 'Входя в систему, вы подтверждаете согласие на мониторинг сессии нейросетью.',
    student: 'Студент',
    teacher: 'Учитель',
    admin: 'Админ',
  },
  en: {
    welcome: 'Welcome',
    login: 'Login / Email',
    password: 'Password',
    auth: 'Authorization',
    consent: 'By logging in, you consent to neural network session monitoring.',
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Admin',
  },
};

const OpenProctorLogo = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="50" r="25" stroke="currentColor" strokeWidth="8" />
    <circle cx="65" cy="50" r="25" stroke="currentColor" strokeWidth="8" />
    <path d="M50 35L60 50L50 65L40 50Z" fill="#F97316" />
  </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, login, loading = false, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Student' | 'Teacher' | 'Admin'>('Student');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'kk' | 'ru' | 'en'>('kk');
  const t = translations[lang];

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mappedRole = role === 'Student' ? 'student' : 'teacher';
    try {
      await login(email, password, mappedRole);
      onLoginSuccess();
    } catch {
      // handled by hook
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl transition-opacity ${theme === 'dark' ? 'bg-orange-900/10' : 'bg-orange-100/30'}`} />
      <div className={`absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-3xl transition-opacity ${theme === 'dark' ? 'bg-indigo-900/10' : 'bg-indigo-100/30'}`} />

      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-500">
        <div className={`rounded-[3rem] shadow-2xl border overflow-hidden transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="p-10 pb-0 flex flex-col items-center text-center">
            <div className="bg-slate-900 dark:bg-slate-800 p-4 rounded-[2rem] shadow-xl mb-6">
              <OpenProctorLogo className="w-12 h-12 text-white" />
            </div>
            <h1 className={`text-3xl font-black tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              OpenProctor<span className="text-orange-500">AI</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Exam Proctoring System</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            {error && (
              <div className={`p-3 rounded-2xl border text-sm font-bold ${theme === 'dark' ? 'bg-red-950/40 border-red-900 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
                {error}
              </div>
            )}

            <div className={`flex p-1.5 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              {(['Student', 'Teacher', 'Admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    role === r
                      ? (theme === 'dark' ? 'bg-slate-700 text-orange-400 border border-slate-600 shadow-lg' : 'bg-white text-orange-600 shadow-md border border-orange-100')
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t[r.toLowerCase() as 'student' | 'teacher' | 'admin']}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.login}</label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    required
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username"
                    className={`w-full pl-11 pr-4 py-4 border rounded-2xl text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-750' : 'bg-slate-50 border-slate-100 text-slate-900 focus:bg-white'} focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/20`}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.password}</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-4 py-4 border rounded-2xl text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-750' : 'bg-slate-50 border-slate-100 text-slate-900 focus:bg-white'} focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/20`}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 shadow-2xl ${theme === 'dark' ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/5' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>{t.auth} <ShieldCheck className="w-4 h-4 text-orange-500" /></>}
            </button>
            <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest leading-relaxed">{t.consent}</p>
          </form>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-orange-400' : 'bg-white border-slate-200 text-slate-400 hover:text-orange-500'}`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className={`flex items-center gap-1 p-1 rounded-full border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            {(['kk', 'ru', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-full transition-all ${lang === l ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
