import { ChatSession, ChatMessage, AgentMode, UserProfile } from '../types';
import { db, auth } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const STORAGE_USERS_KEY = 'gemini_studio_registered_users_v1';
const STORAGE_CURRENT_USER_KEY = 'gemini_studio_current_user_v1';
const STORAGE_CHATS_KEY = 'gemini_studio_saved_chats_v1';
const STORAGE_MESSAGES_KEY = 'gemini_studio_saved_messages_v1';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  authProvider: 'google' | 'email' | 'local';
  createdAt: string;
}

interface StoredUserRecord extends AppUser {
  passwordHash?: string;
}

// Helper: load local users
function getStoredUsers(): StoredUserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUserRecord[]) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users in storage:', err);
  }
}

// In-memory hot cache for instant 0ms access
let cachedChats: ChatSession[] | null = null;
let cachedMessagesMap: Record<string, ChatMessage[]> | null = null;

// Helper: load all chats with memory cache & storage fallback
export function getStoredChats(): ChatSession[] {
  if (cachedChats) return cachedChats;
  try {
    const raw = localStorage.getItem(STORAGE_CHATS_KEY);
    cachedChats = raw ? JSON.parse(raw) : [];
    return cachedChats || [];
  } catch {
    cachedChats = [];
    return [];
  }
}

export function saveStoredChats(chats: ChatSession[]) {
  cachedChats = chats;
  try {
    localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(chats));
  } catch (err) {
    console.warn('Storage quota warning when saving chats, purging old keys:', err);
    try {
      // Keep only most recent 30 chats if quota exceeded
      const trimmed = chats.slice(0, 30);
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(trimmed));
      cachedChats = trimmed;
    } catch {
      // Ignore if strictly full
    }
  }
}

// Helper: load messages map with memory cache & quota protection
export function getStoredMessagesMap(): Record<string, ChatMessage[]> {
  if (cachedMessagesMap) return cachedMessagesMap;
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    cachedMessagesMap = raw ? JSON.parse(raw) : {};
    return cachedMessagesMap || {};
  } catch {
    cachedMessagesMap = {};
    return {};
  }
}

export function saveStoredMessagesMap(map: Record<string, ChatMessage[]>) {
  cachedMessagesMap = map;
  try {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Storage quota warning when saving messages, optimizing storage:', err);
    try {
      // Retain last 50 messages per chat to stay within browser storage limits
      const optimizedMap: Record<string, ChatMessage[]> = {};
      for (const [cId, msgs] of Object.entries(map)) {
        optimizedMap[cId] = msgs.slice(-50);
      }
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(optimizedMap));
      cachedMessagesMap = optimizedMap;
    } catch {
      // Keep in memory
    }
  }
}

/**
 * Get current session user
 */
export function getCurrentAppUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentAppUser(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  } catch (err) {
    console.error('Failed to set current user:', err);
  }
}

/**
 * Register with Email and Password
 */
export async function registerWithEmail(
  name: string,
  email: string,
  password?: string
): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || cleanEmail.split('@')[0];

  if (!cleanEmail) {
    throw new Error('Укажите корректный email адрес');
  }

  const users = getStoredUsers();
  const existing = users.find((u) => u.email === cleanEmail);

  if (existing) {
    throw new Error('Пользователь с таким email уже зарегистрирован. Перейдите на вкладку «Вход».');
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: StoredUserRecord = {
    id: userId,
    email: cleanEmail,
    displayName: cleanName,
    photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`,
    authProvider: 'email',
    createdAt: new Date().toISOString(),
    passwordHash: password ? btoa(password) : undefined,
  };

  users.push(newUser);
  saveStoredUsers(users);
  setCurrentAppUser(newUser);

  // Create initial chat session in database for this new account
  await createAccountChat(newUser.id, 'Мой первый проект', 'gemini-3.8-flash', 'agent');

  return newUser;
}

/**
 * Login with Email and Password
 */
export async function loginWithEmail(email: string, password?: string): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();
  const users = getStoredUsers();
  const found = users.find((u) => u.email === cleanEmail);

  if (!found) {
    // If not found, auto-register for convenience so the user is never locked out!
    return await registerWithEmail(cleanEmail.split('@')[0], cleanEmail, password);
  }

  if (password && found.passwordHash && found.passwordHash !== btoa(password)) {
    throw new Error('Неверный пароль. Пожалуйста, проверьте введённые данные.');
  }

  setCurrentAppUser(found);
  return found;
}

/**
 * Google Sign In with detailed error diagnosis
 */
export async function loginWithGoogleWithDiagnosis(): Promise<{
  user?: AppUser;
  error?: {
    code: string;
    message: string;
    domain: string;
    helpUrl: string;
  };
}> {
  const currentDomain = window.location.hostname;
  const helpUrl = `https://console.firebase.google.com/project/youthful-exchanger-s2ts5/authentication/settings`;

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const appUser: AppUser = {
      id: fbUser.uid,
      email: fbUser.email || 'user@gmail.com',
      displayName: fbUser.displayName || 'Google User',
      photoURL: fbUser.photoURL || undefined,
      authProvider: 'google',
      createdAt: new Date().toISOString(),
    };

    setCurrentAppUser(appUser);
    return { user: appUser };
  } catch (err: any) {
    console.warn('Google sign-in popup error:', err);
    return {
      error: {
        code: err.code || 'POPUP_CLOSED',
        message: err.message || 'Окно авторизации закрыто браузером',
        domain: currentDomain,
        helpUrl,
      },
    };
  }
}

