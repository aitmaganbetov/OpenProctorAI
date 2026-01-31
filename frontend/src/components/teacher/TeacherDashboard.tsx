// src/components/teacher/TeacherDashboard.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Monitor,
  Users,
  BookOpen,
  Send,
  AlertTriangle,
  Eye,
  FileUp,
  Plus,
  Search,
  Copy,
  Trash2,
  Settings,
  CheckSquare,
  Mail,
  Fingerprint,
  RefreshCw,
  Layers,
  Clock,
  ChevronRight,
  ToggleRight,
  ToggleLeft,
  Play,
  Filter as FilterIcon,
  User,
  LogOut
} from 'lucide-react';
import api from '../../services/api';

interface TeacherDashboardProps {
  onLogout?: () => void;
}

// --- Компонент Логотипа ---
const OpenProctorLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="50" r="25" stroke="currentColor" strokeWidth="8" />
    <circle cx="65" cy="50" r="25" stroke="currentColor" strokeWidth="8" />
    <path d="M50 35L60 50L50 65L40 50Z" fill="#F97316" />
  </svg>
);

// --- Компонент выпадающего меню профиля ---
const ProfileMenu = ({ notify, onLogout }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-white shadow-md hover:shadow-lg hover:ring-2 hover:ring-orange-500/30 transition-all flex items-center justify-center overflow-hidden active:scale-95"
      >
        <div className="bg-gradient-to-br from-slate-700 to-slate-900 w-full h-full flex items-center justify-center text-white text-[10px] font-black">
          ПР
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-5 py-4 border-b border-slate-50 mb-1">
            <p className="text-sm font-black text-slate-900 leading-tight">Профессор Разумов</p>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.1em] mt-0.5">Главный администратор</p>
          </div>
          
          <div className="px-2 space-y-0.5">
            <button 
              onClick={() => { notify("Загрузка профиля..."); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-all font-semibold"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                <User className="w-4 h-4" />
              </div>
              Профиль
            </button>
            
            <button 
              onClick={() => { notify("Настройки системы..."); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-all font-semibold"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <Settings className="w-4 h-4" />
              </div>
              Настройки
            </button>
          </div>
          
          <div className="my-2 border-t border-slate-50 mx-4"></div>
          
          <div className="px-2">
            <button 
              onClick={() => {
                notify("Выход из системы...");
                setIsOpen(false);
                onLogout?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all font-black uppercase tracking-wider"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50/50 flex items-center justify-center text-red-400">
                <LogOut className="w-4 h-4" />
              </div>
              Выход
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get avatar initials
const getAvatarInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout: _onLogout }) => {
  const [activeTab, setActiveTab] = useState('proctoring');
  const [students, setStudents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [monitoringGroup, setMonitoringGroup] = useState('Все');
  const [notifications, setNotifications] = useState<any[]>([]);


  const refreshStudents = async () => {
    const studentsData = await api.getDashboardStudents().catch(() => []);
    setStudents(studentsData || []);
    if (studentsData && studentsData.length > 0 && !selectedStudent) {
      setSelectedStudent(studentsData[0]);
    }
  };

  const refreshSessions = async (studentId?: number) => {
    if (studentId) {
      const studentSessions = await api.getStudentSessions(studentId).catch(() => []);
      setSessions(studentSessions || []);
      return;
    }
    const sessionsData = await api.getDashboardSessions().catch(() => []);
    setSessions(sessionsData || []);
  };

  const loadDashboardData = async () => {
    try {
      const [studentsData, sessionsData] = await Promise.all([
        api.getDashboardStudents().catch(() => []),
        api.getDashboardSessions().catch(() => [])
      ]);
      setStudents(studentsData || []);
      setSessions(sessionsData || []);
      if (studentsData && studentsData.length > 0) {
        setSelectedStudent(studentsData[0]);
      }
      setQuestions([
        { id: 'q1', text: 'Что такое замыкание в JavaScript?', type: 'Теория', difficulty: 'Средне' },
        { id: 'q2', text: 'Объясните разницу между let, const и var.', type: 'Основы', difficulty: 'Легко' }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      notify('Ошибка при загрузке данных');
    }
  };

  // Load data from MySQL via API
  useEffect(() => {
    const load = async () => {
      try {
        await loadDashboardData();
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        notify('Ошибка при загрузке данных');
      }
    };
    
    load();
  }, []);

  const notify = (msg: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const exportViolationsCsv = (student: any, allSessions: any[]) => {
    if (!student) {
      notify('Выберите студента');
      return;
    }
    const studentSessions = allSessions.filter((s: any) => s.student_id === student.id);
    const violations = studentSessions.flatMap((s: any) => s.violations || []);
    if (violations.length === 0) {
      notify('Нет данных для экспорта');
      return;
    }
    const header = ['id', 'type', 'timestamp', 'severity_score', 'confidence'];
    const rows = violations.map((v: any) => [v.id, v.type, v.timestamp, v.severity_score, v.confidence]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `violations_${student.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Экспорт выполнен');
  };

  const createStudent = async (payload: { email: string; full_name?: string; name?: string; password?: string; group?: string; }) => {
    await api.createDashboardStudent(payload);
    await refreshStudents();
  };

  const deleteStudent = async (studentId: number) => {
    await api.deleteDashboardStudent(studentId);
    await refreshStudents();
  };

  const importStudents = async (studentsList: Array<{ email: string; full_name?: string; name?: string; password?: string; group?: string; }>) => {
    await api.importDashboardStudents(studentsList);
    await refreshStudents();
  };

  // Уникальные группы
  const allGroups = useMemo((): string[] => {
    const groups = students
      .map(s => (s.group || 'Без группы'))
      .filter(Boolean);
    return ['Все', ...Array.from(new Set(groups))];
  }, [students]);

  // Фильтрация студентов для боковой панели
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const searchTerm = searchQuery.toLowerCase();
      const name = (s.full_name || s.name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const id = (s.id?.toString() || '').toLowerCase();
      
      const matchesSearch = name.includes(searchTerm) || 
                            email.includes(searchTerm) ||
                            id.includes(searchTerm);
      
      const studentGroup = s.group || 'Без группы';
      const matchesGroup = monitoringGroup === 'Все' || studentGroup === monitoringGroup;
      
      return matchesSearch && matchesGroup;
    });
  }, [students, searchQuery, monitoringGroup]);

  const renderContent = () => {
    switch (activeTab) {
      case 'proctoring':
        return (
          <ProctoringView
            student={selectedStudent}
            sessions={sessions}
            notify={notify}
            onRefresh={() => selectedStudent?.id && refreshSessions(selectedStudent.id)}
            onExport={() => exportViolationsCsv(selectedStudent, sessions)}
            onLogout={_onLogout}
          />
        );
      case 'students':
        return (
          <StudentsManagementView
            students={students}
            notify={notify}
            onCreate={createStudent}
            onDelete={deleteStudent}
            onImport={importStudents}
            onLogout={_onLogout}
          />
        );
      case 'questions':
        return <QuestionsBankView questions={questions} setQuestions={setQuestions} notify={notify} onLogout={_onLogout} />;
      case 'assignments':
        return <TestAssignmentView students={students} notify={notify} onLogout={_onLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
            {n.msg}
          </div>
        ))}
      </div>

      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm shrink-0 relative z-50">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <OpenProctorLogo className="w-10 h-10 text-slate-800" />
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-800 flex items-baseline leading-none">
                OpenProctor<span className="text-orange-500 ml-0.5">AI</span>
              </h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          <NavButton 
            active={activeTab === 'proctoring'} 
            onClick={() => setActiveTab('proctoring')} 
            icon={<Monitor className="w-5 h-5" />} 
            label="Мониторинг" 
          />
          <NavButton 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')} 
            icon={<Users className="w-5 h-5" />} 
            label="Студенты" 
          />
          <NavButton 
            active={activeTab === 'questions'} 
            onClick={() => setActiveTab('questions')} 
            icon={<BookOpen className="w-5 h-5" />} 
            label="Банк вопросов" 
          />
          <NavButton 
            active={activeTab === 'assignments'} 
            onClick={() => setActiveTab('assignments')} 
            icon={<Send className="w-5 h-5" />} 
            label="Назначение" 
          />

          {activeTab === 'proctoring' && (
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Участники сессии</p>
                
                {/* Выбор группы в мониторинге */}
                <div className="relative mb-3 group">
                  <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <select 
                    value={monitoringGroup}
                    onChange={(e) => setMonitoringGroup(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black uppercase tracking-tight appearance-none outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all cursor-pointer"
                  >
                    {allGroups.map(g => (
                      <option key={g} value={g}>{g === 'Все' ? 'Все группы' : g}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronRight className="w-3 h-3 text-slate-300 rotate-90" />
                  </div>
                </div>

                {/* Поиск */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Поиск по имени/ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                {filteredStudents.length > 0 ? filteredStudents.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left ${selectedStudent?.id === s.id ? 'bg-orange-50 text-orange-700 shadow-sm' : 'hover:bg-slate-50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">{getAvatarInitials(s.full_name || s.name || 'Student')}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{s.full_name || s.name || 'Student'}</p>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-[9px] text-slate-400 truncate font-black">{s.id}</p>
                        <p className="text-[9px] text-indigo-500 font-black">{s.group || 'Без группы'}</p>
                      </div>
                    </div>
                  </button>
                )) : (
                  <p className="px-2 text-[10px] text-slate-400 font-medium italic">Студенты не найдены</p>
                )}
              </div>
            </div>
          )}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        {renderContent()}
      </main>
    </div>
  );
};

function ProctoringView({ student, sessions, notify, onRefresh, onExport, onLogout }: any) {
  if (!student) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <p className="text-slate-400 font-bold">Выберите студента для мониторинга</p>
    </div>
  );
  
  // Get latest session for this student
  const studentSessions = sessions.filter((s: any) => s.student_id === student.id);
  const violations = studentSessions.length > 0 
    ? studentSessions[0].violations || []
    : [];
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <header className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white/90 backdrop-blur sticky top-0 z-40">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{student.full_name || student.name || 'Student'}</h2>
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-100">{student.group || 'Без группы'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1"><Fingerprint className="w-3.5 h-3.5" /> {student.id}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {student.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={onRefresh}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" /> Live
          </button>
          <div className="h-8 w-px bg-slate-200"></div>
          <ProfileMenu notify={notify} onLogout={onLogout} />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 scroll-smooth">
        <div className="aspect-video bg-slate-950 rounded-3xl relative flex items-center justify-center shadow-2xl border border-slate-900 overflow-hidden ring-1 ring-slate-800">
           <Play className="w-16 h-16 text-white/5 animate-pulse" />
           <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 text-white text-[9px] px-3 py-1 rounded-full font-black tracking-widest shadow-lg animate-pulse">
             <div className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE STREAMING
           </div>
           <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-white/80 font-mono tracking-tighter">
             CAM_ID: 0824-A // ENCRYPTION: AES-256
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <h3 className="font-black text-lg flex items-center gap-3 text-slate-800 tracking-tight">
               <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                 <AlertTriangle className="w-5 h-5" />
               </div>
               Журнал инцидентов AI
             </h3>
             <button
               onClick={onExport}
               className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest border-b-2 border-indigo-100 pb-0.5"
             >
               Экспорт истории
             </button>
           </div>
           <table className="w-full text-sm text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] px-4">
                  <th className="pb-4 pl-4">Тип аномалии</th>
                  <th className="pb-4">Метка времени</th>
                  <th className="pb-4 text-right pr-4">Вердикт AI</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {violations.length > 0 ? violations.map((v: any) => (
                  <tr key={v.id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 pl-4 rounded-l-xl font-bold text-slate-700 text-sm">{v.type}</td>
                    <td className="py-4 font-mono text-[11px] text-slate-400 font-bold">{v.timestamp || 'N/A'}</td>
                    <td className="py-4 text-right pr-4 rounded-r-xl">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                        v.severity_score && v.severity_score > 70 
                          ? 'bg-red-50 text-red-600 border-red-100' 
                          : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                      }`}>
                        {v.severity_score && v.severity_score > 70 ? 'Высокий риск' : 'Проверить'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="py-12 text-center text-slate-400 font-bold text-sm bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-100">Нарушений в текущей сессии не выявлено</td></tr>
                )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function StudentsManagementView({ students, notify, onCreate, onDelete, onImport, onLogout }: any) {
  const [newStudent, setNewStudent] = useState({ id: '', name: '', email: '', password: '', group: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < 8; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    setNewStudent(prev => ({ ...prev, password: retVal }));
    notify("Новый пароль сгенерирован");
  };

  const addStudent = async () => {
    if (!newStudent.name || !newStudent.email) {
      notify("Пожалуйста, заполните обязательные поля");
      return;
    }
    try {
      await onCreate({
        email: newStudent.email,
        full_name: newStudent.name,
        password: newStudent.password,
        group: newStudent.group
      });
      setNewStudent({ id: '', name: '', email: '', password: '', group: '' });
      notify(`Студент ${newStudent.name} успешно зарегистрирован`);
    } catch (error) {
      notify('Ошибка при создании студента');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) {
      notify('Файл пустой');
      return;
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const hasHeader = header.includes('email') || header.includes('full_name') || header.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const studentsToImport = dataLines.map((line) => {
      const cols = line.split(',').map(c => c.trim());
      if (hasHeader) {
        const obj: any = {};
        header.forEach((h, i) => { obj[h] = cols[i]; });
        return {
          email: obj.email,
          full_name: obj.full_name || obj.name,
          password: obj.password,
          group: obj.group
        };
      }
      return {
        email: cols[0],
        full_name: cols[1],
        password: cols[2],
        group: cols[3]
      };
    }).filter(s => s.email);

    if (studentsToImport.length === 0) {
      notify('Нет валидных строк для импорта');
      return;
    }

    try {
      await onImport(studentsToImport);
      notify(`Импортировано: ${studentsToImport.length}`);
    } catch (error) {
      notify('Ошибка при импорте');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
      <header className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-40">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">База студентов</h2>
        <ProfileMenu notify={notify} onLogout={onLogout} />
      </header>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Новая запись</h3>
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
            >
              <FileUp className="w-4 h-4" /> Массовый импорт
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Студента</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <input placeholder="ID-0000" className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/20 outline-none transition-all" value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ФИО Участника</label>
                <input placeholder="Имя Фамилия" className="w-full px-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Группа</label>
                <div className="relative">
                  <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input placeholder="Напр. Группа-А" className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" value={newStudent.group} onChange={e => setNewStudent({...newStudent, group: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Эл. почта</label>
                <input placeholder="email@uni.edu" className="w-full px-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Пароль доступа</label>
                <div className="relative">
                  <input placeholder="********" className="w-full pl-4 pr-12 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-mono" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} />
                  <button onClick={generatePassword} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-all">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <button onClick={addStudent} className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.99]">
              <Plus className="w-4 h-4" /> Зарегистрировать в OpenProctorAI
            </button>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-6 text-center w-24">Аватар</th>
                  <th className="px-4 py-6">ID & ФИО</th>
                  <th className="px-8 py-6">Группа</th>
                  <th className="px-8 py-6">Безопасность</th>
                  <th className="px-8 py-6 text-right">Опции</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-black mx-auto shadow-sm ring-4 ring-white">{getAvatarInitials(s.full_name || s.name || 'S')}</div>
                    </td>
                    <td className="px-4 py-5">
                      <p className="font-black text-slate-900 text-sm tracking-tight">{s.full_name || s.name || 'Student'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.id}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">{s.group || 'Без группы'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <code className="bg-slate-50 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-500 font-bold border border-slate-200 tracking-tighter shadow-inner">{s.password || '******'}</code>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(s.password || '');
                              notify("Пароль скопирован");
                            } catch {
                              notify("Не удалось скопировать");
                            }
                          }}
                          className="text-slate-300 hover:text-orange-600 transition-colors active:scale-90 p-1"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={async () => {
                          try {
                            await onDelete(Number(s.id));
                            notify('Студент удален');
                          } catch {
                            notify('Ошибка удаления');
                          }
                        }}
                        className="text-slate-300 hover:text-red-500 transition-all p-2 rounded-xl hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionsBankView({ questions, setQuestions, notify, onLogout }: any) {
  const [newQ, setNewQ] = useState({
    text: '',
    difficulty: 'Средне',
    answerType: 'single',
    options: ['', '', '', ''],
    correct: [0],
  });
  const [examMeta, setExamMeta] = useState({ title: '', description: '', duration: 60 });
  const [builderQuestions, setBuilderQuestions] = useState<any[]>([
    { text: '', answerType: 'single', options: ['', '', '', ''], correct: [0], points: 1 },
  ]);
  const [loadedExams, setLoadedExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshExams = async () => {
    setLoadingExams(true);
    try {
      const data = await api.getExams();
      setLoadedExams(data || []);
    } catch {
      notify('Не удалось загрузить список тестов');
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    refreshExams();
  }, []);

  const addQ = () => {
    if (!newQ.text.trim()) return;
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        text: newQ.text,
        difficulty: newQ.difficulty,
        type: newQ.answerType === 'multiple' ? 'Множественный выбор' : 'Один ответ',
        options: newQ.options,
        correct: newQ.correct,
      },
    ]);
    setNewQ({ text: '', difficulty: 'Средне', answerType: 'single', options: ['', '', '', ''], correct: [0] });
    notify('Новый вопрос добавлен в базу');
  };

  const updateBuilderQuestion = (index: number, field: string, value: any) => {
    const updated = [...builderQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setBuilderQuestions(updated);
  };

  const updateBuilderOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...builderQuestions];
    const options = [...(updated[qIndex].options || [])];
    options[oIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options };
    setBuilderQuestions(updated);
  };

  const toggleCorrect = (qIndex: number, oIndex: number) => {
    const updated = [...builderQuestions];
    const current = updated[qIndex];
    if (current.answerType === 'multiple') {
      const exists = current.correct.includes(oIndex);
      const next = exists ? current.correct.filter((i: number) => i !== oIndex) : [...current.correct, oIndex];
      updated[qIndex] = { ...current, correct: next };
    } else {
      updated[qIndex] = { ...current, correct: [oIndex] };
    }
    setBuilderQuestions(updated);
  };

  const addBuilderQuestion = () => {
    setBuilderQuestions([
      ...builderQuestions,
      { text: '', answerType: 'single', options: ['', '', '', ''], correct: [0], points: 1 },
    ]);
  };

  const removeBuilderQuestion = (index: number) => {
    setBuilderQuestions(builderQuestions.filter((_: any, i: number) => i !== index));
  };

  const handleImportTests = async (file: File) => {
    const content = await file.text();
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          setBuilderQuestions(data);
        } else {
          setExamMeta({
            title: data.title || '',
            description: data.description || '',
            duration: data.duration_minutes || 60,
          });
          if (Array.isArray(data.questions)) {
            setBuilderQuestions(data.questions);
          }
        }
        notify('Тест импортирован');
        return;
      }

      const rows = content.split('\n').map((r) => r.trim()).filter(Boolean);
      const parsed = rows.slice(1).map((row) => row.split(',').map((v) => v.trim()));
      const imported = parsed.map((cols) => {
        const [text, opt1, opt2, opt3, opt4, correct] = cols;
        const correctIndexes = (correct || '')
          .split('|')
          .map((v) => Number(v) - 1)
          .filter((v) => !Number.isNaN(v) && v >= 0);
        return {
          text,
          answerType: correctIndexes.length > 1 ? 'multiple' : 'single',
          options: [opt1, opt2, opt3, opt4].filter(Boolean),
          correct: correctIndexes.length ? correctIndexes : [0],
          points: 1,
        };
      });
      setBuilderQuestions(imported);
      notify('CSV импортирован');
    } catch {
      notify('Не удалось импортировать файл');
    }
  };

  const createExam = async () => {
    if (!examMeta.title.trim()) {
      notify('Введите название теста');
      return;
    }
    try {
      await api.createExam({
        title: examMeta.title,
        description: examMeta.description,
        duration_minutes: examMeta.duration,
        questions: builderQuestions.map((q: any) => ({
          text: q.text,
          type: q.answerType === 'multiple' ? 'multiple_choice' : 'single_choice',
          options: q.options,
          correct_answers: q.correct,
          points: q.points || 1,
        })),
      });
      notify('Тест создан');
      refreshExams();
    } catch {
      notify('Не удалось создать тест');
    }
  };

  const exportExam = () => {
    if (!examMeta.title.trim()) {
      notify('Введите название теста');
      return;
    }
    const payload = {
      title: examMeta.title,
      description: examMeta.description,
      duration_minutes: examMeta.duration,
      questions: builderQuestions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${examMeta.title.replace(/\s+/g, '_').toLowerCase()}_test.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Экспорт выполнен');
  };
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
      <header className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-40">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Банк вопросов</h2>
        <ProfileMenu notify={notify} onLogout={onLogout} />
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-slate-50">
              <BookOpen className="w-24 h-24 rotate-12" />
            </div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs relative">Конструктор вопроса</h3>
            <textarea
              placeholder="Сформулируйте ваш вопрос здесь..."
              className="w-full p-6 border border-slate-100 rounded-[1.5rem] h-32 bg-slate-50 focus:bg-white outline-none focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-semibold relative"
              value={newQ.text}
              onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Сложность:</span>
                <select
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer"
                  value={newQ.difficulty}
                  onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value })}
                >
                  <option>Легко</option>
                  <option>Средне</option>
                  <option>Сложно</option>
                </select>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Тип:</span>
                <select
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer"
                  value={newQ.answerType}
                  onChange={(e) => setNewQ({ ...newQ, answerType: e.target.value })}
                >
                  <option value="single">Один ответ</option>
                  <option value="multiple">Несколько ответов</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {newQ.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <input
                    type={newQ.answerType === 'multiple' ? 'checkbox' : 'radio'}
                    name="bank-correct"
                    checked={newQ.correct.includes(idx)}
                    onChange={() => {
                      if (newQ.answerType === 'multiple') {
                        const exists = newQ.correct.includes(idx);
                        const next = exists ? newQ.correct.filter((i) => i !== idx) : [...newQ.correct, idx];
                        setNewQ({ ...newQ, correct: next });
                      } else {
                        setNewQ({ ...newQ, correct: [idx] });
                      }
                    }}
                    className="text-orange-500"
                  />
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...newQ.options];
                      next[idx] = e.target.value;
                      setNewQ({ ...newQ, options: next });
                    }}
                    placeholder={`Вариант ${idx + 1}`}
                    className="flex-1 bg-transparent outline-none text-sm font-semibold"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center relative">
              <button
                onClick={() => setNewQ({ ...newQ, options: [...newQ.options, ''] })}
                className="text-xs font-black text-slate-400 uppercase tracking-widest"
              >
                + Вариант
              </button>
              <button
                onClick={addQ}
                className="bg-orange-500 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
              >
                Сохранить
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Конструктор теста</h3>
              <div className="flex items-center gap-2">
                <a
                  href="/test_import_template.csv"
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl"
                  download
                >
                  CSV шаблон
                </a>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImportTests(e.target.files[0])}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl"
                >
                  Импорт тестов
                </button>
                <button
                  onClick={exportExam}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl"
                >
                  Экспорт теста
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                value={examMeta.title}
                onChange={(e) => setExamMeta({ ...examMeta, title: e.target.value })}
                placeholder="Название теста"
                className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold"
              />
              <input
                type="number"
                min={5}
                value={examMeta.duration}
                onChange={(e) => setExamMeta({ ...examMeta, duration: Number(e.target.value) })}
                placeholder="Длительность"
                className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold"
              />
              <input
                value={examMeta.description}
                onChange={(e) => setExamMeta({ ...examMeta, description: e.target.value })}
                placeholder="Описание"
                className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold"
              />
            </div>
            <div className="space-y-4">
              {builderQuestions.map((q: any, idx: number) => (
                <div key={idx} className="border border-slate-100 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black uppercase tracking-widest">Вопрос {idx + 1}</p>
                    {builderQuestions.length > 1 && (
                      <button onClick={() => removeBuilderQuestion(idx)} className="text-red-500 text-xs font-bold">
                        Удалить
                      </button>
                    )}
                  </div>
                  <textarea
                    value={q.text}
                    onChange={(e) => updateBuilderQuestion(idx, 'text', e.target.value)}
                    placeholder="Текст вопроса"
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold"
                  />
                  <div className="flex items-center gap-4">
                    <select
                      value={q.answerType}
                      onChange={(e) => updateBuilderQuestion(idx, 'answerType', e.target.value)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest"
                    >
                      <option value="single">Один ответ</option>
                      <option value="multiple">Несколько ответов</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={q.points || 1}
                      onChange={(e) => updateBuilderQuestion(idx, 'points', Number(e.target.value))}
                      className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(q.options || []).map((opt: string, oIndex: number) => (
                      <label key={oIndex} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                        <input
                          type={q.answerType === 'multiple' ? 'checkbox' : 'radio'}
                          name={`builder-${idx}`}
                          checked={(q.correct || []).includes(oIndex)}
                          onChange={() => toggleCorrect(idx, oIndex)}
                          className="text-orange-500"
                        />
                        <input
                          value={opt}
                          onChange={(e) => updateBuilderOption(idx, oIndex, e.target.value)}
                          placeholder={`Вариант ${oIndex + 1}`}
                          className="flex-1 bg-transparent outline-none text-sm font-semibold"
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => updateBuilderQuestion(idx, 'options', [...(q.options || []), ''])}
                    className="text-xs font-black text-slate-400 uppercase tracking-widest"
                  >
                    + Вариант
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <button onClick={addBuilderQuestion} className="px-4 py-2 text-xs font-black uppercase tracking-widest">
                + Вопрос
              </button>
              <button onClick={createExam} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                Создать тест
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Загруженные тесты</h3>
              <button
                onClick={refreshExams}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl"
              >
                Обновить
              </button>
            </div>
            {loadingExams && <p className="text-sm font-bold text-slate-400">Загрузка...</p>}
            {!loadingExams && loadedExams.length === 0 && (
              <p className="text-sm font-bold text-slate-400">Список пуст</p>
            )}
            <div className="grid grid-cols-1 gap-3">
              {loadedExams.map((exam: any) => (
                <div key={exam.id} className="border border-slate-100 rounded-2xl p-4 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-800 tracking-tight">{exam.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {exam.duration_minutes} мин • {exam.questions?.length || 0} вопросов
                    </p>
                    {exam.description && (
                      <p className="text-xs text-slate-500 font-semibold">{exam.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setExamMeta({
                        title: exam.title || '',
                        description: exam.description || '',
                        duration: exam.duration_minutes || 60,
                      });
                      if (Array.isArray(exam.questions)) {
                        setBuilderQuestions(exam.questions);
                      }
                      notify('Тест загружен в конструктор');
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-orange-500"
                  >
                    Открыть
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {questions.map((q: any) => (
              <div key={q.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex justify-between items-start text-left group hover:border-orange-500/30 transition-all">
                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                      <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{q.difficulty}</span>
                   </div>
                   <p className="font-black text-slate-800 leading-tight text-sm pr-4 tracking-tight">{q.text}</p>
                </div>
                <button onClick={() => setQuestions(questions.filter((x: any) => x.id !== q.id))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestAssignmentView({ students, notify, onLogout }: any) {
  const [selectedGroup, setSelectedGroup] = useState('Все');
  const [timeLimit, setTimeLimit] = useState(60);
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [loadingExams, setLoadingExams] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [editDueDate, setEditDueDate] = useState('');

  const uniqueGroups: string[] = Array.from(new Set(students.map((s: any) => s.group as string)));
  const groups: string[] = ['Все', ...uniqueGroups];
  const filtered = students.filter((s: any) => selectedGroup === 'Все' || s.group === selectedGroup);

  useEffect(() => {
    const loadExams = async () => {
      setLoadingExams(true);
      try {
        const data = await api.getExams();
        setExams(data || []);
        if (data && data.length > 0) {
          setSelectedExamId(String(data[0].id));
        }
      } catch {
        notify('Не удалось загрузить список тестов');
      } finally {
        setLoadingExams(false);
      }
    };
    loadExams();
  }, []);

  const refreshAssignments = async () => {
    try {
      const data = await api.getAssignments();
      setAssignments(data || []);
    } catch {
      notify('Не удалось загрузить назначенные тесты');
    }
  };

  useEffect(() => {
    refreshAssignments();
  }, []);

  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedStudents.size === filtered.length) {
      setSelectedStudents(new Set());
      return;
    }
    setSelectedStudents(new Set(filtered.map((s: any) => Number(s.id))));
  };

  const assignByGroup = async () => {
    if (!selectedExamId) {
      notify('Выберите тест');
      return;
    }
    if (filtered.length === 0) {
      notify('В группе нет студентов');
      return;
    }
    try {
      await Promise.all(
        filtered.map((student: any) => api.assignExam(selectedExamId, { student_id: Number(student.id) }))
      );
      notify(`Тест назначен группе: ${selectedGroup}`);
      refreshAssignments();
    } catch {
      notify('Не удалось назначить тест группе');
    }
  };

  const startSession = async () => {
    if (!selectedExamId) {
      notify('Выберите тест');
      return;
    }
    if (selectedStudents.size === 0) {
      notify('Выберите студентов');
      return;
    }
    try {
      await Promise.all(
        Array.from(selectedStudents).map((studentId) =>
          api.assignExam(selectedExamId, { student_id: studentId })
        )
      );
      notify(`Сессия запущена. Лимит: ${timeLimit} мин.`);
      refreshAssignments();
    } catch {
      notify('Не удалось назначить тест');
    }
  };

  const openEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setEditDueDate(assignment.due_date ? assignment.due_date.slice(0, 16) : '');
  };

  const saveAssignment = async () => {
    if (!editingAssignment) return;
    try {
      await api.updateAssignment(editingAssignment.id, {
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
      });
      notify('Назначение обновлено');
      setEditingAssignment(null);
      refreshAssignments();
    } catch {
      notify('Не удалось обновить назначение');
    }
  };

  const cancelAssignment = async (assignmentId: number) => {
    try {
      await api.deleteAssignment(assignmentId);
      notify('Назначение отменено');
      refreshAssignments();
    } catch {
      notify('Не удалось отменить назначение');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
      <header className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-40">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Назначение тестов</h2>
        <ProfileMenu notify={notify} onLogout={onLogout} />
      </header>

       <div className="flex-1 overflow-y-auto p-8">
         <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
               <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Параметры сессии</p>
               <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Фильтр группы:</span>
                  <select className="text-xs font-black border-none bg-transparent focus:ring-0 cursor-pointer" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                     {groups.map((g: string) => <option key={g} value={g}>{g}</option>)}
                  </select>
               </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
               <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col">
                  <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-3 text-slate-800 mb-8 border-b border-slate-50 pb-4">
                    <CheckSquare className="w-5 h-5 text-orange-500"/> Список студентов ({filtered.length})
                  </h3>
                    <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={toggleAll}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      {selectedStudents.size === filtered.length ? 'Снять все' : 'Выбрать все'}
                    </button>
                      {selectedGroup !== 'Все' && (
                        <button
                          onClick={assignByGroup}
                          className="text-[10px] font-black uppercase tracking-widest text-orange-500"
                        >
                          Назначить группе
                        </button>
                      )}
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedStudents.size}/{filtered.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-100">
                     {filtered.map((s: any) => (
                       <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded-lg border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                            checked={selectedStudents.has(Number(s.id))}
                            onChange={() => toggleStudent(Number(s.id))}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-slate-800 truncate">{s.full_name || s.name || 'Student'}</span>
                            <div className="flex gap-2 items-center">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.id}</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{s.group}</span>
                            </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-6">
                 <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 opacity-5">
                      <Settings className="w-40 h-40" />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-3 text-slate-800 relative"><Settings className="w-5 h-5 text-orange-500"/> Настройки экзамена</h3>
                    
                    <div className="space-y-8 relative">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Выберите тест</label>
                        <select
                          className="w-full p-4 rounded-2xl text-sm font-bold bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer"
                          value={selectedExamId}
                          onChange={(e) => setSelectedExamId(e.target.value)}
                          disabled={loadingExams}
                        >
                          {exams.map((exam: any) => (
                            <option key={exam.id} value={exam.id}>
                              {exam.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> Лимит времени: <span className="text-orange-500 font-black">{timeLimit} минут</span>
                        </label>
                        <div className="px-2">
                          <input 
                            type="range" min="5" max="180" step="5"
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-orange-500" /> Режим прокторинга
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">Активный AI-мониторинг поведения</p>
                        </div>
                        <button 
                          onClick={() => setProctoringEnabled(!proctoringEnabled)}
                          className={`transition-all duration-300 focus:outline-none rounded-full ${proctoringEnabled ? 'text-orange-500 scale-110' : 'text-slate-300 scale-100'}`}
                        >
                          {proctoringEnabled ? <ToggleRight className="w-11 h-11" /> : <ToggleLeft className="w-11 h-11" />}
                        </button>
                      </div>
                    </div>
                 </div>

                  <button 
                    onClick={startSession} 
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                 >
                   <Send className="w-4 h-4" /> Начать экзаменационную сессию
                 </button>
               </div>
            </div>

              <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Назначенные тесты</h3>
                  <button
                    onClick={refreshAssignments}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl"
                  >
                    Обновить
                  </button>
                </div>
                {assignments.length === 0 ? (
                  <p className="text-sm font-bold text-slate-400">Список пуст</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                        <tr>
                          <th className="pb-3">Экзамен</th>
                          <th className="pb-3">Студент</th>
                          <th className="pb-3">Статус</th>
                          <th className="pb-3">Дедлайн</th>
                          <th className="pb-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assignments.map((a: any) => (
                          <tr key={a.id} className="text-slate-700">
                            <td className="py-3 font-bold">{a.exam_id}</td>
                            <td className="py-3">{a.student_email || a.student_id}</td>
                            <td className="py-3 uppercase text-[10px] font-black tracking-widest">
                              {a.status}
                            </td>
                            <td className="py-3 text-xs">
                              {a.due_date ? new Date(a.due_date).toLocaleString() : '—'}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => openEditAssignment(a)}
                                  disabled={a.status !== 'assigned'}
                                  className={`text-[10px] font-black uppercase tracking-widest ${
                                    a.status === 'assigned' ? 'text-orange-500' : 'text-slate-300 cursor-not-allowed'
                                  }`}
                                >
                                  Редактировать
                                </button>
                                <button
                                  onClick={() => cancelAssignment(a.id)}
                                  disabled={a.status !== 'assigned'}
                                  className={`text-[10px] font-black uppercase tracking-widest ${
                                    a.status === 'assigned' ? 'text-red-500' : 'text-slate-300 cursor-not-allowed'
                                  }`}
                                >
                                  Отменить
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
         </div>
       </div>
        {editingAssignment && (
          <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900">Редактировать назначение</h3>
                <button onClick={() => setEditingAssignment(null)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Дедлайн</label>
                  <input
                    type="datetime-local"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold"
                  />
                </div>
                <p className="text-xs text-slate-400 font-bold">
                  Редактирование доступно, пока статус: assigned
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setEditingAssignment(null)}
                  className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500"
                >
                  Отмена
                </button>
                <button
                  onClick={saveAssignment}
                  className="px-6 py-2 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all relative group ${
        active 
          ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100/50' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {label}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
      )}
    </button>
  );
}
