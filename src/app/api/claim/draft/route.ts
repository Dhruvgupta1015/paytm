import { NextResponse } from 'next/server';
import policies from '@/data/policies.json';
import {
  authorizeCustomer,
  isCustomerAuthorizedForPolicy,
  registerCustomerClaim,
} from '@/lib/authz-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Authoritative Customer Check
  // Rejects unauthenticated requests with 401, officer role with 403
  const authz = await authorizeCustomer(request);
  if (!authz.authorized) {
    return authz.response;
  }

  const journeyState = await request.json().catch(() => ({}));

  // Client-supplied memberId tampering guard:
  // If the client explicitly specifies a memberId that differs from the authenticated session, reject with 403
  if (journeyState.memberId && journeyState.memberId !== authz.customer.memberId) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Member identity mismatch' },
      { status: 403 }
    );
  }

  const policyId = journeyState.selectedPolicyId || 'POL-HEALTH-001';

  // Verify that the customer is authorized for this policy
  if (policyId && !isCustomerAuthorizedForPolicy(authz.customer.memberId, policyId)) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: Policy not associated with authenticated member' },
      { status: 403 }
    );
  }

  const policy = policies.find((p) => p.id === policyId);
  const details = journeyState.claimDetails;

  const claimId = `CLM-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
  // Exact ownership registration:
  registerCustomerClaim(authz.customer.memberId, claimId);

  // Authoritatively bind member identity from the verified session
  const claim = {
    id: claimId,
    policyId,
    memberId: authz.customer.memberId,
    status: 'draft',
    type: 'hospitalization',
    patient: {
      name: authz.customer.name || details?.patientName || policy?.holder.name || 'Rahul Sharma',
      relation: details?.relation || 'self',
    },
    hospital: {
      name: details?.hospitalName || 'Apollo Hospital, Delhi',
      admissionDate: details?.admissionDate || '2026-09-01',
      dischargeDate: details?.dischargeDate || '2026-09-05',
      totalBill: details?.totalBill || 85000,
    },
    documents: journeyState.documents || [],
    estimatedSettlement: `₹${((details?.totalBill || 85000) * 0.92).toLocaleString('en-IN')}`,
    timeline: [
      { step: 'Claim Initiated', date: new Date().toISOString().split('T')[0], status: 'completed' },
      { step: 'Documents Uploaded', date: new Date().toISOString().split('T')[0], status: 'completed' },
      { step: 'Documents Verified', date: new Date().toISOString().split('T')[0], status: 'completed' },
      { step: 'Draft Created', date: new Date().toISOString().split('T')[0], status: 'current' },
      { step: 'Submitted for Review', date: null, status: 'upcoming' },
      { step: 'Insurer Review', date: null, status: 'upcoming' },
      { step: 'Settlement', date: null, status: 'upcoming' },
    ],
    createdAt: new Date().toISOString(),
    syntheticData: true,
  };

  return NextResponse.json(claim);
}
