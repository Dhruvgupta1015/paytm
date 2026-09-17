import { NextResponse } from 'next/server';
import { authorizeOfficer, getAuthorizedCasesForOfficer } from '@/lib/authz-server';
import { toOfficerCaseView } from '@/lib/data-minimization-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Authoritative Officer Check
  // Rejects unauthenticated requests with 401, customer role with 403
  const authz = await authorizeOfficer(request);
  if (!authz.authorized) {
    return authz.response;
  }

  // Authoritative officerId from the signed session — any ?officerId query param is ignored
  const officerId = authz.officer.officerId;

  // Retrieve only cases assigned to this officer
  const rawCases = getAuthorizedCasesForOfficer(officerId);

  // Server-side PII minimization: Mask and filter sensitive fields before returning JSON
  const cases = rawCases.map(toOfficerCaseView);

  return NextResponse.json({
    ok: true,
    officerId,
    cases,
  });
}
