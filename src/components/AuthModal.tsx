import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Database,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogleWithDiagnosis,
  AppUser,
} from '../services/accountService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AppUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleDiagnosis, setGoogleDiagnosis] = useState<{
    code: string;
    message: string;
    domain: string;
    helpUrl: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGoogleDiagnosis(null);
    setIsLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Пожалуйста, введите ваш email');
      }
      const user = await registerWithEmail(name, email, password);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGoogleDiagnosis(null);
    setIsLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Пожалуйста, введите ваш email');
      }
      const user = await loginWithEmail(email, password);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleDiagnosis(null);
    setIsLoading(true);

    const res = await loginWithGoogleWithDiagnosis();
    setIsLoading(false);

    if (res.user) {
      onSuccess(res.user);
      onClose();
    } else if (res.error) {
      setGoogleDiagnosis(res.error);
    }
  };

  // Quick 1-click developer login
  const handleQuickDevLogin = async () => {
    setIsLoading(true);
    try {
      const user = await registerWithEmail('Разработчик', 'developer@client.local');
      onSuccess(user);
      onClose();
    } catch {
      const user = await loginWithEmail('developer@client.local');
      onSuccess(user);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-[#121620] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#151a24]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
                Аккаунт и база данных чатов
              </h2>
              <p className="text-[11px] text-slate-400">
                Создайте базу данных для сохранения всех ваших проектов и чатов
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher: Регистрация / Вход */}
        <div className="grid grid-cols-2 p-1.5 bg-[#0e121a] border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-2 text-center rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Регистрация</span>
          </button>
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-2 text-center rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Вход в аккаунт</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 space-y-4">
          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Popup Diagnosis Warning */}
          {googleDiagnosis && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="leading-snug">
                  <strong>Окно Google закрылось браузером:</strong>
                  <p className="mt-1 text-[11px] text-amber-300/90">
                    Браузер заблокировал перенаправление из iframe, либо текущий домен{' '}
                    <code className="bg-amber-950/60 px-1 py-0.5 rounded text-white font-mono text-[10px]">
                      {googleDiagnosis.domain}
                    </code>{' '}
                    требует добавления в список Authorized Domains в консоли Firebase.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex flex-col gap-1.5 border-t border-amber-500/20 text-[11px]">
                <span className="text-white font-medium">
                  Рекомендуется войти через Email / Имя ниже — это работает сразу на 100%!
                </span>
              </div>
            </div>
          )}

          <form onSubmit={tab === 'register' ? handleRegisterSubmit : handleLoginSubmit} className="space-y-3">
            {tab === 'register' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Ваше имя или никнейм:
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: fanikka"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Email адрес:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fanikka02@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Пароль {tab === 'register' ? '(необязательно)' : ''}:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {tab === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Создать аккаунт и базу чатов</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Войти в аккаунт</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[#121620] px-2 text-slate-500">или альтернативные способы</span>
            </div>
          </div>

          {/* Social / Quick Login Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Войти через Google</span>
            </button>

            <button
              type="button"
              onClick={handleQuickDevLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-xl text-xs font-medium text-indigo-300 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Быстрый вход разработчика (в 1 клик)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0d1017] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Локальная + Cloud БД чатов</span>
          </div>
          <span className="text-slate-500">Firestore Ready</span>
        </div>
      </div>
    </div>
  );
};
