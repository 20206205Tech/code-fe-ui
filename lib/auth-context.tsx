'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  TOKEN_CHECK_INTERVAL,
  TOKEN_REFRESH_THRESHOLD,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  USER_SETTINGS_STORAGE_KEY,
} from '../config/app.config';
import { authService } from '../services/auth.service';
import { useSettings } from './settings-context';
import { cookieHelper } from './cookie-helper';

import { profileService } from '../services/profile.service';
import { decodeJwtPayload, getUserRoleFromToken } from './token-helper';

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

interface AuthContextType {
  user: User | null;
  tokens: AuthToken | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (
    access_token: string,
    refresh_token: string,
    expires_in?: number
  ) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { syncSettings } = useSettings();

  useEffect(() => {
    const storedToken = cookieHelper.get(TOKEN_STORAGE_KEY);
    let currentRole = 'user';

    if (storedToken?.access_token) {
      currentRole = getUserRoleFromToken(storedToken.access_token);
      setTokens(storedToken);
    }

    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, role: currentRole });
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    }

    setIsLoading(false);
  }, []);

  // Auto-refresh token before expiry (60 seconds before)
  useEffect(() => {
    if (!tokens) return;

    const refreshInterval = setInterval(async () => {
      const expiryTime = new Date().getTime() + tokens.expires_in * 1000;
      const refreshTime = expiryTime - TOKEN_REFRESH_THRESHOLD;

      if (new Date().getTime() >= refreshTime) {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          logout();
        }
      }
    }, TOKEN_CHECK_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [tokens]);

  // 3. Cập nhật hàm login
  const login = useCallback(
    async (
      access_token: string,
      refresh_token: string,
      expires_in: number = 3600
    ) => {
      try {
        const payload = decodeJwtPayload(access_token);
        if (!payload) throw new Error('Token không hợp lệ');

        const userId = payload.sub;
        const userRole = payload.app_metadata?.role || 'user';

        const dbProfile = await profileService.getProfile(userId, access_token);

        const authUser: User = {
          id: userId,
          email: payload.email,
          name:
            dbProfile?.full_name || payload.user_metadata?.full_name || 'User',
          avatar: dbProfile?.avatar_url || payload.user_metadata?.avatar_url,
          role: userRole,
        };

        setTokens({ access_token, refresh_token, expires_in });
        setUser(authUser);

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
        cookieHelper.set(
          TOKEN_STORAGE_KEY,
          { access_token, refresh_token, expires_in },
          { maxAge: expires_in }
        );

        // Sync settings after login
        await syncSettings(access_token);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    setTokens(null);
    setUser(null);

    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(USER_SETTINGS_STORAGE_KEY);

    cookieHelper.remove(TOKEN_STORAGE_KEY);
  }, []);

  const refreshToken = async () => {
    if (!tokens?.refresh_token) return;

    try {
      const data = await authService.refreshAccessToken(tokens.refresh_token);

      const newTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || tokens.refresh_token,
        expires_in: data.expires_in,
      };

      setTokens(newTokens);

      cookieHelper.set(TOKEN_STORAGE_KEY, newTokens, {
        maxAge: data.expires_in,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  const updateUser = async (
    userData: Partial<User> & { avatarFile?: File }
  ) => {
    if (!tokens || !user) throw new Error('Not authenticated');

    try {
      let updatedData: any = {};

      // Xử lý upload ảnh nếu có
      if (userData.avatarFile) {
        const publicUrl = await profileService.uploadAvatar(
          user.id,
          tokens.access_token,
          userData.avatarFile
        );
        updatedData.avatar_url = publicUrl;
      }

      // Xử lý đổi tên
      if (userData.name) {
        updatedData.full_name = userData.name;
      }

      // Gửi PATCH lên DB profiles
      const newProfile = await profileService.updateProfile(
        user.id,
        tokens.access_token,
        updatedData
      );

      // Cập nhật lại State local
      const newUser = {
        ...user,
        name: newProfile.full_name || user.name,
        avatar: newProfile.avatar_url || user.avatar,
      };
      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!tokens && !!user,
    login,
    logout,
    updateUser,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
