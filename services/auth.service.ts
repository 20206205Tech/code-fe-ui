import axios from 'axios';

export const authService = {
  loginWithGoogle: () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'https://api.20206205.tech/api';
    const endpoint = process.env.NODE_ENV === 'development' ? '/dev' : '/prod';
    const realBackendUrl = `${baseUrl}${endpoint}`;

    const authUrl = new URL(`${realBackendUrl}/supabase/auth/v1/authorize`);
    authUrl.searchParams.append('provider', 'google');
    const redirectUrl = `${window.location.origin}/auth/callback`;
    authUrl.searchParams.append('redirect_to', redirectUrl);
    window.location.href = authUrl.toString();
  },

  refreshAccessToken: async (currentRefreshToken: string) => {
    try {
      const response = await axios.post(
        `/api/api-gateway/supabase/auth/v1/token?grant_type=refresh_token`,
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
};
