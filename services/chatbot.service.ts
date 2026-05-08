import { apiHelper } from '@/lib/api-helper';
import { CODE_CHATBOT_SERVICE_NAME } from '@/config/api.constants';

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

const CHATBOT_BASE = `/${CODE_CHATBOT_SERVICE_NAME}/chats`;

export const chatbotService = {
  getHistory: () => {
    return apiHelper.get<ChatSession[]>(`${CHATBOT_BASE}`);
  },

  getChatMessages: (chatId: string) => {
    return apiHelper.get<ChatMessage[]>(`${CHATBOT_BASE}/${chatId}`);
  },
};
