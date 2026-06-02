import {
  API_GATEWAY_PREFIX,
  CODE_CONVERSATION_SERVICE_NAME,
} from '@/config/api.constants';
import { TOKEN_STORAGE_KEY } from '@/config/app.config';
import { apiHelper } from '@/lib/api-helper';
import { cookieHelper } from '@/lib/cookie-helper';

export interface StreamUpdate {
  type: 'status' | 'content' | 'metadata' | 'status_update' | 'content_chunk';
  message?: any;
  content?: string;
  sources?: any[];
  full_answer?: string;
  pending_confirmation?: boolean;
}

export interface SharedChat {
  shareId: string;
  chatId: string;
  shareUrl: string;
  status: string;
  isActive: boolean;
  createdAt: string;
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

    if (!response.ok) {
      // Đọc body lỗi để lấy message cụ thể từ server
      let errorMessage = 'Đã xảy ra lỗi khi kết nối với máy chủ.';
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message || errorBody?.error || errorMessage;
      } catch {
        // body không phải JSON, dùng message mặc định
      }
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) return;

    const processLine = (line: string): Error | 'BREAK' | null => {
      if (!line.startsWith('data: ')) return null;

      const currentData = line.substring(6).trim();
      if (!currentData) return null;

      // Thử parse JSON trước
      try {
        const parsed = JSON.parse(currentData);
        const update = parsed.data || parsed;

        if (update.type === 'heartbeat') {
          console.log('💓 Heartbeat received');
          return null;
        }

        // NestJS SSE có thể serialize lỗi với statusCode hoặc status
        const statusCode = update.statusCode || update.status;
        if (statusCode && statusCode >= 400) {
          const err = new Error(
            Array.isArray(update.message)
              ? update.message.join(', ')
              : update.message || 'Đã xảy ra lỗi từ máy chủ.'
          );
          (err as any).status = statusCode;
          return err;
        }

        onUpdate(update);

        if (update.type === 'metadata' && update.full_answer) {
          console.log('🏁 Stream completed via metadata.full_answer');
          return 'BREAK';
        }
      } catch {
        // Một số backend gửi marker kết thúc stream dạng text
        if (currentData === '[DONE]') return 'BREAK';

        // Chỉ coi là lỗi khi text có tín hiệu lỗi rõ ràng
        const looksLikeError =
          /exception|error|forbidden|unauthorized|denied|invalid|failed/i.test(
            currentData
          );
        if (looksLikeError) {
          console.warn('[SSE] Non-JSON error data received:', currentData);
          const err = new Error(currentData);
          (err as any).status = 500;
          return err;
        }

        // Fallback: xử lý text thuần như content chunk thay vì ném lỗi giả
        onUpdate({
          type: 'content_chunk',
          content: currentData,
          message: currentData,
        });
      }

      return null;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const result = processLine(line);
        if (result instanceof Error) throw result;
        if (result === 'BREAK') {
          await reader.cancel();
          return;
        }
      }
    }

    if (buffer) {
      const result = processLine(buffer);
      if (result instanceof Error) throw result;
      if (result === 'BREAK') {
        await reader.cancel();
        return;
      }
    }
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
  generateShareLink: (chatId: string, lastMessageId?: string | null) =>
    apiHelper.post<{
      shareId: string;
      chatId: string;
      status: string;
      shareUrl: string;
    }>(`${SHARE_BASE}`, {
      chat_id: chatId,
      last_message_id: lastMessageId || undefined,
    }),

  getMySharedChats: (skip = 0, limit = 100) => {
    return apiHelper.get<SharedChat[]>(`${SHARE_BASE}`, {
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
