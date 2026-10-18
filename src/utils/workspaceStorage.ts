import { WorkspaceState, WorkspaceFile } from '../types';

const DB_NAME = 'gemini_code_agent_workspaces_v2';
const STORE_NAME = 'workspaces';
const DB_VERSION = 1;

interface SerializedWorkspace {
  id: string; // 'chat_${chatId}' or 'global_active'
  name: string;
  isNative: boolean;
  activeFilePath: string | null;
  files: Array<{
    path: string;
    name: string;
    content: string;
    size?: number;
    lastModified?: number;
  }>;
  dirHandle?: FileSystemDirectoryHandle;
  updatedAt: number;
}

/**
 * Open or create IndexedDB instance
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Serialize WorkspaceState Map to plain array
 */
function serializeWorkspace(id: string, workspace: WorkspaceState): SerializedWorkspace {
  const fileArray = Array.from(workspace.files.values()).map((f) => ({
    path: f.path,
    name: f.name,
    content: f.content,
    size: f.size || f.content.length,
    lastModified: f.lastModified || Date.now(),
  }));

  return {
    id,
    name: workspace.name,
    isNative: workspace.isNative,
    activeFilePath: workspace.activeFilePath,
    files: fileArray,
    dirHandle: workspace.dirHandle,
    updatedAt: Date.now(),
  };
}

/**
 * Deserialize to WorkspaceState
 */
function deserializeWorkspace(record: SerializedWorkspace): WorkspaceState {
  const fileMap = new Map<string, WorkspaceFile>();
  for (const f of record.files) {
    fileMap.set(f.path, {
      path: f.path,
      name: f.name,
      content: f.content,
      size: f.size,
      lastModified: f.lastModified,
    });
  }

  return {
    name: record.name,
    isNative: record.isNative,
    dirHandle: record.dirHandle,
    files: fileMap,
    activeFilePath: record.activeFilePath,
  };
}

/**
 * Save workspace for a specific chat
 */
export async function saveWorkspaceForChat(chatId: string, workspace: WorkspaceState): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Save under chat id
    const chatRecord = serializeWorkspace(`chat_${chatId}`, workspace);
    store.put(chatRecord);

    // Also update global active snapshot so restarts restore immediately
    const globalRecord = serializeWorkspace('global_active', workspace);
    store.put(globalRecord);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save workspace to IndexedDB:', err);
  }
}

/**
 * Load workspace for a specific chat
 */
export async function loadWorkspaceForChat(chatId: string): Promise<WorkspaceState | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(`chat_${chatId}`);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(deserializeWorkspace(request.result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to load chat workspace from IndexedDB:', err);
    return null;
  }
}

/**
 * Load last active global workspace (used on project restart/refresh)
 */
export async function loadGlobalWorkspace(): Promise<WorkspaceState | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('global_active');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(deserializeWorkspace(request.result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to load global workspace from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete workspace for a deleted chat
 */
export async function deleteWorkspaceForChat(chatId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(`chat_${chatId}`);
  } catch (err) {
    console.warn('Failed to delete chat workspace:', err);
  }
}
