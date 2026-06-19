import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_STORAGE_KEY } from './config/app.config';
import { getAALFromToken, getUserRoleFromToken } from './lib/token-helper';

const publicRoutes = ['/', '/login', '/auth/callback'];
const adminRoutes = ['/admin'];
const mfaRoute = '/auth/mfa';

type AuthTokensCookie = {
  access_token?: unknown;
};

function parseAccessTokenFromCookie(cookieValue?: string) {
  if (!cookieValue) return null;

  try {
    const tokens = JSON.parse(
      decodeURIComponent(cookieValue)
    ) as AuthTokensCookie;

    return typeof tokens.access_token === 'string' ? tokens.access_token : null;
  } catch {
    console.error('Invalid token format in cookie');
    return null;
  }
}

function getSafeNextPath(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get('next');

  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/chat';
  }

  return nextPath;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith('/share/');

  const authTokensCookie = request.cookies.get(TOKEN_STORAGE_KEY)?.value;
  const accessToken = parseAccessTokenFromCookie(authTokensCookie);
  let hasAuth = false;
  let userRole = 'user';
  let aal = 'aal1';

  if (accessToken) {
    hasAuth = true;
    userRole = getUserRoleFromToken(accessToken);
    aal = getAALFromToken(accessToken);
  }

  if (pathname === mfaRoute && !hasAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!isPublicRoute && pathname !== mfaRoute && !hasAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasAuth && aal !== 'aal2' && !isPublicRoute && pathname !== mfaRoute) {
    const redirectUrl = new URL(mfaRoute, request.url);
    redirectUrl.searchParams.set(
      'next',
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (hasAuth && pathname === '/login') {
    return NextResponse.redirect(
      new URL(aal === 'aal2' ? '/chat' : mfaRoute, request.url)
    );
  }

  if (hasAuth && aal === 'aal2' && pathname === mfaRoute) {
    return NextResponse.redirect(
      new URL(getSafeNextPath(request), request.url)
    );
  }

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico).*)'],
};
