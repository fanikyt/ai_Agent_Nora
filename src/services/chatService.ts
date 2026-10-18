import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { ChatSession, ChatMessage, AgentMode, UserProfile } from '../types';

/**
 * Authentication Methods
 */
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Sync user profile to Firestore
  await syncUserProfile(user);
  return user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function syncUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      const profile: UserProfile = {
        id: user.uid,
        email: user.email || 'anonymous@user.com',
        displayName: user.displayName || 'Пользователь',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, profile);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Chat Session Management
 */
export async function createChatSession(
  ownerId: string,
  title = 'Новый чат',
  model = 'gemini-3.8-flash',
  mode: AgentMode = 'agent'
): Promise<string> {
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const chatRef = doc(db, 'chats', chatId);
  const path = `chats/${chatId}`;

  const now = new Date().toISOString();
  const chatData: ChatSession = {
    id: chatId,
    title: title.slice(0, 150),
    ownerId,
    createdAt: now,
    updatedAt: now,
    model,
    mode,
  };

  try {
    await setDoc(chatRef, chatData);
    return chatId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateChatTitle(chatId: string, newTitle: string): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  const path = `chats/${chatId}`;
  try {
    await updateDoc(chatRef, {
      title: newTitle.trim().slice(0, 150),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function deleteChatSession(chatId: string): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  const path = `chats/${chatId}`;

  try {
    // Delete messages subcollection documents
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const msgSnap = await getDocs(messagesRef);
    for (const d of msgSnap.docs) {
      await deleteDoc(d.ref);
    }
    // Delete main chat document
    await deleteDoc(chatRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export function subscribeToUserChats(
  userId: string,
  onChatsUpdate: (chats: ChatSession[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = 'chats';
  const q = query(
    collection(db, 'chats'),
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats: ChatSession[] = [];
      snapshot.forEach((d) => {
        chats.push(d.data() as ChatSession);
      });
      onChatsUpdate(chats);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToChatMessages(
  chatId: string,
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `chats/${chatId}/messages`;
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        msgs.push({
          id: data.id,
          role: data.role,
          content: data.content,
          timestamp: new Date(data.createdAt).getTime(),
          actions: data.actions || undefined,
          modelUsed: data.modelUsed || undefined,
        });
      });
      onMessagesUpdate(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export async function addMessageToChat(
  chatId: string,
  message: ChatMessage,
  senderId: string
): Promise<void> {
  const messageId = message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  const path = `chats/${chatId}/messages/${messageId}`;

  const payload: any = {
    id: messageId,
    chatId,
    role: message.role,
    content: message.content,
    senderId,
    createdAt: new Date(message.timestamp || Date.now()).toISOString(),
  };

  if (message.actions) {
    payload.actions = message.actions;
  }
  if (message.modelUsed) {
    payload.modelUsed = message.modelUsed;
  }

  try {
    await setDoc(msgRef, payload);
    // Touch chat document's updatedAt
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}
