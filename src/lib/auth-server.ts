/**
 * Server-Authoritative Authentication & Session Engine
 *
 * FinJourney AI — Universal Server & Edge Middleware Compatible
 *
 * IMPORTANT:
 * - This module is SERVER-ONLY. It cannot run in client-side browser bundles.
 * - Sessions are cryptographically signed using Web Crypto API HMAC-SHA256.
 * - The server-side session cookie is the SOLE source of truth for identity and role.
 * - Client-supplied role headers or localStorage values are NOT trusted for authorization.
 */

import type { AuthIdentity, ServerSession } from '@/types';

// Server-only runtime boundary enforcement
if (typeof window !== 'undefined') {
  throw new Error('[auth-server] Critical error: auth-server module is server-only and cannot be executed in the browser.');
}

export const SESSION_COOKIE_NAME = 'finjourney_session';
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours (28,800 seconds)

/**
 * Returns the authoritative signing secret from environment.
 * A development fallback is permitted only in non-production environments.
 */
function getSessionSecret(): string {
  const envSecret = process.env.FINJOURNEY_SESSION_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    return envSecret.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[auth-server] Missing required environment variable: FINJOURNEY_SESSION_SECRET in production.');
  }
  // Development prototype fallback only - never exposed to client or logs
  return 'finjourney-prototype-dev-hmac-secret-delhi-2026';
}

// ─── Universal Web Crypto Utilities (Node.js & Edge Runtime Compatible) ────

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function uint8ArrayToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToUint8Array(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    stringToUint8Array(secret) as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signPayload(data: string, secret: string): Promise<string> {
  const key = await getHmacKey(secret);
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    stringToUint8Array(data) as unknown as BufferSource
  );
  return uint8ArrayToBase64Url(new Uint8Array(signature));
}

async function verifySignature(data: string, signatureB64Url: string, secret: string): Promise<boolean> {
  try {
    const key = await getHmacKey(secret);
    const signatureBytes = base64UrlToUint8Array(signatureB64Url);
    return await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      stringToUint8Array(data) as unknown as BufferSource
    );
  } catch {
    return false;
  }
}

/**
 * Constant-time comparison to protect against timing side-channel attacks.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ─── Session Management ───────────────────────────────────────────────────

/**
 * Create an HMAC-signed server session token for an authenticated identity.
 */
export async function createSession(
  identity: AuthIdentity,
  durationSeconds: number = SESSION_MAX_AGE_SECONDS
): Promise<{ token: string; session: ServerSession }> {
  const now = Date.now();
  const expiresAt = now + durationSeconds * 1000;
  const sessionId = `sess_${globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).substring(2)}`;

  const session: ServerSession = {
    sessionId,
    identity,
    issuedAt: now,
    expiresAt,
  };

  const secret = getSessionSecret();
  const payloadB64 = uint8ArrayToBase64Url(stringToUint8Array(JSON.stringify(session)));
  const signatureB64 = await signPayload(payloadB64, secret);

  const token = `${payloadB64}.${signatureB64}`;
  return { token, session };
}

/**
 * Verify an HMAC-signed session token.
 * Returns the verified ServerSession if valid and not expired; null otherwise.
 */
export async function verifySession(token: string | null | undefined): Promise<ServerSession | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) {
    return null;
  }

  try {
    const secret = getSessionSecret();
    const isValidSignature = await verifySignature(payloadB64, signatureB64, secret);

    if (!isValidSignature) {
      return null;
    }

    const jsonStr = uint8ArrayToString(base64UrlToUint8Array(payloadB64));
    const session = JSON.parse(jsonStr) as ServerSession;

    // Check expiration and issued-at validity
    const now = Date.now();
    if (session.expiresAt <= now) {
      return null; // Expired
    }
    if (session.issuedAt > now + 60000) {
      return null; // Future clock skew beyond 60s
    }

    // Validate structural schema
    if (!session.sessionId || !session.identity) {
      return null;
    }
    const role = session.identity.role;
    if (role !== 'customer' && role !== 'officer') {
      return null;
    }
    if (role === 'customer' && !session.identity.memberId) {
      return null;
    }
    if (role === 'officer' && !session.identity.officerId) {
      return null;
    }

    return session;
  } catch {
    // Malformed JSON or invalid token
    return null;
  }
}

