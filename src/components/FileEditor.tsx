import React, { useState, useEffect } from 'react';
import {
  Save,
  X,
  FileCode,
  Check,
  RotateCcw,
  Sparkles,
  Copy,
  ExternalLink,
  Code,
  Download
} from 'lucide-react';
import { WorkspaceFile } from '../types';
import { detectLanguage } from '../utils/fileSystem';
import { downloadSingleFile } from '../utils/zipExport';

interface FileEditorProps {
  file: WorkspaceFile | null;
  onSave: (file: WorkspaceFile, newContent: string) => Promise<boolean>;
  onClose: () => void;
  onAskAgentAboutFile: (file: WorkspaceFile) => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({
  file,
  onSave,
  onClose,
  onAskAgentAboutFile,
}) => {
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setIsDirty(false);
      setJustSaved(false);
    }
  }, [file]);

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-[#0d1017]">
        <FileCode className="w-12 h-12 mb-3 text-slate-600 opacity-60" />
        <h3 className="text-sm font-medium text-slate-400 mb-1">Файл не выбран</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Выберите файл в проводнике слева, чтобы просмотреть или отредактировать его содержимое.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave(file, content);
    setIsSaving(false);
    if (success) {
      setIsDirty(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    }
  };

  const handleReset = () => {
    setContent(file.content);
    setIsDirty(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = detectLanguage(file.path);
  const lineCount = content.split('\n').length;

  return (
    <div className="h-full flex flex-col bg-[#0b0e14] border-l border-slate-800/80">
      {/* Tab Header */}
      <div className="h-10 bg-[#121620] border-b border-slate-800 flex items-center justify-between px-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-mono text-xs font-medium text-slate-200 truncate">
            {file.path}
          </span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Несохраненные изменения" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAskAgentAboutFile(file)}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-xs transition cursor-pointer"
            title="Спросить Gemini 3.8 Flash об этом файле"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Спросить ИИ</span>
          </button>

          <button
            onClick={() => downloadSingleFile(file)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Скачать этот файл на компьютер"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Скопировать содержимое"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {isDirty && (
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
              title="Отменить изменения"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
              justSaved
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : isDirty
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {justSaved ? (
              <>
                <Check className="w-3 h-3" /> Сохранено
              </>
            ) : (
              <>
                <Save className="w-3 h-3" /> {isSaving ? 'Сохранение...' : 'Сохранить'}
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer ml-1"
            title="Закрыть вкладку"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div className="w-12 bg-[#090c12] border-r border-slate-800/80 text-slate-600 font-mono text-xs select-none py-3 text-right pr-2 overflow-hidden">
          {Array.from({ length: Math.min(lineCount, 500) }).map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area Code Editor */}
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setIsDirty(true);
          }}
          onKeyDown={(e) => {
            // Support Ctrl+S / Cmd+S inside editor
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
              e.preventDefault();
              handleSave();
            }
          }}
          spellCheck={false}
          className="flex-1 bg-transparent p-3 font-mono text-xs text-slate-200 leading-6 resize-none focus:outline-none overflow-y-auto selection:bg-indigo-600/40"
        />
      </div>

      {/* Editor Status Bar */}
      <div className="h-6 bg-[#090c12] border-t border-slate-800 px-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span>Язык: <strong className="text-slate-300 font-normal">{language}</strong></span>
          <span>Строк: <strong className="text-slate-300 font-normal">{lineCount}</strong></span>
          <span>Размер: <strong className="text-slate-300 font-normal">{new Blob([content]).size} B</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Нажмите Ctrl+S для сохранения</span>
        </div>
      </div>
    </div>
  );
};
