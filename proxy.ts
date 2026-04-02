import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_STORAGE_KEY } from './config/app.config';

const publicRoutes = ['/login', '/auth/callback'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.includes(pathname);

  const authTokens = request.cookies.get(TOKEN_STORAGE_KEY)?.value;
  const hasAuth = !!authTokens;

  if (!isPublicRoute && !hasAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicRoute && hasAuth) {
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico).*)'],
};
