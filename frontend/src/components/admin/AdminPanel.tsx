import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Bot,
  CheckCircle,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Languages,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Network,
  PlusCircle,
  ScrollText,
  Search,
  Settings,
  Shield,
  Sun,
  Terminal,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import apiService from '../../services/api';

const translations = {
  ru: {
    monitoring: 'Мониторинг',
    participants: 'Участники',
    logs: 'Системные логи',
    settings: 'Настройки',
    adminWorkspace: 'ADMIN Рабочая область',
    logout: 'Выход',
    activeSessions: 'Активные сессии',
    currentTests: 'Текущие тесты',
    storage: 'Хранилище логов',
    protected: 'Система защищена',
    adminPanel: 'Панель Администратора',
    statusReady: 'Система OpenProctorAI работает в штатном режиме.',
    addUser: 'Добавить пользователя',
    searchPlaceholder: 'Поиск по имени или email...',
    allRoles: 'Все роли',
    roleAdmin: 'Администратор',
    roleTeacher: 'Преподаватель',
    roleStudent: 'Студент',
    cpuLoad: 'CPU LOAD',
    ramUsage: 'RAM USAGE',
    dbStorage: 'DB STORAGE',
    traffic: 'TRAFFIC',
    testConnection: 'Проверить соединение',
    saveConfig: 'Сохранить конфигурацию',
    autoProctoring: 'Авто-прокторинг',
    evidenceRecord: 'Запись доказательств',
    metadataStorage: 'Хранение метаданных',
  },
  kk: {
    monitoring: 'Бақылау',
    participants: 'Қатысушылар',
    logs: 'Жүйелік журналдар',
    settings: 'Баптаулар',
    adminWorkspace: 'ADMIN Жұмыс аймағы',
    logout: 'Шығу',
    activeSessions: 'Белсенді сессиялар',
    currentTests: 'Ағымдағы тесттер',
    storage: 'Журнал қоймасы',
    protected: 'Жүйе қорғалған',
    adminPanel: 'Әкімші панелі',
    statusReady: 'OpenProctorAI жүйесі қалыпты режимде жұмыс істеуде.',
    addUser: 'Пайдаланушы қосу',
    searchPlaceholder: 'Аты немесе email бойынша іздеу...',
    allRoles: 'Барлық рөлдер',
    roleAdmin: 'Әкімші',
    roleTeacher: 'Оқытушы',
    roleStudent: 'Студент',
    cpuLoad: 'CPU ЖҮКТЕМЕСІ',
    ramUsage: 'RAM ПАЙДАЛАНУ',
    dbStorage: 'ДҚ ҚОЙМАСЫ',
    traffic: 'ТРАФИК',
    testConnection: 'Қосылымды тексеру',
    saveConfig: 'Конфигурацияны сақтау',
    autoProctoring: 'Авто-прокторинг',
    evidenceRecord: 'Дәлелдемелерді жазу',
    metadataStorage: 'Метадеректерді сақтау',
  },
  en: {
    monitoring: 'Monitoring',
    participants: 'Participants',
    logs: 'System Logs',
    settings: 'Settings',
    adminWorkspace: 'ADMIN Workspace',
    logout: 'Logout',
    activeSessions: 'Active Sessions',
    currentTests: 'Current Tests',
    storage: 'Logs Storage',
    protected: 'System Protected',
    adminPanel: 'Admin Panel',
    statusReady: 'OpenProctorAI system is running normally.',
    addUser: 'Add User',
    searchPlaceholder: 'Search by name or email...',
    allRoles: 'All Roles',
    roleAdmin: 'Administrator',
    roleTeacher: 'Teacher',
    roleStudent: 'Student',
    cpuLoad: 'CPU LOAD',
    ramUsage: 'RAM USAGE',
    dbStorage: 'DB STORAGE',
    traffic: 'TRAFFIC',
    testConnection: 'Test Connection',
    saveConfig: 'Save Configuration',
    autoProctoring: 'Auto Proctoring',
    evidenceRecord: 'Evidence Recording',
    metadataStorage: 'Metadata Storage',
  },
};

type Language = keyof typeof translations;

type MessageType = 'success' | 'info';

interface MessageState {
  text: string;
  type: MessageType;
}

interface AdminUser {
  id: number;
  code: string;
  name: string;
  email: string;
  role: 'Student' | 'Teacher' | 'Admin';
  status: 'Active' | 'Disabled';
  lastLogin: string;
  avatar: string;
}

