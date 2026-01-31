// src/components/student/StudentDashboard.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
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
import api from '../../services/api';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import ThemeToggle from '../ui/ThemeToggle';

interface StudentDashboardProps {
  onLogout?: () => void;
}

type StreamKind = 'camera' | 'screen';

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

const FloatingCamera = ({ warning, message, stream, cameraError, onRetry, noiseStatus }: any) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const height = isMinimized ? 96 : 180;
    setPosition({ x: 24, y: window.innerHeight - height - 24 });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const videoEl = videoRef.current;
    if (!videoEl || !stream) {
      setCameraReady(false);
      return;
    }

    setCameraReady(false);

    const attach = async () => {
      try {
        videoEl.srcObject = stream;
        videoEl.muted = true;
        await videoEl.play();
      } catch {
        if (!cancelled) setCameraReady(false);
      }
    };

    attach();

    const poll = () => {
      if (cancelled) return;
      if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
        setCameraReady(true);
        return;
      }
      requestAnimationFrame(poll);
    };

    requestAnimationFrame(poll);

    return () => {
      cancelled = true;
    };
  }, [stream]);

  const handleDragStart = (clientX: number, clientY: number) => {
    setDragging(true);
    dragOffset.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragging) return;
    const rect = widgetRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 260;
    const height = rect?.height ?? 180;
    const nextX = Math.max(12, Math.min(window.innerWidth - width - 12, clientX - dragOffset.current.x));
    const nextY = Math.max(12, Math.min(window.innerHeight - height - 12, clientY - dragOffset.current.y));
    setPosition({ x: nextX, y: nextY });
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handleDragMove(t.clientX, t.clientY);
    };
    const onTouchEnd = () => handleDragEnd();

    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging]);

  return (
    <div
      ref={widgetRef}
      className="fixed z-50 transition-all duration-300 ease-in-out"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className={`relative bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-300 ${
          warning ? 'ring-4 ring-orange-500 animate-pulse' : 'ring-1 ring-slate-800'
        } ${isMinimized ? 'w-36 h-24' : 'w-72 aspect-video'}`}
      >
        <div
          className="absolute inset-x-0 top-0 h-8 cursor-move z-20"
          onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) handleDragStart(t.clientX, t.clientY);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center pointer-events-none">
          {stream ? (
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
          ) : cameraError ? (
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 text-center">
              {cameraError}
            </div>
          ) : (
            <User size={isMinimized ? 32 : 64} className="text-slate-700 opacity-40" />
          )}
        </div>

        {!cameraReady && (
          <button
            onClick={onRetry}
            className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Перезапустить
          </button>
        )}

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

        {!isMinimized && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/40 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
            <div className={`w-2 h-2 rounded-full ${noiseStatus === 'noisy' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              {noiseStatus === 'noisy' ? 'ШУМНО' : 'ТИХО'}
            </span>
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

const ProfileView = ({ onStart, notify, onLogout, studentId, profileData, onProfileRefresh, lang, setLang, isDark, setIsDark }: any) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [hasProfilePhoto, setHasProfilePhoto] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const startExam = async (examId?: number) => {
    setLoading(true);
    try {
      const ok = await onStart(examId);
      if (!ok) {
        setLoading(false);
        return;
      }
    } catch {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadStatus = async () => {
      if (!studentId) return;
      try {
        const status = await api.checkStudentPhoto(studentId);
        setHasProfilePhoto(Boolean(status?.has_photo));
      } catch {
        setHasProfilePhoto(false);
      }
    };
    loadStatus();
  }, [studentId]);

  const handlePhotoUpload = async (file?: File) => {
    if (!file || !studentId) return;
    setPhotoLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      await api.uploadStudentPhoto(studentId, base64);
      await onProfileRefresh?.();
      setHasProfilePhoto(true);
      notify('Фото профиля сохранено');
    } catch {
      notify('Не удалось загрузить фото');
    } finally {
      setPhotoLoading(false);
    }
  };

  const navLabels = {
    ru: { dashboard: 'Дашборд', exams: 'Экзамены', results: 'Результаты', appeals: 'Апелляция', profile: 'Профиль' },
    en: { dashboard: 'Dashboard', exams: 'Exams', results: 'Results', appeals: 'Appeals', profile: 'Profile' },
    kk: { dashboard: 'Бақылау', exams: 'Емтихандар', results: 'Нәтижелер', appeals: 'Апелляция', profile: 'Профиль' },
  }[lang || 'ru'];

  const navItems = [
    { id: 'dashboard', label: navLabels.dashboard, icon: LayoutDashboard },
    { id: 'exams', label: navLabels.exams, icon: BookOpen },
    { id: 'results', label: navLabels.results, icon: BarChart3 },
    { id: 'appeals', label: navLabels.appeals, icon: MessageSquare },
    { id: 'profile', label: navLabels.profile, icon: User },
  ];

  const checks = [
    { key: 'camera', label: 'Веб-камера', icon: Camera, color: 'text-orange-500' },
    { key: 'mic', label: 'Микрофон', icon: Mic, color: 'text-indigo-500' },
    { key: 'internet', label: 'Интернет', icon: Wifi, color: 'text-blue-500' },
    { key: 'desktop', label: 'Рабочий стол', icon: Monitor, color: 'text-slate-700' },
  ];

  const [equipmentStatus, setEquipmentStatus] = useState<Record<string, 'ok' | 'fail' | 'checking'>>({
    camera: 'checking',
    mic: 'checking',
    internet: 'checking',
    desktop: 'checking',
  });

  const runEquipmentCheck = async () => {
    setEquipmentStatus({
      camera: 'checking',
      mic: 'checking',
      internet: 'checking',
      desktop: 'checking',
    });

    const online = typeof navigator !== 'undefined' ? navigator.onLine : false;
    setEquipmentStatus((prev) => ({ ...prev, internet: online ? 'ok' : 'fail' }));

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
        setEquipmentStatus((prev) => ({ ...prev, camera: 'fail', mic: 'fail', desktop: 'ok' }));
        return;
      }

      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach((track) => track.stop());
          setEquipmentStatus((prev) => ({ ...prev, camera: 'ok', mic: 'ok' }));
          return;
        } catch {
          setEquipmentStatus((prev) => ({ ...prev, camera: 'fail', mic: 'fail' }));
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((d) => d.kind === 'videoinput');
      const hasMic = devices.some((d) => d.kind === 'audioinput');
      setEquipmentStatus((prev) => ({
        ...prev,
        camera: hasCamera ? 'ok' : 'fail',
        mic: hasMic ? 'ok' : 'fail',
        desktop: 'ok',
      }));
    } catch {
      setEquipmentStatus((prev) => ({ ...prev, camera: 'fail', mic: 'fail', desktop: 'ok' }));
    }
  };

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : false;
      setEquipmentStatus((prev) => ({ ...prev, internet: online ? 'ok' : 'fail' }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const availableExams = [
    { id: 1, title: 'Проектирование систем (Final)', date: 'Сегодня', duration: '30 мин', questions: 3, status: 'Доступен' },
    { id: 2, title: 'Алгоритмы и структуры данных', date: 'Завтра, 12:00', duration: '60 мин', questions: 25, status: 'Ожидание' },
    { id: 3, title: 'Базы данных (SQL)', date: '3 Февраля', duration: '45 мин', questions: 20, status: 'Ожидание' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 select-none">
      <div className="max-w-7xl w-full">
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-2">
            <LanguageSwitcher lang={lang} setLang={setLang} isDark={isDark} />
            <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-orange-400" />
            <div className="relative inline-block mb-6 mt-4">
              <div className="w-32 h-32 rounded-full bg-slate-50 border-4 border-white shadow-md mx-auto overflow-hidden flex items-center justify-center ring-1 ring-slate-100">
                {profileData?.photo_base64 ? (
                  <img src={profileData.photo_base64} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-slate-300" />
                )}
              </div>
              {(hasProfilePhoto || profileData?.is_verified) && (
                <div className="absolute bottom-1 right-1 bg-orange-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1 tracking-tight">
              {profileData?.full_name || '—'}
            </h2>
            <p className="text-slate-400 dark:text-slate-400 font-black text-[9px] uppercase mb-8 tracking-[0.15em]">
              ID: {studentId ?? '—'} • {profileData?.is_active ? 'OpenProctorAI Verified' : 'Не активен'}
            </p>

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

              <div className="my-4 border-t border-slate-50 dark:border-slate-700 mx-2" />

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
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100 dark:border-slate-700">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <ShieldCheck className="text-orange-500" size={28} />
                  Статус оборудования
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {checks.map((item, i) => {
                    const status = equipmentStatus[item.key] || 'checking';
                    const statusLabel = status === 'ok' ? 'OK' : status === 'fail' ? 'Нет доступа' : 'Проверка';
                    const statusClass =
                      status === 'ok'
                        ? 'text-green-500 border-green-50'
                        : status === 'fail'
                          ? 'text-rose-500 border-rose-50'
                          : 'text-amber-500 border-amber-50';
                    return (
                      <div key={i} className="flex items-center justify-between p-5 rounded-3xl border border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 ${item.color}`}>
                            <item.icon size={20} />
                          </div>
                          <span className="font-black text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300">{item.label}</span>
                        </div>
                        <div className={`flex items-center gap-2 font-black text-[9px] bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest ${statusClass}`}>
                          <CheckCircle size={12} strokeWidth={3} />
                          {statusLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={runEquipmentCheck}
                    className="mt-6 px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Проверить оборудование
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 opacity-5 pointer-events-none">
                  <OpenProctorLogo className="w-56 h-56" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3 uppercase tracking-tight relative">
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
                      <p className="text-slate-600 dark:text-slate-300 font-bold text-sm leading-relaxed pt-1">{text}</p>
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
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-3">
                    <BookOpen size={24} className="text-orange-500" />
                    Доступные экзамены
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="text"
                      placeholder="Поиск..."
                      className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-bold focus:bg-white dark:focus:bg-slate-800 outline-none transition-all w-48 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {availableExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-6 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 rounded-3xl flex items-center justify-between group hover:border-orange-200 transition-all hover:bg-white dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                            exam.status === 'Доступен' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <Terminal size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight mb-1">{exam.title}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 flex items-center gap-1">
                              <Calendar size={12} /> {exam.date}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 dark:bg-slate-600 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 flex items-center gap-1">
                              <Clock size={12} /> {exam.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={exam.status === 'Доступен' ? () => startExam(exam.id) : undefined}
                        disabled={exam.status !== 'Доступен' || loading}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          exam.status === 'Доступен'
                            ? 'bg-slate-900 text-white hover:bg-orange-500 shadow-lg active:scale-95'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
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
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500 mb-6">
                <BarChart3 size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-2">Ваши результаты</h3>
              <p className="text-slate-400 dark:text-slate-300 text-sm font-medium">Здесь будут отображаться итоги пройденных тестов после их проверки системой.</p>
            </div>
          )}

          {activeTab === 'appeals' && (
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500 mb-6">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-2">Апелляция</h3>
              <p className="text-slate-400 dark:text-slate-300 text-sm font-medium mb-8">
                В данном разделе вы можете подать заявку на пересмотр результатов экзамена или логов прокторинга.
              </p>
              <button className="px-8 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl active:scale-95">
                Подать заявку
              </button>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-xl border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-8 uppercase tracking-tight">Персональные данные</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">ФИО</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{profileData?.full_name || '—'}</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Почта</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{profileData?.email || '—'}</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Группа</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{profileData?.group || '—'}</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Статус</p>
                  <p className={`text-sm font-bold ${profileData?.is_active ? 'text-green-600' : 'text-rose-500'}`}>
                    {profileData?.is_active ? 'Верифицирован' : 'Не активен'}
                  </p>
                </div>
              </div>
              <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Фото профиля</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {hasProfilePhoto ? 'Загружено' : 'Не загружено'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                    />
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={hasProfilePhoto || photoLoading}
                      className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        hasProfilePhoto
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800'
                      }`}
                    >
                      {photoLoading ? 'Загрузка...' : 'Добавить фото'}
                    </button>
                  </div>
                </div>
                {hasProfilePhoto && (
                  <p className="mt-3 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    Фото уже добавлено. Повторная загрузка недоступна.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

const QuestionCard = ({ question, index, selectedAnswer, onAnswer, isFlagged, onToggleFlag }: any) => (
  <div className="space-y-6">
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-3">
        <div className="inline-flex bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
          <span className="text-orange-500 font-black text-[9px] tracking-widest uppercase">Вопрос 0{index + 1}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight">{question.text}</h2>
      </div>
      <button
        onClick={() => onToggleFlag(index)}
        className={`p-4 rounded-2xl transition-all border-2 shrink-0 shadow-sm ${
          isFlagged ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-orange-100 scale-110' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-200 hover:border-slate-200'
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
            selectedAnswer === i
              ? 'border-orange-500 bg-white dark:bg-slate-800 shadow-orange-50'
              : 'border-white dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200'
          }`}
        >
          <input type="radio" name={`q-${index}`} checked={selectedAnswer === i} onChange={() => onAnswer(i)} className="sr-only" />
          <div className="flex items-center w-full gap-5">
            <div
              className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-inner ${
                selectedAnswer === i
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 group-hover:border-slate-200'
              }`}
            >
              <Check size={16} strokeWidth={4} className={`text-white transition-transform duration-300 ${selectedAnswer === i ? 'scale-100' : 'scale-0'}`} />
            </div>
            <span className={`text-base font-bold transition-colors ${selectedAnswer === i ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-300'}`}>{option}</span>
          </div>
        </label>
      ))}
    </div>
  </div>
);

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout }) => {
  const [lang, setLang] = useState<'ru' | 'en' | 'kk'>(() => (localStorage.getItem('lang') as any) || 'ru');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [view, setView] = useState<'profile' | 'verification' | 'exam'>('profile');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [warning, setWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('Внимание: посмотрите в камеру!');
  const [noiseLevel, setNoiseLevel] = useState<number>(0);
  const [noiseStatus, setNoiseStatus] = useState<'quiet' | 'noisy'>('quiet');
  const [notifications, setNotifications] = useState<Array<{ id: number; msg: string }>>([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [faceCheckLoading, setFaceCheckLoading] = useState(false);
  const [faceCheckError, setFaceCheckError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [streamMode, setStreamMode] = useState<'camera' | 'screen'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeExamId, setActiveExamId] = useState<number | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const verificationVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const profileDescriptorRef = useRef<Float32Array | null>(null);
  const lastViolationAtRef = useRef<number>(0);
  const lastGazeViolationAtRef = useRef<number>(0);
  const lastMultipleFacesAtRef = useRef<number>(0);
  const lastObjectCheckAtRef = useRef<number>(0);
  const lastObjectViolationAtRef = useRef<Record<string, number>>({});
  const objectModelRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioMonitorTimerRef = useRef<number | null>(null);
  const lastNoiseAtRef = useRef<number>(0);
  const examStartAtRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const bufferRef = useRef<Array<{ blob: Blob; ts: number }>>([]);
  const captureTailRef = useRef<{ active: boolean; chunks: Blob[] } | null>(null);
  const evidenceInFlightRef = useRef(false);
  const pendingViolationsRef = useRef<Array<Record<string, any>>>([]);
  const streamPeersRef = useRef<Record<StreamKind, Map<string, RTCPeerConnection>>>(
    { camera: new Map(), screen: new Map() }
  );
  const streamSocketRef = useRef<Record<StreamKind, WebSocket | null>>({ camera: null, screen: null });
  const pendingStreamViewersRef = useRef<Record<StreamKind, Set<string>>>(
    { camera: new Set(), screen: new Set() }
  );
  const [profileData, setProfileData] = useState<{
    id?: number;
    full_name?: string;
    email?: string;
    group?: string;
    is_active?: boolean;
    photo_base64?: string;
    is_verified?: boolean;
  } | null>(null);

  const effectiveStudentId = studentId ?? profileData?.id ?? null;

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

  const handleLangChange = useCallback((nextLang: 'ru' | 'en' | 'kk') => {
    setLang(nextLang);
    localStorage.setItem('lang', nextLang);
    document.documentElement.lang = nextLang;
    window.dispatchEvent(new Event('app:lang-change'));
  }, []);

  const captureViolation = useCallback(async (): Promise<Blob | null> => {
    if (evidenceInFlightRef.current) return null;
    evidenceInFlightRef.current = true;
    try {
      const preChunks = bufferRef.current.map((c) => c.blob);
      captureTailRef.current = { active: true, chunks: [] };
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const tailChunks = captureTailRef.current?.chunks || [];
      captureTailRef.current = null;
      const all = [...preChunks, ...tailChunks];
      if (all.length === 0) return null;
      return new Blob(all, { type: 'video/webm' });
    } finally {
      evidenceInFlightRef.current = false;
    }
  }, []);

  const logViolation = useCallback(
    async (payload: Record<string, any>) => {
      try {
        if (view === 'exam' && cameraStream) {
          const evidence = await captureViolation();
          if (evidence) {
            const form = new FormData();
            form.append('file', evidence, `violation_${Date.now()}.webm`);
            form.append('session_id', String(activeSessionId || payload.session_id || ''));
            if (payload.student_id) form.append('student_id', String(payload.student_id));
            if (payload.exam_id) form.append('exam_id', String(payload.exam_id));
            form.append('violation_type', String(payload.violation_type || 'object_detected'));
            form.append('timestamp', String(payload.timestamp || new Date().toISOString()));
            form.append('confidence', String(payload.confidence ?? 0.6));
            await api.reportViolationEvidence(form);
            return;
          }
        }
        await api.reportViolation(activeSessionId || undefined, payload);
      } catch {
        pendingViolationsRef.current.push(payload);
      }
    },
    [activeSessionId, cameraStream, captureViolation, view]
  );

  useEffect(() => {
    const interval = setInterval(async () => {
      if (pendingViolationsRef.current.length === 0) return;
      const queue = [...pendingViolationsRef.current];
      pendingViolationsRef.current = [];
      for (const payload of queue) {
        try {
          await api.reportViolation(activeSessionId || undefined, payload);
        } catch {
          pendingViolationsRef.current.push(payload);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSessionId]);

  const notify = (msg: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, msg }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 3000);
  };

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    setScreenStream(null);
    setStreamMode('camera');
    streamPeersRef.current.screen.forEach((pc) => pc.close());
    streamPeersRef.current.screen.clear();
    pendingStreamViewersRef.current.screen.clear();
  }, [screenStream]);

  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      notify('Браузер не поддерживает демонстрацию экрана');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          stopScreenShare();
        };
      }
      setScreenStream(stream);
      setStreamMode('screen');
      notify('Экран транслируется');
    } catch {
      notify('Не удалось запустить демонстрацию экрана');
    }
  }, [notify, stopScreenShare]);

  const stopAudioMonitor = useCallback(() => {
    if (audioMonitorTimerRef.current) {
      window.clearInterval(audioMonitorTimerRef.current);
      audioMonitorTimerRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    audioAnalyserRef.current = null;
  }, []);

  const startAudioMonitor = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia not supported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStreamRef.current = stream;
      const context = new AudioContext();
      // Resume AudioContext if suspended (browser autoplay policy)
      if (context.state === 'suspended') {
        await context.resume();
      }
      audioContextRef.current = context;
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512; // Smaller FFT for faster response
      analyser.smoothingTimeConstant = 0.3; // Less smoothing for faster detection
      source.connect(analyser);
      audioAnalyserRef.current = analyser;

      const data = new Uint8Array(analyser.fftSize);
      audioMonitorTimerRef.current = window.setInterval(async () => {
        const node = audioAnalyserRef.current;
        if (!node) return;
        
        // Ensure context is still running
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        node.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setNoiseLevel(rms);
        
        // Threshold 0.025 - sensitive to whispers and voice, ignores most fan noise
        const isNoisy = rms > 0.025;
        setNoiseStatus(isNoisy ? 'noisy' : 'quiet');
        
        if (isNoisy) {
          const now = Date.now();
          // Log violation every 5 seconds if noise persists
          if (now - lastNoiseAtRef.current > 5000) {
            lastNoiseAtRef.current = now;
            setWarning(true);
            setWarningMessage('🔊 Обнаружен посторонний шум или голос');
            console.log('Noise detected! RMS:', rms);
            if (effectiveStudentId) {
              void logViolation({
                violation_type: 'voice_detected',
                timestamp: new Date().toISOString(),
                confidence: 0.7,
                severity_score: 60,
                student_id: effectiveStudentId,
                exam_id: activeExamId,
              });
            }
          }
        }
      }, 500); // Check every 500ms for faster detection
      
      console.log('Audio monitor started successfully');
    } catch (err) {
      console.error('Audio monitor error:', err);
    }
  }, [activeExamId, effectiveStudentId, logViolation]);

  const sendStreamOffer = useCallback(async (kind: StreamKind, viewerId: string, selfId: string) => {
    const pc = streamPeersRef.current[kind].get(viewerId);
    const socket = streamSocketRef.current[kind];
    if (!pc || !socket) return;

    const hasTracks = pc.getSenders().some((s) => s.track);
    if (!hasTracks || pc.signalingState !== 'stable') {
      pendingStreamViewersRef.current[kind].add(viewerId);
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription, from: selfId, to: viewerId }));
    } else {
      pendingStreamViewersRef.current[kind].add(viewerId);
    }
  }, []);

  const startEvidenceRecorder = useCallback((stream: MediaStream) => {
    if (recorderRef.current) return;
    if (typeof MediaRecorder === 'undefined') return;
    try {
      const h264Mime = 'video/webm;codecs=h264,opus';
      const vp8Mime = 'video/webm;codecs=vp8,opus';
      const mimeType = MediaRecorder.isTypeSupported(h264Mime)
        ? h264Mime
        : MediaRecorder.isTypeSupported(vp8Mime)
          ? vp8Mime
          : 'video/webm';
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 900_000,
      });
      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size === 0) return;
        const now = Date.now();
        bufferRef.current.push({ blob: event.data, ts: now });
        while (bufferRef.current.length > 0 && now - bufferRef.current[0].ts > 15000) {
          bufferRef.current.shift();
        }
        if (captureTailRef.current?.active) {
          captureTailRef.current.chunks.push(event.data);
        }
      };
      recorder.start(1000);
      recorderRef.current = recorder;
    } catch {
      // ignore recorder start errors
    }
  }, []);

  const stopEvidenceRecorder = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    bufferRef.current = [];
    captureTailRef.current = null;
  }, []);


  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          setStudentId(Number(parsed.id));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handler = () => setLang((localStorage.getItem('lang') as any) || 'ru');
    window.addEventListener('app:lang-change', handler as EventListener);
    return () => window.removeEventListener('app:lang-change', handler as EventListener);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!studentId) return;
    try {
      const data = await api.getStudentProfile(studentId) as any;
      setProfileData({
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        group: data.group,
        is_active: data.is_active,
        photo_base64: data.photo_base64,
        is_verified: data.is_verified,
      });
    } catch {
      // ignore
    }
  }, [studentId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    let active = true;
    const MODEL_URL = '/models';
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        if (active) setModelsReady(true);
      } catch {
        if (active) setModelsReady(false);
      }
    };
    loadModels();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const buildDescriptor = async () => {
      if (!modelsReady || !profileData?.photo_base64) return;
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Image load failed'));
          image.src = profileData.photo_base64 as string;
        });
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        profileDescriptorRef.current = detection?.descriptor || null;
      } catch {
        profileDescriptorRef.current = null;
      }
    };
    buildDescriptor();
  }, [modelsReady, profileData?.photo_base64]);

  const startCameraStream = useCallback(async () => {
    try {
      setCameraError(null);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
    } catch (err: any) {
      const reason = err?.name === 'NotAllowedError'
        ? 'Доступ к камере запрещен'
        : err?.name === 'NotFoundError'
          ? 'Камера не найдена'
          : 'Камера недоступна';
      setCameraError(reason);
      setCameraStream(null);
    }
  }, []);

  useEffect(() => {
    if (view === 'exam' || view === 'verification') {
      startCameraStream();
    } else {
      stopScreenShare();
      stopAudioMonitor();
      stopEvidenceRecorder();
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      cameraStreamRef.current = null;
      setCameraStream(null);
    }
  }, [view, startCameraStream, stopScreenShare, stopAudioMonitor, stopEvidenceRecorder]);

  useEffect(() => {
    if (view !== 'verification') return;
    const video = verificationVideoRef.current;
    if (!video || !cameraStream) return;
    video.srcObject = cameraStream;
    video.muted = true;
    video.play().catch(() => {});
  }, [view, cameraStream]);

  const captureSnapshot = async (): Promise<string> => {
    if (!navigator.mediaDevices?.getUserMedia && !cameraStreamRef.current) {
      throw new Error('Camera не доступна');
    }
    const localStream = cameraStreamRef.current
      ? null
      : await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const stream = cameraStreamRef.current || localStream;
    if (!stream) {
      throw new Error('Camera не доступна');
    }
    const video = videoRef.current || document.createElement('video');
    videoRef.current = video;
    video.srcObject = stream;
    await video.play();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const maxWidth = 640;
    const scale = vw > maxWidth ? maxWidth / vw : 1;
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas не доступен');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const verifyFaceClient = async (snapshotBase64: string): Promise<{ verified: boolean; message?: string }> => {
    // Try client-side verification first
    if (modelsReady && profileDescriptorRef.current) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Image load failed'));
          image.src = snapshotBase64;
        });
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (!detection?.descriptor) {
          return { verified: false, message: 'Лицо не обнаружено' };
        }
        const distance = faceapi.euclideanDistance(profileDescriptorRef.current, detection.descriptor);
        const threshold = 0.6;
        return {
          verified: distance < threshold,
          message: distance < threshold ? 'OK' : 'Лицо не совпадает',
        };
      } catch (clientErr) {
        console.warn('Client-side face verification failed, falling back to server:', clientErr);
      }
    }

    // Fallback to server-side verification
    if (effectiveStudentId) {
      try {
        const result = await api.verifyStudentPhoto(effectiveStudentId, snapshotBase64) as any;
        return {
          verified: result?.verified === true,
          message: result?.message || (result?.verified ? 'OK' : 'Верификация не пройдена'),
        };
      } catch (serverErr) {
        console.error('Server-side face verification failed:', serverErr);
        return { verified: false, message: 'Ошибка проверки на сервере' };
      }
    }

    return { verified: false, message: 'Не удалось выполнить верификацию' };
  };

  const eyeAspectRatio = (points: faceapi.Point[]) => {
    const dist = (a: faceapi.Point, b: faceapi.Point) => Math.hypot(a.x - b.x, a.y - b.y);
    const p2p6 = dist(points[1], points[5]);
    const p3p5 = dist(points[2], points[4]);
    const p1p4 = dist(points[0], points[3]);
    return (p2p6 + p3p5) / (2.0 * p1p4);
  };

  const verifyLivenessBlink = async (durationMs = 4500): Promise<boolean> => {
    if (!modelsReady) return false;
    const localStream = cameraStreamRef.current
      ? null
      : await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const stream = cameraStreamRef.current || localStream;
    if (!stream) return false;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    const start = Date.now();
    let blinked = false;
    let moved = false;
    let wasClosed = false;
    const threshold = 0.28;
    let lastCenter: { x: number; y: number } | null = null;

    while (Date.now() - start < durationMs) {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }))
        .withFaceLandmarks();
      if (detection?.landmarks) {
        const leftEye = detection.landmarks.getLeftEye();
        const rightEye = detection.landmarks.getRightEye();
        const ear = (eyeAspectRatio(leftEye) + eyeAspectRatio(rightEye)) / 2;
        const box = detection.detection.box;
        const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        if (lastCenter) {
          const dx = Math.abs(center.x - lastCenter.x);
          const dy = Math.abs(center.y - lastCenter.y);
          if (dx + dy > 6) moved = true;
        }
        lastCenter = center;
        if (ear < threshold) {
          wasClosed = true;
        } else if (wasClosed) {
          blinked = true;
          break;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    return blinked || moved;
  };

  const detectGazeAway = async (snapshotBase64: string): Promise<{ away: boolean; message?: string }> => {
    if (!modelsReady) return { away: false, message: 'Модели распознавания не загружены' };
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image load failed'));
        image.src = snapshotBase64;
      });
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }))
        .withFaceLandmarks();
      if (!detection?.landmarks) {
        return { away: true, message: 'Лицо не обнаружено' };
      }

      const jaw = detection.landmarks.getJawOutline();
      const nose = detection.landmarks.getNose();
      const leftEye = detection.landmarks.getLeftEye();
      const rightEye = detection.landmarks.getRightEye();
      if (!jaw.length || !nose.length || !leftEye.length || !rightEye.length) {
        return { away: true, message: 'Глаза не обнаружены' };
      }

      const left = jaw[0].x;
      const right = jaw[jaw.length - 1].x;
      const width = Math.max(1, right - left);
      const noseTip = nose[Math.floor(nose.length / 2)].x;
      const faceCenter = (left + right) / 2;
      const headOffset = Math.abs((noseTip - faceCenter) / width);

      const eyeCenter = (eye: faceapi.Point[]) => {
        const xs = eye.map((p) => p.x);
        return xs.reduce((sum, x) => sum + x, 0) / xs.length;
      };
      const eyesCenter = (eyeCenter(leftEye) + eyeCenter(rightEye)) / 2;
      const eyeOffset = Math.abs((eyesCenter - faceCenter) / width);

      const isAway = headOffset > 0.18 || eyeOffset > 0.12;
      return { away: isAway, message: isAway ? 'Отведение взгляда в сторону' : undefined };
    } catch {
      return { away: false, message: 'Ошибка проверки взгляда' };
    }
  };

  const detectMultipleFaces = async (snapshotBase64: string): Promise<boolean> => {
    if (!modelsReady) return false;
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image load failed'));
        image.src = snapshotBase64;
      });
      // Lower threshold (0.3) for more sensitive detection of additional faces
      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
      );
      return detections.length > 1;
    } catch {
      return false;
    }
  };

  const ensureObjectModel = useCallback(async () => {
    if (objectModelRef.current) return objectModelRef.current;
    const tf = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.esm.js');
    const coco = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd/dist/coco-ssd.esm.js');
    try {
      await tf.setBackend('webgl');
    } catch {
      // ignore
    }
    await tf.ready();
    objectModelRef.current = await coco.load();
    return objectModelRef.current;
  }, []);

  const detectObjects = useCallback(async (snapshotBase64: string): Promise<string[]> => {
    try {
      const model = await ensureObjectModel();
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image load failed'));
        image.src = snapshotBase64;
      });
      const detections = await model.detect(img);
      return detections
        .filter((d: any) => d.score >= 0.45)
        .map((d: any) => d.class);
    } catch {
      return [];
    }
  }, [ensureObjectModel]);

  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const snapshot = await captureSnapshot();
      const gaze = await detectGazeAway(snapshot);
      if (gaze.away) {
        setWarning(true);
        setWarningMessage(gaze.message || 'Отведение взгляда в сторону');
        if (effectiveStudentId) {
          void logViolation({
            violation_type: 'gaze_away',
            timestamp: new Date().toISOString(),
            confidence: 0.6,
            student_id: effectiveStudentId,
            exam_id: activeExamId,
          });
        }
        notify(gaze.message || 'Отведение взгляда в сторону');
        return;
      }
      setIsSubmitModalOpen(false);
      notify('Экзамен завершен');
    } catch {
      notify('Не удалось завершить экзамен');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStreamForKind = useCallback(
    (kind: StreamKind) => (kind === 'screen' ? screenStream : cameraStream),
    [screenStream, cameraStream]
  );

  const attachStreamToPeers = useCallback(
    (kind: StreamKind, stream: MediaStream | null) => {
      if (!stream) return;
      const viewers = Array.from(streamPeersRef.current[kind].keys());
      viewers.forEach((viewerId) => {
        const pc = streamPeersRef.current[kind].get(viewerId);
        if (!pc) return;
        stream.getTracks().forEach((track) => {
          const exists = pc.getSenders().some((s) => s.track?.id === track.id);
          if (!exists) pc.addTrack(track, stream);
        });
      });

      const selfId = effectiveStudentId ? String(effectiveStudentId) : '';
      if (selfId) {
        viewers.forEach((viewerId) => {
          if (
            pendingStreamViewersRef.current[kind].has(viewerId) ||
            streamSocketRef.current[kind]?.readyState === WebSocket.OPEN
          ) {
            sendStreamOffer(kind, viewerId, selfId).catch(() => {});
          }
        });
      }
    },
    [effectiveStudentId, sendStreamOffer]
  );

  useEffect(() => {
    if (view !== 'exam' || !effectiveStudentId) return;
    const selfId = String(effectiveStudentId);
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

    const initRoom = (kind: StreamKind) => {
      const roomId = `${selfId}-${kind}`;
      const wsUrl = `${wsProtocol}://${window.location.host}/api/v1/proctoring/ws/stream/${roomId}`;
      const socket = new WebSocket(wsUrl);
      streamSocketRef.current[kind] = socket;

      const createPeerForViewer = (viewerId: string) => {
        const existing = streamPeersRef.current[kind].get(viewerId);
        if (existing) return existing;

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        pc.onicecandidate = (event) => {
          if (event.candidate && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ice', candidate: event.candidate, from: selfId, to: viewerId }));
          }
        };

        streamPeersRef.current[kind].set(viewerId, pc);

        const sourceStream = getStreamForKind(kind);
        if (sourceStream) {
          sourceStream.getTracks().forEach((track) => {
            pc.addTrack(track, sourceStream as MediaStream);
          });
        } else {
          pendingStreamViewersRef.current[kind].add(viewerId);
        }

        return pc;
      };

      socket.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg?.to && msg.to !== selfId) return;

        if (msg.type === 'ready' && msg.from) {
          createPeerForViewer(msg.from);
          sendStreamOffer(kind, msg.from, selfId).catch(() => {});
        }
        if (msg.type === 'answer' && msg.sdp && msg.from) {
          const pc = streamPeersRef.current[kind].get(msg.from);
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          if (pendingStreamViewersRef.current[kind].has(msg.from)) {
            pendingStreamViewersRef.current[kind].delete(msg.from);
            sendStreamOffer(kind, msg.from, selfId).catch(() => {});
          }
        }
        if (msg.type === 'ice' && msg.candidate && msg.from) {
          const pc = streamPeersRef.current[kind].get(msg.from);
          if (!pc) return;
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch {
            // ignore
          }
        }
      };

      return () => {
        streamSocketRef.current[kind] = null;
        socket.close();
        streamPeersRef.current[kind].forEach((pc) => pc.close());
        streamPeersRef.current[kind].clear();
        pendingStreamViewersRef.current[kind].clear();
      };
    };

    const cleanupCamera = initRoom('camera');
    const cleanupScreen = initRoom('screen');

    return () => {
      cleanupCamera();
      cleanupScreen();
    };
  }, [view, effectiveStudentId, sendStreamOffer, getStreamForKind]);

  useEffect(() => {
    attachStreamToPeers('camera', cameraStream);
  }, [cameraStream, attachStreamToPeers]);

  useEffect(() => {
    attachStreamToPeers('screen', screenStream);
  }, [screenStream, attachStreamToPeers]);

  const verifyFaceId = async () => {
    if (!effectiveStudentId) {
      notify('Не найден ID студента');
      return false;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      notify('Камера доступна только на HTTPS или localhost');
      return false;
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      notify('Браузер не поддерживает доступ к камере');
      return false;
    }
    notify('Запуск верификации...');
    setFaceCheckLoading(true);
    setFaceCheckError(null);
    try {
      const status = await api.checkStudentPhoto(effectiveStudentId) as any;
      if (!status?.has_photo) {
        notify('Сначала загрузите фото в профиле');
        setFaceCheckError('Сначала загрузите фото в профиле');
        return false;
      }

      // Load profile data if needed for client-side verification
      if (!profileData?.photo_base64) {
        try {
          const data = await api.getStudentProfile(effectiveStudentId) as any;
          if (data?.photo_base64) {
            setProfileData(prev => ({ ...prev, ...data }));
          }
        } catch {
          console.warn('Could not load profile photo, will use server-side verification');
        }
      }

      notify('Пожалуйста, моргните для проверки живности');
      const isLive = await verifyLivenessBlink();
      if (!isLive) {
        notify('Не удалось подтвердить живность');
        setFaceCheckError('Не удалось подтвердить живность');
        return false;
      }

      let snapshot: string;
      try {
        snapshot = await captureSnapshot();
      } catch (err: any) {
        const reason = err?.name === 'NotAllowedError'
          ? 'Доступ к камере запрещен'
          : err?.name === 'NotFoundError'
            ? 'Камера не найдена'
            : 'Камера недоступна';
        setFaceCheckError(reason);
        notify(reason);
        return false;
      }
      const result = await verifyFaceClient(snapshot);
      if (!result?.verified) {
        notify(result?.message || 'FaceID не подтвержден');
        setFaceCheckError(result?.message || 'FaceID не подтвержден');
        return false;
      }
      setWarning(false);
      return true;
    } catch {
      setFaceCheckError('Ошибка FaceID проверки');
      notify('Ошибка FaceID проверки');
      return false;
    } finally {
      setFaceCheckLoading(false);
    }
  };

  const handleStartExam = async (examId?: number) => {
    if (examId) {
      setActiveExamId(examId);
    }
    setView('verification');
    return true;
  };

  const handleVerifyAndStart = async () => {
    const ok = await verifyFaceId();
    if (ok) {
      if (activeExamId) {
        try {
          const session = await api.startExamSession(String(activeExamId));
          if (session?.id) {
            setActiveSessionId(String(session.id));
          }
        } catch {
          // ignore
        }
      }
      examStartAtRef.current = Date.now();
      setView('exam');
      return true;
    }
    return false;
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
    startAudioMonitor();
    return () => stopAudioMonitor();
  }, [view, startAudioMonitor, stopAudioMonitor]);

  useEffect(() => {
    if (view !== 'exam' || !cameraStream) return;
    startEvidenceRecorder(cameraStream);
    return () => stopEvidenceRecorder();
  }, [view, cameraStream, startEvidenceRecorder, stopEvidenceRecorder]);

  useEffect(() => {
    if (view !== 'exam') return;
    ensureObjectModel().catch(() => {});
  }, [view, ensureObjectModel]);

  useEffect(() => {
    if (view !== 'exam' || !effectiveStudentId) return;
    let active = true;
    let inFlight = false;

    const check = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      try {
        const snapshot = await captureSnapshot();
        const result = await verifyFaceClient(snapshot);
        const inGrace = Date.now() - examStartAtRef.current < 5000;
        const multipleFaces = await detectMultipleFaces(snapshot);
        if (multipleFaces) {
          setWarning(true);
          setWarningMessage('⚠️ ВНИМАНИЕ: Обнаружено несколько лиц! Это серьёзное нарушение.');
          const now = Date.now();
          // Strict: log violation every 3 seconds if multiple faces persist
          if (now - lastMultipleFacesAtRef.current > 3000) {
            lastMultipleFacesAtRef.current = now;
            void logViolation({
              violation_type: 'multiple_faces',
              timestamp: new Date().toISOString(),
              confidence: 0.95,
              severity_score: 90,
              student_id: effectiveStudentId,
              exam_id: activeExamId,
            });
          }
          return;
        }

        if (!result?.verified) {
          if (inGrace) return;
          setWarning(true);
          setWarningMessage(result?.message || 'Внимание: посмотрите в камеру!');
          const now = Date.now();
          if (now - lastViolationAtRef.current > 10000) {
            lastViolationAtRef.current = now;
            const messageText = (result?.message || '').toLowerCase();
            const isNoFace = messageText.includes('лицо не обнаружено') || messageText.includes('no face');
            const isSubstitution = messageText.includes('не совпадает');
            if (isSubstitution || isNoFace) {
              void logViolation({
                violation_type: isSubstitution ? 'face_substitution' : 'face_missing',
                timestamp: new Date().toISOString(),
                confidence: isSubstitution ? 0.8 : 0.5,
                student_id: effectiveStudentId,
                exam_id: activeExamId,
              });
            }
          }
          return;
        }

        const now = Date.now();
        if (now - lastObjectCheckAtRef.current > 3000) {
          lastObjectCheckAtRef.current = now;
          const labels = await detectObjects(snapshot);
          const suspicious = labels.filter((label) =>
            ['cell phone', 'book', 'laptop', 'remote'].includes(label)
          );
          if (suspicious.length > 0) {
            const label = suspicious[0];
            const typeMap: Record<string, string> = {
              'cell phone': 'phone_detected',
              remote: 'phone_detected',
              book: 'book_detected',
              laptop: 'laptop_detected',
            };
            const messageMap: Record<string, string> = {
              'cell phone': 'Обнаружен телефон',
              remote: 'Обнаружен телефон',
              book: 'Обнаружена книга',
              laptop: 'Обнаружен ноутбук',
            };
            const violationType = typeMap[label] || 'object_detected';
            const msg = messageMap[label] || 'Обнаружен посторонний предмет';
            setWarning(true);
            setWarningMessage(msg);
            const lastAt = lastObjectViolationAtRef.current[violationType] || 0;
            if (now - lastAt > 10000) {
              lastObjectViolationAtRef.current[violationType] = now;
              void logViolation({
                violation_type: violationType,
                timestamp: new Date().toISOString(),
                confidence: 0.7,
                student_id: effectiveStudentId,
                exam_id: activeExamId,
              });
            }
            return;
          }
        }

        const gaze = await detectGazeAway(snapshot);
        if (gaze.away) {
          setWarning(true);
          setWarningMessage(gaze.message || 'Отведение взгляда в сторону');
          const now = Date.now();
          if (now - lastGazeViolationAtRef.current > 8000) {
            lastGazeViolationAtRef.current = now;
            void logViolation({
              violation_type: 'gaze_away',
              timestamp: new Date().toISOString(),
              confidence: 0.6,
              student_id: effectiveStudentId,
              exam_id: activeExamId,
            });
          }
          return;
        }

        setWarning(false);
      } catch {
        setWarning(true);
        setWarningMessage('Не удалось проверить лицо');
      } finally {
        inFlight = false;
      }
    };

    check();
    const interval = setInterval(check, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [view, effectiveStudentId, activeSessionId]);

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
    return (
      <>
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4"
            >
              {n.msg}
            </div>
          ))}
        </div>
        <ProfileView
          onStart={handleStartExam}
          notify={notify}
          onLogout={onLogout}
          studentId={studentId}
          profileData={profileData}
          onProfileRefresh={loadProfile}
          lang={lang}
          setLang={handleLangChange}
          isDark={isDark}
          setIsDark={setIsDark}
        />
      </>
    );
  }

  if (view === 'verification') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 select-none">
          <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-tight">Верификация перед экзаменом</h3>
            <p className="text-slate-500 dark:text-slate-300 text-sm font-medium mb-8">
            Для начала экзамена подтвердите личность через камеру.
          </p>

          <div className="mb-8">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
              {cameraStream ? (
                <video ref={verificationVideoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-black uppercase tracking-widest">
                  {cameraError || 'Нет видеопотока'}
                </div>
              )}
              <div className="absolute top-3 left-3 bg-black/50 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                LIVE
              </div>
            </div>
            {warning && (
              <p className="mt-3 text-xs font-bold text-orange-500">{warningMessage}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setView('profile')}
              className="px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              Назад
            </button>
            <button
              onClick={handleVerifyAndStart}
              disabled={faceCheckLoading}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                faceCheckLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-orange-500'
              }`}
            >
              {faceCheckLoading ? 'Проверка...' : 'Пройти верификацию'}
            </button>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4"
            >
              {n.msg}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden select-none">
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        {notifications.map((n) => (
          <div key={n.id} className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4">
            {n.msg}
          </div>
        ))}
      </div>

      <header className="h-20 flex-none bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 md:px-10 flex items-center justify-between z-30 shadow-sm sticky top-0">
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
              <h1 className="font-black text-slate-900 dark:text-slate-100 text-lg leading-none tracking-tight">
                OpenProctor<span className="text-orange-500 ml-0.5">AI</span>
              </h1>
              <span className="text-[9px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1 block">Session ID: #824-A</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:flex items-center gap-2">
            <LanguageSwitcher lang={lang} setLang={handleLangChange} isDark={isDark} />
            <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
          </div>
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
              <button
                onClick={() => (streamMode === 'screen' ? stopScreenShare() : startScreenShare())}
                className={`px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  streamMode === 'screen'
                    ? 'bg-orange-500 text-white border-orange-400'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {streamMode === 'screen' ? 'Экран: Вкл' : 'Экран: Выкл'}
              </button>
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

      <FloatingCamera
        warning={warning}
        message={warningMessage}
        stream={cameraStream}
        cameraError={cameraError}
        onRetry={startCameraStream}
        noiseStatus={noiseStatus}
      />

      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Подтверждение"
        footer={
          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${
              isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isSubmitting ? 'Проверка...' : 'Отправить ответы'}
          </button>
        }
      >
        <p className="text-slate-500 font-bold leading-relaxed text-sm">Вы уверены, что хотите завершить экзамен? Все ответы будут зафиксированы.</p>
      </Modal>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};
