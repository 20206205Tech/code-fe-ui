export const BaseApiUrl = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'https://api.20206205.tech/api';

  const isDevelopment = process.env.NODE_ENV === 'development';

  const endpoint = isDevelopment ? '/dev' : '/prod';

  return `${baseUrl}${endpoint}`;
};
