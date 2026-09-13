export async function POST(request: Request) {
  const { fileName, fileType } = await request.json();

  // Simulate document upload — no real file processing
  const doc = {
    id: `DOC-${Date.now()}`,
    name: fileName,
    status: 'pending' as const,
    type: fileType || inferDocType(fileName),
    uploadedAt: new Date().toISOString(),
  };

  return Response.json(doc);
}

function inferDocType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('discharge')) return 'discharge_summary';
  if (lower.includes('bill') || lower.includes('receipt') || lower.includes('invoice')) return 'bills';
  if (lower.includes('id') || lower.includes('aadhar') || lower.includes('aadhaar') || lower.includes('pan') || lower.includes('passport')) return 'identity';
  if (lower.includes('prescription') || lower.includes('rx')) return 'prescription';
  return 'other';
}
