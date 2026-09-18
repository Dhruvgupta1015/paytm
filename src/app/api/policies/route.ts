import { NextResponse } from 'next/server';
import policies from '@/data/policies.json';
import { getSessionFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);

  if (session?.identity?.role === 'customer') {
    // Authenticated customer: return policies associated with this member
    const customerMemberId = session.identity.memberId;
    const customerPolicies = policies.filter(
      (p) => !p.holder?.memberId || p.holder.memberId === customerMemberId
    );
    return NextResponse.json(customerPolicies);
  }

  // Public Catalog View: Strictly strip customer-specific holder PII
  const sanitizedCatalog = policies.map((p) => {
    const copy = { ...p };
    delete (copy as { holder?: unknown }).holder;
    return copy;
  });
  return NextResponse.json(sanitizedCatalog);
}
