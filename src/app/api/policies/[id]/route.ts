import { NextResponse } from 'next/server';
import policies from '@/data/policies.json';
import { getSessionFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const policy = policies.find((p) => p.id === id);

  if (!policy) {
    return NextResponse.json({ message: 'Policy not found' }, { status: 404 });
  }

  const session = await getSessionFromRequest(request);

  if (session?.identity?.role === 'customer') {
    if (policy.holder?.memberId && policy.holder.memberId !== session.identity.memberId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    return NextResponse.json(policy);
  }

  // Public Catalog View: Strip customer holder PII
  const publicCatalogInfo = { ...policy };
  delete (publicCatalogInfo as { holder?: unknown }).holder;
  return NextResponse.json(publicCatalogInfo);
}
