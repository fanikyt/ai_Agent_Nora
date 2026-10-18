import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FileText,
  Wrench,
  Search,
  ExternalLink,
  Check,
  Terminal,
  Eye,
  Plus,
  Edit3
} from 'lucide-react';
import { AgentAction } from '../types';

interface AgentStepBadgeProps {
  action: AgentAction;
  onOpenFile?: (filepath: string) => void;
  onApplyAction?: (action: AgentAction) => void;
}

export const AgentStepBadge: React.FC<AgentStepBadgeProps> = ({
  action,
  onOpenFile,
  onApplyAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [applied, setApplied] = useState(action.status === 'applied');

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setApplied(true);
    if (onApplyAction) {
      onApplyAction(action);
    }
  };

  const handleOpen = (e: React.MouseEvent, path?: string) => {
    e.stopPropagation();
    const target = path || action.filepath;
    if (target && onOpenFile) {
      onOpenFile(target);
    }
  };

  // Determine line counts
  let linesAdded = action.linesAdded;
  let linesRemoved = action.linesRemoved;

  if (action.content && linesAdded === undefined) {
    const totalLines = action.content.split('\n').length;
    if (action.type === 'create_file') {
      linesAdded = totalLines;
      linesRemoved = 0;
    } else {
      linesAdded = Math.max(1, Math.round(totalLines * 0.4));
      linesRemoved = Math.max(0, Math.round(totalLines * 0.1));
    }
  }

  // 1. READ FILES STEP (e.g. "Read 2 files >")
  if (action.type === 'read_file') {
    const files = action.files && action.files.length > 0
      ? action.files
      : action.filepath
      ? [action.filepath]
      : [];
    const count = files.length || 1;

    return (
      <div className="my-2 select-none">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Read {count} {count === 1 ? 'file' : 'files'}</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-1.5 ml-2 pl-3 border-l border-slate-800 space-y-1 py-1 animate-in fade-in-50 duration-150">
            {files.map((f, i) => (
              <div
                key={i}
                onClick={(e) => handleOpen(e, f)}
                className="flex items-center justify-between gap-3 px-2.5 py-1 rounded bg-slate-900/40 hover:bg-slate-800/70 border border-slate-800/50 text-[11px] font-mono text-slate-300 hover:text-sky-300 transition cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FileText className="w-3 h-3 text-slate-500 group-hover:text-sky-400" />
                  <span className="truncate">{f}</span>
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-300 shrink-0">
                  Открыть &rarr;
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. TOOL USE STEP (e.g. "Used 4 tools >")
  if (action.type === 'tool_use' || action.type === 'search_workspace') {
    const desc = action.description || 'Поиск и анализ структуры проекта';
    return (
      <div className="my-2 select-none">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Used tools</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-1.5 ml-2 pl-3 border-l border-slate-800 py-1.5 animate-in fade-in-50 duration-150">
            <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/70 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex items-center gap-2 text-slate-300">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span>{desc}</span>
              </div>
              {action.command && (
                <div className="text-[11px] text-indigo-300 bg-black/40 px-2 py-1 rounded">
                  $ {action.command}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. FILE CREATION OR EDIT STEP (e.g. "Created RageClickGuiScreen.java +550 -0 >" or "Edited BlazeeClient.java +2 -2 >")
  const isCreated = action.type === 'create_file' || (linesAdded !== undefined && linesRemoved === 0);
  const isReadAndEdited = action.type === 'read_and_edit';
  const verb = isReadAndEdited
    ? 'Read and edited'
    : isCreated
    ? 'Created'
    : 'Edited';

  const fileName = action.filepath ? action.filepath.split('/').pop() || action.filepath : 'файл';

  return (
    <div className="my-2.5 rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm hover:border-slate-700 transition">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs font-mono cursor-pointer hover:bg-slate-800/50 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCreated ? (
            <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : isReadAndEdited ? (
            <Edit3 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          ) : (
            <Edit3 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}

          <span className="text-slate-400">{verb}</span>

          <span className="font-semibold text-white truncate max-w-[220px] sm:max-w-xs" title={action.filepath}>
            {action.filepath || fileName}
          </span>

          <div className="flex items-center gap-1.5 shrink-0 font-medium">
            {linesAdded !== undefined && linesAdded > 0 && (
              <span className="text-emerald-400 font-semibold">+{linesAdded}</span>
            )}
            {linesRemoved !== undefined && (
              <span className={linesRemoved > 0 ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
                -{linesRemoved}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {action.filepath && onOpenFile && (
            <button
              type="button"
              onClick={(e) => handleOpen(e)}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition"
              title="Открыть в редакторе"
            >
              <ExternalLink className="w-3 h-3 text-sky-400" />
              <span>Редактор</span>
            </button>
          )}

          {action.content && onApplyAction && (
            <button
              type="button"
              onClick={handleApply}
              disabled={applied}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                applied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  <span>Сохранено</span>
                </>
              ) : (
                <span>Применить</span>
              )}
            </button>
          )}

          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-800 bg-[#0c1017] p-3 text-xs animate-in fade-in-50 duration-150">
          {action.description && (
            <div className="text-slate-400 mb-2 italic">
              // {action.description}
            </div>
          )}

          {action.filepath && (
            <div className="text-[11px] text-slate-400 mb-2 font-mono flex items-center justify-between">
              <span>Путь: <span className="text-indigo-300">{action.filepath}</span></span>
              {onOpenFile && (
                <button
                  type="button"
                  onClick={(e) => handleOpen(e)}
                  className="text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Перейти к файлу
                </button>
              )}
            </div>
          )}

          {action.content ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-800/80 bg-[#090d14]">
              <pre className="p-3 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-60 leading-relaxed">
                <code>{action.content}</code>
              </pre>
            </div>
          ) : (
            <div className="text-slate-500 italic text-[11px]">Содержимое файла применено к проекту.</div>
          )}
        </div>
      )}
    </div>
  );
};
