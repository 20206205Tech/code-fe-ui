import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '@/config/app.config';
import { cookieHelper } from './cookie-helper';

const apiClient = axios.create({
  baseURL: '/api/backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    let token = null;

    // Try to get token from cookies (consistent with auth-context)
    const storedToken = cookieHelper.get(TOKEN_STORAGE_KEY);
    if (storedToken && storedToken.access_token) {
      token = storedToken.access_token;
    }

    // Fallback to localStorage if cookie fails (as per user suggestion)
    if (!token && typeof window !== 'undefined') {
      try {
        const authTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (authTokens) {
          const parsed = JSON.parse(authTokens);
          token = parsed.access_token;
        }
      } catch (e) {
        console.error('Error parsing tokens from localStorage', e);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
