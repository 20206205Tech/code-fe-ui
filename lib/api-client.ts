import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '@/config/app.config';
import { API_GATEWAY_PREFIX } from '@/config/api.constants';
import { cookieHelper } from './cookie-helper';

const apiClient = axios.create({
  baseURL: API_GATEWAY_PREFIX,
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
    const status = error.response?.status;

    // Nếu là các lỗi Client (400, 401, 403, 404, etc.) - thường là lỗi nghiệp vụ (như yêu cầu VIP)
    // thì ta log dưới dạng console.warn để tránh gây hiểu nhầm là lỗi sập hệ thống (Crash).
    // Chỉ log console.error cho các lỗi Server (5xx) hoặc mất kết nối.
    if (status && status < 500) {
      console.warn(
        `⚠️ [Kong -> NextJS] Lỗi nghiệp vụ ${status} tại ${fullUrl}`
      );
      if (error.response?.data) {
        console.warn('Chi tiết lỗi:', error.response.data);
      }
    } else {
      console.error(
        `❌ [Kong -> NextJS] LỖI HỆ THỐNG ${status || 'Unknown'} tại ${fullUrl}`
      );
      if (error.response?.data) {
        console.error('Chi tiết lỗi hệ thống từ Kong:', error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
