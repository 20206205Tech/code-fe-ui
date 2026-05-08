// file: lib/api-helper.ts
import { AxiosRequestConfig } from 'axios';
import apiClient from './api-client';

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Hàm core xử lý gọi API và bóc tách dữ liệu.
 * Không cần truyền token vì apiClient interceptor đã tự lo việc đó.
 */
export async function fetchBaseResponse<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient({
      method,
      url,
      data,
      ...config,
    });

    const jsonResponse = response.data;

    // 1. Nếu API trả về theo chuẩn BaseResponse { success, message, data }
    if (
      jsonResponse &&
      typeof jsonResponse === 'object' &&
      'success' in jsonResponse
    ) {
      if (!jsonResponse.success) {
        throw new Error(jsonResponse.message || 'Có lỗi xảy ra từ server');
      }
      return jsonResponse.data as T;
    }

    // 2. Fallback: Nếu API không bọc trong BaseResponse (trả về trực tiếp data hoặc array)
    return (
      jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse
    ) as T;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || 'Lỗi không xác định';
    throw new Error(`API call failed: ${errorMessage}`);
  }
}

// Export các hàm tiện ích để gọi nhanh gọn hơn
export const apiHelper = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    fetchBaseResponse<T>('GET', url, undefined, config),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    fetchBaseResponse<T>('POST', url, data, config),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    fetchBaseResponse<T>('PUT', url, data, config),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    fetchBaseResponse<T>('PATCH', url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    fetchBaseResponse<T>('DELETE', url, undefined, config),
};
