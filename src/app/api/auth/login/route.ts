import { NextResponse } from 'next/server';
import {
  authenticateDemoCredentials,
  createSession,
  setSessionCookie,
} from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
  lockedUntil?: number;
}

/**
 * Server-side brute-force attempt tracker.
 * Note: In multi-region serverless production environments, a centralized distributed
 * store (e.g. Upstash Redis, Cloudflare KV, or Vercel Edge Config) is required for global sync.
 * This in-process guard provides robust instance-level brute force protection.
 */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes lockout
const attemptsMap = new Map<string, AttemptRecord>();

function getClientIdentifier(request: Request, email?: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const ip = forwarded || realIp || '127.0.0.1';
  const normalizedEmail = (email || '').trim().toLowerCase();
  return `${ip}::${normalizedEmail}`;
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = attemptsMap.get(key);
  if (!record) return { allowed: true };

  // Check if currently locked
  if (record.lockedUntil && now < record.lockedUntil) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // Reset window if expired
  if (now - record.firstAttemptTime > WINDOW_MS) {
    attemptsMap.delete(key);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + COOLDOWN_MS;
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(COOLDOWN_MS / 1000),
    };
  }

  return { allowed: true };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = attemptsMap.get(key);
  if (!record) {
    attemptsMap.set(key, {
      count: 1,
      firstAttemptTime: now,
      lastAttemptTime: now,
    });
  } else {
    record.count += 1;
    record.lastAttemptTime = now;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + COOLDOWN_MS;
    }
  }
}

function clearAttempts(key: string): void {
  attemptsMap.delete(key);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
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

  const email = typeof body.email === 'string' ? body.email : undefined;
  const pin = typeof body.pin === 'string' ? body.pin : undefined;

  if (!email || !email.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Email address is required' },
      { status: 400 }
    );
  }

  if (!pin || !pin.trim()) {
    return NextResponse.json(
      { ok: false, error: 'PIN is required' },
      { status: 400 }
    );
  }

  // 1. Check Brute-Force Rate Limiting (P1 - Finding 5)
  const clientKey = getClientIdentifier(request, email);
  const rateCheck = checkRateLimit(clientKey);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateCheck.retryAfterSeconds || 900),
        },
      }
    );
  }

  // Authoritative server-side identity resolution
  // Any client-supplied role or ID parameters are strictly ignored
  const identity = authenticateDemoCredentials(email, pin);
  if (!identity) {
    // Record failure for brute-force protection
    recordFailedAttempt(clientKey);
    // Generic response prevents revealing whether email exists
    return NextResponse.json(
      { ok: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Clear attempts on successful authentication
  clearAttempts(clientKey);

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
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );

  // Set HTTP-only, secure, SameSite session cookie
  setSessionCookie(response, token);

  return response;
}
