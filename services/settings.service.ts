import { apiHelper } from '@/lib/api-helper';
import { NEON_SETTING_SERVICE_NAME } from '@/config/api.constants';

export interface SettingItem {
  key: string;
  value: string;
}

export const settingsService = {
  getSettings: (accessToken: string): Promise<SettingItem[]> => {
    return apiHelper.get<SettingItem[]>(`/${NEON_SETTING_SERVICE_NAME}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  updateSettings: (
    accessToken: string,
    settings: SettingItem[]
  ): Promise<void> => {
    return apiHelper.post<void>(`/${NEON_SETTING_SERVICE_NAME}`, settings, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },
};
