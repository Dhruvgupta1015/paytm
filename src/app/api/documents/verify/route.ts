import { NextResponse } from 'next/server';
import { authorizeCustomer, isCustomerAuthorizedForClaim } from '@/lib/authz-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Authoritative Customer Check
  // Rejects unauthenticated requests with 401, officer role with 403
  const authz = await authorizeCustomer(request);
  if (!authz.authorized) {
    return authz.response;
  }

  const body = await request.json().catch(() => ({}));
  const { memberId, claimId } = body;

  // Member tampering check
  if (memberId && memberId !== authz.customer.memberId) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Member identity mismatch' },
      { status: 403 }
    );
  }

  // Claim ownership check: customer cannot verify docs against another customer's claim
  if (claimId && !isCustomerAuthorizedForClaim(authz.customer.memberId, claimId)) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Claim ownership verification failed' },
      { status: 403 }
    );
  }

  const rawDocs = body.documents || body.documentIds || [];

  // Scripted verification logic — deterministic by document type
  const verified = rawDocs.map((doc: unknown, index: number) => {
    const docObj = typeof doc === 'string'
      ? { id: doc, name: `Document-${index + 1}.pdf`, type: 'bills' }
      : (doc as { id?: string; name?: string; type?: string });
    const result = verifyByType(docObj.type || 'other', docObj.name || '');
    return {
      ...docObj,
      status: result.status,
      reason: result.reason,
    };
  });

  return NextResponse.json({ documents: verified });
}

function verifyByType(type: string, name: string): { status: 'verified' | 'rejected'; reason?: string } {
  // Deterministic: most doc types pass, prescriptions are marked as needing attention
  switch (type) {
    case 'discharge_summary':
      return { status: 'verified' };
    case 'bills':
      return { status: 'verified' };
    case 'identity':
      return { status: 'verified' };
    case 'prescription':
      // Simulate one partial verification for demo drama
      if ((name || '').toLowerCase().includes('unclear') || (name || '').toLowerCase().includes('blurry')) {
        return { status: 'rejected', reason: 'Document is not legible. Please upload a clearer copy.' };
      }
      return { status: 'verified' };
    default:
      return { status: 'verified' };
  }
}
