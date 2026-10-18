import { WorkspaceFile } from '../types';

export const isNativeFSSupported = (): boolean => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

// Ignore typical build, cache and giant dependency directories
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
  '.turbo',
  '.idea',
  '.vscode',
  'coverage',
  '.parcel-cache',
]);

const IGNORED_FILES = new Set([
  '.DS_Store',
  'thumbs.db',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
]);

// Binary file extensions to skip from text reading
const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'tiff', 'svgz',
  'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a',
  'mp4', 'mov', 'avi', 'mkv', 'webm',
  'zip', 'tar', 'gz', 'bz2', '7z', 'rar', 'iso',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'exe', 'dll', 'so', 'dylib', 'bin', 'dat', 'db', 'sqlite', 'sqlite3',
  'pyc', 'pyo', 'class', 'o', 'obj', 'wasm', 'woff', 'woff2', 'ttf', 'eot'
]);

/**
 * Universal folder parser from standard HTML5 <input type="file" webkitdirectory />
 * 100% reliable inside any iframe, browser, and OS without security restrictions.
 */
export async function parseFolderUpload(fileList: FileList): Promise<{
  name: string;
  files: Map<string, WorkspaceFile>;
}> {
  const filesMap = new Map<string, WorkspaceFile>();
  let detectedRootName = 'project';

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    // file.webkitRelativePath is formatted like "my-app/src/index.ts"
    const relativePath = file.webkitRelativePath || file.name;
    const parts = relativePath.split('/').filter(Boolean);

    if (parts.length > 1) {
      detectedRootName = parts[0];
    }

    // Path inside project (remove root directory prefix if there is one)
    const internalPath = parts.length > 1 ? parts.slice(1).join('/') : parts[0];

    // Check if any segment is ignored (e.g. node_modules, .git)
    const isIgnored = parts.some((p) => IGNORED_DIRS.has(p) || IGNORED_FILES.has(p));
    if (isIgnored) continue;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isBinary = BINARY_EXTENSIONS.has(ext);

    let content = '';
    if (!isBinary && file.size <= 2 * 1024 * 1024) {
      try {
        content = await file.text();
      } catch {
        content = `[Двоичный файл: ${file.name}, ${formatBytes(file.size)}]`;
      }
    } else {
      content = `[Файл: ${file.name}, ${formatBytes(file.size)}]`;
    }

    filesMap.set(internalPath, {
      path: internalPath,
      name: file.name,
      content,
      size: file.size,
      lastModified: file.lastModified,
    });
  }

  return {
    name: detectedRootName,
    files: filesMap,
  };
}

export async function pickDirectory(): Promise<{
  name: string;
  dirHandle?: FileSystemDirectoryHandle;
  files: Map<string, WorkspaceFile>;
}> {
  if (!isNativeFSSupported()) {
    throw new Error('NOT_SUPPORTED');
  }

  try {
    // @ts-ignore
    const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });

    const files = new Map<string, WorkspaceFile>();
    await scanDirectory(dirHandle, '', files, 0);

    return {
      name: dirHandle.name,
      dirHandle,
      files,
    };
  } catch (err: any) {
    // If blocked by iframe cross-origin policy or user denied
    console.warn('showDirectoryPicker failed, using fallback:', err);
    throw err;
  }
}

export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  currentPath: string,
  filesMap: Map<string, WorkspaceFile>,
  depth = 0
): Promise<void> {
  if (depth > 12) return; // Support deep nesting up to 12 levels

  // @ts-ignore
  for await (const entry of dirHandle.values()) {
    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

    if (entry.kind === 'directory') {
      if (IGNORED_DIRS.has(entry.name)) continue;
      await scanDirectory(entry as FileSystemDirectoryHandle, entryPath, filesMap, depth + 1);
    } else if (entry.kind === 'file') {
      if (IGNORED_FILES.has(entry.name)) continue;

      const parts = entry.name.split('.');
      const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';

      // Skip known binary extensions
      if (ext && BINARY_EXTENSIONS.has(ext)) continue;

      try {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();

        // Skip files > 2MB
        if (file.size > 2 * 1024 * 1024) continue;

        const content = await file.text();
        filesMap.set(entryPath, {
          path: entryPath,
          name: entry.name,
          content,
          handle: fileHandle,
          size: file.size,
          lastModified: file.lastModified,
        });
      } catch (err) {
        console.warn(`Could not read file ${entryPath}:`, err);
      }
    }
  }
}

