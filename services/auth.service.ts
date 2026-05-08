import {
  API_GATEWAY_PREFIX,
  SUPABASE_AUTH_SERVICE_NAME,
} from '@/config/api.constants';
import { apiHelper } from '@/lib/api-helper';
import axios from 'axios';

export const authService = {
  loginWithGoogle: () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'https://api.20206205.tech/api';
    const endpoint = process.env.NODE_ENV === 'development' ? '/dev' : '/prod';
    const realBackendUrl = `${baseUrl}${endpoint}`;

    const authUrl = new URL(
      `${realBackendUrl}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/authorize`
    );
    authUrl.searchParams.append('provider', 'google');
    const redirectUrl = `${window.location.origin}/auth/callback`;
    authUrl.searchParams.append('redirect_to', redirectUrl);
    window.location.href = authUrl.toString();
  },

  refreshAccessToken: async (currentRefreshToken: string) => {
    try {
      const response = await axios.post(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/token?grant_type=refresh_token`,
        { refresh_token: currentRefreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'Token refresh failed:',
        error.response?.data || error.message
      );
      throw new Error('Token refresh failed');
    }
  },

  getProfile: async (userId: string, accessToken: string) => {
    const data = await apiHelper.get<any[]>(
      `/${SUPABASE_AUTH_SERVICE_NAME}/rest/v1/profiles?id=eq.${userId}`,
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

  uploadAvatar: async (userId: string, accessToken: string, file: File) => {
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
