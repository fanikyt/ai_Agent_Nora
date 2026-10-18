import React from 'react';
import {
  X,
  Sparkles,
  FolderOpen,
  Image as ImageIcon,
  Bot,
  Terminal,
  CheckCircle2,
  Cpu,
  Keyboard,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPickDirectory: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onPickDirectory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#121620] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#161c28] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Инструкция: как все устроено и работает</h2>
              <p className="text-xs text-slate-400">
                Полное руководство по Gemini 3.8 Flash, подключению локальной папки и вставке скриншотов по Ctrl+V
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-sm leading-relaxed scrollbar-thin">
          {/* Step 1: Gemini 3.8 Flash */}
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex gap-4 items-start">
            <div className="p-2.5 rounded-lg bg-indigo-600/30 text-indigo-400 shrink-0 mt-0.5">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-base">1. Подключение Gemini 3.8 Flash</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Активно на сервере
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Модель <strong>Gemini 3.8 Flash</strong> уже подключена и настроена через безопасный серверный шлюз на базе официального SDK <code className="text-indigo-300">@google/genai</code>.
                Она обладает огромным окном контекста (до 1M токенов), высокой скоростью ответа, продвинутым рассуждением при написании кода и встроенной поддержкой мультимодального анализа изображений.
              </p>
            </div>
          </div>

          {/* Step 2: Local Folder */}
          <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-900/60 flex gap-4 items-start">
            <div className="p-2.5 rounded-lg bg-sky-600/30 text-sky-400 shrink-0 mt-0.5">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-white text-base">2. Как указать папку для работы ИИ агента</h3>
              <p className="text-xs text-slate-300">
                Приложение использует нативный диалог выбора папки операционной системы:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-300">
                <li>Нажмите синюю кнопку <strong>«Указать папку на диске»</strong> в панели слева.</li>
                <li>Выберите любую папку вашего проекта на компьютере (например, ваш React, Python, Node.js или клиентский репозиторий).</li>
                <li>Все подпапки и файлы мгновенно выстроятся в древовидную структуру слева.</li>
                <li>Попросите ИИ-агента: <em>«Сделай функцию в моём клиенте»</em> — агент создаст файл (например, в папке <code>client/</code>) и запишет код!</li>
                <li>Вы в любой момент можете скачать созданные файлы по отдельности или весь проект архивом по кнопке <strong>«Скачать ZIP»</strong>.</li>
              </ol>
              <div className="pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onPickDirectory();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Указать папку проекта
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Ctrl + V image paste */}
          <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-900/60 flex gap-4 items-start">
            <div className="p-2.5 rounded-lg bg-pink-600/30 text-pink-400 shrink-0 mt-0.5">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-semibold text-white text-base">3. Загрузка фото по Ctrl + V (Буфер обмена)</h3>
              <p className="text-xs text-slate-300">
                Вам не нужно сохранять скриншоты в файлы:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                <li>Сделайте снимок экрана (на Windows: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[11px]">Win + Shift + S</kbd> или <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[11px]">PrintScreen</kbd>, на Mac: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[11px]">Cmd + Shift + 4</kbd>).</li>
                <li>Кликните в поле ввода сообщения и нажмите <kbd className="px-1.5 py-0.5 bg-indigo-900/60 text-indigo-300 rounded border border-indigo-700/80 font-mono text-[11px]">Ctrl + V</kbd> (или <kbd className="px-1.5 py-0.5 bg-indigo-900/60 text-indigo-300 rounded border border-indigo-700/80 font-mono text-[11px]">Cmd + V</kbd>).</li>
                <li>Скриншот моментально прикрепится к промпту с предпросмотром.</li>
                <li>Напишите: <em>«Почини ошибку на скриншоте»</em> или <em>«Сверстай этот интерфейс в компонент»</em> — Gemini 3.8 Flash распознает все детали!</li>
              </ul>
            </div>
          </div>

          {/* Step 4: Unified AI Agent */}
          <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-900/60 flex gap-4 items-start">
            <div className="p-2.5 rounded-lg bg-emerald-600/30 text-emerald-400 shrink-0 mt-0.5">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-semibold text-white text-base">4. Единый автономный ИИ-агент</h3>
              <p className="text-xs text-slate-300">
                Вам не нужно переключаться между режимами — агент универсален:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                <li>Отвечает на любые вопросы, объясняет архитектуру, логику и ошибки.</li>
                <li>Автоматически создаёт и модифицирует файлы прямо на диске, если вы просите написать или изменить код.</li>
                <li>Выполняет команды в терминале и анализирует прикреплённые скриншоты.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#161c28] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md"
          >
            Понятно, начать работу
          </button>
        </div>
      </div>
    </div>
  );
};
