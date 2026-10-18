import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Upload,
  Download,
  Layers,
  ChevronDown,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { SAMPLE_PROJECTS } from '../utils/sampleWorkspaces';
import { parseFolderUpload, isNativeFSSupported } from '../utils/fileSystem';
import { WorkspaceFile } from '../types';

interface ProjectPickerPopoverProps {
  folderName: string;
  hasProject: boolean;
  isNative: boolean;
  filesCount: number;
  onPickDirectory: () => void;
  onFolderUploaded: (result: { name: string; files: Map<string, WorkspaceFile> }) => void;
  onLoadSample: (sampleId: string) => void;
  onClearProject?: () => void;
  onDownloadZip: () => void;
  isExportingZip?: boolean;
  iconOnly?: boolean;
}

export const ProjectPickerPopover: React.FC<ProjectPickerPopoverProps> = ({
  folderName,
  hasProject,
  isNative,
  filesCount,
  onPickDirectory,
  onFolderUploaded,
  onLoadSample,
  onClearProject,
  onDownloadZip,
  isExportingZip = false,
  iconOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenFolderPicker = async () => {
    setIsOpen(false);
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (!isInIframe && isNativeFSSupported()) {
      try {
        await onPickDirectory();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('Native picker blocked, using folder input:', err);
      }
    }
    // Reliable directory dialog in all browsers and iframes
    folderInputRef.current?.click();
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    try {
      const res = await parseFolderUpload(fileList);
      onFolderUploaded(res);
      setIsOpen(false);
    } catch (err) {
      console.error('Folder input error:', err);
    }
    e.target.value = '';
  };

  const handleFilesInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    try {
      const res = await parseFolderUpload(fileList);
      onFolderUploaded(res);
      setIsOpen(false);
    } catch (err) {
      console.error('Files input error:', err);
    }
    e.target.value = '';
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Hidden inputs for folder and file selection */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        // @ts-ignore
        webkitdirectory=""
        // @ts-ignore
        directory=""
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={filesInputRef}
        onChange={handleFilesInputChange}
        multiple
        className="hidden"
      />

      {/* Trigger button: icon-only if iconOnly, else badge */}
      {iconOnly ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer relative group flex items-center justify-center active:scale-95"
          title={hasProject ? `Рабочая папка: ${folderName}` : 'Указать папку проекта (диск)'}
        >
          <FolderPlus className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition" />
          {hasProject && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#18191c]" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-800/60 select-none group"
          title="Выбор рабочей папки проекта"
        >
          <Folder className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
          <span className="truncate max-w-[280px] font-mono text-[12px] text-slate-200">
            {hasProject ? folderName : 'No Project'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-400' : ''
            }`}
          />
        </button>
      )}

      {/* Dropdown Menu exactly matching Photo 2 */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-80 bg-[#121622] border border-slate-700/90 rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          {/* Top Big Button: "Указать папку на диске" */}
          <button
            onClick={handleOpenFolderPicker}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-lg shadow-indigo-900/40 active:scale-[0.99]"
          >
            <FolderOpen className="w-5 h-5 text-indigo-200 shrink-0" />
            <span>{hasProject && isNative ? 'Сменить папку на диске' : 'Указать папку на диске'}</span>
          </button>

          {/* Row of two buttons: "Файлы" and "Скачать ZIP" */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                filesInputRef.current?.click();
                setIsOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-200 transition cursor-pointer active:scale-[0.99]"
              title="Загрузить отдельные файлы в проект"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Файлы</span>
            </button>

            <button
              onClick={() => {
                onDownloadZip();
                setIsOpen(false);
              }}
              disabled={isExportingZip || filesCount === 0}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-medium transition cursor-pointer active:scale-[0.99] ${
                isExportingZip || filesCount === 0
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-slate-200'
              }`}
              title="Скачать весь проект в zip архиве"
            >
              <Download className={`w-3.5 h-3.5 text-emerald-400 shrink-0 ${isExportingZip ? 'animate-bounce' : ''}`} />
              <span>{isExportingZip ? 'Сжатие...' : 'Скачать ZIP'}</span>
            </button>
          </div>

          {/* Accordion: "Примеры проектов для теста" */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer hover:bg-slate-800/60"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Примеры проектов для теста</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  showPresets ? 'rotate-180 text-indigo-400' : ''
                }`}
              />
            </button>

            {showPresets && (
              <div className="p-1.5 border-t border-slate-700/50 space-y-1 bg-slate-900/60 max-h-48 overflow-y-auto scrollbar-thin">
                {SAMPLE_PROJECTS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      onLoadSample(sample.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent text-xs transition cursor-pointer flex flex-col gap-0.5"
                  >
                    <span className="font-medium text-slate-200">{sample.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{sample.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* If there's an active project, allow disconnecting / resetting to No Project */}
          {hasProject && onClearProject && (
            <button
              onClick={() => {
                onClearProject();
                setIsOpen(false);
              }}
              className="w-full mt-0.5 py-1.5 px-3 text-[11px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Отключить проект (No Project)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
