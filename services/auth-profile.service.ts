import {
  API_GATEWAY_PREFIX,
  SUPABASE_AUTH_SERVICE_NAME,
} from '@/config/api.constants';
import { apiHelper } from '@/lib/api-helper';

export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

export const authProfileService = {
  getProfile: async (
    userId: string,
    accessToken: string
  ): Promise<UserProfile | null> => {
    const data = await apiHelper.get<UserProfile[]>(
      `/${SUPABASE_AUTH_SERVICE_NAME}/rest/v1/profiles?id=eq.${userId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data[0] || null;
  },

  updateProfile: async (
    userId: string,
    accessToken: string,
    payload: { full_name?: string; avatar_url?: string }
  ): Promise<UserProfile> => {
    const data = await apiHelper.patch<UserProfile[]>(
      `/${SUPABASE_AUTH_SERVICE_NAME}/rest/v1/profiles?id=eq.${userId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'return=representation',
        },
      }
    );
    return data[0];
  },

  uploadAvatar: async (
    userId: string,
    accessToken: string,
    file: File
  ): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const storagePath = `/${SUPABASE_AUTH_SERVICE_NAME}/storage/v1/object/avatars/${fileName}`;

    await apiHelper.post(storagePath, file, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': file.type,
      },
    });

    return `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/storage/v1/object/public/avatars/${fileName}`;
  },
};
