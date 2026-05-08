import { apiHelper } from '@/lib/api-helper';

export const chatShareService = {
  generateShareLink: (chatId: string) => {
    return apiHelper.post<{ shareId: string; token: string }>(
      '/conversation/shared-chats',
      { chat_id: chatId }
    );
  },

  getMySharedChats: (skip = 0, limit = 100) => {
    return apiHelper.get<any>('/conversation/shared-chats/me', {
      params: { skip, limit },
    });
  },

  getPublicShareDetail: async (shareId: string, token: string) => {
    try {
      // Dùng chung apiHelper để tận dụng logic bắt lỗi và lấy data
      return await apiHelper.get<any>(
        `/api/backend/conversation/shared-chats/public/${shareId}/${token}`
      );
    } catch (error) {
      throw new Error('Shared chat not found or expired');
    }
  },

  revokeShare: (shareId: string) => {
    return apiHelper.delete<void>(`/conversation/shared-chats/${shareId}`);
  },
};
