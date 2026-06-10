import {
  API_GATEWAY_PREFIX,
  SUPABASE_AUTH_SERVICE_NAME,
} from '@/config/api.constants';
import axios from 'axios';

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
}

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

  logout: async (accessToken: string): Promise<boolean> => {
    try {
      await axios.post(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/logout`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (error: any) {
      console.error('Logout failed:', error.response?.data || error.message);
      // Still return true to allow local logout even if server call fails
    }
    return true;
  },
};