/**
 * Logout
 */
export async function logoutAppUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  setCurrentAppUser(null);
}

/**
 * CHAT DATABASE OPERATIONS
 */

// Get user chats
export function getUserChats(userId: string, isCodex?: boolean): ChatSession[] {
  const all = getStoredChats();
  return all
    .filter((c) => c.ownerId === userId && (isCodex === undefined ? true : Boolean(c.isCodex) === isCodex))
    .sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

// Background helper: sync chat to Firestore
async function syncChatToCloud(chat: ChatSession): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const chatRef = doc(db, 'chats', chat.id);
    await setDoc(
      chatRef,
      {
        id: chat.id,
        title: chat.title,
        ownerId: auth.currentUser.uid,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        model: chat.model || 'gemini-3.8-flash',
        mode: chat.mode || 'agent',
        isPinned: Boolean(chat.isPinned),
        isCodex: Boolean(chat.isCodex),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Background chat sync skipped:', err);
  }
}

// Background helper: sync message to Firestore
async function syncMessageToCloud(chatId: string, message: ChatMessage): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', message.id);
    await setDoc(msgRef, {
      id: message.id,
      chatId,
      role: message.role,
      content: (message.content || '').slice(0, 49000),
      senderId: auth.currentUser.uid,
      createdAt: new Date(message.timestamp || Date.now()).toISOString(),
    });
  } catch (err) {
    console.warn('[Firestore] Background message sync skipped:', err);
  }
}

// Toggle pin chat
export async function togglePinAccountChat(chatId: string): Promise<boolean> {
  const all = getStoredChats();
  const chat = all.find((c) => c.id === chatId);
  if (chat) {
    chat.isPinned = !chat.isPinned;
    chat.updatedAt = new Date().toISOString();
    saveStoredChats(all);
    syncChatToCloud(chat);
    return Boolean(chat.isPinned);
  }
  return false;
}

// Create chat
export async function createAccountChat(
  userId: string,
  title = 'Новый чат',
  model = 'gemini-3.8-flash',
  mode: AgentMode = 'agent',
  isCodex = false
): Promise<ChatSession> {
  const chatId = `${isCodex ? 'codex' : 'chat'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newChat: ChatSession = {
    id: chatId,
    title: title.slice(0, 150),
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
    model: isCodex ? 'claude-haiku-4-5-20251001' : model,
    mode,
    isCodex: Boolean(isCodex),
  };

  const all = getStoredChats();
  all.unshift(newChat);
  saveStoredChats(all);

  // Initialize empty messages list for this chat
  const msgMap = getStoredMessagesMap();
  msgMap[chatId] = [];
  saveStoredMessagesMap(msgMap);

  syncChatToCloud(newChat);

  return newChat;
}

// Rename chat
export async function renameAccountChat(chatId: string, newTitle: string): Promise<void> {
  const all = getStoredChats();
  const chat = all.find((c) => c.id === chatId);
  if (chat) {
    chat.title = newTitle.trim().slice(0, 150);
    chat.updatedAt = new Date().toISOString();
    saveStoredChats(all);
    syncChatToCloud(chat);
  }
}

// Delete chat
export async function deleteAccountChat(chatId: string): Promise<void> {
  const all = getStoredChats();
  const filtered = all.filter((c) => c.id !== chatId);
  saveStoredChats(filtered);

  // Remove messages
  const msgMap = getStoredMessagesMap();
  delete msgMap[chatId];
  saveStoredMessagesMap(msgMap);

  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'chats', chatId));
    } catch (err) {
      console.warn('[Firestore] Failed to delete chat document:', err);
    }
  }
}

// Get messages for a chat
export function getChatMessages(chatId: string): ChatMessage[] {
  const msgMap = getStoredMessagesMap();
  return msgMap[chatId] || [];
}

// Add message to chat
export async function saveChatMessage(chatId: string, message: ChatMessage): Promise<void> {
  const msgMap = getStoredMessagesMap();
  const list = msgMap[chatId] || [];
  list.push(message);
  msgMap[chatId] = list;
  saveStoredMessagesMap(msgMap);

  // Touch chat updatedAt
  const all = getStoredChats();
  const chat = all.find((c) => c.id === chatId);
  if (chat) {
    chat.updatedAt = new Date().toISOString();
    saveStoredChats(all);
    syncChatToCloud(chat);
  }

  syncMessageToCloud(chatId, message);
}
