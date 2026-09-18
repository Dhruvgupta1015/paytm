/**
 * Resource-Level Authorization & Access Control Engine
 *
 * FinJourney AI — Phase 4 Server-Authoritative Authorization
 *
 * IMPORTANT:
 * - This module is SERVER-ONLY.
 * - Authenticated session from finjourney_session is the ONLY source of truth.
 * - Client-supplied memberId, officerId, claimId, headers, query params,
 *   or localStorage are NEVER trusted as authorization authority.
 */

import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import type { ServerSession, CustomerIdentity, OfficerIdentity } from '@/types';
import officerQueueData from '@/data/officer-queue.json';
import policiesData from '@/data/policies.json';

// Server-only runtime boundary enforcement
if (typeof window !== 'undefined') {
  throw new Error('[authz-server] Critical error: authz-server module is server-only.');
}

export type AuthzCustomerResult =
  | { authorized: true; session: ServerSession; customer: CustomerIdentity }
  | { authorized: false; response: NextResponse };

export type AuthzOfficerResult =
  | { authorized: true; session: ServerSession; officer: OfficerIdentity }
  | { authorized: false; response: NextResponse };

// ─── Known Synthetic Mappings ─────────────────────────────────────

/**
 * Claims explicitly mapped to other customers (used for isolation testing)
 */
export const OTHER_CUSTOMER_CLAIMS: Record<string, string> = {
  'CLM-2026-9042': 'MEM-OTHER-VIKRAM',
  'CLM-2026-7731': 'MEM-OTHER-SUNITA',
};

/**
 * Exact claim ownership mapping for Rahul Sharma (MEM-2024-78432).
 * Wildcards and prefixes are strictly disallowed.
 */
export const RAHUL_SHARMA_CLAIMS = new Set<string>([
  'CLM-2026-8819',
  'CLM-2026-00142',
  'CLM-2025-00891',
]);

/**
 * Dynamically register a newly drafted claim under an authenticated customer's ownership.
 */
export function registerCustomerClaim(memberId: string, claimId: string): void {
  if (memberId === 'MEM-2024-78432') {
    RAHUL_SHARMA_CLAIMS.add(claimId);
  }
}

/**
 * Officer Case Authorization Mappings:
 * PAYTM-ESC-9042 (Priya Verma) -> ESC-2026-8819
 * PAYTM-ESC-8112 (Rajesh Gupta) -> ESC-2026-9042
 * PAYTM-ESC-7450 (Ananya Sen)  -> ESC-2026-7731
 */
export const OFFICER_CASE_MAPPINGS: Record<string, string[]> = {
  'PAYTM-ESC-9042': ['ESC-2026-8819'],
  'PAYTM-ESC-8112': ['ESC-2026-9042'],
  'PAYTM-ESC-7450': ['ESC-2026-7731'],
};

// ─── Core Role Authorization Guards ───────────────────────────────

/**
 * Authorizes that the request carries a valid session with 'customer' role.
 * Rejects unauthenticated requests with 401, role mismatches with 403.
 */
export async function authorizeCustomer(request: Request): Promise<AuthzCustomerResult> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (session.identity.role !== 'customer') {
    return {
      authorized: false,
      response: NextResponse.json(
        { ok: false, error: 'Forbidden: Customer role required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
    customer: session.identity as CustomerIdentity,
  };
}

/**
 * Authorizes that the request carries a valid session with 'officer' role.
 * Rejects unauthenticated requests with 401, role mismatches with 403.
 */
export async function authorizeOfficer(request: Request): Promise<AuthzOfficerResult> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (session.identity.role !== 'officer') {
    return {
      authorized: false,
      response: NextResponse.json(
        { ok: false, error: 'Forbidden: Officer role required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
    officer: session.identity as OfficerIdentity,
  };
}

// ─── Customer Resource Ownership Verification ─────────────────────

/**
 * Verifies whether an authenticated customer is authorized to access a specific claim.
 * Uses exact ownership lookup. Prefix matching and wildcards are strictly prohibited.
 */
export function isCustomerAuthorizedForClaim(memberId: string, claimId: string): boolean {
  if (!memberId || !claimId) return false;

  // Check if claim belongs to another known customer
  const otherOwner = OTHER_CUSTOMER_CLAIMS[claimId];
  if (otherOwner && otherOwner !== memberId) {
    return false;
  }

  // Exact ownership mapping for Rahul Sharma (MEM-2024-78432)
  if (memberId === 'MEM-2024-78432') {
    return RAHUL_SHARMA_CLAIMS.has(claimId);
  }

  return false;
}

/**
 * Verifies whether an authenticated customer is authorized to file against a policy.
 */
export function isCustomerAuthorizedForPolicy(memberId: string, policyId: string): boolean {
  if (!memberId || !policyId) return false;
  const policyList = policiesData as unknown as Array<{ id: string; holder?: { memberId?: string } }>;
  const policy = policyList.find((p) => p.id === policyId);
  if (!policy) return false;
  if (policy.holder?.memberId && policy.holder.memberId !== memberId) {
    return false;
  }
  return true;
}

// ─── Officer Case Authorization Verification ──────────────────────

/**
 * Verifies whether an authenticated officer is assigned/authorized for a specific escalation case.
 */
export function isOfficerAuthorizedForCase(officerId: string, caseId: string): boolean {
  if (!officerId || !caseId) return false;
  const allowedCases = OFFICER_CASE_MAPPINGS[officerId] || [];
  return allowedCases.includes(caseId);
}

/**
 * Verifies whether an authenticated officer is authorized for a specific claim by mapping to case.
 */
export function isOfficerAuthorizedForClaim(officerId: string, claimId: string): boolean {
  if (!officerId || !claimId) return false;
  const queueList = officerQueueData as unknown as Array<{ caseId: string; claimId: string }>;
  const targetCase = queueList.find((c) => c.claimId === claimId);
  if (!targetCase) return false;
  return isOfficerAuthorizedForCase(officerId, targetCase.caseId);
}

/**
 * Returns strictly the subset of officer queue cases assigned to the authenticated officer.
 */
export function getAuthorizedCasesForOfficer(officerId: string) {
  const allowedCases = OFFICER_CASE_MAPPINGS[officerId] || [];
  const queueList = officerQueueData as unknown as Array<{ caseId: string }>;
  return queueList.filter((c) => allowedCases.includes(c.caseId));
}
