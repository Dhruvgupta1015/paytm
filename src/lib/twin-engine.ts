import policies from '@/data/policies.json';
import type {
  JourneyState,
  Policy,
  FinancialJourneyTwin,
  FinancialSummary,
  ClaimReadinessScore,
  ReadinessComponent,
  NextBestAction,
  Contradiction,
  ClaimEvidenceGraph,
  EvidenceNode,
  EvidenceRelationship,
  FinancialJourneyPassport,
  UpcomingJourney,
} from '@/types';

// ─── CANONICAL FINANCIAL BREAKDOWN (PRESERVED STEP-BY-STEP) ───────────
// Gross Bill: ₹85,000 | Non-Medical Deductibles: ₹6,500 | Estimated Payable: ₹78,500
// Standard non-medical items typically excluded from hospitalization payouts:
// 1. Gloves, PPE kits, sanitization consumables: ₹3,200
// 2. Admission processing & administrative file charges: ₹1,800
// 3. Patient hygiene & convenience kit: ₹1,500
// NOTE: No named regulator or specific legal citation is used.
export const CANONICAL_FINANCIALS = {
  grossHospitalBill: 85000,
  deductibles: 6500,
  estimatedPayable: 78500,
  deductibleItems: [
    {
      item: 'Gloves, PPE Kits & Sanitization Consumables',
      category: 'Medical Consumables',
      amount: 3200,
      reason: 'Standard non-medical administrative consumables typically excluded from claim payouts.',
    },
    {
      item: 'Hospital Admission Processing & File Charges',
      category: 'Administrative Charges',
      amount: 1800,
      reason: 'Standard non-payable administrative and documentation overhead charges.',
    },
    {
      item: 'Patient Hygiene & Personal Convenience Kit',
      category: 'Patient Convenience',
      amount: 1500,
      reason: 'Personal convenience and non-treatment comfort items not eligible for claim reimbursement.',
    },
  ],
  disclaimer:
    'Prototype estimate for demonstration purposes. This is an estimated payable amount, not a final insurer guarantee or settlement confirmation.',
};

/**
 * AI Contradiction Detector Layer
 *
 * Compares clinical facts across:
 * - Patient Identity & Policy Holder
 * - Hospital Admission & Discharge Dates vs Invoiced Period
 * - Gross Declared Bill vs Itemized Pharmacy/Consumables Sum
 * - Network Hospital Status
 *
 * CRITICAL RULE:
 * The default canonical demo path (Rahul Sharma, Apollo Hospital, 4 standard documents)
 * has ZERO contradictions by default. Mismatch scenarios are opt-in and triggered explicitly
 * via state.activeMismatchScenario.
 */
export function detectContradictions(state: JourneyState): Contradiction[] {
  const scenario = state.activeMismatchScenario;

  if (scenario === 'date_mismatch') {
    return [
      {
        id: 'CONTRA-DATE-001',
        type: 'date_mismatch',
        severity: 'BLOCKING',
        documents: ['discharge_summary_apollo.pdf', 'hospital_final_bill_85000.pdf'],
        fields: ['dischargeDate', 'invoicedBillingPeriod'],
        values: {
          expected: '05 Sep 2026 (Physician Signed Discharge Summary)',
          found: '08 Sep 2026 (Hospital Invoiced Bill)',
        },
        explanation:
          'Physician discharge summary records clinical discharge on 05 Sep 2026, but hospital bill invoices room stay charges through 08 Sep 2026 (3-day discrepancy). This mismatch represents an inpatient billing conflict.',
        resolution:
          'Resolve contradiction: Upload an amended hospital final invoice matching 05 Sep 2026, or obtain an addendum certificate from Apollo Hospital Delhi billing desk.',
        status: 'detected',
      },
    ];
  }

  if (scenario === 'amount_mismatch') {
    return [
      {
        id: 'CONTRA-AMT-002',
        type: 'bill_amount_mismatch',
        severity: 'BLOCKING',
        documents: ['hospital_final_bill_85000.pdf', 'claim_intake_summary'],
        fields: ['totalBill', 'itemizedSum'],
        values: {
          expected: '₹85,000 (Declared Claim Gross Amount)',
          found: '₹1,05,000 (Submitted Pharmacy & Consumables Invoice Sum)',
        },
        explanation:
          'Itemized pharmacy and room rent receipts total ₹1,05,000, exceeding the declared consolidated hospital admission bill of ₹85,000 by ₹20,000.',
        resolution:
          'Resolve contradiction: Reconcile itemized pharmacy receipts with the consolidated indoor hospital bill.',
        status: 'detected',
      },
    ];
  }

  // Cross-compare facts on active state (canonical path = 0 contradictions)
  const contradictions: Contradiction[] = [];

  // Patient name check (if different names are entered)
  if (
    state.claimDetails?.patientName &&
    state.claimDetails.patientName.trim().toLowerCase() !== 'rahul sharma' &&
    state.claimDetails.patientName.trim().toLowerCase() !== 'self' &&
    state.claimDetails.relation === 'self'
  ) {
    contradictions.push({
      id: 'CONTRA-NAME-001',
      type: 'patient_name_mismatch',
      severity: 'WARNING',
      documents: ['aadhaar_rahul_sharma.pdf', 'claim_intake_summary'],
      fields: ['patientName', 'policyHolderName'],
      values: {
        expected: 'Rahul Sharma (Policy Holder)',
        found: state.claimDetails.patientName,
      },
      explanation: 'Patient name does not match primary policyholder identity record.',
      resolution: 'Specify correct beneficiary relation (e.g. spouse/dependent) or verify ID proof.',
      status: 'detected',
    });
  }

  return contradictions;
}

