export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Return a mock claim status
  const claim = {
    id,
    status: 'submitted_for_review',
    type: 'hospitalization',
    patient: {
      name: 'Rahul Sharma',
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

  return Response.json(claim);
}
