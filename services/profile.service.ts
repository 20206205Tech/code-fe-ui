import { apiHelper } from '@/lib/api-helper';

export const profileService = {
  getProfile: async (userId: string, accessToken: string) => {
    const data = await apiHelper.get<any[]>(
      `/supabase/rest/v1/profiles?id=eq.${userId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data[0] || null;
  },

  updateProfile: async (
    userId: string,
    accessToken: string,
    payload: { full_name?: string; avatar_url?: string }
  ) => {
    const data = await apiHelper.patch<any[]>(
      `/supabase/rest/v1/profiles?id=eq.${userId}`,
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

  uploadAvatar: async (userId: string, accessToken: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const storagePath = `/supabase/storage/v1/object/avatars/${fileName}`;

    await apiHelper.post(storagePath, file, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': file.type,
      },
    });

    return `/api/backend/supabase/storage/v1/object/public/avatars/${fileName}`;
  },
};
