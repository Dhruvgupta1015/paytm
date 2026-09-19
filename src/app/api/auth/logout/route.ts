import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );

  // Invalidate and expire session cookie
  clearSessionCookie(response);

  return response;
}
