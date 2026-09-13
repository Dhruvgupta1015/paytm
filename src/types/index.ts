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
}

// ─── Chat Types ──────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
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
