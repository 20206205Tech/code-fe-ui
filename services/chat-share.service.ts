import apiClient from '@/lib/api-client';

export const chatShareService = {
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

  revokeShare: async (shareId: string) => {
    await apiClient.delete(`/conversation/shared-chats/${shareId}`);
  },
};
