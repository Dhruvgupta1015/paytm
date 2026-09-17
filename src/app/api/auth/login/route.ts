import { NextResponse } from 'next/server';
import {
  authenticateDemoCredentials,
  createSession,
  setSessionCookie,
} from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Malformed JSON payload' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { ok: false, error: 'Request body must be a JSON object' },
      { status: 400 }
    );
  }

  const { email, pin } = body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Email address is required' },
      { status: 400 }
    );
  }

  if (!pin || typeof pin !== 'string' || !pin.trim()) {
    return NextResponse.json(
      { ok: false, error: 'PIN is required' },
      { status: 400 }
    );
  }

  // Authoritative server-side identity resolution
  // Any client-supplied role or ID parameters are strictly ignored
  const identity = authenticateDemoCredentials(email, pin);
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Generate cryptographically signed session token
  const { token } = await createSession(identity);

  // Prepare response payload (never returns PIN, secret, or raw session token)
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

  const response = NextResponse.json(
    {
      ok: true,
      user: userPayload,
    },
    { status: 200 }
  );

  // Set HTTP-only, secure, SameSite session cookie
  setSessionCookie(response, token);

  return response;
}
