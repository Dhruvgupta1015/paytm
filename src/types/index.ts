// ─── Policy Types ────────────────────────────────────────────────

export interface PolicyHolder {
  name: string;
  age: number;
  memberId: string;
}

export interface PolicyCoverage {
  hospitalization: boolean;
  daycare: boolean;
  preHospitalization: string;
  postHospitalization: string;
  ambulance: number;
  roomRent: string;
}

export interface Policy {
  id: string;
  name: string;
  type: string;
  provider: string;
  premium: number;
  sumInsured: number;
  status: 'active' | 'expired' | 'lapsed';
  holder: PolicyHolder;
  coverage: PolicyCoverage;
  exclusions: string[];
  claimProcess: string[];
  networkHospitals: string[];
}

// ─── Document Types ──────────────────────────────────────────────

export type DocumentStatus = 'pending' | 'verified' | 'rejected';
export type DocumentType = 'discharge_summary' | 'bills' | 'identity' | 'prescription' | 'other';

export interface ClaimDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  type: DocumentType;
  uploadedAt: string;
  reason?: string; // rejection reason
}

// ─── Claim Types ─────────────────────────────────────────────────

export type ClaimStatus = 
  | 'draft'
  | 'submitted_for_review'
  | 'under_review'
  | 'additional_info_required'
  | 'settled';

export interface ClaimHospital {
  name: string;
  admissionDate: string;
  dischargeDate: string;
  totalBill: number;
}

export interface ClaimTimelineEntry {
  step: string;
  date: string | null;
  status: 'completed' | 'current' | 'upcoming';
}

export interface Claim {
  id: string;
  policyId: string;
  status: ClaimStatus;
  type: string;
  patient: {
    name: string;
    relation: string;
  };
  hospital: ClaimHospital;
  documents: ClaimDocument[];
  estimatedSettlement: string;
  timeline: ClaimTimelineEntry[];
  createdAt: string;
  syntheticData: true;
}

// ─── Journey Types ───────────────────────────────────────────────

export type JourneyStepStatus = 'completed' | 'current' | 'upcoming' | 'skipped';

export interface JourneyStep {
  id: number;
  key: string;
  label: string;
  description: string;
  status: JourneyStepStatus;
}

export interface JourneyState {
  steps: JourneyStep[];
  currentStepIndex: number;
  currentStep: number; // 1-indexed (1 to 8)
  progress: number;  // 0–100
  selectedPolicyId: string | null;
  claimDetails: {
    hospitalName: string;
    admissionDate: string;
    dischargeDate: string;
    totalBill: number;
    patientName: string;
    relation: string;
    diagnosis: string;
  } | null;
  documents: ClaimDocument[];
  claimId: string | null;
  claimStatus: ClaimStatus | null;
  twin?: FinancialJourneyTwin;
  activeMismatchScenario?: 'none' | 'date_mismatch' | 'amount_mismatch' | null;
  simulateLowConfidence?: boolean;
}

// ─── Financial Journey Twin & Readiness Types ─────────────────────

export interface DeductibleItem {
  item: string;
  category: string;
  amount: number;
  reason: string;
}

export interface FinancialSummary {
  grossHospitalBill: number;
  deductibles: number;
  deductibleItems: DeductibleItem[];
  estimatedPayable: number;
  sumInsured: number;
  remainingCoverage: number;
  copayPercent: number;
  disclaimer: string;
}

export interface ReadinessComponent {
  id: string;
  category: 'policy' | 'claim_details' | 'hospital' | 'documents' | 'financial' | 'evidence';
  label: string;
  weight: number;
  score: number; // 0 to 100
  status: 'complete' | 'partial' | 'missing' | 'blocked';
  detail: string;
}

export interface ClaimReadinessScore {
  overallScore: number; // 0 to 100
  status: 'not_ready' | 'needs_attention' | 'ready_for_review' | 'ready_to_submit';
  components: ReadinessComponent[];
  blockingReasons: string[];
  explanation: string;
}

export type ContradictionType =
  | 'patient_name_mismatch'
  | 'hospital_mismatch'
  | 'date_mismatch'
  | 'bill_amount_mismatch'
  | 'treatment_mismatch'
  | 'claim_amount_mismatch'
  | 'policy_mismatch';

export type ContradictionSeverity = 'INFO' | 'WARNING' | 'BLOCKING';
export type ContradictionStatus = 'detected' | 'resolved' | 'acknowledged';

export interface Contradiction {
  id: string;
  type: ContradictionType;
  severity: ContradictionSeverity;
  documents: string[];
  fields: string[];
  values: {
    expected: string;
    found: string;
  };
  explanation: string;
  resolution: string;
  status: ContradictionStatus;
}

export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NextBestAction {
  id: string;
  action: string;
  reason: string;
  priority: ActionPriority;
  confidence: number;
  blocking: boolean;
  target: string;
  targetRoute?: string;
}

// Backward compatibility alias
export type NextBestActionStub = NextBestAction;

// ─── Evidence Graph Types ─────────────────────────────────────────

export type EvidenceNodeType = 'document' | 'policy' | 'hospital' | 'claim_fact' | 'financial';

export interface EvidenceNode {
  id: string;
  type: EvidenceNodeType;
  source: string;
  extractedFacts: string[];
  confidence: number;
  verified: boolean;
}

