import { apiHelper } from '@/lib/api-helper';

export interface SettingItem {
  key: string;
  value: string;
}

export const settingsService = {
  getSettings: (accessToken: string): Promise<SettingItem[]> => {
    return apiHelper.get<SettingItem[]>('/settings', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  updateSettings: (
    accessToken: string,
    settings: SettingItem[]
  ): Promise<void> => {
    return apiHelper.post<void>('/settings', settings, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },
};
