'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  TOKEN_CHECK_INTERVAL,
  TOKEN_REFRESH_THRESHOLD,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  USER_SETTINGS_STORAGE_KEY,
} from '../config/app.config';
import { authService } from '../services/auth.service';
import { authMfaService } from '../services/auth-mfa.service';
import { useSettings } from './settings-context';
import { cookieHelper } from './cookie-helper';
import { paymentService, Subscription } from '../services/payment.service';
import type { AuthToken, User } from '../services/auth.service';

import {
  decodeJwtPayload,
  getUserRoleFromToken,
  getAALFromToken,
} from './token-helper';

interface AuthContextType {
  user: User | null;
  tokens: AuthToken | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMfaRequired: boolean;
  mfaFactors: any[];

  login: (
    access_token: string,
    refresh_token: string,
    expires_in?: number
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
  syncSubscription: () => Promise<void>;
  refreshMfa: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthToken | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { syncSettings, clearSettings } = useSettings();

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

    // Chỉ sync subscription nếu đã đạt aal2 (đã qua MFA)
    if (
      storedToken?.access_token &&
      getAALFromToken(storedToken.access_token) === 'aal2'
    ) {
      syncSubscription();
    }

    setIsLoading(false);
  }, []);

  const syncSubscription = async () => {
    try {
      const sub = await paymentService.getMySubscription();
      console.log(
        '[AuthContext] syncSubscription success. Fetched subscription:',
        sub
      );
      console.log(
        '[AuthContext] has_active_subscription:',
        sub?.has_active_subscription
      );
      setSubscription(sub);
    } catch (error) {
      console.error('[AuthContext] Failed to sync subscription:', error);
    }
  };

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

        const dbProfile = await authService.getProfile(userId, access_token);

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

        // Chỉ sync dữ liệu sâu (settings, subscription) nếu đã đạt cấp độ bảo mật cao nhất (aal2)
        // Nếu mới chỉ là aal1 (vừa nhập pass, chờ OTP), ta bỏ qua để đợi bước verifyMFA gọi lại login với aal2
        const aal = getAALFromToken(access_token);
        if (aal === 'aal2') {
          // Sync settings after login
          await syncSettings(access_token);
          // Sync subscription after login
          await syncSubscription();
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const accessToken = tokens?.access_token;

    // 1. Dọn dẹp State và Storage ngay lập tức để UI phản hồi nhanh
    setTokens(null);
    setUser(null);
    setSubscription(null);

    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(USER_SETTINGS_STORAGE_KEY);
    cookieHelper.remove(TOKEN_STORAGE_KEY);

    // 2. Gọi API logout ở background (không đợi nếu không cần thiết, hoặc bắt lỗi)
    if (accessToken) {
      try {
        await authService.logout(accessToken);
      } catch (error) {
        console.error('API Logout failed:', error);
      }
    }

    // 3. Chuyển hướng về login bằng router.push để tránh reload F5
    clearSettings();
    router.push('/login');
  }, [tokens, router, clearSettings]);

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
        const publicUrl = await authService.uploadAvatar(
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

      // Xử lý avatar URL trực tiếp
      if (userData.avatar !== undefined) {
        updatedData.avatar_url = userData.avatar;
      }

      // Gửi PATCH lên DB profiles
      const newProfile = await authService.updateProfile(
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

  const [mfaFactors, setMfaFactors] = useState<any[]>([]);

  // Hàm load factors để biết user đã bật MFA chưa
  const loadMfaFactors = async (accessToken: string) => {
    try {
      const factors = await authMfaService.listFactors(accessToken);
      setMfaFactors(factors.active || []);
      return factors.active || [];
    } catch (e) {
      console.error('Load MFA factors failed:', e);
      return [];
    }
  };

  useEffect(() => {
    if (tokens?.access_token) {
      loadMfaFactors(tokens.access_token);
    } else {
      setMfaFactors([]);
    }
  }, [tokens]);

  const currentAAL = tokens ? getAALFromToken(tokens.access_token) : 'aal1';

  // isAuthenticated: Bắt buộc phải qua bước MFA (aal2)
  const isAuthenticated =
    !isLoading && !!tokens && !!user && currentAAL === 'aal2';

  // isMfaRequired: Nếu mới chỉ có password (aal1) thì bắt buộc phải xác thực MFA
  const isMfaRequired =
    !isLoading && !!tokens && !!user && currentAAL === 'aal1';

  const refreshMfa = async () => {
    if (tokens?.access_token) {
      await loadMfaFactors(tokens.access_token);
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    subscription,
    isLoading,
    isAuthenticated,
    isMfaRequired,
    mfaFactors,
    login,
    logout,
    updateUser,
    refreshToken,
    syncSubscription,
    refreshMfa,
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
