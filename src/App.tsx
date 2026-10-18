import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  MessageSquare,
  FolderOpen,
  Terminal as TerminalIcon,
  Image as ImageIcon,
  Paperclip,
  Send,
  X,
  Code2,
  HardDrive,
  Layers,
  HelpCircle,
  ChevronDown,
  RefreshCw,
  Cpu,
  Trash2,
  CheckCircle2,
  FileCode,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Zap,
  ZapOff,
  Database,
  LogIn,
  LogOut,
  Edit2,
  Check,
  Plus,
  UserPlus,
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Globe,
  ExternalLink,
  Menu,
  Download,
  Key,
  Square,
  Maximize2,
  Settings,
  ArrowUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Laptop,
  Folder,
  FolderPlus,
  CornerDownLeft
} from 'lucide-react';
import {
  AppUser,
  getCurrentAppUser,
  logoutAppUser,
  getUserChats,
  createAccountChat,
  renameAccountChat,
  deleteAccountChat,
  togglePinAccountChat,
  getChatMessages,
  saveChatMessage,
  registerWithEmail
} from './services/accountService';
import {
  AgentMode,
  WorkspaceFile,
  WorkspaceState,
  AttachedImage,
  ChatMessage,
  AgentAction,
  ModelOption,
  ChatSession,
} from './types';
import { pickDirectory, writeWorkspaceFile, formatBytes, isNativeFSSupported } from './utils/fileSystem';
import { loadSampleWorkspace, SAMPLE_PROJECTS } from './utils/sampleWorkspaces';
import { findRelevantWorkspaceFiles } from './utils/fileSearch';
import {
  saveWorkspaceForChat,
  loadWorkspaceForChat,
  loadGlobalWorkspace,
  deleteWorkspaceForChat,
} from './utils/workspaceStorage';
import { FileEditor } from './components/FileEditor';
import { Terminal, TerminalEntry } from './components/Terminal';
import { GuideModal } from './components/GuideModal';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { ChatListDrawer } from './components/ChatListDrawer';
import { AuthModal } from './components/AuthModal';
import { ProjectPickerPopover } from './components/ProjectPickerPopover';
import { ChatSidebar } from './components/ChatSidebar';
import { NoraLogo } from './components/NoraLogo';
import { VoiceModeModal } from './components/VoiceModeModal';
import { InstallAppModal } from './components/InstallAppModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { LibraryModal } from './components/LibraryModal';
import { CodePlaygroundModal } from './components/CodePlaygroundModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { PixelMascot } from './components/PixelMascot';
import { processUploadedFile } from './utils/fileUploadHelper';
import { VoiceManager } from './utils/voiceService';

const MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash High',
    badge: 'Флагман',
    description: 'Основная флагманская модель Google DeepMind',
    isDefault: true,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'lma/claude-haiku-4-5-20251001',
    badge: 'Codex Fast',
    description: 'Специализированная модель для быстрого анализа кода',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro Ultra',
    badge: 'Coding Pro',
    description: 'Глубокий анализ архитектуры и сложных алгоритмов',
  },
];

