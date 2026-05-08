import { apiHelper } from '@/lib/api-helper';

export const chatBookmarkService = {
  getBookmarkFolders: (skip = 0, limit = 100) => {
    return apiHelper.get<any[]>('/conversation/bookmarks', {
      params: { skip, limit },
    });
  },

  createBookmarkFolder: (folderName: string) => {
    return apiHelper.post<any>('/conversation/bookmarks', { folderName });
  },

  addBookmarkItem: (folderId: string, chatId: string, note: string) => {
    return apiHelper.put<any>(`/conversation/bookmarks/${folderId}/item`, {
      chatId,
      note,
    });
  },

  removeBookmarkItem: (folderId: string, chatId: string) => {
    return apiHelper.delete<void>(
      `/conversation/bookmarks/${folderId}/item/${chatId}`
    );
  },

  getBookmarkDetail: (folderId: string) => {
    return apiHelper.get<any>(`/conversation/bookmarks/${folderId}`);
  },
};
