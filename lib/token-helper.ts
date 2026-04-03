// Thêm 2 hàm dưới đây
export function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Dùng atob() không có window. để tương thích với cả Edge Runtime và Browser
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error('Lỗi giải mã token:', error);
    return null;
  }
}

export function getUserRoleFromToken(token: string): string {
  const payload = decodeJwtPayload(token);
  return payload?.app_metadata?.role || 'user'; // Fallback mặc định là 'user'
}