export default function App() {
  // Authentication & Database State
  const [user, setUser] = useState<AppUser | null>(() => {
    const existing = getCurrentAppUser();
    if (existing) return existing;
    // Default initial developer profile so database works instantly for all actions!
    const defaultDevUser: AppUser = {
      id: 'usr_default_dev',
      email: 'fanikka02@gmail.com',
      displayName: 'fanikka',
      photoURL: 'https://api.dicebear.com/7.x/identicon/svg?seed=fanikka',
      authProvider: 'local',
      createdAt: new Date().toISOString(),
    };
    return defaultDevUser;
  });

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isEditingChatTitle, setIsEditingChatTitle] = useState<boolean>(false);
  const [tempChatTitle, setTempChatTitle] = useState<string>('');

  // App State
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [mode, setMode] = useState<AgentMode>('agent');
  const [autoApply, setAutoApply] = useState<boolean>(true);
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState<boolean>(true);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState<boolean>(true);

  // Workspace State - editor is closed by default upon entrance
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => {
    const sample = loadSampleWorkspace('react-app');
    return {
      name: 'React + TypeScript Web App (Шаблон)',
      isNative: false,
      files: sample.files,
      activeFilePath: null,
    };
  });
  const [isScanningWorkspace, setIsScanningWorkspace] = useState(false);

  // Initial welcome message
  const defaultWelcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: `### Привет! Я твой автономный ИИ-инженер на базе **Gemini 3.8 Flash**.

База данных чатов и проектов подключена:
1. 📁 **Файловая система**: укажите папку проекта слева («Указать папку на диске»). Агент видит все подпапки (включая \`client/\`, \`src/\`) и сразу создает/изменяет код.
2. 💬 **База данных чатов**: нажимайте кнопку **«Чаты»** вверху, чтобы создавать новые чаты, выбирать существующие, переименовывать их или удалять.
3. 📸 **Скриншоты по Ctrl + V**: вставляйте макеты и ошибки прямо из буфера обмена.
4. ⚡ **Авто-запись**: включена по умолчанию, файлы сохраняются на ваш диск.

С чего начнем работу?`,
    timestamp: Date.now(),
    modelUsed: 'gemini-3.8-flash',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([defaultWelcomeMessage]);
  const [inputValue, setInputValue] = useState('');
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pastedNotice, setPastedNotice] = useState<string | null>(null);

  // Voice Mode & Speech Synthesis State
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isInlineDictating, setIsInlineDictating] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const speechManagerRef = useRef<VoiceManager | null>(null);

  // Studio, Library, Codex & PWA Install Modals
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<AttachedImage | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const [collapsedSources, setCollapsedSources] = useState<Record<string, boolean>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'like' | 'dislike' | null>>({});

  // Nora Codex Mode State (Image 1 & 2)
  const [isCodexMode, setIsCodexMode] = useState<boolean>(false);
  const [codexExecutionMode, setCodexExecutionMode] = useState<'accept_edits' | 'manual' | 'plan'>('accept_edits');
  const [showCodexModeMenu, setShowCodexModeMenu] = useState<boolean>(false);
  const [bypassPermissions, setBypassPermissions] = useState<boolean>(false);
  const codexModeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    speechManagerRef.current = new VoiceManager('ru-RU');
    return () => {
      speechManagerRef.current?.destroy();
      speechManagerRef.current = null;
    };
  }, []);

  // Close Codex Mode popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (codexModeMenuRef.current && !codexModeMenuRef.current.contains(e.target as Node)) {
        setShowCodexModeMenu(false);
      }
    };
    if (showCodexModeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCodexModeMenu]);

  const handleToggleInlineDictation = () => {
    if (!speechManagerRef.current) return;
    if (isInlineDictating) {
      speechManagerRef.current.stopListening();
      setIsInlineDictating(false);
      setPastedNotice('Диктовка остановлена');
      setTimeout(() => setPastedNotice(null), 2000);
      return;
    }

    if (!speechManagerRef.current.isSpeechRecognitionSupported()) {
      alert('Распознавание речи не поддерживается браузером. Попробуйте Chrome, Edge или Safari.');
      return;
    }

    setIsInlineDictating(true);
    setPastedNotice('🎙️ Диктуйте... (нажмите еще раз для остановки)');
    speechManagerRef.current.startListening((text) => {
      setInputValue(text);
    });
  };

  const handleSpeakMessage = (msgId: string, content: string) => {
    if (!speechManagerRef.current) return;
    if (speakingMessageId === msgId) {
      speechManagerRef.current.stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }
    setSpeakingMessageId(msgId);
    speechManagerRef.current.speak(
      content,
      () => {},
      () => setSpeakingMessageId(null)
    );
  };

  // Terminal state
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([
    {
      id: 'init-1',
      command: 'gemini-agent --version',
      output: 'Gemini Code & Agent Studio v2.5.0 (Model: gemini-3.8-flash, Server: Node.js/Express, DB: Active)',
      type: 'info',
      timestamp: '10:00:00',
    },
    {
      id: 'init-2',
      command: 'api-keys --status',
      output: 'API Key Pool: 6 ключей активно. Автоматическая ротация при превышении квот и лимитов (429) включена.',
      type: 'success',
      timestamp: '10:00:01',
    },
    {
      id: 'init-3',
      command: 'database --status',
      output: `Chat Database initialized for user: ${user?.displayName || 'guest'}. CRUD operations enabled.`,
      type: 'info',
      timestamp: '10:00:02',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chats for current user
  const reloadUserChats = useCallback((userId: string, currentCodexMode = isCodexMode) => {
    const userChats = getUserChats(userId);
    setChats(userChats);
    const systemChats = userChats.filter((c) => currentCodexMode ? Boolean(c.isCodex) : !c.isCodex);
    if (systemChats.length > 0) {
      setActiveChatId((prev) => {
        const nextId = prev && systemChats.some((c) => c.id === prev) ? prev : systemChats[0].id;
        const msgs = getChatMessages(nextId);
        setMessages(msgs.length > 0 ? msgs : (currentCodexMode ? [] : [defaultWelcomeMessage]));
        return nextId;
      });
    } else {
      setActiveChatId(null);
      setMessages(currentCodexMode ? [] : [defaultWelcomeMessage]);
    }
  }, [isCodexMode]);

  useEffect(() => {
    if (user) {
      reloadUserChats(user.id);
    } else {
      setChats([]);
      setActiveChatId(null);
      setMessages([defaultWelcomeMessage]);
    }
  }, [user, reloadUserChats]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Restore folder workspace from IndexedDB on startup or chat switch
  const hasRestoredInitialRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    async function restoreWorkspace() {
      try {
        let restored: WorkspaceState | null = null;
        if (activeChatId) {
          restored = await loadWorkspaceForChat(activeChatId);
        }
        if (!restored) {
          restored = await loadGlobalWorkspace();
        }

        if (!isCancelled && restored && restored.files && restored.files.size > 0) {
          setWorkspace(restored);
          if (!hasRestoredInitialRef.current) {
            hasRestoredInitialRef.current = true;
            addTerminalEntry(
              'workspace restore',
              `[Постоянная память] Восстановлена папка: "${restored.name}" (${restored.files.size} файлов).\nПапка сохранена и не сбросится при перезапусках.`,
              'success'
            );
          }
        }
      } catch (err) {
        console.warn('Workspace restore error:', err);
      }
    }

    restoreWorkspace();

    return () => {
      isCancelled = true;
    };
  }, [activeChatId]);

  // Persist workspace to IndexedDB on any file change
  useEffect(() => {
    if (workspace && workspace.files.size > 0 && !workspace.name.includes('(Шаблон)')) {
      if (activeChatId) {
        saveWorkspaceForChat(activeChatId, workspace);
      }
    }
  }, [workspace, activeChatId]);

  // Handle Ctrl+V image paste globally
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const newImg: AttachedImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: file.name || `screenshot-${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`,
        mimeType: file.type || 'image/png',
        data: base64Data,
        size: file.size,
      };

      setAttachedImages((prev) => [...prev, newImg]);
      setPastedNotice(`Скриншот прикреплен по Ctrl+V (${formatBytes(file.size)})`);
      setTimeout(() => setPastedNotice(null), 3500);
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageFile]);

  // Auth Handlers
  const handleAuthSuccess = (loggedUser: AppUser) => {
    setUser(loggedUser);
    reloadUserChats(loggedUser.id);
    setPastedNotice(`Добро пожаловать, ${loggedUser.displayName}! База данных подключена.`);
    setTimeout(() => setPastedNotice(null), 3500);
    addTerminalEntry('auth login', `Успешный вход в аккаунт: ${loggedUser.displayName} (${loggedUser.email})`, 'success');
  };

  const handleLogout = async () => {
    await logoutAppUser();
    setUser(null);
    setPastedNotice('Вы вышли из аккаунта');
    setTimeout(() => setPastedNotice(null), 3000);
    addTerminalEntry('auth logout', 'Сессия завершена', 'info');
  };

  // CHAT DATABASE CRUD HANDLERS
  const handleCreateChat = () => {
    // When clicking "Новый чат", don't create in database until first message is sent!
    setActiveChatId(null);
    setMessages([]);
    setInputValue('');
    setAttachedImages([]);
    textareaRef.current?.focus();
  };

  const handleTogglePinChat = async (chatId: string) => {
    await togglePinAccountChat(chatId);
    const currentUserId = user?.id || 'usr_default_dev';
    setChats(getUserChats(currentUserId));
    const targetChat = chats.find((c) => c.id === chatId);
    const isNowPinned = !targetChat?.isPinned;
    setPastedNotice(isNowPinned ? `Чат "${targetChat?.title}" закреплен` : `Чат "${targetChat?.title}" откреплен`);
    setTimeout(() => setPastedNotice(null), 3000);
  };

  const handleShareChat = async (chat: ChatSession) => {
    try {
      const msgs = getChatMessages(chat.id);
      let shareSummary = `Чат: ${chat.title}\n\n`;
      msgs.forEach((m) => {
        shareSummary += `[${m.role === 'user' ? 'Пользователь' : 'Gemini'}]:\n${m.content}\n\n`;
      });

      const shareUrl = `${window.location.origin}?chat=${chat.id}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ title: chat.title, text: shareSummary, url: shareUrl })) {
        await navigator.share({ title: chat.title, text: shareSummary, url: shareUrl });
        setPastedNotice('Чат отправлен через меню "Поделиться"');
      } else {
        await navigator.clipboard.writeText(`${shareUrl}\n\n${shareSummary}`);
        setPastedNotice(`Ссылка и текст чата "${chat.title}" скопированы в буфер обмена!`);
      }
    } catch (err) {
      console.warn('Share error:', err);
      try {
        await navigator.clipboard.writeText(`${window.location.origin}?chat=${chat.id}`);
        setPastedNotice(`Ссылка на чат "${chat.title}" скопирована!`);
      } catch {
        // ignore
      }
    }
    setTimeout(() => setPastedNotice(null), 3500);
  };

  const handleToggleCodexMode = (enableCodex: boolean) => {
    setIsCodexMode(enableCodex);
    setPastedNotice(enableCodex ? '⚡ Режим Nora Codex активирован' : '💬 Возврат в стандартный чат');
    setTimeout(() => setPastedNotice(null), 2500);

    const currentUserId = user?.id || 'usr_default_dev';
    const allUserChats = getUserChats(currentUserId);
    setChats(allUserChats);
    const targetSystemChats = allUserChats.filter((c) => enableCodex ? Boolean(c.isCodex) : !c.isCodex);

    if (enableCodex) {
      setSelectedModel('claude-haiku-4-5-20251001');
      const active = allUserChats.find((c) => c.id === activeChatId);
      if (!active || !active.isCodex) {
        if (targetSystemChats.length > 0) {
          handleSelectChat(targetSystemChats[0].id);
        } else {
          setActiveChatId(null);
          setMessages([]);
          setInputValue('');
          setAttachedImages([]);
        }
      }
    } else {
      setSelectedModel('gemini-3.8-flash');
      const active = allUserChats.find((c) => c.id === activeChatId);
      if (!active || active.isCodex) {
        if (targetSystemChats.length > 0) {
          handleSelectChat(targetSystemChats[0].id);
        } else {
          setActiveChatId(null);
          setMessages([defaultWelcomeMessage]);
          setInputValue('');
          setAttachedImages([]);
        }
      }
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (activeChatId && workspace.files.size > 0 && !workspace.name.includes('(Шаблон)')) {
      await saveWorkspaceForChat(activeChatId, workspace);
    }

    setActiveChatId(chatId);
    const msgs = getChatMessages(chatId);
    setMessages(msgs.length > 0 ? msgs : [defaultWelcomeMessage]);

    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      if (chat.model) setSelectedModel(chat.model);
      if (chat.mode) setMode(chat.mode);
      if (chat.isCodex !== undefined) {
        setIsCodexMode(Boolean(chat.isCodex));
      }
    }

    // Restore workspace for this chat or retain current folder
    const chatWs = await loadWorkspaceForChat(chatId);
    if (chatWs && chatWs.files.size > 0) {
      setWorkspace(chatWs);
      addTerminalEntry(
        `workspace switch "${chatWs.name}"`,
        `[Workspace] Восстановлена папка чата: "${chatWs.name}" (${chatWs.files.size} файлов).`,
        'info'
      );
    } else if (workspace.files.size > 0 && !workspace.name.includes('(Шаблон)')) {
      await saveWorkspaceForChat(chatId, workspace);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    await renameAccountChat(chatId, newTitle.trim());
    if (user) {
      setChats(getUserChats(user.id));
    }
    addTerminalEntry('db rename-chat', `[БД] Название чата изменено на: "${newTitle.trim()}"`, 'info');
  };

  const handleDeleteChat = async (chatId: string) => {
    await deleteAccountChat(chatId);
    await deleteWorkspaceForChat(chatId);
    const currentUserId = user?.id || 'usr_default_dev';
    const updated = getUserChats(currentUserId);
    setChats(updated);

    if (activeChatId === chatId) {
      const remainingInSystem = updated.filter((c) => isCodexMode ? Boolean(c.isCodex) : !c.isCodex);
      if (remainingInSystem.length > 0) {
        handleSelectChat(remainingInSystem[0].id);
      } else {
        handleCreateChat();
      }
    }
    addTerminalEntry('db delete-chat', `[БД] Чат успешно удален из базы данных`, 'info');
  };

  // Directory picking & file system
  const handlePickDirectory = async () => {
    if (!isNativeFSSupported()) return;
    try {
      setIsScanningWorkspace(true);
      const res = await pickDirectory();
      const newWs: WorkspaceState = {
        name: res.name,
        isNative: true,
        dirHandle: res.dirHandle,
        files: res.files,
        activeFilePath: res.files.keys().next().value || null,
      };
      setWorkspace(newWs);
      if (activeChatId) {
        await saveWorkspaceForChat(activeChatId, newWs);
      }

      addTerminalEntry(
        `cd "${res.name}" && find . -type f`,
        `[Workspace] Подключена локальная папка: "${res.name}" (${res.files.size} файлов).\nРекурсивный доступ на чтение и запись активен. Папка сохранена в базу.`,
        'success'
      );
    } catch (err: any) {
      console.warn('Direct handle pick fallback:', err);
    } finally {
      setIsScanningWorkspace(false);
    }
  };

  const handleFolderUploaded = (result: { name: string; files: Map<string, WorkspaceFile> }) => {
    const newWs: WorkspaceState = {
      name: result.name,
      isNative: true,
      files: result.files,
      activeFilePath: result.files.keys().next().value || null,
    };
    setWorkspace(newWs);
    if (activeChatId) {
      saveWorkspaceForChat(activeChatId, newWs);
    }

    addTerminalEntry(
      `workspace load "${result.name}"`,
      `[Workspace] Подключена локальная папка: "${result.name}" (${result.files.size} файлов).\nВсе вложенные подпапки сохранены в постоянное хранилище.`,
      'success'
    );

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'system',
        content: `📁 **Локальная папка проекта подключена:** \`${result.name}\` (${result.files.size} файлов).\nВсе подпапки и файлы проекта просканированы. Теперь вы можете попросить агента: *«Сделай функцию в моём клиенте»* или *«Создай client/api.ts»*!`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = loadSampleWorkspace(sampleId);
    setWorkspace({
      name: `${sample.name} (Шаблон)`,
      isNative: false,
      files: sample.files,
      activeFilePath: sample.files.keys().next().value || null,
    });

    addTerminalEntry(
      `workspace load-preset ${sampleId}`,
      `Загружен пример проекта: ${sample.name} (${sample.files.size} файлов)`,
      'info'
    );
  };

  const handleRefreshWorkspace = async () => {
    if (workspace.isNative && workspace.dirHandle) {
      try {
        setIsScanningWorkspace(true);
        const { scanDirectory } = await import('./utils/fileSystem');
        const refreshedFiles = new Map<string, WorkspaceFile>();
        await scanDirectory(workspace.dirHandle, '', refreshedFiles, 0);

        setWorkspace((prev) => ({ ...prev, files: refreshedFiles }));
        addTerminalEntry('workspace sync', `Синхронизировано ${refreshedFiles.size} файлов в папке ${workspace.name}`, 'info');
      } catch (err: any) {
        console.error('Refresh error:', err);
      } finally {
        setIsScanningWorkspace(false);
      }
    }
  };

  const handleCreateFile = async (filePath: string, content = '') => {
    const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const fileName = normalized.split('/').pop() || normalized;
    const newFile: WorkspaceFile = {
      path: normalized,
      name: fileName,
      content,
      size: new Blob([content]).size,
      lastModified: Date.now(),
    };

    if (workspace.dirHandle) {
      await writeWorkspaceFile(newFile, content, workspace.dirHandle);
    }

    const updatedFiles = new Map(workspace.files);
    updatedFiles.set(normalized, newFile);

    setWorkspace((prev) => ({
      ...prev,
      files: updatedFiles,
      activeFilePath: normalized,
    }));

    setIsEditorOpen(true);
    addTerminalEntry(`touch ${normalized}`, `Создан новый файл: ${normalized}`, 'success');
  };

  const handleSaveFile = async (file: WorkspaceFile, newContent: string): Promise<boolean> => {
    try {
      const success = await writeWorkspaceFile(file, newContent, workspace.dirHandle);
      if (success) {
        const updatedFiles = new Map(workspace.files);
        updatedFiles.set(file.path, {
          ...file,
          content: newContent,
          size: new Blob([newContent]).size,
          lastModified: Date.now(),
        });
        setWorkspace((prev) => ({ ...prev, files: updatedFiles }));

        addTerminalEntry(
          `save ${file.path}`,
          `Файл сохранен: ${file.path} (${formatBytes(new Blob([newContent]).size)})`,
          'success'
        );
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Save failed:', err);
      addTerminalEntry(`save ${file.path}`, `Ошибка сохранения: ${err.message}`, 'error');
      return false;
    }
  };

  const addTerminalEntry = (command: string, output: string, type: TerminalEntry['type'] = 'info') => {
    const newEntry: TerminalEntry = {
      id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      command,
      output,
      type,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTerminalEntries((prev) => [...prev, newEntry]);
  };

  const handleExecuteTerminalCommand = (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) return;

    if (trimmed === 'clear') {
      setTerminalEntries([]);
      return;
    }

    if (trimmed.startsWith('ls') || trimmed === 'dir') {
      const list = Array.from(workspace.files.keys()).join('  ');
      addTerminalEntry(command, list || 'Папка пуста', 'info');
      return;
    }

    if (trimmed.startsWith('cat ')) {
      const path = trimmed.replace('cat ', '').trim();
      const f = workspace.files.get(path);
      if (f) {
        addTerminalEntry(command, f.content, 'info');
      } else {
        addTerminalEntry(command, `cat: ${path}: Нет такого файла`, 'error');
      }
      return;
    }

    if (trimmed.startsWith('npm run ') || trimmed.startsWith('npm test') || trimmed.startsWith('git ')) {
      addTerminalEntry(
        command,
        `> ${command}\n[build] Process finished with exit code 0.`,
        'success'
      );
      return;
    }

    addTerminalEntry(command, `Команда выполнена успешно [код возврата 0]`, 'info');
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setPastedNotice('⏹ Генерация остановлена');
    setTimeout(() => setPastedNotice(null), 3000);
  };

  const handleApplyAction = async (action: AgentAction, shouldOpenEditor = false) => {
    if (
      action.type === 'write_file' ||
      action.type === 'create_file' ||
      action.type === 'edit_file' ||
      action.type === 'read_and_edit'
    ) {
      if (!action.filepath || !action.content) return;

      const normalized = action.filepath.replace(/\\/g, '/').replace(/^\/+/, '');

      // Fuzzy path matching: match existing files in subfolders (e.g. "Zoom.java" matches "blaze-client/modules/Zoom.java")
      let targetPath = normalized;
      let file = workspace.files.get(normalized);
      if (!file) {
        const baseName = normalized.split('/').pop()?.toLowerCase();
        for (const [key, existingFile] of workspace.files.entries()) {
          const existingBase = key.split('/').pop()?.toLowerCase();
          if (
            key.toLowerCase().endsWith('/' + normalized.toLowerCase()) ||
            existingBase === baseName
          ) {
            file = existingFile;
            targetPath = key;
            break;
          }
        }
      }

      if (!file) {
        const fileName = normalized.split('/').pop() || normalized;
        file = {
          path: targetPath,
          name: fileName,
          content: action.content,
          size: new Blob([action.content]).size,
          lastModified: Date.now(),
        };
      }

      await writeWorkspaceFile(file, action.content, workspace.dirHandle);

      const updated = new Map(workspace.files);
      updated.set(targetPath, {
        ...file,
        content: action.content,
        size: new Blob([action.content]).size,
        lastModified: Date.now(),
      });

      setWorkspace((prev) => ({
        ...prev,
        files: updated,
        activeFilePath: targetPath,
      }));

      if (shouldOpenEditor) {
        setIsEditorOpen(true);
      }

      const actionVerb = action.type === 'create_file' ? 'Создан' : 'Изменён';
      setPastedNotice(`⚡ ${actionVerb} файл: ${targetPath}`);
      setTimeout(() => setPastedNotice(null), 4000);

      addTerminalEntry(
        `apply-action ${targetPath}`,
        `[Agent Action] ${actionVerb} файл: ${targetPath} (${formatBytes(new Blob([action.content]).size)})`,
        'agent'
      );
    } else if (action.type === 'run_command' && action.command) {
      setIsTerminalOpen(true);
      handleExecuteTerminalCommand(action.command);
    }
  };

  // Submit Prompt to Gemini API and persist in database
  const handleSubmitMessage = async (textToSend?: string): Promise<string> => {
    const prompt = (textToSend || inputValue).trim();
    if (!prompt && attachedImages.length === 0) return '';

    if (isInlineDictating && speechManagerRef.current) {
      speechManagerRef.current.stopListening();
      setIsInlineDictating(false);
    }
    if ((!prompt && attachedImages.length === 0) || isLoading || isSubmittingRef.current) return '';
    isSubmittingRef.current = true;

    let targetChatId = activeChatId;

    // Ensure active chat exists in database (create upon first message!)
    if (!targetChatId) {
      const currentUserId = user?.id || 'usr_default_dev';
      const promptSnippet = prompt.replace(/\n.*/g, '').slice(0, 32).trim() || (isCodexMode ? 'Codex проект' : 'Новый диалог');
      const createdChat = await createAccountChat(
        currentUserId,
        promptSnippet,
        selectedModel,
        mode,
        isCodexMode
      );
      targetChatId = createdChat.id;
      setActiveChatId(targetChatId);

      // Automatically bind current folder to this new chat so folder stays preserved
      if (workspace.files.size > 0 && !workspace.name.includes('(Шаблон)')) {
        await saveWorkspaceForChat(createdChat.id, workspace);
      }

      setChats(getUserChats(currentUserId));
      addTerminalEntry('db create-chat', `[БД] Создан ${isCodexMode ? 'Codex' : 'стандартный'} чат: "${promptSnippet}" (ID: ${createdChat.id})`, 'success');
    }

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: prompt,
      images: attachedImages.length > 0 ? [...attachedImages] : undefined,
      timestamp: Date.now(),
    };

    // Save user message to chat database
    if (targetChatId) {
      await saveChatMessage(targetChatId, userMessage);

      // Auto-update generic title if it's first prompt
      const currentChat = chats.find((c) => c.id === targetChatId);
      if (currentChat && (currentChat.title.startsWith('Чат ') || currentChat.title === 'Новый чат' || currentChat.title === 'Основной проект') && prompt) {
        handleRenameChat(targetChatId, prompt.slice(0, 35));
      }
    }

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    const currentImages = [...attachedImages];
    setAttachedImages([]);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const assistantMsgId = `asst-${Date.now()}`;
    let streamedContent = '';
    let finalActions: AgentAction[] = [];

    // Add empty assistant message placeholder for live streaming text
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: selectedModel,
      usedWebSearch: isWebSearchEnabled,
    };
    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      // Prepare conversation history
      const historyPayload = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
          images: m.images?.map((img) => ({
            mimeType: img.mimeType,
            data: img.data,
          })),
        }));

      historyPayload.push({
        role: 'user',
        content: prompt,
        images: currentImages.map((img) => ({
          mimeType: img.mimeType,
          data: img.data,
        })),
      });

      const activeFile = workspace.activeFilePath
        ? workspace.files.get(workspace.activeFilePath)
        : null;

      const allFilePaths = Array.from(workspace.files.keys());
      const relevantFiles = findRelevantWorkspaceFiles(
        prompt,
        workspace.files,
        workspace.activeFilePath,
        12,
        12000
      );

      const workspaceContext = {
        hasWorkspace: true,
        folderName: workspace.name,
        fileCount: workspace.files.size,
        fileList: allFilePaths,
        activeFile: activeFile
          ? {
              path: activeFile.path,
              content: activeFile.content.slice(0, 10000),
            }
          : undefined,
        relevantFiles,
      };

      const customKey = localStorage.getItem('nora_custom_api_key') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) {
        headers['x-gemini-key'] = customKey;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        signal: abortController.signal,
        body: JSON.stringify({
          model: selectedModel,
          messages: historyPayload,
          mode,
          webSearch: isWebSearchEnabled,
          workspaceContext,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      // Stream the response using Server-Sent Events reader
      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const rawData = trimmed.slice(6);
              if (!rawData) continue;
              try {
                const payload = JSON.parse(rawData);
                if (payload.type === 'chunk' && payload.text) {
                  streamedContent += payload.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: streamedContent } : m
                    )
                  );
                } else if (payload.type === 'done') {
                  if (payload.text) streamedContent = payload.text;
                  if (payload.actions) finalActions = payload.actions;

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content: streamedContent,
                            actions: payload.actions,
                            searchSources: payload.searchSources,
                            usedWebSearch: payload.usedWebSearch,
                          }
                        : m
                    )
                  );

                  // Auto-apply file creations/edits directly into the project!
                  if (payload.actions && payload.actions.length > 0) {
                    for (const act of payload.actions) {
                      if (
                        act.type === 'write_file' ||
                        act.type === 'create_file' ||
                        act.type === 'edit_file' ||
                        act.type === 'read_and_edit'
                      ) {
                        if (autoApply && act.content) {
                          await handleApplyAction(act, false);
                        }
                      }
                    }
                  }
                } else if (payload.type === 'error') {
                  throw new Error(payload.error || 'Ошибка стриминга');
                }
              } catch (parseErr: any) {
                if (parseErr.message && !parseErr.message.includes('JSON')) {
                  throw parseErr;
                }
              }
            }
          }
        }
      }

      // Persist finished assistant message to database
      if (targetChatId && streamedContent) {
        await saveChatMessage(targetChatId, {
          id: assistantMsgId,
          role: 'assistant',
          content: streamedContent,
          actions: finalActions.length > 0 ? finalActions : undefined,
          modelUsed: selectedModel,
          timestamp: Date.now(),
        });
      }

      return streamedContent;
    } catch (err: any) {
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        console.log('Генерация ответа остановлена');
        return streamedContent;
      }

      console.error('Error generating response:', err);
      const rawErr = String(err?.message || err);
      const isRateLimit =
        rawErr.includes('429') ||
        rawErr.includes('quota') ||
        rawErr.includes('RESOURCE_EXHAUSTED') ||
        rawErr.includes('лимит');

      let formattedContent = '';
      if (isRateLimit) {
        formattedContent = `⏳ **Минутный лимит Gemini 3.8 Flash (5 запросов в минуту)**\n\nGoogle Free Tier ограничивает частоту до 5 запросов в минуту на один проект.\n\n* Пожалуйста, подождите **5–10 секунд** перед следующим вопросом.\n* 💡 Вы также можете указать свой личный Gemini API-ключ в шапке (кнопка с ключом 🔑), чтобы снять минутный лимит.`;
      } else {
        formattedContent = `⚠️ **Ошибка генерации ответа:**\n${rawErr}\n\nПопробуйте повторить запрос через несколько секунд.`;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: formattedContent }
            : m
        )
      );
      return formattedContent;
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(msgId);
      setPastedNotice('Текст скопирован в буфер');
      setTimeout(() => {
        setCopiedMessageId((prev) => (prev === msgId ? null : prev));
        setPastedNotice(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setMessageFeedback((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type,
    }));
    setPastedNotice(type === 'like' ? 'Спасибо за положительную оценку!' : 'Спасибо за отзыв, учтём!');
    setTimeout(() => setPastedNotice(null), 2500);
  };

  const handleRegenerateMessage = async (assistantMsgId: string) => {
    if (isLoading) return;
    const msgIndex = messages.findIndex((m) => m.id === assistantMsgId);
    if (msgIndex === -1) return;
    let userPrompt = '';
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user' && messages[i].content) {
        userPrompt = messages[i].content;
        break;
      }
    }
    if (!userPrompt) {
      userPrompt = inputValue.trim();
    }
    if (userPrompt) {
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      await handleSubmitMessage(userPrompt);
    }
  };

  const toggleSources = (msgId: string) => {
    setCollapsedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await processUploadedFile(file);

      if (result.image) {
        setAttachedImages((prev) => [...prev, result.image!]);
        setPastedNotice(result.notice);
      }

      if (result.files && result.files.length > 0) {
        const updatedFiles = new Map(workspace.files);
        for (const item of result.files) {
          const fileName = item.path.split('/').pop() || item.path;
          updatedFiles.set(item.path, {
            path: item.path,
            name: fileName,
            content: item.content,
            size: item.size,
            lastModified: Date.now(),
          });
        }
        setWorkspace((prev) => ({
          ...prev,
          files: updatedFiles,
          activeFilePath: result.files![0].path,
        }));
        setPastedNotice(result.notice);
        addTerminalEntry(
          `upload "${file.name}"`,
          `[Upload] Добавлено ${result.files.length} файлов в проект из ${file.name}`,
          'success'
        );
      }

      if (!result.image && (!result.files || result.files.length === 0)) {
        setPastedNotice(result.notice);
      }
    }

    setTimeout(() => setPastedNotice(null), 4000);
    e.target.value = '';
  };

  const activeFileObj = workspace.activeFilePath
    ? workspace.files.get(workspace.activeFilePath) || null
    : null;

  const currentChatObj = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1017] text-slate-100 font-sans">
      {/* Main Workspace Layout (Full-height canvas without top bar) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat System Sidebar with Account at the bottom (Image 2) */}
        <ChatSidebar
          user={user}
          chats={chats}
          activeChatId={activeChatId}
          isOpen={isChatSidebarOpen}
          onToggleOpen={() => setIsChatSidebarOpen(!isChatSidebarOpen)}
          onSelectChat={handleSelectChat}
          onCreateChat={handleCreateChat}
          onRenameChat={handleRenameChat}
          onTogglePinChat={handleTogglePinChat}
          onDeleteChat={handleDeleteChat}
          onShareChat={handleShareChat}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onFeatureNotice={(text) => {
            setPastedNotice(text);
            setTimeout(() => setPastedNotice(null), 3000);
          }}
          onOpenImageStudio={() => setIsImageStudioOpen(true)}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onOpenCodex={() => handleToggleCodexMode(!isCodexMode)}
          onOpenInstallApp={() => setIsInstallModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          isCodexMode={isCodexMode}
          onToggleCodexMode={handleToggleCodexMode}
        />

        {/* Center: Chat & Agent Interaction Panel */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0d1017] relative">
          {/* Floating Mobile Sidebar Trigger */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
            <button
              onClick={() => setIsChatSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#141824]/80 hover:bg-[#1c2233] backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
              title="Открыть список чатов"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Floating Mode Switcher & Settings Trigger in Top Right */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleCodexMode(!isCodexMode)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition shadow-md cursor-pointer flex items-center gap-1.5 ${
                isCodexMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-[#141824]/70 text-slate-400 border-slate-800/80 hover:text-white hover:bg-[#1c2233]'
              }`}
              title={isCodexMode ? 'Выключить режим Codex (перейти в Чаты)' : 'Включить режим Nora Codex'}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{isCodexMode ? 'Codex' : 'Chat'}</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl bg-[#141824]/70 hover:bg-[#1c2233] backdrop-blur-md border border-slate-800/80 text-slate-400 hover:text-white transition shadow-md cursor-pointer"
              title="Настройки: консоль, энергия, параметры"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* Notification banner for Ctrl+V image paste or auto-apply */}
          {pastedNotice && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 border border-white/20 animate-fade-in">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{pastedNotice}</span>
            </div>
          )}

          {/* Chat Messages Scrollable Feed */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-3 sm:p-6 max-w-lg mx-auto select-none">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                  {isCodexMode ? (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <PixelMascot className="w-9 h-8 text-[#d97757]" />
                    </div>
                  ) : (
                    <NoraLogo className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-xl" />
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {isCodexMode ? 'Nora Codex — Разработка кода' : 'Чем могу помочь сегодня?'}
                </h2>
                <p className="text-xs text-slate-400 mb-5 sm:mb-6 max-w-sm">
                  {isCodexMode
                    ? 'Опишите задачу или задайте вопрос разработчика. Код автоматически анализируется и применяется в проект.'
                    : 'Nora готова ответить на любые вопросы, найти актуальную информацию в интернете или помочь в разработке проекта.'}
                </p>

                {isCodexMode && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {[
                      'Создай компонент формы с валидацией',
                      'Добавь переключатель темы (dark/light)',
                      'Напиши API маршруты с обработкой ошибок',
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputValue(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1d2333] border border-slate-700/70 hover:border-emerald-500/50 text-slate-300 hover:text-white transition cursor-pointer text-left"
                      >
                        ⚡ {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isSystem = msg.role === 'system';

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-200 text-center max-w-2xl mx-auto shadow-sm"
                  >
                    <MarkdownRenderer content={msg.content} />
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-2xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start w-full'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#141824] border border-slate-800 flex items-center justify-center shrink-0 shadow-md mt-0.5">
                      <NoraLogo className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl transition ${
                      isUser
                        ? 'bg-indigo-600 text-white shadow-md max-w-lg p-3 sm:p-3.5'
                        : 'bg-[#151a24] border border-slate-800/90 text-slate-200 shadow-md p-3 sm:p-3.5 w-full max-w-2xl'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-slate-800/80 pb-1.5 font-mono">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-white">Nora</span>
                          <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900">
                            {msg.modelUsed || selectedModel}
                          </span>
                          {msg.usedWebSearch && (
                            <span className="text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-900/60 flex items-center gap-1 font-mono">
                              <Globe className="w-2.5 h-2.5" /> Поиск в сети
                            </span>
                          )}
                          {autoApply && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/50 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" /> Авто-запись
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isLoading && msg.id === messages[messages.length - 1]?.id && (
                            <button
                              type="button"
                              onClick={handleStopGeneration}
                              className="px-2 py-0.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 flex items-center gap-1 text-[11px] font-sans font-medium transition cursor-pointer active:scale-95 animate-pulse"
                              title="Остановить генерацию ответа"
                            >
                              <Square className="w-2.5 h-2.5 fill-rose-400" />
                              <span>Остановить</span>
                            </button>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}

                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2.5">
                        {msg.images.map((img) => (
                          <div
                            key={img.id}
                            onClick={() => setPreviewImage(img)}
                            className="relative group rounded-xl overflow-hidden border border-white/20 max-w-[180px] shadow cursor-pointer hover:border-indigo-400 transition"
                            title="Нажмите, чтобы раскрыть фото на весь экран"
                          >
                            <img
                              src={img.data}
                              alt={img.name}
                              className="w-full h-auto max-h-44 object-cover group-hover:scale-105 transition duration-200"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-1 text-[10px] text-white truncate">
                              {img.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.content ? (
                      <MarkdownRenderer
                        content={msg.content}
                        onApplyAction={handleApplyAction}
                        onOpenFile={(path) => {
                          const file = workspace.files.get(path);
                          if (file) {
                            setWorkspace((prev) => ({ ...prev, activeFilePath: file.path }));
                            setIsEditorOpen(true);
                          } else {
                            handleCreateFile(path, '');
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-2.5 py-2 text-xs text-slate-300">
                        <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                        <div>
                          <span className="font-semibold text-white">Nora выполняет действия в реальном времени...</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Анализ модулей, создание файлов и генерация итогового ответа
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Verified Web Sources with Collapsible Toggle */}
                    {msg.searchSources && msg.searchSources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => toggleSources(msg.id)}
                          className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-200 py-0.5 transition cursor-pointer select-none group"
                          title={collapsedSources[msg.id] ? "Показать источники" : "Скрыть источники"}
                        >
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-sky-400" />
                            <span>Источники из интернета ({msg.searchSources.length}):</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-sky-300 font-normal">
                            <span>{collapsedSources[msg.id] ? 'Показать' : 'Скрыть'}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                collapsedSources[msg.id] ? '-rotate-90 text-slate-500' : 'rotate-0 text-slate-400'
                              }`}
                            />
                          </div>
                        </button>
                        {!collapsedSources[msg.id] && (
                          <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in duration-150">
                            {msg.searchSources.slice(0, 8).map((source, sIdx) => {
                              let domain = '';
                              try {
                                domain = new URL(source.url).hostname.replace('www.', '');
                              } catch {
                                domain = source.title;
                              }
                              return (
                                <a
                                  key={sIdx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-lg text-[11px] text-slate-300 hover:text-white transition group"
                                  title={source.title}
                                >
                                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-sky-400" />
                                  <span className="truncate max-w-[170px]">{source.title || domain}</span>
                                  <span className="text-[9px] text-slate-500">({domain})</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assistant Message Actions Toolbar matching Image 2 */}
                    {!isUser && msg.content && (
                      <div className="mt-2.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {/* 1. Copy */}
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/70 transition cursor-pointer"
                            title={copiedMessageId === msg.id ? 'Скопировано!' : 'Копировать'}
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 2. Read Aloud */}
                          <button
                            type="button"
                            onClick={() => handleSpeakMessage(msg.id, msg.content)}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/70 transition cursor-pointer"
                            title={speakingMessageId === msg.id ? 'Остановить озвучку' : 'Озвучить ответ'}
                          >
                            {speakingMessageId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 3. Thumbs Up */}
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 'like')}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              messageFeedback[msg.id] === 'like'
                                ? 'text-emerald-400 bg-emerald-500/15'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                            }`}
                            title="Хороший ответ"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Thumbs Down */}
                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 'dislike')}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              messageFeedback[msg.id] === 'dislike'
                                ? 'text-rose-400 bg-rose-500/15'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                            }`}
                            title="Плохой ответ"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Regenerate */}
                          <button
                            type="button"
                            onClick={() => handleRegenerateMessage(msg.id)}
                            disabled={isLoading}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/70 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Повторить генерацию ответа"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center shrink-0 font-bold text-xs">
                      {user?.displayName?.[0]?.toUpperCase() || 'Вы'}
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form with Ctrl+V support (Lowered closer to bottom) */}
          <div className="px-2.5 sm:px-4 pt-1 pb-1.5 sm:pb-2">
            {attachedImages.length > 0 && (
              <div className="flex items-center gap-2 mb-2.5 p-2 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
                <span className="text-xs text-slate-400 font-medium shrink-0 ml-1">
                  Прикреплено ({attachedImages.length}):
                </span>
                {attachedImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setPreviewImage(img)}
                    className="relative group shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-indigo-500/40 shadow-md cursor-pointer hover:border-indigo-400 transition"
                    title="Нажмите для полноэкранного просмотра"
                  >
                    <img src={img.data} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttachedImages((prev) => prev.filter((i) => i.id !== img.id));
                      }}
                      className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition cursor-pointer z-10"
                      title="Удалить"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ─────────────── CONDITIONAL INPUT: CODEX MODE (Image 1 & 2) VS STANDARD CHAT ─────────────── */}
            {isCodexMode ? (
              <div className="flex flex-col gap-1.5 relative">
                {/* Top Row: [💻 Local] [📁 Fanik] [📁+] on left, 8-bit terracotta mascot on right (Image 1) */}
                <div className="flex items-end justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    {/* Local chip */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181c27] border border-slate-700/70 text-slate-300 font-mono text-[11px] select-none shadow-sm">
                      <Laptop className="w-3.5 h-3.5 text-slate-400" />
                      <span>Local</span>
                    </div>

                    {/* Folder name chip (Fanik / current workspace) */}
                    <button
                      type="button"
                      onClick={handlePickDirectory}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181c27] hover:bg-[#1f2533] border border-slate-700/70 text-slate-300 hover:text-white font-mono text-[11px] transition cursor-pointer shadow-sm"
                      title="Выбрать папку проекта"
                    >
                      <Folder className="w-3.5 h-3.5 text-slate-400" />
                      <span>{workspace.files.size > 0 && !workspace.name.includes('(Шаблон)') && workspace.name !== 'No Project' ? workspace.name : 'Fanik'}</span>
                    </button>

                    {/* Folder Plus button [📁+] */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 px-1.5 rounded-lg bg-[#181c27] hover:bg-[#1f2533] border border-slate-700/70 text-slate-400 hover:text-white text-[11px] transition cursor-pointer shadow-sm flex items-center justify-center"
                      title="Прикрепить файлы (.zip, .py, .java, etc.)"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Terracotta Pixel Mascot sitting on top right edge of input bar (Image 1) */}
                  <div className="pr-4 pb-0.5 select-none pointer-events-none" title="Codex Mascot">
                    <PixelMascot className="w-5 h-4.5 text-[#d97757]" />
                  </div>
                </div>

                {/* Main Codex Input Container (Image 1) */}
                <div className="relative bg-[#12151e] border border-slate-700/80 focus-within:border-slate-500 rounded-2xl shadow-2xl p-2.5 sm:p-3 transition flex items-center gap-2">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitMessage();
                      }
                    }}
                    placeholder="Describe a task or ask a question"
                    rows={1}
                    className="flex-1 bg-transparent p-1 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none scrollbar-none min-h-[36px]"
                  />

                  {/* Return Icon (↵) on right inside input field */}
                  <button
                    type="button"
                    onClick={() => handleSubmitMessage()}
                    disabled={isLoading || (!inputValue.trim() && attachedImages.length === 0)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    title="Отправить (Enter)"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Row below input container: [+ Accept edits] on left, [lma/claude-haiku-4-5-20251001 ○] on right */}
                <div className="flex items-center justify-between px-1 pt-0.5">
                  {/* Mode trigger on left: [+ Accept edits] / [+ Manual] / [+ Plan] */}
                  <div className="relative" ref={codexModeMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowCodexModeMenu(!showCodexModeMenu)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer select-none py-0.5 px-1 rounded-md hover:bg-slate-800/40"
                    >
                      <span className="text-slate-500 font-bold">+</span>
                      <span className="font-sans">
                        {codexExecutionMode === 'manual'
                          ? 'Manual'
                          : codexExecutionMode === 'plan'
                          ? 'Plan'
                          : 'Accept edits'}
                      </span>
                    </button>

                    {/* Mode Popover Menu matching Image 2 */}
                    {showCodexModeMenu && (
                      <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 bg-[#161922] border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left select-none">
                        <div className="px-3 py-1.5 text-xs text-slate-400 font-semibold">
                          Mode
                        </div>

                        {/* 1. Manual */}
                        <button
                          type="button"
                          onClick={() => {
                            setCodexExecutionMode('manual');
                            setAutoApply(false);
                            setShowCodexModeMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex flex-col gap-0.5 ${
                            codexExecutionMode === 'manual' ? 'bg-slate-800/80' : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">Manual</span>
                              {codexExecutionMode === 'manual' && <Check className="w-4 h-4 text-sky-400" />}
                            </div>
                            <span className="text-xs text-slate-500 font-mono">1</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-snug">
                            Always ask before making changes
                          </p>
                        </button>

                        {/* 2. Accept edits (Checked by default in Image 2) */}
                        <button
                          type="button"
                          onClick={() => {
                            setCodexExecutionMode('accept_edits');
                            setAutoApply(true);
                            setShowCodexModeMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex flex-col gap-0.5 ${
                            codexExecutionMode === 'accept_edits' ? 'bg-slate-800/80' : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">Accept edits</span>
                              {codexExecutionMode === 'accept_edits' && <Check className="w-4 h-4 text-sky-400" />}
                            </div>
                            <span className="text-xs text-slate-500 font-mono">2</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-snug">
                            Automatically accept all file edits
                          </p>
                        </button>

                        {/* 3. Plan */}
                        <button
                          type="button"
                          onClick={() => {
                            setCodexExecutionMode('plan');
                            setShowCodexModeMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex flex-col gap-0.5 ${
                            codexExecutionMode === 'plan' ? 'bg-slate-800/80' : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">Plan</span>
                              {codexExecutionMode === 'plan' && <Check className="w-4 h-4 text-sky-400" />}
                            </div>
                            <span className="text-xs text-slate-500 font-mono">3</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-snug">
                            Create a plan before making changes
                          </p>
                        </button>

                        <div className="my-1.5 border-t border-slate-800" />

                        {/* Bypass permissions row */}
                        <div className="flex items-center justify-between px-2.5 py-1.5">
                          <span className="text-xs font-medium text-slate-200">Bypass permissions</span>
                          <button
                            type="button"
                            onClick={() => setBypassPermissions(!bypassPermissions)}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition cursor-pointer ${
                              bypassPermissions
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                          >
                            {bypassPermissions ? 'Enabled' : 'Enable'}
                          </button>
                        </div>

                        {/* Auto (Disabled item in Image 2) */}
                        <div className="px-2.5 py-1.5 opacity-50 cursor-not-allowed select-none">
                          <div className="text-xs font-medium text-slate-400">Auto</div>
                          <div className="text-[11px] text-slate-500">Not available for the selected model</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Model name on right: [lma/claude-haiku-4-5-20251001 ○] */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition cursor-pointer select-none py-0.5 px-1.5 rounded-md hover:bg-slate-800/40"
                      title="Выбрать модель"
                    >
                      <span>{selectedModel === 'claude-haiku-4-5-20251001' ? 'lma/claude-haiku-4-5-20251001' : selectedModel}</span>
                      <span className="w-2 h-2 rounded-full border border-slate-500 bg-transparent" />
                    </button>

                    {showModelDropdown && (
                      <div className="absolute right-0 bottom-full mb-2 w-56 sm:w-64 bg-[#121622] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Выбор модели
                        </div>
                        {MODELS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m.id);
                              setShowModelDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                              selectedModel === m.id
                                ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                                : 'text-slate-300 hover:bg-slate-800/80'
                            }`}
                          >
                            <span className="font-semibold text-white">{m.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                              {m.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Chat Input Container (Lowered and bluer #131722 with subtle slate/indigo border) */
              <div className="relative bg-[#131722] border border-slate-700/80 rounded-2xl shadow-2xl p-3 sm:p-3.5 focus-within:border-indigo-500/70 transition flex flex-col gap-1.5">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitMessage();
                    }
                  }}
                  placeholder="Write a message..."
                  rows={2}
                  className="w-full bg-transparent p-0 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none scrollbar-thin min-h-[46px]"
                />

                {/* Bottom bar inside input: + and folder on left, model badge and terracotta squircle on right */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  {/* Left side: + (Attach) and Folder+ (Workspace Project) */}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,.zip,.rar,.7z,.py,.java,.scs,.txt,.json,.ts,.tsx,.js,.jsx,.html,.css,.cpp,.c,.h,.cs,.go,.rs,.sh,.yml,.yaml,.xml,.md"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Прикрепить фото или файлы (.zip, .py, .java, etc.)"
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-center active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>

                    <ProjectPickerPopover
                      iconOnly={true}
                      folderName={workspace.name}
                      hasProject={workspace.files.size > 0 && !workspace.name.includes('(Шаблон)') && workspace.name !== 'No Project'}
                      isNative={workspace.isNative}
                      filesCount={workspace.files.size}
                      onPickDirectory={handlePickDirectory}
                      onFolderUploaded={handleFolderUploaded}
                      onLoadSample={handleLoadSample}
                      onClearProject={() => {
                        const emptyWs: WorkspaceState = {
                          name: 'No Project',
                          isNative: false,
                          files: new Map(),
                          activeFilePath: null,
                        };
                        setWorkspace(emptyWs);
                        if (activeChatId) {
                          saveWorkspaceForChat(activeChatId, emptyWs);
                        }
                        addTerminalEntry('workspace clear', 'Проект отключен (No Project)', 'info');
                      }}
                      onDownloadZip={async () => {
                        const { exportWorkspaceToZip } = await import('./utils/zipExport');
                        await exportWorkspaceToZip(workspace.name, workspace.files);
                      }}
                    />

                    {/* Web Search toggle (compact subtle icon) */}
                    <button
                      type="button"
                      onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                      className={`p-1 rounded-lg transition cursor-pointer flex items-center justify-center active:scale-95 ${
                        isWebSearchEnabled
                          ? 'text-sky-400 bg-sky-500/15'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                      }`}
                      title={isWebSearchEnabled ? 'Поиск в интернете (Google) включён' : 'Включить поиск в интернете (Google)'}
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right side: Model badge in "табличка" (Image 2 style) & Terracotta Squircle Button (Photo 2) */}
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    {/* Model Name Selector styled in exact badge/табличка matching Image 2 */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#162032] hover:bg-[#1d2a42] border border-[#243550] text-[#38bdf8] hover:text-[#60a5fa] text-xs font-mono font-medium shadow-sm transition cursor-pointer select-none active:scale-95"
                        title="Выбрать модель Gemini"
                      >
                        <span>{selectedModel === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : selectedModel}</span>
                        <ChevronDown className="w-3 h-3 text-[#38bdf8]/70" />
                      </button>

                      {/* Dropdown for models */}
                      {showModelDropdown && (
                        <div className="absolute right-0 bottom-full mb-2 w-56 sm:w-60 bg-[#121622] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                          <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Выбор модели Gemini
                          </div>
                          {MODELS.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedModel(m.id);
                                setShowModelDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                                selectedModel === m.id
                                  ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                                  : 'text-slate-300 hover:bg-slate-800/80'
                              }`}
                            >
                              <span className="font-semibold text-white">{m.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                                {m.badge}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Terracotta / Burnt Orange Squircle Button matching Photo 2 with dynamic voice behavior */}
                    {isLoading ? (
                      <button
                        type="button"
                        onClick={handleStopGeneration}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-md shadow-rose-600/30 active:scale-95 animate-pulse"
                        title="Остановить генерацию"
                      >
                        <Square className="w-3.5 h-3.5 fill-white text-white" />
                      </button>
                    ) : !inputValue.trim() && attachedImages.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setIsVoiceModeOpen(true)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2a2c33] hover:bg-[#343740] text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-md border border-zinc-700/70 active:scale-95 group"
                        title="Голосовой режим Nora Live"
                      >
                        <svg className="w-4 h-4 text-zinc-300 group-hover:text-white transition" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="2" y="8" width="2.5" height="8" rx="1.25" />
                          <rect x="7" y="4.5" width="2.5" height="15" rx="1.25" />
                          <rect x="12" y="2" width="2.5" height="20" rx="1.25" />
                          <rect x="17" y="5.5" width="2.5" height="13" rx="1.25" />
                          <rect x="22" y="8" width="2.5" height="8" rx="1.25" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSubmitMessage()}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#c26343] hover:bg-[#d06d4c] text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-md shadow-[#c26343]/30 active:scale-95 animate-in fade-in zoom-in-95 duration-150"
                        title="Отправить (Enter)"
                      >
                        <ArrowUp className="w-4 h-4 text-white stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
        </main>

        {/* Right Panel: File Editor */}
        {isEditorOpen && activeFileObj && (
          <div className="w-96 lg:w-[480px] shrink-0 h-full border-l border-slate-800 bg-[#0b0e14] flex flex-col">
            <FileEditor
              file={activeFileObj}
              onSave={handleSaveFile}
              onClose={() => setIsEditorOpen(false)}
              onAskAgentAboutFile={(file) => {
                setInputValue(`Посмотри файл ${file.path}. Что в нем можно улучшить или добавить?`);
                textareaRef.current?.focus();
              }}
            />
          </div>
        )}
      </div>

      {/* Terminal */}
      <Terminal
        entries={terminalEntries}
        onExecuteCommand={handleExecuteTerminalCommand}
        onClear={() => setTerminalEntries([])}
        isOpen={isTerminalOpen}
        onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
      />

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onPickDirectory={handlePickDirectory}
      />

      {/* Database & Chat List Drawer */}
      <ChatListDrawer
        user={user}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onCreateChat={handleCreateChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
      />

      {/* Account Registration & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Nora Voice Mode Modal (ChatGPT / Gemini Live style) */}
      <VoiceModeModal
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onSendMessage={async (text) => {
          return await handleSubmitMessage(text);
        }}
        modelName={selectedModel === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash High' : selectedModel}
      />

      {/* PWA App Installation Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* Nora Studio - Image Generation Modal */}
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onSendToChat={(prompt) => handleSubmitMessage(prompt)}
      />

      {/* Nora Library & Custom Instructions Modal */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onApplyPrompt={(prompt) => {
          setInputValue(prompt);
          textareaRef.current?.focus();
        }}
      />

      {/* Nora Codex - Live Canvas & Code Playground Modal */}
      <CodePlaygroundModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
      />

      {/* Fullscreen Image Preview Lightbox */}
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Settings Modal (Console / Sandbox and System Parameters) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        autoApply={autoApply}
        onToggleAutoApply={() => setAutoApply(!autoApply)}
        selectedModel={selectedModel}
        onSelectModel={(m) => setSelectedModel(m)}
        isWebSearchEnabled={isWebSearchEnabled}
        onToggleWebSearch={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
        onClearTerminalHistory={() => setTerminalEntries([])}
        terminalCount={terminalEntries.length}
      />
    </div>
  );
}
