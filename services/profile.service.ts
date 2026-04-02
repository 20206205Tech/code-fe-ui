import { BaseApiUrl } from '@/config/env.config';

export const profileService = {
  // Lấy profile từ table 'profiles' thay vì từ Auth Token
  getProfile: async (userId: string, accessToken: string) => {
    const response = await fetch(
      `${BaseApiUrl()}/supabase/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch profile');
    const data = await response.json();
    return data[0] || null;
  },

  // Cập nhật tên (full_name) vào Database
  updateProfile: async (
    userId: string,
    accessToken: string,
    payload: { full_name?: string; avatar_url?: string }
  ) => {
    const response = await fetch(
      `${BaseApiUrl()}/supabase/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) throw new Error('Update profile failed');
    const data = await response.json();
    return data[0];
  },

  // Upload ảnh vào Storage và trả về Public URL
  uploadAvatar: async (userId: string, accessToken: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const storageUrl = `${BaseApiUrl()}/supabase/storage/v1/object/avatars/${fileName}`;

    const response = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) throw new Error('Upload failed');

    // Trả về Public URL tương tự mã Python
    return `${BaseApiUrl()}/supabase/storage/v1/object/public/avatars/${fileName}`;
  },
};
