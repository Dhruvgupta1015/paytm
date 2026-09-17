import { NextResponse } from 'next/server';
import { authorizeCustomer, isCustomerAuthorizedForClaim } from '@/lib/authz-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authoritative Customer Check
  // Rejects unauthenticated requests with 401, officer role with 403
  const authz = await authorizeCustomer(request);
  if (!authz.authorized) {
    return authz.response;
  }

  const { id } = await params;

  // Resource ownership verification:
  // Server verifies that this claim belongs to the authenticated customer
  if (!isCustomerAuthorizedForClaim(authz.customer.memberId, id)) {
    // 403 Forbidden - generic safe response without revealing existence of other claims
    return NextResponse.json(
      { ok: false, error: 'Access denied' },
      { status: 403 }
    );
  }

  // Return claim status for authorized customer
  const claim = {
    id,
    status: 'submitted_for_review',
    type: 'hospitalization',
    patient: {
      name: authz.customer.name || 'Rahul Sharma',
      relation: 'self',
    },
    hospital: {
      name: 'Apollo Hospital, Delhi',
      admissionDate: '2026-09-01',
      dischargeDate: '2026-09-05',
      totalBill: 85000,
    },
    estimatedSettlement: '₹78,200',
    timeline: [
      { step: 'Claim Initiated', date: '2026-09-10', status: 'completed' },
      { step: 'Documents Uploaded', date: '2026-09-10', status: 'completed' },
      { step: 'Documents Verified', date: '2026-09-11', status: 'completed' },
      { step: 'Submitted for Review', date: '2026-09-13', status: 'current' },
      { step: 'Insurer Review', date: null, status: 'upcoming' },
      { step: 'Settlement', date: null, status: 'upcoming' },
    ],
    createdAt: '2026-09-10T14:30:00Z',
    syntheticData: true,
  };

  return NextResponse.json(claim);
}
