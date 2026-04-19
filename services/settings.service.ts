import apiClient from '@/lib/api-client';

export interface SettingItem {
  key: string;
  value: string;
}

export const settingsService = {
  getSettings: async (accessToken: string): Promise<SettingItem[]> => {
    try {
      const response = await apiClient.get('/settings', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data || {};
      throw new Error(
        `Failed to fetch settings: ${errorData.message || error.message}`
      );
    }
  },

  updateSettings: async (
    accessToken: string,
    settings: SettingItem[]
  ): Promise<void> => {
    try {
      await apiClient.post('/settings', settings, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error: any) {
      const errorData = error.response?.data || {};
      throw new Error(
        `Failed to update settings: ${errorData.message || error.message}`
      );
    }
  },
};
