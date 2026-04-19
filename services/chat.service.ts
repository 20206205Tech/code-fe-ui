import apiClient from '@/lib/api-client';
import { TOKEN_STORAGE_KEY } from '@/config/app.config';
import { cookieHelper } from '@/lib/cookie-helper';

export interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'human' | 'ai';
  content: string;
  created_at: string;
}

export interface StreamUpdate {
  type: 'status' | 'content' | 'metadata';
  message: any;
}

const CONVERSATION_BASE = '/conversation/chats';
const CHATBOT_BASE = '/chatbot/chats';

const getAuthToken = () => {
  const storedToken = cookieHelper.get(TOKEN_STORAGE_KEY);
  if (storedToken && storedToken.access_token) {
    return storedToken.access_token;
  }
  if (typeof window !== 'undefined') {
    const authTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (authTokens) {
      try {
        return JSON.parse(authTokens).access_token;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

export const chatService = {
  // Conversation Service: Interaction
  startChat: async () => {
    const response = await apiClient.post<{
      message: string;
      data: { chatId: string; createdAt: string };
    }>(`${CONVERSATION_BASE}/start`);
    return response.data.data;
  },

  streamChat: async (
    chatId: string,
    query: string,
    fileIds: string[],
    onUpdate: (update: StreamUpdate) => void
  ) => {
    const token = getAuthToken();
    const response = await fetch(`/api/backend${CONVERSATION_BASE}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        chat_id: chatId,
        query,
        file_ids: fileIds,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to stream chat');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentData = '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          currentData = line.substring(6);
          try {
            const parsed = JSON.parse(currentData);
            onUpdate(parsed);
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
          }
        }
      }
    }
  },

  deleteChat: async (chatId: string) => {
    await apiClient.delete(`${CONVERSATION_BASE}/${chatId}`);
  },

  // Bookmark Services (/conversation/bookmarks)
  getBookmarkFolders: async (skip = 0, limit = 100) => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      '/conversation/bookmarks',
      { params: { skip, limit } }
    );
    return response.data.data;
  },

  createBookmarkFolder: async (folderName: string) => {
    const response = await apiClient.post('/conversation/bookmarks', {
      folderName,
    });
    return response.data;
  },

  addBookmarkItem: async (folderId: string, chatId: string, note: string) => {
    const response = await apiClient.put(
      `/conversation/bookmarks/${folderId}/item`,
      {
        chatId,
        note,
      }
    );
    return response.data;
  },

  removeBookmarkItem: async (folderId: string, chatId: string) => {
    await apiClient.delete(
      `/conversation/bookmarks/${folderId}/item/${chatId}`
    );
  },

  getBookmarkDetail: async (folderId: string) => {
    const response = await apiClient.get(`/conversation/bookmarks/${folderId}`);
    return response.data.data;
  },

  // Share Services (/conversation/shared-chats)
  generateShareLink: async (chatId: string) => {
    const response = await apiClient.post<{
      data: { shareId: string; token: string };
    }>('/conversation/shared-chats', { chat_id: chatId });
    return response.data.data;
  },

  getMySharedChats: async (skip = 0, limit = 100) => {
    const response = await apiClient.get('/conversation/shared-chats/me', {
      params: { skip, limit },
    });
    return response.data;
  },

  getPublicShareDetail: async (shareId: string, token: string) => {
    const response = await fetch(
      `/api/backend/conversation/shared-chats/public/${shareId}/${token}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error('Shared chat not found or expired');
    return await response.json();
  },

  // Chatbot Service: Persistence
  getHistory: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: ChatSession[];
    }>(`${CHATBOT_BASE}`);
    return response.data.data;
  },

  getChatMessages: async (chatId: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: ChatMessage[];
    }>(`${CHATBOT_BASE}/${chatId}`);
    return response.data.data;
  },
};
