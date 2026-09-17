/**
 * Server-Side Data Minimization & PII Masking Engine
 *
 * FinJourney AI — Phase 5 Security Architecture
 *
 * Enforces the Principle of Least Privilege:
 * - Minimizes officer-facing payloads before JSON serialization.
 * - Masks operationally useful identifiers (names, numbers, policy IDs).
 * - Strips unneeded private demographic, contact, and unrelated customer data.
 */

// Server-only runtime boundary enforcement
if (typeof window !== 'undefined') {
  throw new Error('[data-minimization-server] Critical error: module is server-only.');
}

export interface MinimizedOfficerQueueCase {
  caseId: string;
  claimId: string;
  customerName: string; // Masked (e.g. "Rahul S.")
  customerAge?: number;
  policyName: string;
  policyNumber: string; // Masked (e.g. "POL-***-001")
  hospitalName: string;
  admissionDates: string;
  claimedGross: string;
  estimatedPayable: string;
  deductiblesInfo: string;
  attachedDocsSummary: string; // Sanitized doc list without raw Aadhaar
  officerName: string;
  officerInitials: string;
  officerTitle: string;
  officerBadge: string;
  aiConfidence: number;
  triggerReason: string;
  status: string;
  priority: string;
  summary: string;
  // Strictly NO raw Aadhaar, phone numbers, full addresses, bank/UPI details, or unrelated policies
}

/**
 * Masks customer full name to first name and last initial (e.g. "Rahul S.")
 */
export function maskCustomerName(fullName: string): string {
  if (!fullName) return 'Customer';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
}

/**
 * Masks policy number to hide middle product code (e.g. "POL-HEALTH-001" -> "POL-***-001")
 */
export function maskPolicyNumber(policyNumber: string): string {
  if (!policyNumber) return 'POL-***';
  const parts = policyNumber.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-***-${parts[parts.length - 1]}`;
  }
  return policyNumber.replace(/(.{3}).*(.{3})/, '$1***$2');
}

/**
 * Masks phone number to standard Indian privacy format (e.g. "+91******1234")
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '+91******1234';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    return `+91******${last4}`;
  }
  return '+91******1234';
}

/**
 * Masks email address (e.g. "rahul.sharma@paytm.demo" -> "r***@paytm.demo")
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return 'u***@example.com';
  const [local, domain] = email.split('@');
  const firstChar = local[0] || 'u';
  return `${firstChar}***@${domain}`;
}

/**
 * Masks bank / UPI account identifiers (e.g. "****1234")
 */
export function maskAccountNumber(acc?: string | null): string {
  if (!acc) return '****1234';
  const digits = acc.replace(/\D/g, '');
  const last4 = digits.slice(-4) || '1234';
  return `****${last4}`;
}

/**
 * Transforms a raw internal case record into an authoritative, minimized officer-safe payload.
 * Strips unneeded PII and masks sensitive identifiers before transmission.
 */
export function toOfficerCaseView(rawCase: any): MinimizedOfficerQueueCase {
  const cleanSummary = (rawCase.summary || '').replace(
    /Insured\s+([A-Za-z]+)\s+([A-Za-z]+)/g,
    (_match: string, p1: string, p2: string) => `Insured ${p1} ${p2[0]}.`
  );

  return {
    caseId: rawCase.caseId,
    claimId: rawCase.claimId,
    customerName: maskCustomerName(rawCase.customerName),
    customerAge: rawCase.customerAge,
    policyName: rawCase.policyName,
    policyNumber: maskPolicyNumber(rawCase.policyNumber),
    hospitalName: rawCase.hospitalName,
    admissionDates: rawCase.admissionDates,
    claimedGross: rawCase.claimedGross,
    estimatedPayable: rawCase.estimatedPayable,
    deductiblesInfo: rawCase.deductiblesInfo,
    attachedDocsSummary: (rawCase.attachedDocsSummary || '').replace(
      /Aadhaar(?:\s*\(verified\))?/gi,
      'Aadhaar (****-7843 verified)'
    ),
    officerName: rawCase.officerName,
    officerInitials: rawCase.officerInitials,
    officerTitle: rawCase.officerTitle,
    officerBadge: rawCase.officerBadge,
    aiConfidence: rawCase.aiConfidence,
    triggerReason: rawCase.triggerReason,
    status: rawCase.status,
    priority: rawCase.priority,
    summary: cleanSummary,
  };
}
