export type AgentMode = 'agent' | 'chat';

export interface WorkspaceFile {
  path: string;
  name: string;
  content: string;
  handle?: FileSystemFileHandle;
  size?: number;
  lastModified?: number;
}

export interface WorkspaceState {
  name: string;
  isNative: boolean;
  dirHandle?: FileSystemDirectoryHandle;
  files: Map<string, WorkspaceFile>;
  activeFilePath: string | null;
}

export interface AttachedImage {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64
  size: number;
}

export interface AgentAction {
  type: 'write_file' | 'read_file' | 'run_command' | 'create_file' | 'edit_file' | 'read_and_edit' | 'tool_use' | 'search_workspace';
  filepath?: string;
  files?: string[];
  command?: string;
  tool?: string;
  content?: string;
  description?: string;
  linesAdded?: number;
  linesRemoved?: number;
  status?: 'pending' | 'applied' | 'rejected' | 'executed';
  output?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: AttachedImage[];
  timestamp: number;
  actions?: AgentAction[];
  modelUsed?: string;
  isThinking?: boolean;
  searchSources?: Array<{ title: string; url: string }>;
  searchQueries?: string[];
  usedWebSearch?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  isDefault?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  mode?: AgentMode;
  isPinned?: boolean;
  isCodex?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
}
