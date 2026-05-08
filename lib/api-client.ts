import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '@/config/app.config';
import { cookieHelper } from './cookie-helper';

const apiClient = axios.create({
  baseURL: '/api/backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    let token = null;

    const storedToken = cookieHelper.get(TOKEN_STORAGE_KEY);
    if (storedToken && storedToken.access_token) {
      token = storedToken.access_token;
    }

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

    // ==========================================
    // 🐞 DEBUG KONG API GATEWAY TẠI ĐÂY
    // ==========================================
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log(
      `🚀 [NextJS -> Kong] ${config.method?.toUpperCase()} ${fullUrl}`
    );

    // // In thêm params nếu có (ví dụ: ?skip=0&limit=10)
    // if (config.params) {
    //   console.log('📦 [Params]:', config.params);
    // }
    // ==========================================

    return config;
  },
  (error) => {
    console.error('❌ [NextJS Request Error]', error);
    return Promise.reject(error);
  }
);

// Bổ sung thêm Response Interceptor để xem Kong trả về lỗi gì (rất hữu ích khi debug Gateway)
apiClient.interceptors.response.use(
  (response) => {
    // Tuỳ chọn: Bạn có thể log status code thành công ở đây nếu muốn
    // console.log(`✅ [Kong -> NextJS] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    console.error(
      `❌ [Kong -> NextJS] LỖI ${error.response?.status} tại ${fullUrl}`
    );
    if (error.response?.data) {
      console.error('Chi tiết lỗi từ Kong:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
