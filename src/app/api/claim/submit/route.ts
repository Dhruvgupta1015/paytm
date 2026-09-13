export async function POST(request: Request) {
  const { claimId } = await request.json();

  // Simulate claim submission — NEVER say "approved"
  const result = {
    id: claimId || `CLM-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
    status: 'submitted_for_review',
    message: 'Your claim has been submitted for review. You will be notified of any updates.',
    estimatedReviewTime: '3-5 business days',
    submittedAt: new Date().toISOString(),
    syntheticData: true,
  };

  return Response.json(result);
}
