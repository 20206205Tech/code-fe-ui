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
  voice_id: string | null;
  content: string;
  created_at: string;
  reasoning_steps?: { content: string; step_order: number }[];
  sources?: any[];
}

const CHATBOT_BASE = `/${CODE_CHATBOT_SERVICE_NAME}/chats`;

export const chatbotService = {
  getHistory: () => {
    return apiHelper.get<ChatSession[]>(`${CHATBOT_BASE}`);
  },

  getChatMessages: (chatId: string) => {
    return apiHelper.get<APIChatMessage[]>(`${CHATBOT_BASE}/${chatId}`);
  },
};
