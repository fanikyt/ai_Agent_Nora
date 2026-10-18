import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sliders,
  Check,
  Copy,
  ArrowRight,
  X,
  Code2,
  Bug,
  Layout,
  FileText,
  Database,
  Sparkles,
  Save,
} from 'lucide-react';
import { NoraLogo } from './NoraLogo';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (promptText: string) => void;
}

interface PromptPreset {
  id: string;
  category: 'code' | 'debug' | 'design' | 'docs' | 'data';
  title: string;
  description: string;
  prompt: string;
  icon: any;
}

const PRESETS: PromptPreset[] = [
  {
    id: 'p-1',
    category: 'debug',
    title: 'Аудит безопасности и баг-хантинг',
    description: 'Глубокий анализ кода на утечки памяти, race conditions и уязвимости безопасности.',
    prompt: 'Проведи глубокий аудит безопасности и надежности следующего кода. Найди потенциальные уязвимости (SQL injection, XSS, утечки памяти, race conditions) и предложи исправленный вариант с объяснениями:',
    icon: Bug,
  },
  {
    id: 'p-2',
    category: 'code',
    title: 'Рефакторинг в чистый React 19 + TypeScript',
    description: 'Улучшение типизации, устранение дублирования и перевод на современные хуки.',
    prompt: 'Сделай профессиональный рефакторинг этого компонента на чистый TypeScript и современные стандарты React: добавь строгие интерфейсы, декомпозируй логику на кастомные хуки и улучши читаемость:',
    icon: Code2,
  },
  {
    id: 'p-3',
    category: 'design',
    title: 'Генератор Tailwind UI компонентов',
    description: 'Создание адаптивного, темного и визуально привлекательного интерфейса.',
    prompt: 'Создай современный, адаптивный компонент интерфейса на Tailwind CSS с поддержкой темной темы, микроанимаций при наведении и идеальной доступностью (WCAG):',
    icon: Layout,
  },
  {
    id: 'p-4',
    category: 'docs',
    title: 'Генерация профессионального README.md',
    description: 'Структурированная документация проекта с бейджами, инструкциями и примерами.',
    prompt: 'Напиши исчерпывающий, красиво оформленный файл README.md для проекта. Включи бейджи, архитектурную схему, инструкции по установке (npm/pnpm), примеры использования и FAQ:',
    icon: FileText,
  },
  {
    id: 'p-5',
    category: 'data',
    title: 'Архитектура базы данных и SQL-схемы',
    description: 'Проектирование нормализованных таблиц, индексов и связей.',
    prompt: 'Спроектируй оптимальную реляционную схему базы данных PostgreSQL для сервиса. Включи внешние ключи, составные индексы для быстрого поиска и примеры сложных запросов с JOIN:',
    icon: Database,
  },
];

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  onApplyPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'prompts' | 'instructions'>('prompts');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom instructions state
  const [userProfile, setUserProfile] = useState('');
  const [responseStyle, setResponseStyle] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('nora_custom_profile') || '';
    const savedStyle = localStorage.getItem('nora_custom_style') || '';
    setUserProfile(savedProfile);
    setResponseStyle(savedStyle);
  }, []);

  const handleSaveInstructions = () => {
    localStorage.setItem('nora_custom_profile', userProfile);
    localStorage.setItem('nora_custom_style', responseStyle);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (!isOpen) return null;

  const filteredPresets = PRESETS.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl h-[90vh] sm:h-[84vh] bg-[#0c0f17] border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Tabs */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Библиотека Nora</h2>
              <p className="text-xs text-slate-400">
                Шаблоны промптов и персональные правила для ассистента
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#141824] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('prompts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'prompts'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Промпты
              </button>
              <button
                onClick={() => setActiveTab('instructions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'instructions'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Custom Instructions</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Prompts Catalog */}
        {activeTab === 'prompts' && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin shrink-0">
              {[
                { id: 'all', label: 'Все категории' },
                { id: 'code', label: 'Разработка' },
                { id: 'debug', label: 'Поиск багов' },
                { id: 'design', label: 'UI / UX' },
                { id: 'docs', label: 'Документация' },
                { id: 'data', label: 'Базы данных' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600/20 text-white border-indigo-500 shadow-sm'
                      : 'bg-[#141824] text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Presets Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 scrollbar-thin pr-1">
              {filteredPresets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <div
                    key={preset.id}
                    className="p-4 rounded-2xl bg-[#0f131d] border border-slate-800 hover:border-indigo-500/50 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold text-sm text-white">{preset.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {preset.description}
                      </p>
                      <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-[11px] text-slate-300 font-mono mb-4 line-clamp-3">
                        {preset.prompt}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(preset.prompt);
                          setCopiedId(preset.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        {copiedId === preset.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Скопировано</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Скопировать</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onApplyPrompt(preset.prompt);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-indigo-600/30"
                      >
                        <span>Применить в чат</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Instructions */}
        {activeTab === 'instructions' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4 text-xs text-slate-300">
              💡 <strong>Custom Instructions</strong> позволяют Nora помнить контекст о вас и ваших предпочтениях во всех чатах без необходимости повторяться в каждом запросе.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                1. Что Nora должна знать о вас, чтобы давать более точные ответы?
              </label>
              <textarea
                value={userProfile}
                onChange={(e) => setUserProfile(e.target.value)}
                placeholder="Пример: Я Full-Stack разработчик (React, Node.js, TypeScript). Работаю над SaaS-проектами. Предпочитаю чистую архитектуру..."
                rows={4}
                className="w-full bg-[#141824] border border-slate-700/80 rounded-2xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                2. Какой формат и стиль ответов вы предпочитаете?
              </label>
              <textarea
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value)}
                placeholder="Пример: Отвечай кратко и по делу. Сначала давай готовый рабочий код с комментариями, затем объясняй неочевидные моменты. Не пиши лишних вступлений..."
                rows={4}
                className="w-full bg-[#141824] border border-slate-700/80 rounded-2xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveInstructions}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? 'Инструкции сохранены!' : 'Сохранить настройки'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
