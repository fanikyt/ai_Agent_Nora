import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  SquarePen,
  Search,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Share2,
  Pencil,
  Pin,
  Trash2,
  Check,
  X,
  LogIn,
  LogOut,
  Images,
  BookOpen,
  Code2,
  Download,
  Settings,
  Plus,
  Terminal,
} from 'lucide-react';
import { ChatSession } from '../types';
import { AppUser } from '../services/accountService';
import { NoraLogo } from './NoraLogo';

interface ChatSidebarProps {
  user: AppUser | null;
  chats: ChatSession[];
  activeChatId: string | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onTogglePinChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onShareChat: (chat: ChatSession) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onFeatureNotice?: (text: string) => void;
  onOpenImageStudio?: () => void;
  onOpenLibrary?: () => void;
  onOpenCodex?: () => void;
  onOpenInstallApp?: () => void;
  onOpenSettings?: () => void;
  isCodexMode?: boolean;
  onToggleCodexMode?: (isCodex: boolean) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  user,
  chats,
  activeChatId,
  isOpen,
  onToggleOpen,
  onSelectChat,
  onCreateChat,
  onRenameChat,
  onTogglePinChat,
  onDeleteChat,
  onShareChat,
  onOpenAuth,
  onLogout,
  onFeatureNotice,
  onOpenImageStudio,
  onOpenLibrary,
  onOpenCodex,
  onOpenInstallApp,
  onOpenSettings,
  isCodexMode = false,
  onToggleCodexMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null);
  const [isPinnedSectionOpen, setIsPinnedSectionOpen] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [featureNotice, setFeatureNotice] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenChatId(null);
      }
    }
    if (menuOpenChatId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenChatId]);

  // Separate 2 Chat Systems: Regular Chats vs Codex Chats
  const regularCount = chats.filter((c) => !c.isCodex).length;
  const codexCount = chats.filter((c) => Boolean(c.isCodex)).length;

  const currentSystemChats = chats.filter((c) =>
    isCodexMode ? Boolean(c.isCodex) : !c.isCodex
  );

  const filteredChats = currentSystemChats.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedChats = filteredChats.filter((c) => Boolean(c.isPinned));
  const unpinnedChats = filteredChats.filter((c) => !c.isPinned);

  const startEditing = (chat: ChatSession) => {
    setMenuOpenChatId(null);
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveTitle = (chatId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleDelete = (chatId: string) => {
    setMenuOpenChatId(null);
    if (window.confirm('Удалить этот чат?')) {
      onDeleteChat(chatId);
    }
  };

  const handleTogglePin = (chatId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMenuOpenChatId(null);
    onTogglePinChat(chatId);
  };

  const handleShare = (chat: ChatSession, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMenuOpenChatId(null);
    onShareChat(chat);
  };

  // If sidebar is collapsed, show just the mini-bar on desktop (hidden on mobile)
  if (!isOpen) {
    return (
      <div className="hidden md:flex h-full bg-[#090b10] border-r border-slate-900/40 flex-col items-center py-3 px-1.5 shrink-0 z-20">
        <button
          onClick={onToggleOpen}
          className="p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer mb-2"
          title="Развернуть боковую панель Nora"
        >
          <NoraLogo className="w-6 h-6" />
        </button>

        <button
          onClick={onCreateChat}
          className="mt-2 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title={isCodexMode ? 'Новый Codex проект' : 'Новый чат'}
        >
          {isCodexMode ? <Code2 className="w-4 h-4 text-emerald-400" /> : <SquarePen className="w-4 h-4" />}
        </button>

        {onToggleCodexMode && (
          <button
            onClick={() => onToggleCodexMode(!isCodexMode)}
            className={`mt-1 p-2 rounded-xl transition cursor-pointer ${
              isCodexMode
                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isCodexMode ? 'Система: Codex (нажмите для Чатов)' : 'Система: Чаты (нажмите для Codex)'}
          >
            {isCodexMode ? <Code2 className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          </button>
        )}

        <div className="mt-auto flex flex-col items-center gap-2">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Настройки (Консоль / Энергия)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {user ? (
            <button
              onClick={onToggleOpen}
              className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow"
              title={user.displayName || 'Профиль'}
            >
              {user.displayName?.[0]?.toUpperCase() || 'U'}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Войти"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return 'FA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper to render individual chat item matching Image 1 & 2
  const renderChatItem = (chat: ChatSession) => {
    const isActive = chat.id === activeChatId;
    const isEditing = editingChatId === chat.id;
    const isMenuOpen = menuOpenChatId === chat.id;

    return (
      <div
        key={chat.id}
        onClick={() => {
          onSelectChat(chat.id);
          if (window.innerWidth < 768) {
            onToggleOpen();
          }
        }}
        className={`group relative flex items-center justify-between px-2.5 py-2.5 rounded-xl text-xs transition cursor-pointer select-none ${
          isActive
            ? chat.isCodex
              ? 'bg-[#122820] text-emerald-200 font-medium border border-emerald-500/40 shadow-sm'
              : 'bg-[#1e2330] text-white font-medium border border-slate-700/60 shadow-sm'
            : 'text-slate-300 hover:bg-[#121622] hover:text-white'
        }`}
      >
        {isEditing ? (
          <form
            onSubmit={(e) => handleSaveTitle(chat.id, e)}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 w-full"
          >
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="flex-1 bg-slate-950 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="p-1 hover:bg-emerald-600/30 text-emerald-400 rounded transition"
              title="Сохранить"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditingChatId(null)}
              className="p-1 hover:bg-rose-600/30 text-rose-400 rounded transition"
              title="Отмена"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <>
            {/* Left: Chat Title with appropriate icon */}
            <div className="flex items-center gap-2.5 min-w-0 pr-1.5 flex-1">
              {chat.isCodex ? (
                <Code2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-emerald-500/60 group-hover:text-emerald-400'
                  }`}
                />
              ) : (
                <MessageSquare
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
              )}
              <span className="truncate text-[12px]">{chat.title}</span>
            </div>

            {/* Right: Pin icon + 3-dots button (matching Image 1 & 2) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Pin Icon button */}
              <button
                onClick={(e) => handleTogglePin(chat.id, e)}
                title={chat.isPinned ? 'Открепить чат' : 'Закрепить чат'}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  chat.isPinned
                    ? 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/50'
                    : 'text-slate-500 hover:text-white hover:bg-slate-700/50 opacity-0 group-hover:opacity-100'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${chat.isPinned ? 'fill-indigo-400/30 rotate-45' : ''}`} />
              </button>

              {/* 3 dots menu trigger */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenChatId(isMenuOpen ? null : chat.id);
                  }}
                  title="Опции чата"
                  className={`p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer ${
                    isActive || isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {/* 3 Dots Context Menu (Matches Image 1 precisely) */}
                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-48 bg-[#181c26] border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
                  >
                    {/* 1. Поделиться */}
                    <button
                      onClick={(e) => handleShare(chat, e)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer text-left"
                    >
                      <Share2 className="w-4 h-4 text-slate-400" />
                      <span>Поделиться</span>
                    </button>

                    {/* 2. Переименовать */}
                    <button
                      onClick={() => startEditing(chat)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer text-left"
                    >
                      <Pencil className="w-4 h-4 text-slate-400" />
                      <span>Переименовать</span>
                    </button>

                    {/* 3. Закрепить / Открепить чат */}
                    <button
                      onClick={(e) => handleTogglePin(chat.id, e)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer text-left"
                    >
                      <Pin className={`w-4 h-4 ${chat.isPinned ? 'text-indigo-400 fill-indigo-400/30' : 'text-slate-400'}`} />
                      <span>{chat.isPinned ? 'Открепить чат' : 'Закрепить чат'}</span>
                    </button>

                    <div className="my-1 border-t border-slate-700/60" />

                    {/* 4. Удалить (Red text and trash icon as in Image 1) */}
                    <button
                      onClick={() => handleDelete(chat.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition cursor-pointer text-left font-medium"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Удалить</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        onClick={onToggleOpen}
      />

      <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#090b10] border-r border-slate-900/40 flex flex-col shrink-0 select-none shadow-2xl md:relative md:w-64 md:inset-auto md:z-20 md:shadow-none animate-in slide-in-from-left duration-200">
        {/* Sidebar Top Header with Nora Logo (seamless, no dividing line) */}
        <div className="h-14 px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <NoraLogo className="w-6 h-6" />
            <span className="font-bold text-base tracking-tight text-white font-sans">
              Nora
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
              title="Поиск по чатам"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleOpen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
              title="Закрыть панель"
            >
              <X className="w-4 h-4 md:hidden" />
              <PanelLeftClose className="w-4 h-4 hidden md:block" />
            </button>
          </div>
        </div>

        {/* 2 Chat Systems Switcher: Regular Chats vs Codex Chats (2 системы чатов) */}
        <div className="px-2 pt-1 pb-1">
          <div className="p-0.5 rounded-xl bg-[#121622] border border-slate-800/90 flex items-center gap-0.5 text-xs select-none">
            <button
              type="button"
              onClick={() => onToggleCodexMode?.(false)}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                !isCodexMode
                  ? 'bg-[#1b2130] text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Переключиться на систему обычных диалогов"
            >
              <MessageSquare className={`w-3.5 h-3.5 ${!isCodexMode ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>Чаты</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                !isCodexMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/80 text-slate-500'
              }`}>
                {regularCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onToggleCodexMode?.(true)}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                isCodexMode
                  ? 'bg-[#0f241d] text-emerald-200 shadow-sm border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title="Переключиться на систему Nora Codex"
            >
              <Code2 className={`w-3.5 h-3.5 ${isCodexMode ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Codex</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isCodexMode ? 'bg-emerald-500/30 text-emerald-300 font-semibold' : 'bg-slate-800/80 text-slate-500'
              }`}>
                {codexCount}
              </span>
            </button>
          </div>
        </div>

        {/* Top Navigation Items (Photo 2) */}
        <div className="p-2 space-y-1">
          {/* Новый чат / Новый Codex проект Button */}
          <button
            onClick={() => {
              onCreateChat();
              if (window.innerWidth < 768) {
                onToggleOpen();
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer group shadow-sm active:scale-[0.99] border ${
              isCodexMode
                ? 'bg-[#0e211a] hover:bg-[#142e24] border-emerald-900/60 hover:border-emerald-700/60 text-emerald-100'
                : 'bg-[#141824] hover:bg-[#1c2233] border-slate-800 hover:border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isCodexMode ? (
                <Code2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <SquarePen className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition" />
              )}
              <span>{isCodexMode ? 'Новый Codex проект' : 'Новый чат'}</span>
            </div>
            <Plus className={`w-3.5 h-3.5 ${isCodexMode ? 'text-emerald-400' : 'text-slate-400'}`} />
          </button>

          {/* 1. Изображения */}
          <button
            type="button"
            onClick={() => {
              onOpenImageStudio?.();
              if (window.innerWidth < 768) onToggleOpen();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-[#141824] rounded-xl text-xs font-medium transition cursor-pointer group"
            title="Nora Studio — генерация изображений"
          >
            <div className="flex items-center gap-2.5">
              <Images className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition" />
              <span>Изображения</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">Studio</span>
          </button>

          {/* 2. Библиотека */}
          <button
            type="button"
            onClick={() => {
              onOpenLibrary?.();
              if (window.innerWidth < 768) onToggleOpen();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-[#141824] rounded-xl text-xs font-medium transition cursor-pointer group"
            title="Библиотека промптов и Custom Instructions"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition" />
              <span>Библиотека</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">Presets</span>
          </button>

          {/* 3. Nora codex */}
          <button
            type="button"
            onClick={() => {
              if (onToggleCodexMode) {
                onToggleCodexMode(!isCodexMode);
              } else {
                onOpenCodex?.();
              }
              if (window.innerWidth < 768) onToggleOpen();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer group ${
              isCodexMode
                ? 'bg-emerald-500/20 text-white border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#141824]'
            }`}
            title="Nora Codex — режим разработки кода"
          >
            <div className="flex items-center gap-2.5">
              <Code2 className={`w-4 h-4 transition ${isCodexMode ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
              <span>Nora codex</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              isCodexMode
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-semibold'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {isCodexMode ? 'Активен' : 'Live'}
            </span>
          </button>

        {/* Floating In-Sidebar Notice "Скоро появится" */}
        {featureNotice && (
          <div className="mt-1 p-2 bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-500/40 rounded-xl text-center text-xs text-indigo-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <span>✨ {featureNotice}</span>
          </div>
        )}

        {/* Search input if toggled */}
        {showSearch && (
          <div className="mt-2 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск чатов..."
              className="w-full bg-[#121622] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chat List with Pinned and Recent Sections */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3 scrollbar-thin pb-4">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 space-y-2">
            {searchTerm ? (
              'Чаты не найдены'
            ) : isCodexMode ? (
              <div className="py-4 flex flex-col items-center gap-2">
                <Code2 className="w-6 h-6 text-emerald-500/40" />
                <p className="text-slate-400 font-medium">Нет сессий Codex</p>
                <p className="text-[11px] text-slate-600 max-w-[180px]">Напишите сообщение в строке Codex для старта проекта</p>
              </div>
            ) : (
              'Напишите сообщение нейросети для создания чата'
            )}
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedChats.length > 0 && (
              <div className="space-y-1">
                <button
                  onClick={() => setIsPinnedSectionOpen(!isPinnedSectionOpen)}
                  className="w-full flex items-center justify-between px-2 pt-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{isCodexMode ? 'Закрепленные проекты' : 'Закрепленные'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({pinnedChats.length})</span>
                  </span>
                  {isPinnedSectionOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  )}
                </button>

                {isPinnedSectionOpen && (
                  <div className="space-y-0.5">
                    {pinnedChats.map(renderChatItem)}
                  </div>
                )}
              </div>
            )}

            {/* Unpinned / Recent Section */}
            {unpinnedChats.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 pt-1 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>{isCodexMode ? 'Codex проекты' : (pinnedChats.length > 0 ? 'Недавнее' : 'Чаты')}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{unpinnedChats.length}</span>
                </div>
                <div className="space-y-0.5">
                  {unpinnedChats.map(renderChatItem)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Account Card (Matching Image 2: Green avatar + Name + Free) */}
      <div className="p-2 border-t border-slate-800/80 bg-[#090b10] relative">
        {/* Install App Button */}
        {onOpenInstallApp && (
          <button
            onClick={onOpenInstallApp}
            className="w-full flex items-center justify-between p-2 mb-2 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 hover:from-indigo-900/80 hover:to-purple-900/80 border border-indigo-500/30 text-xs font-semibold text-indigo-200 hover:text-white transition cursor-pointer shadow-sm group active:scale-98"
            title="Установить Nora на телефон или ПК"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400 group-hover:animate-bounce" />
              <span>Установить приложение</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              App
            </span>
          </button>
        )}

        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#141824] border border-transparent hover:border-slate-800 transition cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-sm">
                    {getInitials(user.displayName)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {user.displayName || 'FanikYT'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    Free
                  </div>
                </div>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform ${
                  showAccountMenu ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Account Menu Popup */}
            {showAccountMenu && (
              <div className="absolute left-0 bottom-full mb-1.5 w-full bg-[#121622] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                <div className="px-2.5 py-1.5 text-[11px] text-slate-400 border-b border-slate-800">
                  <p className="font-semibold text-white truncate">{user.displayName}</p>
                  <p className="truncate text-[10px] text-slate-400">{user.email}</p>
                </div>
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Настройки (Консоль)</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Выйти из аккаунта</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#141824] hover:bg-[#1c2233] border border-slate-800 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                FA
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  Войти в аккаунт
                </div>
                <div className="text-[11px] text-slate-400">
                  Free
                </div>
              </div>
            </div>
            <LogIn className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition" />
          </button>
        )}
      </div>
    </aside>
  </>
  );
};
