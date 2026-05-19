import { apiHelper } from '@/lib/api-helper';
import { TOKEN_STORAGE_KEY } from '@/config/app.config';
import {
  API_GATEWAY_PREFIX,
  CODE_CONVERSATION_SERVICE_NAME,
} from '@/config/api.constants';
import { cookieHelper } from '@/lib/cookie-helper';

export interface StreamUpdate {
  type: 'status' | 'content' | 'metadata';
  message: any;
}

const CONVERSATION_BASE = `/${CODE_CONVERSATION_SERVICE_NAME}/chats`;
const BOOKMARK_BASE = `/${CODE_CONVERSATION_SERVICE_NAME}/bookmarks`;
const SHARE_BASE = `/${CODE_CONVERSATION_SERVICE_NAME}/shared-chats`;

const getAuthToken = () => {
  const storedToken = cookieHelper.get(TOKEN_STORAGE_KEY);
  if (storedToken && storedToken.access_token) return storedToken.access_token;

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

export const conversationService = {
  // Chat methods
  startChat: () => {
    return apiHelper.post<{ chatId: string; createdAt: string }>(
      `${CONVERSATION_BASE}/start`
    );
  },

  streamChat: async (
    chatId: string,
    query: string,
    fileIds: string[],
    useReasoning: boolean,
    onUpdate: (update: StreamUpdate) => void
  ) => {
    const token = getAuthToken();
    const response = await fetch(
      `${API_GATEWAY_PREFIX}${CONVERSATION_BASE}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chat_id: chatId,
          query,
          file_ids: fileIds,
          use_reasoning: useReasoning,
        }),
      }
    );

    if (!response.ok) throw new Error('Failed to stream chat');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) return;

    const processLine = (line: string) => {
      if (line.startsWith('data: ')) {
        const currentData = line.substring(6);
        try {
          const parsed = JSON.parse(currentData);
          const update = parsed.data || parsed;
          
          // Bỏ qua tin nhắn heartbeat
          if (update.type === 'heartbeat') {
            console.log('💓 Heartbeat received');
            return;
          }
          
          onUpdate(update);
        } catch (e) {
          console.error('Error parsing stream chunk:', e);
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) processLine(line);
    }

    if (buffer) processLine(buffer);
  },

  deleteChat: (chatId: string) => {
    return apiHelper.delete<void>(`${CONVERSATION_BASE}/${chatId}`);
  },

  getVoiceSessionToken: (
    chatId: string,
    fileIds: string[] = [],
    useReasoning: boolean = false,
    voiceId?: string
  ) => {
    return apiHelper.get<{ token: string; serverUrl: string }>(
      `${CONVERSATION_BASE}/${chatId}/voice-token`,
      {
        params: {
          file_ids: fileIds,
          use_reasoning: useReasoning,
          voice_id: voiceId,
        },
      }
    );
  },

  // Bookmark methods
  getBookmarkFolders: (skip = 0, limit = 100) => {
    return apiHelper.get<any[]>(`${BOOKMARK_BASE}`, {
      params: { skip, limit },
    });
  },

  createBookmarkFolder: (folderName: string) => {
    return apiHelper.post<any>(`${BOOKMARK_BASE}`, { folderName });
  },

  addBookmarkItem: (folderId: string, chatId: string, note: string) => {
    return apiHelper.put<any>(`${BOOKMARK_BASE}/${folderId}/item`, {
      chatId,
      note,
    });
  },

  removeBookmarkItem: (folderId: string, chatId: string) => {
    return apiHelper.delete<void>(
      `${BOOKMARK_BASE}/${folderId}/item/${chatId}`
    );
  },

  getBookmarkDetail: (folderId: string) => {
    return apiHelper.get<any>(`${BOOKMARK_BASE}/${folderId}`);
  },

  // Share methods
  generateShareLink: (chatId: string) => {
    return apiHelper.post<{ shareId: string; token: string }>(`${SHARE_BASE}`, {
      chat_id: chatId,
    });
  },

  getMySharedChats: (skip = 0, limit = 100) => {
    return apiHelper.get<any>(`${SHARE_BASE}/me`, {
      params: { skip, limit },
    });
  },

  getPublicShareDetail: async (shareId: string, token: string) => {
    try {
      return await apiHelper.get<any>(
        `${SHARE_BASE}/public/${shareId}/${token}`
      );
    } catch (error) {
      throw new Error('Shared chat not found or expired');
    }
  },

  revokeShare: (shareId: string) => {
    return apiHelper.delete<void>(`${SHARE_BASE}/${shareId}`);
  },
};
