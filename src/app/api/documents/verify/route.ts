export async function POST(request: Request) {
  const body = await request.json();
  const rawDocs = body.documents || body.documentIds || [];

  // Scripted verification logic — deterministic by document type
  const verified = rawDocs.map((doc: any, index: number) => {
    const docObj = typeof doc === 'string'
      ? { id: doc, name: `Document-${index + 1}.pdf`, type: 'bills' }
      : doc;
    const result = verifyByType(docObj.type || 'other', docObj.name || '');
    return {
      ...docObj,
      status: result.status,
      reason: result.reason,
    };
  });

  return Response.json({ documents: verified });
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
      if (name.toLowerCase().includes('unclear') || name.toLowerCase().includes('blurry')) {
        return { status: 'rejected', reason: 'Document is not legible. Please upload a clearer copy.' };
      }
      return { status: 'verified' };
    default:
      return { status: 'verified' };
  }
}
