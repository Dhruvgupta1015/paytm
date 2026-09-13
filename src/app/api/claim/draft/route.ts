import policies from '@/data/policies.json';

export async function POST(request: Request) {
  const journeyState = await request.json();

  const policy = policies.find((p) => p.id === journeyState.selectedPolicyId);
  const details = journeyState.claimDetails;

  const claim = {
    id: `CLM-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
    policyId: journeyState.selectedPolicyId || 'POL-HEALTH-001',
    status: 'draft',
    type: 'hospitalization',
    patient: {
      name: details?.patientName || policy?.holder.name || 'Rahul Sharma',
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

  return Response.json(claim);
}
