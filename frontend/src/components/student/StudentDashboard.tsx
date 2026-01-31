// src/components/student/StudentDashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  Maximize2,
  Menu,
  MessageSquare,
  Mic,
  Minimize2,
  Monitor,
  Search,
  ShieldCheck,
  Terminal,
  User,
  Wifi,
  X,
} from 'lucide-react';

interface StudentDashboardProps {
  onLogout?: () => void;
}

const OpenProctorLogo = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="50" r="25" stroke="currentColor" strokeWidth="8" />
    <circle cx="65" cy="50" r="25" stroke="currentColor" strokeWidth="8" />
    <path d="M50 35L60 50L50 65L40 50Z" fill="#F97316" />
  </svg>
);

const Modal = ({ isOpen, onClose, title, children, footer }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-10">{children}</div>
        {footer && (
          <div className="px-8 py-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-50">{footer}</div>
        )}
      </div>
    </div>
  );
};

const FloatingCamera = ({ warning, message }: any) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`fixed z-50 transition-all duration-500 ease-in-out ${isMinimized ? 'top-24 right-6' : 'bottom-8 right-8'}`}>
      <div
        className={`relative bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-500 ${
          warning ? 'ring-4 ring-orange-500 animate-pulse' : 'ring-1 ring-slate-800'
        } ${isMinimized ? 'w-36 h-24' : 'w-72 aspect-video'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <User size={isMinimized ? 32 : 64} className="text-slate-700 opacity-40" />
        </div>

        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
          <div className={`w-1.5 h-1.5 rounded-full ${warning ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
          {!isMinimized && <span className="text-[9px] font-black text-white uppercase tracking-widest">PROCTORING ACTIVE</span>}
        </div>

        {warning && !isMinimized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <div className="bg-orange-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-bounce">
              <AlertCircle size={14} />
              {message}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
        >
          {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
      </div>
    </div>
  );
};

const ProfileView = ({ onStart, notify, onLogout }: any) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const startExam = () => {
    setLoading(true);
    setTimeout(onStart, 1500);
  };

  const navItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'exams', label: 'Экзамены', icon: BookOpen },
    { id: 'results', label: 'Результаты', icon: BarChart3 },
    { id: 'appeals', label: 'Апелляция', icon: MessageSquare },
    { id: 'profile', label: 'Профиль', icon: User },
  ];

  const checks = [
    { label: 'Веб-камера', icon: Camera, color: 'text-orange-500' },
    { label: 'Микрофон', icon: Mic, color: 'text-indigo-500' },
    { label: 'Интернет', icon: Wifi, color: 'text-blue-500' },
    { label: 'Рабочий стол', icon: Monitor, color: 'text-slate-700' },
  ];

  const availableExams = [
    { id: 1, title: 'Проектирование систем (Final)', date: 'Сегодня', duration: '30 мин', questions: 3, status: 'Доступен' },
    { id: 2, title: 'Алгоритмы и структуры данных', date: 'Завтра, 12:00', duration: '60 мин', questions: 25, status: 'Ожидание' },
    { id: 3, title: 'Базы данных (SQL)', date: '3 Февраля', duration: '45 мин', questions: 20, status: 'Ожидание' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-orange-400" />
            <div className="relative inline-block mb-6 mt-4">
              <div className="w-32 h-32 rounded-full bg-slate-50 border-4 border-white shadow-md mx-auto overflow-hidden flex items-center justify-center ring-1 ring-slate-100">
                <User size={64} className="text-slate-300" />
              </div>
              <div className="absolute bottom-1 right-1 bg-orange-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <Check size={14} className="text-white" />
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1 tracking-tight">Александр Иванов</h2>
            <p className="text-slate-400 font-black text-[9px] uppercase mb-8 tracking-[0.15em]">ID: 2024-08912 • OpenProctorAI Verified</p>

            <div className="space-y-1 text-left">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group ${
                    activeTab === item.id
                      ? 'bg-orange-50 text-orange-600 border border-orange-100/50 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon size={18} className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {item.label}
                  {activeTab === item.id && (
                    <div className="ml-auto w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                  )}
                </button>
              ))}

              <div className="my-4 border-t border-slate-50 mx-2" />

              <button
                onClick={() => {
                  notify('Завершение сеанса...');
                  onLogout?.();
                }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all"
              >
                <LogOut size={18} />
                Выход
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'dashboard' && (
            <>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <ShieldCheck className="text-orange-500" size={28} />
                  Статус оборудования
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {checks.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-3xl border border-slate-50 bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 ${item.color}`}>
                          <item.icon size={20} />
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-wider text-slate-600">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-500 font-black text-[9px] bg-white px-3 py-1.5 rounded-full border border-green-50 shadow-sm uppercase tracking-widest">
                        <CheckCircle size={12} strokeWidth={3} />
                        OK
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 opacity-5 pointer-events-none">
                  <OpenProctorLogo className="w-56 h-56" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tight relative">
                  <FileText className="text-orange-500" size={28} />
                  Регламент OpenProctorAI
                </h3>
                <div className="space-y-5 relative mb-10">
                  {[
                    'Таймер сессии не может быть остановлен после запуска.',
                    'AI отслеживает положение головы и направление взгляда.',
                    'Запрещено использование внешних ресурсов и окон.',
                    'Любые аномалии автоматически заносятся в протокол.',
                  ].map((text, i) => (
                    <div key={i} className="flex gap-5 group">
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black group-hover:bg-orange-500 transition-colors">
                        0{i + 1}
                      </div>
                      <p className="text-slate-600 font-bold text-sm leading-relaxed pt-1">{text}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab('exams')}
                  className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-[0.99] flex items-center justify-center gap-3"
                >
                  Перейти к списку экзаменов
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {activeTab === 'exams' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <BookOpen size={24} className="text-orange-500" />
                    Доступные экзамены
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="text"
                      placeholder="Поиск..."
                      className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:bg-white outline-none transition-all w-48"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {availableExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-orange-200 transition-all hover:bg-white"
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                            exam.status === 'Доступен' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Terminal size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-sm tracking-tight mb-1">{exam.title}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Calendar size={12} /> {exam.date}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock size={12} /> {exam.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={exam.status === 'Доступен' ? startExam : undefined}
                        disabled={exam.status !== 'Доступен' || loading}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          exam.status === 'Доступен'
                            ? 'bg-slate-900 text-white hover:bg-orange-500 shadow-lg active:scale-95'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {loading && exam.status === 'Доступен' ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          exam.status === 'Доступен' ? 'Начать' : 'Закрыто'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500 mb-6">
                <BarChart3 size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Ваши результаты</h3>
              <p className="text-slate-400 text-sm font-medium">Здесь будут отображаться итоги пройденных тестов после их проверки системой.</p>
            </div>
          )}

          {activeTab === 'appeals' && (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 mb-6">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Апелляция</h3>
              <p className="text-slate-400 text-sm font-medium mb-8">
                В данном разделе вы можете подать заявку на пересмотр результатов экзамена или логов прокторинга.
              </p>
              <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl active:scale-95">
                Подать заявку
              </button>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Персональные данные</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">ФИО</p>
                  <p className="text-sm font-bold text-slate-700">Иванов Александр Сергеевич</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Почта</p>
                  <p className="text-sm font-bold text-slate-700">a.ivanov@openproctor.ai</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Группа</p>
                  <p className="text-sm font-bold text-slate-700">Б-ПИ-21-4</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Статус</p>
                  <p className="text-sm font-bold text-green-600">Верифицирован</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionCard = ({ question, index, selectedAnswer, onAnswer, isFlagged, onToggleFlag }: any) => (
  <div className="space-y-6">
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-3">
        <div className="inline-flex bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
          <span className="text-orange-500 font-black text-[9px] tracking-widest uppercase">Вопрос 0{index + 1}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">{question.text}</h2>
      </div>
      <button
        onClick={() => onToggleFlag(index)}
        className={`p-4 rounded-2xl transition-all border-2 shrink-0 shadow-sm ${
          isFlagged ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-orange-100 scale-110' : 'bg-white border-slate-100 text-slate-200 hover:border-slate-200'
        }`}
      >
        <Flag size={24} fill={isFlagged ? 'currentColor' : 'none'} />
      </button>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {question.options.map((option: string, i: number) => (
        <label
          key={i}
          className={`group relative flex items-center p-6 cursor-pointer rounded-[2rem] border-2 transition-all duration-300 shadow-sm ${
            selectedAnswer === i ? 'border-orange-500 bg-white shadow-orange-50' : 'border-white bg-white hover:border-slate-200'
          }`}
        >
          <input type="radio" name={`q-${index}`} checked={selectedAnswer === i} onChange={() => onAnswer(i)} className="sr-only" />
          <div className="flex items-center w-full gap-5">
            <div
              className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-inner ${
                selectedAnswer === i ? 'border-orange-500 bg-orange-500' : 'border-slate-100 bg-slate-50 group-hover:border-slate-200'
              }`}
            >
              <Check size={16} strokeWidth={4} className={`text-white transition-transform duration-300 ${selectedAnswer === i ? 'scale-100' : 'scale-0'}`} />
            </div>
            <span className={`text-base font-bold transition-colors ${selectedAnswer === i ? 'text-slate-900' : 'text-slate-500'}`}>{option}</span>
          </div>
        </label>
      ))}
    </div>
  </div>
);

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout }) => {
  const [view, setView] = useState<'profile' | 'exam'>('profile');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [warning, setWarning] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: number; msg: string }>>([]);

  const notify = (msg: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, msg }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 3000);
  };

  const questions = [
    {
      id: 1,
      text: "Каков основной принцип работы 'Виртуальной памяти' в современных ОС?",
      options: [
        'Использование внешних накопителей для расширения адресного пространства',
        'Создание иллюзии непрерывной памяти для процессов через сегментацию и страницы',
        'Оптимизация кэширования L1/L2 через программные прерывания',
        'Метод сжатия данных в оперативной памяти без участия CPU',
      ],
    },
    {
      id: 2,
      text: "Какой метод HTTP-запроса считается 'идемпотентным'?",
      options: ['POST', 'GET', 'PUT', 'PATCH'],
    },
    {
      id: 3,
      text: 'В чем преимущество использования архитектуры микросервисов перед монолитом?',
      options: [
        'Гарантированное отсутствие задержек при сетевом взаимодействии',
        'Упрощение тестирования сквозных сценариев (E2E)',
        'Независимое масштабирование и деплой отдельных компонентов',
        'Снижение общих затрат на инфраструктуру базы данных',
      ],
    },
  ];

  useEffect(() => {
    if (view !== 'exam') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  useEffect(() => {
    if (view !== 'exam') return;
    const trigger = setTimeout(() => setWarning(true), 15000);
    const stop = setTimeout(() => setWarning(false), 20000);
    return () => {
      clearTimeout(trigger);
      clearTimeout(stop);
    };
  }, [view]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleFlag = (idx: number) => {
    const next = new Set(flagged);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setFlagged(next);
  };

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  if (view === 'profile') {
    return <ProfileView onStart={() => setView('exam')} notify={notify} onLogout={onLogout} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden select-none">
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        {notifications.map((n) => (
          <div key={n.id} className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4">
            {n.msg}
          </div>
        ))}
      </div>

      <header className="h-20 flex-none bg-white border-b border-slate-200 px-6 md:px-10 flex items-center justify-between z-30 shadow-sm sticky top-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <OpenProctorLogo className="w-10 h-10 text-slate-800" />
            <div className="hidden sm:block">
              <h1 className="font-black text-slate-900 text-lg leading-none tracking-tight">
                OpenProctor<span className="text-orange-500 ml-0.5">AI</span>
              </h1>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 block">Session ID: #824-A</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div
            className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl font-mono text-sm font-black border-2 transition-all shadow-inner ${
              timeLeft < 300 ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-600'
            }`}
          >
            <Clock size={18} className={timeLeft < 300 ? 'text-orange-500' : 'text-slate-400'} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <div className="h-10 w-px bg-slate-100" />

          <div className="flex items-center gap-3">
            <button onClick={() => setView('profile')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Домой">
              <LayoutDashboard size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black border-2 border-white shadow-sm">
              АИ
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-slate-200 transform transition-all duration-500 lg:relative lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col p-8">
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Прогресс сессии</span>
                <span className="text-xs font-black text-orange-600">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Навигатор вопросов</p>
              <div className="grid grid-cols-4 gap-3">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIdx(i);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className={`aspect-square rounded-2xl text-[11px] font-black border-2 transition-all relative flex items-center justify-center ${
                      currentIdx === i
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md'
                        : answers[i] !== undefined
                          ? 'border-slate-100 bg-slate-50 text-slate-900'
                          : 'border-slate-50 bg-white text-slate-300 hover:border-slate-200'
                    }`}
                  >
                    {i + 1}
                    {flagged.has(i) && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                        <Flag size={8} fill="white" className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20 flex flex-col items-center bg-slate-50/50">
          <div className="w-full max-w-3xl space-y-12">
            <QuestionCard
              index={currentIdx}
              question={questions[currentIdx]}
              selectedAnswer={answers[currentIdx]}
              onAnswer={(val: number) => setAnswers({ ...answers, [currentIdx]: val })}
              isFlagged={flagged.has(currentIdx)}
              onToggleFlag={handleToggleFlag}
            />

            <div className="pt-12 flex items-center justify-between gap-6 border-t border-slate-200/60">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
              >
                <ChevronLeft size={16} />
                <span>Назад</span>
              </button>

              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 text-[10px] uppercase tracking-widest"
                >
                  Завершить тест
                  <Check size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 text-[10px] uppercase tracking-widest"
                >
                  <span>Далее</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      <FloatingCamera warning={warning} message="Внимание: посмотрите в камеру!" />

      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Подтверждение"
        footer={
          <button className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
            Отправить ответы
          </button>
        }
      >
        <p className="text-slate-500 font-bold leading-relaxed text-sm">Вы уверены, что хотите завершить экзамен? Все ответы будут зафиксированы.</p>
      </Modal>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};
