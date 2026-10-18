import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  LogIn,
  LogOut,
  User as UserIcon,
  Search,
  Sparkles,
  Database,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { ChatSession } from '../types';
import { AppUser } from '../services/accountService';

interface ChatListDrawerProps {
  user: AppUser | null;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatListDrawer: React.FC<ChatListDrawerProps> = ({
  user,
  chats,
  activeChatId,
  onSelectChat,
  onCreateChat,
  onRenameChat,
  onDeleteChat,
  onOpenAuth,
  onLogout,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  if (!isOpen) return null;

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEditing = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить этот чат?')) {
      onDeleteChat(chatId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-80 sm:w-96 bg-[#121620] border-r border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#151a24]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
                База данных чатов
              </h2>
              <p className="text-[11px] text-slate-400">
                {user ? `Аккаунт: ${user.displayName}` : 'Войдите для сохранения истории'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Account / Auth Section */}
        <div className="p-3 border-b border-slate-800 bg-[#0f131c]">
          {user ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border border-indigo-500/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {user.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-white truncate">
                    {user.displayName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Выйти из аккаунта"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-300">
                Войдите или зарегистрируйтесь, чтобы создать базу данных чатов:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onOpenAuth}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Регистрация</span>
                </button>
                <button
                  onClick={onOpenAuth}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Вход</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* New Chat Button & Search */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <button
            onClick={() => {
              onCreateChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-indigo-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Создать новый чат</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по названию чата..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 text-slate-600" />
              <span>{searchTerm ? 'Ничего не найдено' : 'У вас пока нет сохраненных чатов'}</span>
              <button
                onClick={() => {
                  onCreateChat();
                  onClose();
                }}
                className="mt-2 px-3 py-1 bg-indigo-600/30 text-indigo-300 rounded-lg hover:bg-indigo-600/50 transition"
              >
                Создать первый чат
              </button>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = editingChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectChat(chat.id);
                      onClose();
                    }
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white font-medium shadow-sm'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveTitle(chat.id, e)}
                        className="flex items-center gap-1 flex-1 mr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white w-full focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingChatId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">{chat.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>
                            {new Date(chat.updatedAt).toLocaleDateString([], {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button
                        onClick={(e) => startEditing(chat, e)}
                        title="Переименовать чат"
                        className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(chat.id, e)}
                        title="Удалить чат"
                        className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-[#0d1017] text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>База данных активна</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {chats.length} {chats.length === 1 ? 'чат' : 'чатов'}
          </span>
        </div>
      </div>

      {/* Backdrop closer */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