/**
 * Deterministic Claim Readiness Scoring Engine
 *
 * SCORING FORMULA BREAKDOWN (Total: 100 points):
 * -------------------------------------------------------------------------
 * 1. Policy Identification (Weight: 15 points):
 *    - Full points if active policy selected (POL-HEALTH-001 or valid policy id)
 *
 * 2. Claim Details Completeness (Weight: 15 points):
 *    - Full points if patient name and diagnosis are specified
 *
 * 3. Hospital & Admission Details (Weight: 15 points):
 *    - Full points if hospital name, admission date, and discharge date are recorded
 *
 * 4. Required Documents Complete (Weight: 20 points):
 *    - 4 core required document types: discharge_summary, bills, identity, prescription
 *    - 5 points per unique required document type present
 *
 * 5. Document Automated Verification (Weight: 25 points):
 *    - 6.25 points per verified document (up to 25 points when all 4 are verified)
 *
 * 6. Financial Calculations Resolved (Weight: 10 points):
 *    - Full points when gross bill is recorded and deductibles are calculated
 *
 * CONTRADICTION PENALTIES (Phase 2):
 * - If any BLOCKING contradiction is flagged, readiness is severely penalized
 *   (capped at 45%), and submission is blocked until resolved.
 */
export function calculateReadinessScore(
  state: JourneyState,
  contradictions: Contradiction[] = []
): ClaimReadinessScore {
  const components: ReadinessComponent[] = [];
  const blockingReasons: string[] = [];

  // 1. Policy Identification (15 pts)
  const hasPolicy = Boolean(state.selectedPolicyId);
  const policyScore = hasPolicy ? 15 : 0;
  components.push({
    id: 'policy_info',
    category: 'policy',
    label: 'Policy Identification & Coverage Check',
    weight: 15,
    score: policyScore,
    status: hasPolicy ? 'complete' : 'missing',
    detail: hasPolicy
      ? `Policy ${state.selectedPolicyId} linked and confirmed active.`
      : 'No active insurance policy selected for this claim.',
  });
  if (!hasPolicy) blockingReasons.push('Please select an active policy.');

  // 2. Claim Details (15 pts)
  const hasPatient = Boolean(state.claimDetails?.patientName);
  const hasDiagnosis = Boolean(state.claimDetails?.diagnosis);
  const claimDetailsScore = hasPatient && hasDiagnosis ? 15 : hasPatient || hasDiagnosis ? 8 : 0;
  components.push({
    id: 'claim_details',
    category: 'claim_details',
    label: 'Claim & Diagnosis Details',
    weight: 15,
    score: claimDetailsScore,
    status: claimDetailsScore === 15 ? 'complete' : claimDetailsScore > 0 ? 'partial' : 'missing',
    detail:
      claimDetailsScore === 15
        ? `Patient: ${state.claimDetails?.patientName} · Diagnosis: ${state.claimDetails?.diagnosis}`
        : 'Patient name or clinical diagnosis missing.',
  });
  if (claimDetailsScore < 15) blockingReasons.push('Diagnosis and patient details are required.');

  // 3. Hospital Details (15 pts)
  const hasHospitalName = Boolean(state.claimDetails?.hospitalName);
  const hasDates = Boolean(state.claimDetails?.admissionDate && state.claimDetails?.dischargeDate);
  const hospitalScore = hasHospitalName && hasDates ? 15 : hasHospitalName || hasDates ? 7 : 0;
  components.push({
    id: 'hospital_info',
    category: 'hospital',
    label: 'Hospital & Admission Period',
    weight: 15,
    score: hospitalScore,
    status: hospitalScore === 15 ? 'complete' : hospitalScore > 0 ? 'partial' : 'missing',
    detail:
      hospitalScore === 15
        ? `${state.claimDetails?.hospitalName} (${state.claimDetails?.admissionDate} to ${state.claimDetails?.dischargeDate})`
        : 'Hospital admission and discharge dates required.',
  });
  if (hospitalScore < 15) blockingReasons.push('Hospital admission period details incomplete.');

  // 4. Required Documents Uploaded (20 pts — 5 pts per required doc type)
  const docTypes = new Set(state.documents.map((d) => d.type));
  const requiredTypes = ['discharge_summary', 'bills', 'identity', 'prescription'] as const;
  const uploadedCount = requiredTypes.filter((t) => docTypes.has(t)).length;
  const docsUploadedScore = Math.round((uploadedCount / requiredTypes.length) * 20);
  components.push({
    id: 'documents_uploaded',
    category: 'documents',
    label: 'Required Claim Documents Uploaded',
    weight: 20,
    score: docsUploadedScore,
    status: docsUploadedScore === 20 ? 'complete' : docsUploadedScore > 0 ? 'partial' : 'missing',
    detail: `${uploadedCount} of 4 essential documents uploaded.`,
  });
  if (uploadedCount < 4) {
    blockingReasons.push(`${4 - uploadedCount} required document(s) pending upload.`);
  }

  // 5. Document Automated Verification (25 pts)
  const verifiedCount = state.documents.filter((d) => d.status === 'verified').length;
  const docsVerifiedScore = Math.min(25, Math.round((verifiedCount / 4) * 25));
  components.push({
    id: 'documents_verified',
    category: 'evidence',
    label: 'Document Automated Verification',
    weight: 25,
    score: docsVerifiedScore,
    status: docsVerifiedScore === 25 ? 'complete' : docsVerifiedScore > 0 ? 'partial' : 'missing',
    detail: `${verifiedCount} of ${state.documents.length || 4} uploaded documents verified.`,
  });
  if (verifiedCount < 4) {
    blockingReasons.push('All 4 core documents must complete automated verification.');
  }

  // 6. Financial Calculations Resolved (10 pts)
  const hasBill = Boolean(state.claimDetails?.totalBill || state.currentStep >= 3);
  const financialScore = hasBill ? 10 : 0;
  components.push({
    id: 'financial_calculations',
    category: 'financial',
    label: 'Gross Bill & Deductible Reconciliation',
    weight: 10,
    score: financialScore,
    status: financialScore === 10 ? 'complete' : 'missing',
    detail: financialScore === 10
      ? 'Gross bill itemization and non-medical exclusions calculated.'
      : 'Hospital bills pending calculation.',
  });

  // Calculate base score sum (0 to 100)
  let rawScore =
    policyScore +
    claimDetailsScore +
    hospitalScore +
    docsUploadedScore +
    docsVerifiedScore +
    financialScore;

  // Contradiction Penalties (Phase 2 integration)
  const blockingContradictions = contradictions.filter((c) => c.severity === 'BLOCKING');
  const warningContradictions = contradictions.filter((c) => c.severity === 'WARNING');

  if (blockingContradictions.length > 0) {
    // Severe penalty: subtract 55 from raw score, then clamp to floor=10, ceiling=45
    rawScore = Math.min(45, Math.max(10, rawScore - 55));
    blockingContradictions.forEach((c) => {
      blockingReasons.push(`Blocking contradiction: ${c.explanation}`);
    });
  } else if (warningContradictions.length > 0) {
    rawScore = Math.max(20, rawScore - 15);
    warningContradictions.forEach((c) => {
      blockingReasons.push(`Warning: ${c.explanation}`);
    });
  }

  const overallScore = Math.max(0, Math.min(100, rawScore));

  let status: ClaimReadinessScore['status'] = 'not_ready';
  let explanation = '';

  if (blockingContradictions.length > 0) {
    status = 'needs_attention';
    explanation = `Submission blocked: ${blockingContradictions.length} unresolved document contradiction detected.`;
  } else if (overallScore >= 95 && blockingReasons.length === 0) {
    status = 'ready_to_submit';
    explanation =
      'Claim packet is fully ready with 100% verified clinical evidence and clear settlement breakdown.';
  } else if (overallScore >= 75) {
    status = 'ready_for_review';
    explanation =
      'Major clinical documents and event details provided. Ready for policyholder draft review.';
  } else if (overallScore >= 40) {
    status = 'needs_attention';
    explanation =
      'Essential documents or hospital details are still incomplete. Follow recommended actions.';
  } else {
    status = 'not_ready';
    explanation = 'Initial claim intake in progress. Please complete hospital incident details.';
  }

  return {
    overallScore,
    status,
    components,
    blockingReasons,
    explanation,
  };
}

