import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth-server';

// Server-authoritative route protection middleware
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip API routes, Next.js internal paths, and static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Read and verify session strictly from the authoritative HTTP-only cookie
  // Any client-supplied headers (e.g. x-finjourney-role), query params, or localStorage are strictly ignored
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionCookie);
  const isAuthenticated = Boolean(session);
  const role = session?.identity?.role;

  // 3. Define customer-only route prefixes
  const isCustomerRoute =
    pathname.startsWith('/journey') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/claim') ||
    pathname.startsWith('/passport') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/escalation');

  const isOfficerRoute = pathname.startsWith('/officer');
  const isLoginRoute = pathname === '/login';
  const isUnauthorizedRoute = pathname === '/unauthorized';

  // ─── LOGIN ROUTE ──────────────────────────────────────────────────────────
  if (isLoginRoute) {
    if (!isAuthenticated) {
      return NextResponse.next();
    }
    // Already authenticated: redirect to respective workspace
    if (role === 'customer') {
      return NextResponse.redirect(new URL('/journey', request.url));
    }
    if (role === 'officer') {
      return NextResponse.redirect(new URL('/officer', request.url));
    }
    return NextResponse.next();
  }

  // ─── UNAUTHORIZED PAGE ───────────────────────────────────────────────────
  if (isUnauthorizedRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // ─── OFFICER ROUTE (/officer) ─────────────────────────────────────────────
  if (isOfficerRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'officer') {
      // Role mismatch: Authenticated customer attempting officer console
      return NextResponse.redirect(
        new URL('/unauthorized?target=officer&role=customer', request.url)
      );
    }
    return NextResponse.next();
  }

  // ─── CUSTOMER ROUTES ──────────────────────────────────────────────────────
  if (isCustomerRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'customer') {
      // Role mismatch: Authenticated officer attempting customer journey
      const targetKey = pathname.split('/')[1] || 'journey';
      return NextResponse.redirect(
        new URL(`/unauthorized?target=${targetKey}&role=officer`, request.url)
      );
    }
    return NextResponse.next();
  }

  // 4. All other routes (e.g. Landing Page '/') remain publicly accessible
  return NextResponse.next();
}

// Next.js 16 Proxy export compatibility
export const proxy = middleware;
export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled independently)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, JSON assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
};
