import React from 'react';

interface Props {
  lang: string;
  setLang: (l: string) => void;
  isDark?: boolean;
}

export const LanguageSwitcher: React.FC<Props> = ({ lang, setLang, isDark = false }) => {
  const langs = ['kk', 'ru', 'en'];
  return (
    <div className={`flex bg-slate-500/10 p-1 rounded-xl items-center border ${isDark ? 'border-slate-700' : 'border-slate-200'} pointer-events-auto`}>
      {langs.map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1.5 rounded-lg text-[12px] font-black uppercase transition-all cursor-pointer ${lang === l ? (isDark ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 shadow-sm') : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
