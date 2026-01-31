import React from 'react';

interface Props {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

export const ThemeToggle: React.FC<Props> = ({ isDark, setIsDark }) => {
  return (
    <button onClick={() => setIsDark(!isDark)} className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
