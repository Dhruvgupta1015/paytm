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
  const { claimId, memberId } = body;

  // Client-supplied memberId tampering guard:
  if (memberId && memberId !== authz.customer.memberId) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Member identity mismatch' },
      { status: 403 }
    );
  }

  // Claim ownership verification:
  // A customer must not be able to submit another customer's claim by tampering with the claimId
  if (claimId && !isCustomerAuthorizedForClaim(authz.customer.memberId, claimId)) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Claim ownership verification failed' },
      { status: 403 }
    );
  }

  // Simulate claim submission — NEVER say "approved"
  const result = {
    id: claimId || `CLM-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
    memberId: authz.customer.memberId,
    status: 'submitted_for_review',
    message: 'Your claim has been submitted for review. You will be notified of any updates.',
    estimatedReviewTime: '3-5 business days',
    submittedAt: new Date().toISOString(),
    syntheticData: true,
  };

  return NextResponse.json(result);
}