export interface EvidenceRelationship {
  sourceId: string;
  targetId: string;
  relationship: string;
  confidence: number;
  isContradiction?: boolean;
}

export interface ClaimEvidenceGraph {
  nodes: EvidenceNode[];
  relationships: EvidenceRelationship[];
}

// ─── Financial Journey Passport Types ──────────────────────────────

export interface UpcomingJourney {
  id: string;
  title: string;
  category: 'Lending' | 'Fintech' | 'Wealth';
  status: 'Coming Soon';
  badge: string;
  description: string;
  projectedBenefit: string;
}

export interface FinancialJourneyPassport {
  passportId: string;
  holderName: string;
  memberId: string;
  issuedAt: string;
  activeJourney: {
    title: string;
    type: string;
    status: string;
    policyName: string;
    policyNumber: string;
    hospitalName: string;
    grossAmount: number;
    estimatedPayable: number;
    readinessScore: number;
    verifiedDocsCount: number;
    totalDocsCount: number;
    nextAction: string;
  };
  otherJourneys: UpcomingJourney[];
}

export interface FinancialJourneyTwin {
  customer: {
    name: string;
    age: number;
    memberId: string;
    phone: string;
  };
  journeyType: 'health_insurance_reimbursement';
  policy: Policy | null;
  claim: {
    id: string | null;
    status: ClaimStatus | 'not_started';
    type: string;
  };
  hospital: {
    name: string;
    isNetwork: boolean;
    admissionDate: string;
    dischargeDate: string;
    durationDays: number;
  } | null;
  documents: ClaimDocument[];
  evidence: {
    totalDocuments: number;
    verifiedCount: number;
    pendingCount: number;
  };
  financialSummary: FinancialSummary;
  readiness: ClaimReadinessScore;
  contradictions: Contradiction[];
  currentState: string;
  nextBestAction: NextBestAction;
  evidenceGraph?: ClaimEvidenceGraph;
  passport?: FinancialJourneyPassport;
  confidence: number;
  lastUpdated: string;
}

// ─── Chat Types ──────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  isLiveSarvam?: boolean;
}

// ─── Escalation Types ────────────────────────────────────────────

export interface EscalationCase {
  caseId: string;
  reason: string;
  confidenceScore: number;
  status: 'pending' | 'assigned' | 'resolved';
  assignedTo: string;
  createdAt: string;
}

export interface OfficerQueueCase {
  caseId: string;
  claimId: string;
  customerName: string;
  customerAge: number;
  policyName: string;
  policyNumber: string;
  hospitalName: string;
  admissionDates: string;
  claimedGross: string;
  estimatedPayable: string;
  deductiblesInfo: string;
  attachedDocsSummary: string;
  officerName: string;
  officerInitials: string;
  officerTitle: string;
  officerBadge: string;
  aiConfidence: number;
  triggerReason: string;
  status: string;
  priority: 'High' | 'Medium' | 'Critical';
  summary: string;
  n8nExecution?: {
    executionId: string;
    route: N8nRoute;
    readinessScore: number;
    contradictionCount: number;
    routingReason: string;
    handoverStatus: string;
    timestamp: string;
  };
}

// ─── n8n Orchestration Types ─────────────────────────────────────

export type N8nRoute = 'FAST_TRACK' | 'STANDARD_REVIEW' | 'HUMAN_REVIEW';

export interface N8nWorkflowNode {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  timestamp?: string;
  outputSummary?: string;
}

export interface N8nNotificationSummary {
  status: string; // e.g. "Notification Prepared — Demo"
  recipient: string;
  channel: string;
  headline: string;
  message: string;
  dispatchedAt: string;
}

export interface N8nHospitalDossierSummary {
  status: string; // e.g. "Hospital Sync Payload Prepared — Demo"
  facility: string;
  patientMemberId: string;
  invoicedAmount: string;
  excludedConsumables: string;
  packetStatus: string;
  preparedAt: string;
}

export interface N8nAuditRecord {
  executionId: string;
  claimId: string;
  policyNumber?: string;
  customerName?: string;
  readinessScore: number;
  contradictionCount: number;
  selectedRoute: N8nRoute;
  priority: 'High' | 'Medium' | 'Critical';
  workflowStatus: string;
  timestamp: string;
}

export interface N8nTriggerPayload {
  claimId: string;
  policyId?: string;
  policyNumber?: string;
  customerId?: string;
  customerName?: string;
  hospitalName?: string;
  memberId?: string;
  readinessScore: number;
  contradictions: any[];
  grossAmount: number;
  deductions: number;
  estimatedPayable: number;
  claimStatus?: string;
  documentsVerified?: boolean;
  timestamp?: string;
  customWebhookUrl?: string;
}

export interface N8nExecutionResult {
  success: boolean;
  mode: 'live' | 'simulation';
  executionId: string;
  route: N8nRoute;
  priority: 'High' | 'Medium' | 'Critical';
  latencyMs: number;
  readinessScore: number;
  contradictionCount: number;
  nodes: N8nWorkflowNode[];
  notification: N8nNotificationSummary;
  hospitalDossier: N8nHospitalDossierSummary;
  auditRecord: N8nAuditRecord;
  error?: string;
}
