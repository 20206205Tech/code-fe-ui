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

type AuthErrorResponse = {
  error_code?: string;
  error_description?: string;
  msg?: string;
};

type ErrorWithCode = Error & {
  errorCode?: string;
};

function getAuthErrorData(error: unknown): AuthErrorResponse {
  if (!axios.isAxiosError<AuthErrorResponse>(error)) return {};

  const data = error.response?.data;
  return data && typeof data === 'object' ? data : {};
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
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

  loginWithEmailPassword: async (
    email: string,
    password: string
  ): Promise<AuthToken> => {
    try {
      const response = await axios.post<AuthToken>(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/token?grant_type=password`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: unknown) {
      const errorData = getAuthErrorData(error);
      if (errorData.error_code === 'invalid_credentials') {
        throw new Error('Sai thông tin đăng nhập hoặc chưa xác nhận mail', {
          cause: error,
        });
      }

      console.error('Email login failed:', errorData || getErrorMessage(error));
      throw new Error(
        errorData.error_description || errorData.msg || 'Đăng nhập thất bại',
        { cause: error }
      );
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      const redirectUrl = encodeURIComponent(
        `${window.location.origin}/auth/callback`
      );
      const response = await axios.post<unknown>(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/signup?redirect_to=${redirectUrl}`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: unknown) {
      const errorData = getAuthErrorData(error);
      console.error('Signup failed:', errorData || getErrorMessage(error));
      throw new Error(errorData.msg || 'Đăng ký thất bại', { cause: error });
    }
  },

  recoverPassword: async (email: string) => {
    try {
      const redirectUrl = encodeURIComponent(
        `${window.location.origin}/auth/callback?type=recovery`
      );
      const response = await axios.post<unknown>(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/recover?redirect_to=${redirectUrl}`,
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: unknown) {
      const errorData = getAuthErrorData(error);
      console.error(
        'Password recovery failed:',
        errorData || getErrorMessage(error)
      );
      throw new Error(errorData.msg || 'Password recovery failed', {
        cause: error,
      });
    }
  },

  updateUserPassword: async (accessToken: string, password: string) => {
    try {
      const response = await axios.put<unknown>(
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
    } catch (error: unknown) {
      const errorData = getAuthErrorData(error);
      const customError = new Error(errorData.msg || 'Update password failed', {
        cause: error,
      }) as ErrorWithCode;

      if (errorData.error_code) {
        customError.errorCode = errorData.error_code;
      }

      throw customError;
    }
  },

  refreshAccessToken: async (
    currentRefreshToken: string
  ): Promise<AuthToken> => {
    try {
      const response = await axios.post<AuthToken>(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/token?grant_type=refresh_token`,
        { refresh_token: currentRefreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error: unknown) {
      const errorData = getAuthErrorData(error);
      console.error(
        'Token refresh failed:',
        errorData || getErrorMessage(error)
      );
      throw new Error('Token refresh failed', { cause: error });
    }
  },

  logout: async (accessToken: string): Promise<boolean> => {
    try {
      await axios.post(
        `${API_GATEWAY_PREFIX}/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/logout`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (error: unknown) {
      const errorData = getAuthErrorData(error);
      console.error('Logout failed:', errorData || getErrorMessage(error));
      // Still return true to allow local logout even if server call fails
    }
    return true;
  },
};
