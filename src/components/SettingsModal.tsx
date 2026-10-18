import React from 'react';
import {
  X,
  Settings,
  Terminal as TerminalIcon,
  Zap,
  Globe,
  Sliders,
  Sparkles,
  Cpu,
  Trash2,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { NoraLogo } from './NoraLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  autoApply: boolean;
  onToggleAutoApply: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isWebSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onClearTerminalHistory?: () => void;
  terminalCount?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isTerminalOpen,
  onToggleTerminal,
  autoApply,
  onToggleAutoApply,
  selectedModel,
  onSelectModel,
  isWebSearchEnabled,
  onToggleWebSearch,
  onClearTerminalHistory,
  terminalCount = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#121622] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#161b29]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Настройки системы Nora</h2>
              <p className="text-[11px] text-slate-400">Параметры агента, консоли и инструментов</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* Section 1: Кнопка Консоль (Перенесена сюда) */}
          <div className="p-4 rounded-xl bg-[#181d2c] border border-slate-700/70 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isTerminalOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <TerminalIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Консоль (Терминал проекта)</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                      isTerminalOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {isTerminalOpen ? 'Активна' : 'Скрыта'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Песочница команд (Claude Code Sandbox). Показывает логи выполнения действий агента, операции с файлами, git и вывод консольных команд.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onToggleTerminal();
                  onClose();
                }}
                className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 ${
                  isTerminalOpen
                    ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40'
                }`}
              >
                <TerminalIcon className="w-4 h-4" />
                <span>{isTerminalOpen ? 'Закрыть консоль' : 'Открыть консоль проекта'}</span>
              </button>

              {onClearTerminalHistory && (
                <button
                  type="button"
                  onClick={onClearTerminalHistory}
                  className="py-2 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer flex items-center gap-1.5"
                  title="Очистить историю терминала"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xs:inline">Очистить</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Разъяснение и настройка "Энергия" (Auto-Apply ⚡) */}
          <div className="p-4 rounded-xl bg-[#181d2c] border border-slate-700/70 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  autoApply
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Энергия агента (Авто-запись файлов)</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                      autoApply
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {autoApply ? 'Включена (⚡)' : 'Выключена'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    <strong>Что это за кнопка:</strong> когда «Энергия» включена, Nora автоматически сохраняет и перезаписывает файлы проекта на вашем диске в реальном времени по ходу генерации ответа.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Если выключить — агент генерирует только код в чате, и вам нужно вручную нажимать «Применить».
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-xs text-slate-300 font-medium">Автоматическое применение правок</span>
              <button
                type="button"
                onClick={onToggleAutoApply}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  autoApply ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoApply ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 3: Выбор модели ИИ */}
          <div className="p-4 rounded-xl bg-[#181d2c] border border-slate-700/70 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Базовая языковая модель</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectModel('gemini-3.8-flash')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  selectedModel === 'gemini-3.8-flash'
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Gemini 3.8 Flash</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Fast</span>
                </div>
                <span className="text-[10px] text-slate-400">Мгновенный ответ и стриминг</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectModel('gemini-3.8-pro')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  selectedModel === 'gemini-3.8-pro'
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Gemini 3.8 Pro</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Deep</span>
                </div>
                <span className="text-[10px] text-slate-400">Сложный глубокий рефакторинг</span>
              </button>
            </div>
          </div>

          {/* Section 4: Google Поиск */}
          <div className="p-4 rounded-xl bg-[#181d2c] border border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Google Поиск (Web Grounding)</h4>
                <p className="text-[11px] text-slate-400">Поиск актуальной документации и свежих библиотек</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isWebSearchEnabled ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isWebSearchEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 px-5 border-t border-slate-800 bg-[#161b29] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <NoraLogo className="w-4 h-4" /> Nora Studio Engine v2.5
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
