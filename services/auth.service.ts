import { BaseApiUrl } from '@/config/env.config';

export const authService = {
  loginWithGoogle: () => {
    const authUrl = new URL(`${BaseApiUrl()}/supabase/auth/v1/authorize`);
    authUrl.searchParams.append('provider', 'google');
    const redirectUrl = `${window.location.origin}/auth/callback`;
    authUrl.searchParams.append('redirect_to', redirectUrl);
    window.location.href = authUrl.toString();
  },

  refreshAccessToken: async (currentRefreshToken: string) => {
    const response = await fetch(
      `${BaseApiUrl()}/supabase/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: currentRefreshToken,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return await response.json(); // Mong đợi trả về: { access_token, refresh_token, expires_in }
  },
};
