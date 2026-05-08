import { apiHelper } from '@/lib/api-helper';
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

export const chatService = {
  startChat: () => {
    return apiHelper.post<{ chatId: string; createdAt: string }>(
      `${CONVERSATION_BASE}/start`
    );
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
      body: JSON.stringify({ chat_id: chatId, query, file_ids: fileIds }),
    });

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
          onUpdate(parsed.data || parsed);
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

  getHistory: () => {
    return apiHelper.get<ChatSession[]>(`${CHATBOT_BASE}`);
  },

  getChatMessages: (chatId: string) => {
    return apiHelper.get<ChatMessage[]>(`${CHATBOT_BASE}/${chatId}`);
  },
};
