import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  Search,
  Plus,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  FolderPlus,
  X,
  FileCheck,
  Download,
  Upload
} from 'lucide-react';
import { WorkspaceFile } from '../types';
import { formatBytes, buildFileTree, TreeNode, parseFolderUpload } from '../utils/fileSystem';
import { SAMPLE_PROJECTS } from '../utils/sampleWorkspaces';
import { exportWorkspaceToZip } from '../utils/zipExport';

interface WorkspaceExplorerProps {
  folderName: string;
  isNative: boolean;
  files: Map<string, WorkspaceFile>;
  activeFile: WorkspaceFile | null;
  onSelectFile: (file: WorkspaceFile) => void;
  onPickDirectory: () => void;
  onFolderUploaded: (result: { name: string; files: Map<string, WorkspaceFile> }) => void;
  onLoadSample: (sampleId: string) => void;
  onCreateFile: (path: string, content?: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const WorkspaceExplorer: React.FC<WorkspaceExplorerProps> = ({
  folderName,
  isNative,
  files,
  activeFile,
  onSelectFile,
  onPickDirectory,
  onFolderUploaded,
  onLoadSample,
  onCreateFile,
  onRefresh,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [targetFolderForNewFile, setTargetFolderForNewFile] = useState<string>('');
  const [newFileName, setNewFileName] = useState('');
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  // Set of expanded folder paths
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Default expand root-level folders
    for (const path of files.keys()) {
      const parts = path.split('/');
      if (parts.length > 1) {
        initial.add(parts[0]);
      }
    }
    return initial;
  });

  // Automatically expand parent folders of the active file
  useEffect(() => {
    if (activeFile) {
      const parts = activeFile.path.split('/');
      if (parts.length > 1) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          let current = '';
          for (let i = 0; i < parts.length - 1; i++) {
            current = current ? `${current}/${parts[i]}` : parts[i];
            next.add(current);
          }
          return next;
        });
      }
    }
  }, [activeFile]);

  // Build tree from files
  const fileTree = React.useMemo(() => buildFileTree(files), [files]);

  const toggleFolder = (folderPath: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const handleStartCreateFileInFolder = (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetFolderForNewFile(folderPath);
    setNewFileName('');
    setShowNewFileInput(true);
    setExpandedFolders((prev) => new Set(prev).add(folderPath));
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const finalPath = targetFolderForNewFile
      ? `${targetFolderForNewFile}/${newFileName.trim()}`.replace(/^\/+/, '')
      : newFileName.trim().replace(/^\/+/, '');

    onCreateFile(finalPath);
    setNewFileName('');
    setShowNewFileInput(false);
    setTargetFolderForNewFile('');
  };

  // Trigger HTML5 directory input
  const handleOpenFolderPicker = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  // Handle selected folder via webkitdirectory
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      const result = await parseFolderUpload(fileList);
      onFolderUploaded(result);
    } catch (err) {
      console.error('Error parsing folder:', err);
    } finally {
      e.target.value = '';
    }
  };

  // Handle loose files upload
  const handleFilesInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      const result = await parseFolderUpload(fileList);
      onFolderUploaded(result);
    } catch (err) {
      console.error('Error parsing files:', err);
    } finally {
      e.target.value = '';
    }
  };

  // Download entire workspace as a zip archive
  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      await exportWorkspaceToZip(folderName, files);
    } catch (err) {
      console.error('Failed to export ZIP:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'js':
      case 'jsx':
      case 'mjs':
        return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'json':
        return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'css':
      case 'scss':
        return <FileCode className="w-4 h-4 text-pink-400 shrink-0" />;
      case 'py':
        return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
      case 'html':
        return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  // Filter nodes for search
  const filterNode = (node: TreeNode, query: string): boolean => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    if (node.name.toLowerCase().includes(lowerQuery) || node.path.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (node.isDir && node.children.some((c) => filterNode(c, query))) {
      return true;
    }
    return false;
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: TreeNode, depth = 0): React.ReactNode => {
    if (searchTerm && !filterNode(node, searchTerm)) return null;

    const isExpanded = expandedFolders.has(node.path) || Boolean(searchTerm);
    const isFileActive = !node.isDir && activeFile?.path === node.path;
    const indentPadding = `${depth * 14 + 10}px`;

    if (node.isDir) {
      return (
        <div key={node.path} className="flex flex-col select-none">
          <div
            onClick={(e) => toggleFolder(node.path, e)}
            style={{ paddingLeft: indentPadding }}
            className="flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 group-hover:text-slate-200">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400/90 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400/80 shrink-0" />
              )}
              <span className="truncate font-mono text-[12px]">{node.name}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={(e) => handleStartCreateFileInFolder(node.path, e)}
                title={`Создать файл внутри ${node.path}/`}
                className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Children nodes if expanded */}
          {isExpanded && (
            <div className="flex flex-col">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File Node
    return (
      <div
        key={node.path}
        onClick={() => node.file && onSelectFile(node.file)}
        style={{ paddingLeft: indentPadding }}
        title={`${node.path} (${formatBytes(node.size)})`}
        className={`flex items-center justify-between py-1.5 pr-2.5 rounded-lg text-xs transition cursor-pointer group ${
          isFileActive
            ? 'bg-indigo-600/25 text-white border border-indigo-500/40 font-medium'
            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3.5 shrink-0" />
          {getFileIcon(node.name)}
          <span className="truncate font-mono text-[12px]">{node.name}</span>
        </div>
        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-mono ml-2 shrink-0">
          {formatBytes(node.size)}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#121620] border-r border-slate-800/80 text-slate-200 w-full select-none">
      {/* Hidden standard HTML5 folder & file inputs */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        // @ts-ignore
        webkitdirectory=""
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

      {/* Workspace Header */}
      <div className="p-3 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`p-1.5 rounded-lg border ${
                isNative
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}
            >
              {isNative ? <HardDrive className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
            </span>
            <div className="min-w-0">
              <div
                className="flex items-center gap-1.5 font-semibold text-sm truncate text-white"
                title={folderName}
              >
                <span className="truncate">{folderName}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>{files.size} файлов</span>
                <span>•</span>
                <span className={isNative ? 'text-emerald-400 font-medium' : 'text-indigo-300'}>
                  {isNative ? 'Локальная папка' : 'Шаблон'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Обновить файлы папки"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                setTargetFolderForNewFile('');
                setShowNewFileInput(!showNewFileInput);
              }}
              title="Создать новый файл в корне"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* New File / Folder Form */}
      {showNewFileInput && (
        <form onSubmit={handleCreateFileSubmit} className="p-2.5 border-b border-slate-800 bg-[#0f131c]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
            <span>
              {targetFolderForNewFile ? (
                <>
                  Новый файл в <code className="text-indigo-300 font-mono">{targetFolderForNewFile}/</code>:
                </>
              ) : (
                'Новый файл (напр. client/functions/test.ts):'
              )}
            </span>
            <button
              type="button"
              onClick={() => setShowNewFileInput(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="имя_файла.ts"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Создать
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="p-2 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по папкам и файлам..."
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Recursive Directory & File Tree View */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 dark-scrollbar">
        {files.size === 0 ? (
          <div className="p-5 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <FolderOpen className="w-8 h-8 text-slate-600 opacity-60" />
            <span>Папка пуста. Нажмите «Указать папку на диске» выше.</span>
          </div>
        ) : (
          fileTree.map((node) => renderTreeNode(node, 0))
        )}
      </div>

      {/* Quick Agent Actions Footer */}
      <div className="p-2.5 border-t border-slate-800 bg-[#0d1017]">
        <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Доступ агента</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            Чтение + Запись
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Агент видит все подпапки. Скажите: <em>«Создай функцию в папке client/»</em>, и он создаст файл в нужной директории!
        </p>
      </div>
    </div>
  );
};
