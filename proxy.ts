import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_STORAGE_KEY } from './config/app.config';
import { getUserRoleFromToken } from './lib/token-helper';

const publicRoutes = ['/login', '/auth/callback'];

// Các route cần quyền admin. Chỉ cần khai báo tiền tố '/admin'
// vì logic .startsWith() sẽ bao quát tất cả các trang con như /admin/data-pipeline.
const adminRoutes = ['/admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith('/share/');

  const authTokensCookie = request.cookies.get(TOKEN_STORAGE_KEY)?.value;
  let hasAuth = false;
  let userRole = 'user';

  if (authTokensCookie) {
    try {
      const tokens = JSON.parse(decodeURIComponent(authTokensCookie));
      if (tokens && tokens.access_token) {
        hasAuth = true;
        userRole = getUserRoleFromToken(tokens.access_token);
      }
    } catch (e) {
      console.error('Invalid token format in cookie');
    }
  }

  // 1. Nếu chưa đăng nhập mà vào trang yêu cầu Auth -> Đẩy về login
  if (!isPublicRoute && !hasAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Nếu đã đăng nhập mà cố vào login -> Đẩy về chat
  if (isPublicRoute && hasAuth) {
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  // 3. Phân quyền: Đã đăng nhập nhưng không phải admin mà cố vào trang admin -> Đẩy về chat
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico).*)'],
};