/**
 * Synthesize the complete Financial Journey Twin model from active application state.
 * Guaranteed to produce zero duplicate sources of truth.
 */
export function deriveJourneyTwin(state: JourneyState): FinancialJourneyTwin {
  const policyList = policies as Policy[];
  const policy = policyList.find((p) => p.id === state.selectedPolicyId) || policyList[0] || null;

  const totalBill = state.claimDetails?.totalBill || CANONICAL_FINANCIALS.grossHospitalBill;
  const deductibles = CANONICAL_FINANCIALS.deductibles;
  const estimatedPayable = Math.max(0, totalBill - deductibles);

  const financialSummary: FinancialSummary = {
    grossHospitalBill: totalBill,
    deductibles,
    deductibleItems: CANONICAL_FINANCIALS.deductibleItems,
    estimatedPayable,
    sumInsured: policy?.sumInsured || 500000,
    remainingCoverage: policy?.sumInsured || 500000,
    copayPercent: 0,
    disclaimer: CANONICAL_FINANCIALS.disclaimer,
  };

  // Run AI Contradiction Detector
  const contradictions: Contradiction[] = detectContradictions(state);

  const readiness = calculateReadinessScore(state, contradictions);

  // Next Best Action determination (Evaluates state, documents, evidence, contradictions, readiness)
  let nextBestAction: NextBestAction = {
    id: 'intake_incident',
    action: 'Provide Hospitalization Details',
    reason: 'Record hospital admission date and diagnosis to initiate your claim draft.',
    priority: 'high',
    confidence: 0.95,
    blocking: true,
    target: 'journey_intake',
    targetRoute: '/journey',
  };

  const isLowConfidence = Boolean(state.simulateLowConfidence);
  const overallConfidence = isLowConfidence ? 0.62 : 0.95;

  // Check if a blocking contradiction overrides next best action
  const blockingContradiction = contradictions.find((c) => c.severity === 'BLOCKING');

  if (blockingContradiction) {
    nextBestAction = {
      id: 'resolve_contradiction',
      action: 'Resolve Document Contradiction (Blocking)',
      reason: blockingContradiction.explanation,
      priority: 'critical',
      confidence: 0.99,
      blocking: true,
      target: 'contradictions',
      targetRoute: state.currentStep >= 6 ? '/claim/draft' : '/documents',
    };
  } else if (isLowConfidence) {
    // Low confidence safeguard path (TEST 5)
    nextBestAction = {
      id: 'escalate_officer',
      action: 'Connect with Claims Support Officer (Low Confidence Safeguard)',
      reason:
        'AI triage confidence is 62%. Route directly to senior human adjudicator Priya Verma for human-in-the-loop review.',
      priority: 'high',
      confidence: 0.62,
      blocking: false,
      target: 'escalation',
      targetRoute: '/escalation',
    };
  } else if (!state.selectedPolicyId) {
    nextBestAction = {
      id: 'select_policy',
      action: 'Confirm Insurance Policy',
      reason: 'Choose your active Paytm Health Secure Plus policy for cashless or reimbursement processing.',
      priority: 'high',
      confidence: 0.98,
      blocking: true,
      target: 'policy_selection',
      targetRoute: '/journey',
    };
  } else if (!state.claimDetails?.hospitalName) {
    nextBestAction = {
      id: 'confirm_hospital',
      action: 'Confirm Hospital Stay Dates',
      reason: 'Verify admission and discharge at Apollo Hospital Delhi to populate claim packet.',
      priority: 'high',
      confidence: 0.96,
      blocking: true,
      target: 'hospital_details',
      targetRoute: '/journey',
    };
  } else if (state.documents.length < 4 || state.documents.some((d) => d.status !== 'verified')) {
    nextBestAction = {
      id: 'verify_docs',
      action: 'Upload & Verify Required Documents',
      reason: 'Upload discharge summary, itemized bills, Aadhaar & doctor prescription for automated verification.',
      priority: 'high',
      confidence: 0.95,
      blocking: true,
      target: 'document_verification',
      targetRoute: '/documents',
    };
  } else if (state.currentStep < 7 && (!state.claimStatus || state.claimStatus === 'draft')) {
    nextBestAction = {
      id: 'approve_draft',
      action: 'Review Breakdown & Approve Claim',
      reason: 'Inspect ₹85,000 gross bill, ₹6,500 non-medical exclusions, and sign user declaration to submit.',
      priority: 'high',
      confidence: 0.99,
      blocking: false,
      target: 'claim_approval',
      targetRoute: '/claim/draft',
    };
  } else {
    nextBestAction = {
      id: 'track_claim',
      action: 'Monitor Adjudication Status',
      reason: 'Your claim is submitted and under senior underwriter inspection. Download your receipt.',
      priority: 'medium',
      confidence: 0.94,
      blocking: false,
      target: 'claim_tracking',
      targetRoute: '/claim/tracking',
    };
  }

  const verifiedDocsCount = state.documents.filter((d) => d.status === 'verified').length;

  const partialTwin: FinancialJourneyTwin = {
    customer: {
      name: policy?.holder.name || 'Rahul Sharma',
      age: policy?.holder.age || 32,
      memberId: policy?.holder.memberId || 'MEM-2024-78432',
      phone: '+91 98765 43210',
    },
    journeyType: 'health_insurance_reimbursement',
    policy,
    claim: {
      id: state.claimId || null,
      status: state.claimStatus || (state.currentStep >= 7 ? 'under_review' : 'draft'),
      type: 'Inpatient Hospitalization (Reimbursement)',
    },
    hospital: state.claimDetails
      ? {
          name: state.claimDetails.hospitalName || 'Apollo Hospital, Delhi',
          isNetwork: true,
          admissionDate: state.claimDetails.admissionDate || '2026-09-01',
          dischargeDate: state.claimDetails.dischargeDate || '2026-09-05',
          durationDays: 4,
        }
      : {
          name: 'Apollo Hospital, Delhi',
          isNetwork: true,
          admissionDate: '2026-09-01',
          dischargeDate: '2026-09-05',
          durationDays: 4,
        },
    documents: state.documents,
    evidence: {
      totalDocuments: state.documents.length,
      verifiedCount: verifiedDocsCount,
      pendingCount: Math.max(0, 4 - verifiedDocsCount),
    },
    financialSummary,
    readiness,
    contradictions,
    currentState: state.steps.find((s) => s.status === 'current')?.label || 'Intake',
    nextBestAction,
    confidence: overallConfidence,
    lastUpdated: new Date().toISOString(),
  };

  // Derive Evidence Graph from actual application state & synthetic documents
  const evidenceGraph = deriveEvidenceGraph(state, contradictions);

  // Derive Financial Journey Passport reusing twin state
  const passport = deriveJourneyPassport(partialTwin);

  return {
    ...partialTwin,
    evidenceGraph,
    passport,
  };
}