/**
 * Extract and verify a session from a raw Cookie header string.
 */
export async function getSessionFromCookieHeader(cookieHeader: string | null | undefined): Promise<ServerSession | null> {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, ...valParts] = cookie.split('=');
    if (name === SESSION_COOKIE_NAME) {
      const rawToken = valParts.join('=');
      if (rawToken) {
        return await verifySession(decodeURIComponent(rawToken));
      }
    }
  }

  return null;
}

/**
 * Extract and verify a session from an incoming Request / NextRequest.
 */
export async function getSessionFromRequest(request: Request): Promise<ServerSession | null> {
  const cookieHeader = request.headers.get('cookie');
  return await getSessionFromCookieHeader(cookieHeader);
}

/**
 * Standard cookie options for setting the authoritative session cookie.
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  };
}

/**
 * Set the session cookie on a Response or NextResponse.
 */
export function setSessionCookie(response: Response, token: string): void {
  const options = getSessionCookieOptions();

  // If response is a NextResponse or provides cookies.set
  if (typeof (response as any).cookies?.set === 'function') {
    (response as any).cookies.set(options.name, token, {
      httpOnly: options.httpOnly,
      sameSite: options.sameSite,
      path: options.path,
      maxAge: options.maxAge,
      secure: options.secure,
    });
  } else {
    const secureFlag = options.secure ? '; Secure' : '';
    const cookieHeaderVal = `${options.name}=${encodeURIComponent(token)}; Path=${options.path}; Max-Age=${options.maxAge}; HttpOnly; SameSite=Lax${secureFlag}`;
    response.headers.append('Set-Cookie', cookieHeaderVal);
  }
}

/**
 * Clear the session cookie on a Response or NextResponse (used upon logout).
 */
export function clearSessionCookie(response: Response): void {
  const options = getSessionCookieOptions();

  if (typeof (response as any).cookies?.set === 'function') {
    (response as any).cookies.set(options.name, '', {
      httpOnly: options.httpOnly,
      sameSite: options.sameSite,
      path: options.path,
      maxAge: 0,
      expires: new Date(0),
      secure: options.secure,
    });
  } else if (typeof (response as any).cookies?.delete === 'function') {
    (response as any).cookies.delete(options.name);
  } else {
    const secureFlag = options.secure ? '; Secure' : '';
    const cookieHeaderVal = `${options.name}=; Path=${options.path}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`;
    response.headers.append('Set-Cookie', cookieHeaderVal);
  }
}

// ─── Demo Credentials & Authentication ───────────────────────────

export interface DemoUserRecord {
  email: string;
  pin: string;
  identity: AuthIdentity;
}

/**
 * Authoritative Server-Side Demo Identities
 * Used strictly for prototype evaluation without external IAM dependencies.
 */
export const DEMO_USERS: Record<string, DemoUserRecord> = {
  'rahul.sharma@paytm.demo': {
    email: 'rahul.sharma@paytm.demo',
    pin: '1234',
    identity: {
      role: 'customer',
      memberId: 'MEM-2024-78432',
      email: 'rahul.sharma@paytm.demo',
      name: 'Rahul Sharma',
    },
  },
  'priya.verma@paytm.officer': {
    email: 'priya.verma@paytm.officer',
    pin: '9042',
    identity: {
      role: 'officer',
      officerId: 'PAYTM-ESC-9042',
      email: 'priya.verma@paytm.officer',
      name: 'Priya Verma',
      badge: 'Paytm Insurance Officer #9042',
      title: 'Senior Claims Adjudicator',
    },
  },
};

/**
 * Validate submitted credentials against server-authoritative synthetic records.
 * Completely ignores any client-supplied role or ID parameters.
 */
export function authenticateDemoCredentials(
  email: string | null | undefined,
  pin: string | null | undefined
): AuthIdentity | null {
  if (!email || !pin || typeof email !== 'string' || typeof pin !== 'string') {
    return null;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPin = pin.trim();

  const user = DEMO_USERS[normalizedEmail];
  if (!user) {
    return null;
  }

  // Constant-time PIN comparison to protect against timing side-channels
  if (!constantTimeCompare(normalizedPin, user.pin)) {
    return null;
  }

  return user.identity;
}
