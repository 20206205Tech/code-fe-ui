import { apiHelper } from '@/lib/api-helper';
import { CODE_CHATBOT_SERVICE_NAME } from '@/config/api.constants';

export interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

export interface APIChatMessage {
  id: string;
  role: 'human' | 'ai';
  persona_id: string | null;
  content: string;
  created_at: string;
  reasoning_steps?: { content: string; step_order: number }[];
  sources?: any[];
}

const CHATBOT_BASE = `/${CODE_CHATBOT_SERVICE_NAME}/chats`;

export const chatbotService = {
  getHistory: (skip?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append('skip', skip.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    const query = params.toString();
    return apiHelper.get<ChatSession[]>(
      `${CHATBOT_BASE}${query ? `?${query}` : ''}`
    );
  },

  getChatMessages: (chatId: string, beforeId?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (beforeId) params.append('before_id', beforeId);
    if (limit !== undefined) params.append('limit', limit.toString());
    const query = params.toString();
    return apiHelper.get<APIChatMessage[]>(
      `${CHATBOT_BASE}/${chatId}${query ? `?${query}` : ''}`
    );
  },
};
