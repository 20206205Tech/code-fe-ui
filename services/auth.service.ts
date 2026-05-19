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

  loginWithEmailPassword: async (email: string, password: string) => {
    try {
      const response = await axios.post(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/token?grant_type=password`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.error_code === 'invalid_credentials') {
        throw new Error('Sai thông tin đăng nhập hoặc chưa xác nhận mail');
      }

      console.error('Email login failed:', errorData || error.message);
      throw new Error(
        errorData?.error_description || errorData?.msg || 'Đăng nhập thất bại'
      );
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      const redirectUrl = encodeURIComponent(
        `${window.location.origin}/auth/callback`
      );
      const response = await axios.post(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/signup?redirect_to=${redirectUrl}`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: any) {
      console.error('Signup failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Đăng ký thất bại');
    }
  },

  recoverPassword: async (email: string) => {
    try {
      const redirectUrl = encodeURIComponent(
        `${window.location.origin}/auth/callback`
      );
      const response = await axios.post(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/recover?redirect_to=${redirectUrl}`,
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'Password recovery failed:',
        error.response?.data || error.message
      );
      throw new Error(error.response?.data?.msg || 'Password recovery failed');
    }
  },

  updateUserPassword: async (accessToken: string, password: string) => {
    try {
      const response = await axios.put(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/user`,
        { password },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const customError = new Error(errorData?.msg || 'Update password failed');
      if (errorData?.error_code) {
        (customError as any).errorCode = errorData.error_code;
      }
      throw customError;
    }
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

  logout: async (accessToken: string) => {
    try {
      await axios.post(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error: any) {
      console.error('Logout failed:', error.response?.data || error.message);
      // We still return true to allow local logout even if server call fails
    }
    return true;
  },
};
