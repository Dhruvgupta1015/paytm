import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Authoritatively extract and verify session strictly from HTTP-only cookie
  // Any client-supplied headers or parameters are completely ignored
  const session = await getSessionFromRequest(request);

  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Unauthenticated' },
      { status: 401, headers: noCacheHeaders }
    );
  }

  const identity = session.identity;

  const userPayload =
    identity.role === 'customer'
      ? {
          role: identity.role,
          memberId: identity.memberId,
          email: identity.email,
          name: identity.name,
        }
      : {
          role: identity.role,
          officerId: identity.officerId,
          email: identity.email,
          name: identity.name,
          badge: identity.badge,
          title: identity.title,
        };

  return NextResponse.json(
    {
      ok: true,
      user: userPayload,
    },
    { status: 200, headers: noCacheHeaders }
  );
}
