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
  const { fileName, fileType, memberId, claimId } = body;

  // Member tampering check
  if (memberId && memberId !== authz.customer.memberId) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Member identity mismatch' },
      { status: 403 }
    );
  }

  // Claim ownership check: customer cannot associate docs to another customer's claim
  if (claimId && !isCustomerAuthorizedForClaim(authz.customer.memberId, claimId)) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Claim ownership verification failed' },
      { status: 403 }
    );
  }

  // Simulate document upload
  const doc = {
    id: `DOC-${Date.now()}`,
    name: fileName,
    status: 'pending' as const,
    type: fileType || inferDocType(fileName),
    memberId: authz.customer.memberId,
    uploadedAt: new Date().toISOString(),
  };

  return NextResponse.json(doc);
}

function inferDocType(fileName: string): string {
  const lower = (fileName || '').toLowerCase();
  if (lower.includes('discharge')) return 'discharge_summary';
  if (lower.includes('bill') || lower.includes('receipt') || lower.includes('invoice')) return 'bills';
  if (lower.includes('id') || lower.includes('aadhar') || lower.includes('aadhaar') || lower.includes('pan') || lower.includes('passport')) return 'identity';
  if (lower.includes('prescription') || lower.includes('rx')) return 'prescription';
  return 'other';
}
