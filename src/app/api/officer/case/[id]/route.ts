import { NextResponse } from 'next/server';
import { authorizeOfficer, isOfficerAuthorizedForCase } from '@/lib/authz-server';
import { toOfficerCaseView } from '@/lib/data-minimization-server';
import officerQueueData from '@/data/officer-queue.json';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authoritative Officer Check
  const authz = await authorizeOfficer(request);
  if (!authz.authorized) {
    return authz.response;
  }

  const { id } = await params;

  // Case-level authorization check:
  // Server verifies that this specific case is assigned to this authenticated officer
  if (!isOfficerAuthorizedForCase(authz.officer.officerId, id)) {
    // 403 Forbidden - generic safe response without leaking case details
    return NextResponse.json(
      { ok: false, error: 'Access denied' },
      { status: 403 }
    );
  }

  const queueList = officerQueueData as unknown as Array<Record<string, unknown>>;
  const foundCase = queueList.find((c) => c.caseId === id);
  if (!foundCase) {
    return NextResponse.json(
      { ok: false, error: 'Case not found' },
      { status: 404 }
    );
  }

  // Server-side PII minimization before returning JSON
  const minimizedCase = toOfficerCaseView(foundCase);

  return NextResponse.json({
    ok: true,
    case: minimizedCase,
  });
}
