import apiClient from '@/lib/api-client';

export const chatBookmarkService = {
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
};