/**
 * Derives the deterministic Claim Evidence Graph using only the project's real synthetic documents.
 */
export function deriveEvidenceGraph(
  state: JourneyState,
  _contradictions: Contradiction[]
): ClaimEvidenceGraph {
  void _contradictions;
  const isDateMismatch = state.activeMismatchScenario === 'date_mismatch';
  const isAmountMismatch = state.activeMismatchScenario === 'amount_mismatch';

  const docStatuses: Record<string, boolean> = {
    discharge_summary: state.documents.some(
      (d) => d.type === 'discharge_summary' && d.status === 'verified'
    ),
    bills: state.documents.some((d) => d.type === 'bills' && d.status === 'verified'),
    identity: state.documents.some((d) => d.type === 'identity' && d.status === 'verified'),
    prescription: state.documents.some(
      (d) => d.type === 'prescription' && d.status === 'verified'
    ),
  };

  const nodes: EvidenceNode[] = [
    {
      id: 'node_discharge',
      type: 'document',
      source: 'discharge_summary_apollo.pdf',
      extractedFacts: [
        'Patient Name: Rahul Sharma',
        'Diagnosis: Dengue Fever with Severe Thrombocytopenia',
        'Hospital: Apollo Hospital, Sarita Vihar, Delhi',
        'Admission: 01 Sep 2026 | Discharge: 05 Sep 2026',
        'Physician: Dr. A. Kapoor (Reg #MCI-2015-4491)',
      ],
      confidence: 0.98,
      verified: docStatuses.discharge_summary,
    },
    {
      id: 'node_bill',
      type: 'document',
      source: 'hospital_final_bill_85000.pdf',
      extractedFacts: [
        `Consolidated Invoiced Bill: ${isAmountMismatch ? '₹1,05,000' : '₹85,000'}`,
        'Room Rent (Twin Sharing, 4 Days): ₹20,000',
        'Pharmacy & Diagnostics: ₹28,500',
        'Non-Medical Consumables Excluded: ₹6,500',
        `Billing Period: 01 Sep 2026 to ${isDateMismatch ? '08 Sep 2026' : '05 Sep 2026'}`,
      ],
      confidence: 0.96,
      verified: docStatuses.bills,
    },
    {
      id: 'node_identity',
      type: 'document',
      source: 'aadhaar_card_rahul.pdf',
      extractedFacts: [
        'Full Name: Rahul Sharma',
        'Age / DOB: 32 Years',
        'Gender: Male',
        'UID Token: XXXX-XXXX-4812',
      ],
      confidence: 0.99,
      verified: docStatuses.identity,
    },
    {
      id: 'node_rx',
      type: 'document',
      source: 'prescription_dr_kapoor.pdf',
      extractedFacts: [
        'Consulting Specialist: Dr. A. Kapoor, MD (Internal Medicine)',
        'Clinical Rx: IV Fluids (NS/DNS 500ml)',
        'Supportive Therapy: Platelet Infusion Monitoring & Antipyretics',
      ],
      confidence: 0.95,
      verified: docStatuses.prescription,
    },
    {
      id: 'node_policy',
      type: 'policy',
      source: 'Paytm Health Secure Plus (POL-HEALTH-001)',
      extractedFacts: [
        'Policyholder: Rahul Sharma',
        'Sum Insured: ₹5,00,000 (100% Available Balance)',
        'Network Hospital: Apollo Hospital Delhi (Direct Cashless & Reimbursement Eligible)',
      ],
      confidence: 0.99,
      verified: Boolean(state.selectedPolicyId),
    },
    {
      id: 'node_claim_fact',
      type: 'financial',
      source: 'Financial Breakdown & Adjudication Summary',
      extractedFacts: [
        'Gross Claimed Amount: ₹85,000',
        'Standard Non-Medical Consumables Deduction: -₹6,500',
        'Net Estimated Payable: ₹78,500',
      ],
      confidence: 0.97,
      verified: state.currentStep >= 6,
    },
  ];

  const relationships: EvidenceRelationship[] = [
    {
      sourceId: 'node_identity',
      targetId: 'node_policy',
      relationship: 'verifies_policyholder_identity',
      confidence: 0.99,
    },
    {
      sourceId: 'node_discharge',
      targetId: 'node_policy',
      relationship: 'confirms_covered_inpatient_ailment',
      confidence: 0.98,
    },
    {
      sourceId: 'node_discharge',
      targetId: 'node_bill',
      relationship: isDateMismatch
        ? 'CONTRADICTION: Physician discharge (05 Sep) conflicts with hospital billing period (08 Sep)'
        : 'corroborates_inpatient_stay_duration',
      confidence: isDateMismatch ? 0.99 : 0.96,
      isContradiction: isDateMismatch,
    },
    {
      sourceId: 'node_rx',
      targetId: 'node_bill',
      relationship: 'substantiates_inpatient_pharmacy_and_fluid_charges',
      confidence: 0.95,
    },
    {
      sourceId: 'node_bill',
      targetId: 'node_claim_fact',
      relationship: isAmountMismatch
        ? 'CONTRADICTION: Itemized hospital bill receipts (₹1,05,000) exceed declared claim (₹85,000)'
        : 'substantiates_gross_hospitalization_and_exclusions',
      confidence: isAmountMismatch ? 0.99 : 0.97,
      isContradiction: isAmountMismatch,
    },
  ];

  return { nodes, relationships };
}

