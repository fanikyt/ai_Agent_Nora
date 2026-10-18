import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Play, Trash2, Maximize2, Minimize2, CheckCircle2, ChevronRight } from 'lucide-react';

export interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  type: 'info' | 'success' | 'error' | 'agent';
  timestamp: string;
}

interface TerminalProps {
  entries: TerminalEntry[];
  onExecuteCommand: (command: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  entries,
  onExecuteCommand,
  onClear,
  isOpen,
  onToggle,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onExecuteCommand(commandInput.trim());
    setCommandInput('');
  };

  return (
    <div
      className={`border-t border-slate-800 bg-[#090c12] flex flex-col transition-all duration-200 z-20 ${
        isExpanded ? 'h-96' : 'h-52'
      }`}
    >
      {/* Terminal Bar */}
      <div className="h-8 bg-[#121620] border-b border-slate-800 px-3 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">Терминал проекта (Claude Code Sandbox)</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">bash / zsh</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={onClear}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Очистить консоль"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
            title={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Закрыть терминал"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-2 text-slate-300 leading-relaxed scrollbar-thin"
      >
        <div className="text-slate-500 text-[11px] mb-2 border-b border-slate-800/80 pb-1">
          ИИ-агент Gemini 3.8 Flash может запускать команды для сборки, тестирования и анализа рабочей папки.
        </div>

        {entries.map((entry) => (
          <div key={entry.id} className="space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">$</span>
              <span className="text-slate-200 font-medium">{entry.command}</span>
              <span className="text-[10px] text-slate-600 ml-auto">{entry.timestamp}</span>
            </div>
            {entry.output && (
              <pre
                className={`p-2 rounded bg-black/40 text-[11px] whitespace-pre-wrap ${
                  entry.type === 'error'
                    ? 'text-rose-400'
                    : entry.type === 'agent'
                    ? 'text-sky-300'
                    : 'text-slate-300'
                }`}
              >
                {entry.output}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Command Input Form */}
      <form onSubmit={handleSubmit} className="h-9 border-t border-slate-800/80 px-3 flex items-center gap-2 bg-[#0d1017]">
        <span className="text-emerald-400 font-mono text-xs font-semibold">$</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Введите команду (напр. npm run build, git status, npm test)..."
          className="flex-1 bg-transparent font-mono text-xs text-white placeholder:text-slate-600 focus:outline-none"
        />
        <button
          type="submit"
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono transition cursor-pointer"
        >
          Запустить
        </button>
      </form>
    </div>
  );
};
