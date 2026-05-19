/**
 * Phân tích User Agent để tạo tên thiết bị thân thiện
 */
export function getFriendlyDeviceName(): string {
  if (typeof window === 'undefined') return 'Thiết bị mới';

  const ua = window.navigator.userAgent;
  let browser = 'Trình duyệt';
  let os = 'Thiết bị';

  // Phân tích Trình duyệt
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Browser';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  // Phân tích Hệ điều hành
  if (ua.includes('Windows NT 10.0')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'Mac';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} trên ${os}`;
}