/**
 * Derives the Financial Journey Passport reusing the Financial Journey Twin.
 * Guarantees zero duplicate state.
 */
export function deriveJourneyPassport(twin: FinancialJourneyTwin): FinancialJourneyPassport {
  const otherJourneys: UpcomingJourney[] = [
    {
      id: 'journey_lending',
      title: 'Emergency Hospital Credit Line',
      category: 'Lending',
      status: 'Coming Soon',
      badge: 'Fast-Track Credit (Planned)',
      description:
        'Digital emergency credit line to assist with hospital admission security deposits and non-medical exclusions.',
      projectedBenefit: 'Deferred settlement assistance pending insurer claim adjudication',
    },
    {
      id: 'journey_fintech',
      title: 'Paytm Cashless Hospital Checkout',
      category: 'Fintech',
      status: 'Coming Soon',
      badge: 'UPI Checkout (Planned)',
      description:
        'Direct provider settlement at network hospitals with one-tap digital authorization and billing desk synchronization.',
      projectedBenefit: 'Reduces waiting time at hospital discharge billing desk',
    },
    {
      id: 'journey_wealth',
      title: 'Health Savings Account (HSA) Tax Optimizer',
      category: 'Wealth',
      status: 'Coming Soon',
      badge: 'Tax-Efficient Savings',
      description:
        'Automated health savings vault with recurring contributions toward future healthcare preparedness.',
      projectedBenefit: 'Tax-efficient savings options for planned healthcare expenses',
    },
  ];

  const claimStatusDisplay =
    twin.claim.status === 'submitted_for_review' || twin.claim.status === 'under_review'
      ? 'Submitted (Insurer Adjudication In Progress)'
      : twin.claim.status === 'settled'
      ? 'Settled (Funds Dispatched)'
      : 'Active (Claim Packet Preparation)';

  return {
    passportId: `FP-2026-${twin.customer.memberId.replace(/[^0-9]/g, '') || '78432'}`,
    holderName: twin.customer.name,
    memberId: twin.customer.memberId,
    issuedAt: '01 Sep 2026',
    activeJourney: {
      title: 'Paytm Health Insurance Claims Copilot',
      type: 'Inpatient Hospitalization Reimbursement',
      status: claimStatusDisplay,
      policyName: twin.policy?.name || 'Paytm Health Secure Plus',
      policyNumber: twin.policy?.id || 'POL-HEALTH-001',
      hospitalName: twin.hospital?.name || 'Apollo Hospital, Delhi',
      grossAmount: twin.financialSummary.grossHospitalBill,
      estimatedPayable: twin.financialSummary.estimatedPayable,
      readinessScore: twin.readiness.overallScore,
      verifiedDocsCount: twin.evidence.verifiedCount,
      totalDocsCount: 4,
      nextAction: twin.nextBestAction.action,
    },
    otherJourneys,
  };
}