export async function writeWorkspaceFile(
  workspaceFile: WorkspaceFile,
  newContent: string,
  dirHandle?: FileSystemDirectoryHandle
): Promise<boolean> {
  const normalizedPath = workspaceFile.path.replace(/\\/g, '/').replace(/^\/+/, '');

  // 1. If we have root dir handle, create/write with full directory hierarchy
  if (dirHandle) {
    try {
      const pathSegments = normalizedPath.split('/').filter(Boolean);
      let currentDir = dirHandle;

      // Traverse or create intermediate directories
      for (let i = 0; i < pathSegments.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(pathSegments[i], { create: true });
      }

      const fileName = pathSegments[pathSegments.length - 1];
      const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
      // @ts-ignore
      const writable = await fileHandle.createWritable();
      await writable.write(newContent);
      await writable.close();

      workspaceFile.handle = fileHandle;
      workspaceFile.path = normalizedPath;
      workspaceFile.content = newContent;
      workspaceFile.size = new Blob([newContent]).size;
      workspaceFile.lastModified = Date.now();
      return true;
    } catch (err) {
      console.error('Error creating/writing file via directory handle:', err);
    }
  }

  // 2. If native file handle exists directly
  if (workspaceFile.handle) {
    try {
      // @ts-ignore
      const writable = await workspaceFile.handle.createWritable();
      await writable.write(newContent);
      await writable.close();
      workspaceFile.content = newContent;
      workspaceFile.size = new Blob([newContent]).size;
      workspaceFile.lastModified = Date.now();
      return true;
    } catch (err) {
      console.error('Error writing native file handle:', err);
    }
  }

  // 3. In-memory update
  workspaceFile.path = normalizedPath;
  workspaceFile.content = newContent;
  workspaceFile.size = new Blob([newContent]).size;
  workspaceFile.lastModified = Date.now();
  return true;
}

// Tree view data structure
export interface TreeNode {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: WorkspaceFile;
  size?: number;
}

export function buildFileTree(files: Map<string, WorkspaceFile>): TreeNode[] {
  const root: TreeNode = {
    id: 'root',
    name: 'root',
    path: '',
    isDir: true,
    children: [],
  };

  const sortedFiles = Array.from(files.values()).sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const normalized = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = normalized.split('/').filter(Boolean);

    let current = root;
    let accumulatedPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      let child = current.children.find((c) => c.name === part);

      if (!child) {
        child = {
          id: accumulatedPath,
          name: part,
          path: accumulatedPath,
          isDir: !isFile,
          children: [],
          file: isFile ? file : undefined,
          size: isFile ? file.size : undefined,
        };
        current.children.push(child);
      }

      current = child;
    }
  }

  // Sort: directories first, then files alphabetically
  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
    for (const node of nodes) {
      if (node.isDir && node.children.length > 0) {
        sortNodes(node.children);
      }
    }
  }

  sortNodes(root.children);
  return root.children;
}

export function detectLanguage(filepath: string): string {
  const ext = filepath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'ts':
    case 'mts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
    case 'less':
      return 'scss';
    case 'json':
      return 'json';
    case 'py':
      return 'python';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'bash';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'toml':
      return 'toml';
    case 'vue':
      return 'vue';
    case 'svelte':
      return 'svelte';
    case 'php':
      return 'php';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'java':
    case 'kt':
      return 'java';
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'cs':
      return 'csharp';
    default:
      return 'plaintext';
  }
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
