import apiClient from '@/lib/api-client';

export const profileService = {
  // Lấy profile từ table 'profiles' thay vì từ Auth Token
  getProfile: async (userId: string, accessToken: string) => {
    try {
      const response = await apiClient.get(
        `/supabase/rest/v1/profiles?id=eq.${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data[0] || null;
    } catch (error: any) {
      throw new Error('Failed to fetch profile');
    }
  },

  // Cập nhật tên (full_name) vào Database
  updateProfile: async (
    userId: string,
    accessToken: string,
    payload: { full_name?: string; avatar_url?: string }
  ) => {
    try {
      const response = await apiClient.patch(
        `/supabase/rest/v1/profiles?id=eq.${userId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'return=representation',
          },
        }
      );
      return response.data[0];
    } catch (error: any) {
      throw new Error('Update profile failed');
    }
  },

  // Upload ảnh vào Storage và trả về Public URL
  uploadAvatar: async (userId: string, accessToken: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const storagePath = `/supabase/storage/v1/object/avatars/${fileName}`;

    try {
      await apiClient.post(storagePath, file, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': file.type,
        },
      });

      // Trả về Public URL thông qua PROXY để bảo mật URL gốc
      return `/api/backend/supabase/storage/v1/object/public/avatars/${fileName}`;
    } catch (error: any) {
      throw new Error('Upload failed');
    }
  },
};
