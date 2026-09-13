export async function POST(request: Request) {
  const { documents } = await request.json();

  // Scripted verification logic — deterministic by document type
  const verified = (documents as Array<{ id: string; name: string; type: string }>).map((doc) => {
    const result = verifyByType(doc.type, doc.name);
    return {
      ...doc,
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