interface AdminLog {
  id: number;
  user_email?: string | null;
  action?: string | null;
  details?: Record<string, unknown> | string | null;
  created_at?: string | null;
}

interface AdminPanelProps {
  onLogout: () => void;
}

const OpenProctorLogo = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="50" r="25" stroke="currentColor" strokeWidth="8" />
    <circle cx="65" cy="50" r="25" stroke="currentColor" strokeWidth="8" />
    <path d="M50 35L60 50L50 65L40 50Z" fill="#F97316" />
  </svg>
);

const formatUserCode = (role: AdminUser['role'], id: number) => {
  const prefix = role === 'Admin' ? 'AD' : role === 'Teacher' ? 'TC' : 'ST';
  return `${prefix}-2026-${String(id).padStart(3, '0')}`;
};

const resolveRole = (value?: string): AdminUser['role'] => {
  if (!value) return 'Student';
  const normalized = value.toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'teacher') return 'Teacher';
  return 'Student';
};

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.split(' ').filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'U';
};

const Message = ({ text, type = 'info', onClose }: { text: string; type?: MessageType; onClose: () => void }) => {
  const bg =
    type === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
  const textCol =
    type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400';
  const Icon = type === 'success' ? CheckCircle : Activity;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 p-4 rounded-2xl border shadow-2xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${bg} ${textCol}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-bold">{text}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface AdminUserModuleProps {
  users: AdminUser[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  roleFilter: 'All' | AdminUser['role'];
  setRoleFilter: (value: 'All' | AdminUser['role']) => void;
  toggleStatus: (id: number) => void;
  handleDelete: (id: number) => void;
  t: typeof translations.ru;
  onAddUser: () => void;
}

const AdminUserModule = ({
  users,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  toggleStatus,
  handleDelete,
  t,
  onAddUser,
}: AdminUserModuleProps) => {
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden text-left animate-in fade-in duration-500">
      <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.participants}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">OpenProctorAI Access Control</p>
        </div>
        <button
          onClick={onAddUser}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
        >
          <PlusCircle className="w-4 h-4" /> {t.addUser}
        </button>
      </div>

      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:text-white transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as AdminUserModuleProps['roleFilter'])}
          className="sm:w-56 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none dark:text-white cursor-pointer appearance-none"
        >
          <option value="All">{t.allRoles}</option>
          <option value="Admin">{t.roleAdmin}</option>
          <option value="Teacher">{t.roleTeacher}</option>
          <option value="Student">{t.roleStudent}</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
            <tr>
              <th className="px-8 py-5">User</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-black ring-4 ring-white dark:ring-slate-800">
                      {user.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{user.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <button onClick={() => toggleStatus(user.id)} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-[10px] font-black uppercase dark:text-slate-400">{user.status}</span>
                  </button>
                </td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface SystemLogsModuleProps {
  t: typeof translations.ru;
  logs: AdminLog[];
  loading: boolean;
  status?: {
    os?: string;
    cpu_percent?: number;
    memory_percent?: number;
    disk_percent?: number;
    net_sent_mb?: number;
    net_recv_mb?: number;
  };
}

const metricColorStyles = {
  orange: {
    bg: 'bg-orange-50',
    darkBg: 'dark:bg-orange-900/20',
    text: 'text-orange-600',
    darkText: 'dark:text-orange-400',
    border: 'border-orange-100',
    darkBorder: 'dark:border-orange-800',
  },
  indigo: {
    bg: 'bg-indigo-50',
    darkBg: 'dark:bg-indigo-900/20',
    text: 'text-indigo-600',
    darkText: 'dark:text-indigo-400',
    border: 'border-indigo-100',
    darkBorder: 'dark:border-indigo-800',
  },
  amber: {
    bg: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/20',
    text: 'text-amber-600',
    darkText: 'dark:text-amber-400',
    border: 'border-amber-100',
    darkBorder: 'dark:border-amber-800',
  },
  emerald: {
    bg: 'bg-emerald-50',
    darkBg: 'dark:bg-emerald-900/20',
    text: 'text-emerald-600',
    darkText: 'dark:text-emerald-400',
    border: 'border-emerald-100',
    darkBorder: 'dark:border-emerald-800',
  },
};

const SystemLogsModule = ({ t, logs, loading, status }: SystemLogsModuleProps) => {
  const metrics = {
    cpu: status?.cpu_percent ?? 0,
    ram: status?.memory_percent ?? 0,
    disk: status?.disk_percent ?? 0,
    net: status ? Math.min(100, Math.round((status.net_recv_mb ?? 0) % 100)) : 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.logs}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {([
          { label: t.cpuLoad, val: metrics.cpu, icon: Cpu, col: 'orange' },
          { label: t.ramUsage, val: metrics.ram, icon: HardDrive, col: 'indigo' },
          { label: t.dbStorage, val: metrics.disk.toFixed(1), icon: Database, col: 'amber' },
          { label: t.traffic, val: metrics.net, icon: Network, col: 'emerald' },
        ] as const).map((m) => {
          const color = metricColorStyles[m.col];
          return (
            <div
              key={m.label}
              className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-orange-500/20 transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className={`p-3 ${color.bg} ${color.darkBg} rounded-2xl ${color.text} ${color.darkText} group-hover:bg-orange-500 group-hover:text-white transition-all`}
                >
                  <m.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">{m.val}%</div>
              <div className="w-full bg-slate-50 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${m.val}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {status?.os && (
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {status.os}
        </div>
      )}

      <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden p-8 font-mono text-[11px] text-slate-300 space-y-2 max-h-[300px] overflow-y-auto">
        <div className="text-orange-500 font-black mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
          <Terminal className="w-4 h-4" /> OpenProctorAI Shell v4.0
        </div>
        {loading && <div className="text-slate-400">Loading logs...</div>}
        {!loading && logs.length === 0 && <div className="text-slate-400">No audit logs yet.</div>}
        {!loading &&
          logs.map((log) => {
            const time = log.created_at ? new Date(log.created_at).toLocaleTimeString() : new Date().toLocaleTimeString();
            const actor = log.user_email ? `(${log.user_email})` : '';
            const details = log.details
              ? typeof log.details === 'string'
                ? log.details
                : JSON.stringify(log.details)
              : '';
            const line = `${log.action || 'EVENT'} ${actor}`.trim();
            return (
              <div key={log.id} className="text-slate-200">
                [{time}] {line} {details}
              </div>
            );
          })}
      </div>
    </div>
  );
};

interface SettingsModuleProps {
  t: typeof translations.ru;
  showMessage: (text: string, type: MessageType) => void;
}

const providerColorStyles = {
  emerald: {
    bg: 'bg-emerald-50',
    darkBg: 'dark:bg-emerald-900/20',
    text: 'text-emerald-600',
    darkText: 'dark:text-emerald-400',
    border: 'border-emerald-100',
    darkBorder: 'dark:border-emerald-800',
  },
  indigo: {
    bg: 'bg-indigo-50',
    darkBg: 'dark:bg-indigo-900/20',
    text: 'text-indigo-600',
    darkText: 'dark:text-indigo-400',
    border: 'border-indigo-100',
    darkBorder: 'dark:border-indigo-800',
  },
};

const SettingsModule = ({ t, showMessage }: SettingsModuleProps) => {
  const [config, setConfig] = useState({ auto: true, textLogs: true, videoLogs: false });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.settings}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {([
          { id: 'openai', label: 'OpenAI (GPT-4o)', icon: Bot, color: 'emerald' },
          { id: 'gemini', label: 'Google Gemini Pro', icon: Globe, color: 'indigo' },
        ] as const).map((api) => {
          const color = providerColorStyles[api.color];
          return (
            <div
              key={api.id}
              className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 p-8 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-12 h-12 ${color.bg} ${color.darkBg} rounded-2xl flex items-center justify-center ${color.text} ${color.darkText} border ${color.border} ${color.darkBorder}`}
                >
                  <api.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{api.label}</h3>
              </div>
              <input
                type="password"
                value="sk-••••••••••••••••"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-mono mb-4 text-slate-400"
                readOnly
              />
              <button
                onClick={() => showMessage(`${api.label} connection OK`, 'success')}
                className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
              >
                {t.testConnection}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {([
            { label: t.autoProctoring, active: config.auto, key: 'auto', col: 'orange' },
            { label: t.metadataStorage, active: config.textLogs, key: 'textLogs', col: 'orange' },
            { label: t.evidenceRecord, active: config.videoLogs, key: 'videoLogs', col: 'rose' },
          ] as const).map((opt) => (
            <div
              key={opt.key}
              onClick={() => setConfig({ ...config, [opt.key]: !opt.active })}
              className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 cursor-pointer group"
            >
              <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white">{opt.label}</span>
              {opt.active ? (
                <ToggleRight className={opt.col === 'rose' ? 'w-10 h-10 text-rose-500' : 'w-10 h-10 text-orange-500'} />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <button
            onClick={() => showMessage(t.protected, 'success')}
            className="px-10 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-orange-500/20 active:scale-95"
          >
            {t.saveConfig}
          </button>
        </div>
      </div>
    </div>
  );
};

const dashboardCardStyles = {
  orange: {
    bg: 'bg-orange-50',
    darkBg: 'dark:bg-orange-900/20',
    text: 'text-orange-600',
    darkText: 'dark:text-orange-400',
  },
  slate: {
    bg: 'bg-slate-900',
    darkBg: 'dark:bg-slate-900',
    text: 'text-white',
    darkText: 'dark:text-white',
  },
  emerald: {
    bg: 'bg-emerald-50',
    darkBg: 'dark:bg-emerald-900/20',
    text: 'text-emerald-600',
    darkText: 'dark:text-emerald-400',
  },
};

export const AdminPanel = ({ onLogout }: AdminPanelProps) => {
  const api = useMemo(() => apiService, []);
  const [lang, setLang] = useState<Language>('ru');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'logs' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminUserModuleProps['roleFilter']>('All');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<SystemLogsModuleProps['status']>(undefined);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState<{ name: string; email: string; role: AdminUser['role'] }>({
    name: '',
    email: '',
    role: 'Student',
  });
  const t = translations[lang];

  const showMessage = (text: string, type: MessageType) => setMessage({ text, type });

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      try {
        const data = await api.getAdminUsers();
        if (!mounted) return;
        const mapped = data.map((user) => {
          const role = resolveRole(user.role);
          const name = user.full_name || user.email?.split('@')[0] || 'User';
          return {
            id: Number(user.id),
            code: formatUserCode(role, Number(user.id)),
            name,
            email: user.email,
            role,
            status: user.is_active ? 'Active' : 'Disabled',
            lastLogin: '—',
            avatar: getInitials(name),
          } as AdminUser;
        });
        setUsers(mapped);
      } catch {
        showMessage('Не удалось загрузить пользователей', 'info');
      }
    };

    loadUsers();
    return () => {
      mounted = false;
    };
  }, [api]);

  useEffect(() => {
    if (activeTab !== 'logs') {
      return;
    }
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      setLogsLoading(true);
      try {
        const [logsData, statusData] = await Promise.all([api.getAdminLogs(), api.getServerStatus()]);
        if (!mounted) return;
        setLogs(logsData as AdminLog[]);
        setServerStatus(statusData as SystemLogsModuleProps['status']);
      } catch {
        if (mounted) {
          showMessage('Не удалось загрузить системные логи', 'info');
        }
      } finally {
        if (mounted) {
          setLogsLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeTab, api]);

  const handleToggleStatus = (id: number) => {
    const userId = id;
    api
      .toggleAdminUser(userId)
      .then((data) => {
        const role = resolveRole(data.role);
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId
              ? { ...user, status: data.is_active ? 'Active' : 'Disabled', role, code: formatUserCode(role, userId) }
              : user
          )
        );
      })
      .catch(() => {
        showMessage('Не удалось обновить статус', 'info');
      });
  };

  const handleDelete = (id: number) => {
    const userId = id;
    api
      .deleteAdminUser(userId)
      .then(() => {
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        showMessage('Пользователь удален', 'success');
      })
      .catch(() => {
        showMessage('Не удалось удалить пользователя', 'info');
      });
  };

  const handleAddUser = () => {
    setIsAddUserOpen(true);
  };

  const handleCreateUser = () => {
    const email = newUser.email.trim().toLowerCase();
    const name = newUser.name.trim();
    if (!email || !name) {
      showMessage('Введите имя и email', 'info');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === email)) {
      showMessage('Пользователь уже существует', 'info');
      return;
    }

    api
      .createAdminUser({
        email,
        full_name: name,
        role: newUser.role.toLowerCase(),
        password: 'demo_password',
      })
      .then((created) => {
        const role = resolveRole(created.role);
        const userId = Number(created.id);
        setUsers((prev) => [
          {
            id: userId,
            code: formatUserCode(role, userId),
            name: created.full_name || name,
            email: created.email,
            role,
            status: created.is_active ? 'Active' : 'Disabled',
            lastLogin: 'just now',
            avatar: getInitials(created.full_name || name),
          },
          ...prev,
        ]);
        setIsAddUserOpen(false);
        setNewUser({ name: '', email: '', role: 'Student' });
        showMessage('Пользователь добавлен. Пароль: demo_password', 'success');
      })
      .catch(() => {
        showMessage('Не удалось создать пользователя', 'info');
      });
  };

  const navItems = [
    { label: t.monitoring, icon: Monitor, id: 'dashboard' },
    { label: t.participants, icon: Users, id: 'users' },
    { label: t.logs, icon: ScrollText, id: 'logs' },
    { label: t.settings, icon: Settings, id: 'settings' },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8 text-left animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {([
                { label: t.activeSessions, val: '372', icon: Users, col: 'orange' },
                { label: t.currentTests, val: '12', icon: Activity, col: 'slate' },
                { label: t.storage, val: '450GB', icon: Database, col: 'orange' },
                { label: t.protected, val: 'AES-256', icon: Shield, col: 'emerald' },
              ] as const).map((item) => {
                const color = dashboardCardStyles[item.col];
                return (
                  <div
                    key={item.label}
                    className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-orange-500/20 transition-all"
                  >
                    <div
                      className={`p-3 ${color.bg} ${color.darkBg} rounded-2xl w-fit mb-6 ${color.text} ${color.darkText}`}
                    >
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{item.val}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 p-20 text-center relative overflow-hidden shadow-inner">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] dark:opacity-[0.05]">
                <OpenProctorLogo className="w-96 h-96" />
              </div>
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative">
                <Monitor className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] relative">{t.adminPanel}</h3>
              <p className="text-slate-400 font-bold max-w-sm mx-auto mt-4 text-sm leading-relaxed relative">
                {t.statusReady}
              </p>
            </div>
          </div>
        );
      case 'users':
        return (
          <AdminUserModule
            users={users}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            toggleStatus={handleToggleStatus}
            handleDelete={handleDelete}
            t={t}
            onAddUser={handleAddUser}
          />
        );
      case 'logs':
        return <SystemLogsModule t={t} logs={logs} loading={logsLoading} status={serverStatus} />;
      case 'settings':
        return <SettingsModule t={t} showMessage={showMessage} />;
      default:
        return null;
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-[#fdfdfd] dark:bg-slate-900 flex font-sans text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-500 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-3">
              <OpenProctorLogo className="w-10 h-10 text-slate-800 dark:text-white" />
              <h1 className="font-black text-xl tracking-tighter text-slate-800 dark:text-white leading-none flex items-baseline">
                OpenProctor<span className="text-orange-500 ml-0.5 italic">AI</span>
              </h1>
            </div>
            <button className="lg:hidden ml-auto p-2" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6 space-y-2 flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              {t.adminWorkspace}
            </div>
            {navItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all relative group ${
                    activeTab === item.id
                      ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-100/50 dark:border-orange-500/20'
                      : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  {item.label}
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut className="w-5 h-5" /> {t.logout}
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
          <header className="h-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shrink-0 sticky top-0 z-40">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic hidden sm:block uppercase tracking-widest">
                {navItems.find((n) => n.id === activeTab)?.label || 'Overview'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <button className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-orange-500 rounded-xl transition-all flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">{lang}</span>
                </button>
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-[100] overflow-hidden">
                  {(['ru', 'kk', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`w-full px-4 py-3 text-[10px] font-black uppercase text-left hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-500 transition-all ${
                        lang === l ? 'text-orange-500' : 'text-slate-400'
                      }`}
                    >
                      {l === 'ru' ? 'Русский' : l === 'kk' ? 'Қазақша' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-orange-500 rounded-xl transition-all"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <button
                onClick={() => showMessage('Нет новых уведомлений', 'info')}
                className="relative p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-orange-500 rounded-xl transition-all"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-500 rounded-full ring-4 ring-white dark:ring-slate-800" />
              </button>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
              <button className="w-10 h-10 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden bg-slate-900 dark:bg-orange-500">
                <User className="w-5 h-5 text-white" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto pb-20">{renderContent()}</div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Core Active</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">OpenProctorAI Protected</span>
          </div>

        </main>

        {message && <Message text={message.text} type={message.type} onClose={() => setMessage(null)} />}
        {isAddUserOpen && (
          <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{t.addUser}</h3>
                <button onClick={() => setIsAddUserOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                  <input
                    value={newUser.name}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                  <input
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                    placeholder="user@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as AdminUser['role'] }))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200"
                  >
                    <option value="Admin">{t.roleAdmin}</option>
                    <option value="Teacher">{t.roleTeacher}</option>
                    <option value="Student">{t.roleStudent}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-8 py-3 rounded-2xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
