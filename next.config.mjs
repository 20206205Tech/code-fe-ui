/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    const endpoint = isDev ? '/dev' : '/prod';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.20206205.tech/api';

    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}${endpoint}/:path*`,
      },
    ];
  },
}

export default nextConfig
