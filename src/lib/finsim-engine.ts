/**
 * FinJourney AI — FinSim Agent (Financial What-If Simulator)
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. SINGLE SOURCE OF TRUTH: All baseline values, deductibles, and payable formulas are
 *    strictly derived from CANONICAL_FINANCIALS and deriveJourneyTwin() in src/lib/twin-engine.ts.
 *    DO NOT independently hardcode consumables or duplicate financial deduction logic.
 * 2. STRICT IMMUTABILITY: Simulations run in-memory on isolated state clones. The customer's
 *    real JourneyState, claim details, readiness score, evidence graph, and contradictions
 *    are NEVER mutated.
 * 3. NO LLM ARITHMETIC: LLM (Sarvam) handles natural language understanding and explanation;
 *    all numerical calculations and scenario deltas are strictly deterministic.
 * 4. AUDITABLE & EXPLAINABLE: Every simulation produces real vs simulated numbers, deltas,
 *    and clear customer-facing disclaimers.
 */

import { CANONICAL_FINANCIALS, deriveJourneyTwin } from '@/lib/twin-engine';
import type {
  JourneyState,
  JourneyStep,
  ClaimDocument,
  FinSimFinancialValues,
  FinSimImpact,
  FinSimScenarioResult,
  FinancialJourneyTwin,
} from '@/types';

export interface FinSimScenarioParams {
  scenarioId: string;
  hypotheticalGross: number;
  scenarioDescription: string;
  valid: boolean;
  validationError?: string;
  requestedAt: string;
}

/**
 * Returns a baseline JourneyState snapshot safe for read-only calculations.
 */
function getSafeBaseState(stateSnapshot?: Partial<JourneyState>): JourneyState {
  const defaultSteps: JourneyStep[] = [
    { id: 1, key: 'intent', label: 'Intent', description: 'Initial inquiry', status: 'completed' },
    { id: 2, key: 'policy', label: 'Policy Selection', description: 'Active policy', status: 'completed' },
    { id: 3, key: 'hospital', label: 'Hospital Details', description: 'Inpatient info', status: 'completed' },
    { id: 4, key: 'documents', label: 'Document Upload', description: 'Files submitted', status: 'completed' },
    { id: 5, key: 'verification', label: 'Verification', description: 'Automated check', status: 'completed' },
    { id: 6, key: 'draft', label: 'Draft Review', description: 'Claim preview', status: 'current' },
    { id: 7, key: 'submitted', label: 'Submitted', description: 'Awaiting insurer review', status: 'upcoming' },
  ];

  const defaultDocuments: ClaimDocument[] = [
    { id: 'doc-1', name: 'discharge_summary_apollo.pdf', type: 'discharge_summary', status: 'verified', uploadedAt: '2026-09-05T10:00:00.000Z' },
    { id: 'doc-2', name: 'hospital_final_bill_85000.pdf', type: 'bills', status: 'verified', uploadedAt: '2026-09-05T10:05:00.000Z' },
    { id: 'doc-3', name: 'aadhaar_card_rahul.pdf', type: 'identity', status: 'verified', uploadedAt: '2026-09-05T10:10:00.000Z' },
    { id: 'doc-4', name: 'prescription_dr_kapoor.pdf', type: 'prescription', status: 'verified', uploadedAt: '2026-09-05T10:15:00.000Z' },
  ];

  return {
    currentStepIndex: stateSnapshot?.currentStepIndex ?? 5,
    currentStep: stateSnapshot?.currentStep ?? 6,
    progress: stateSnapshot?.progress ?? 85,
    steps: stateSnapshot?.steps ?? defaultSteps,
    selectedPolicyId: stateSnapshot?.selectedPolicyId ?? 'POL-HEALTH-001',
    claimDetails: {
      patientName: stateSnapshot?.claimDetails?.patientName ?? 'Rahul Sharma',
      relation: stateSnapshot?.claimDetails?.relation ?? 'self',
      hospitalName: stateSnapshot?.claimDetails?.hospitalName ?? 'Apollo Hospital, Delhi',
      admissionDate: stateSnapshot?.claimDetails?.admissionDate ?? '2026-09-01',
      dischargeDate: stateSnapshot?.claimDetails?.dischargeDate ?? '2026-09-05',
      diagnosis: stateSnapshot?.claimDetails?.diagnosis ?? 'Dengue Fever with Severe Thrombocytopenia',
      totalBill: stateSnapshot?.claimDetails?.totalBill ?? CANONICAL_FINANCIALS.grossHospitalBill,
    },
    documents: stateSnapshot?.documents ?? defaultDocuments,
    claimStatus: stateSnapshot?.claimStatus ?? 'draft',
    claimId: stateSnapshot?.claimId ?? 'CLM-2026-88419',
    language: stateSnapshot?.language ?? 'en',
    activeMismatchScenario: stateSnapshot?.activeMismatchScenario,
    simulateLowConfidence: stateSnapshot?.simulateLowConfidence,
  };
}

// ─── SERVER TOOL 1: get_current_financial_state ─────────────────────────────
/**
 * Reads the authoritative baseline financial state from CANONICAL_FINANCIALS and deriveJourneyTwin().
 * Reuses existing twin engine directly.
 */
export function getCurrentFinancialState(
  _memberId?: string,
  stateSnapshot?: Partial<JourneyState>
): FinSimFinancialValues {
  const safeState = getSafeBaseState(stateSnapshot);
  // Reusing authoritative deriveJourneyTwin from src/lib/twin-engine.ts
  const twin = deriveJourneyTwin(safeState);
  const fin = twin.financialSummary;

  return {
    grossHospitalBill: fin.grossHospitalBill,
    deductibles: fin.deductibles,
    estimatedPayable: fin.estimatedPayable,
    patientOutOfPocket: Math.max(0, fin.grossHospitalBill - fin.estimatedPayable),
    currency: 'INR',
  };
}

// ─── SERVER TOOL 2: create_claim_scenario ───────────────────────────────────
/**
 * Validates and normalizes hypothetical scenario parameters.
 * Enforces business bounds: ₹5,000 to ₹50,00,000.
 */
export function createClaimScenario(
  hypotheticalGross: number,
  scenarioDescription?: string
): FinSimScenarioParams {
  const requestedAt = new Date().toISOString();
  const scenarioId = `SCENARIO-${Date.now().toString(36).toUpperCase()}`;

  if (typeof hypotheticalGross !== 'number' || isNaN(hypotheticalGross)) {
    return {
      scenarioId,
      hypotheticalGross: 0,
      scenarioDescription: scenarioDescription || 'Invalid scenario inquiry',
      valid: false,
      validationError: 'Hypothetical gross bill must be a valid number.',
      requestedAt,
    };
  }

  if (hypotheticalGross <= 0) {
    return {
      scenarioId,
      hypotheticalGross,
      scenarioDescription: scenarioDescription || 'Invalid negative/zero bill scenario',
      valid: false,
      validationError: 'Hospital bill amount must be greater than zero.',
      requestedAt,
    };
  }

  if (hypotheticalGross < 5000) {
    return {
      scenarioId,
      hypotheticalGross,
      scenarioDescription: scenarioDescription || 'Below minimum inpatient admission threshold',
      valid: false,
      validationError: 'Minimum inpatient hospitalization bill for simulation is ₹5,000.',
      requestedAt,
    };
  }

  if (hypotheticalGross > 5000000) {
    return {
      scenarioId,
      hypotheticalGross,
      scenarioDescription: scenarioDescription || 'Exceeds maximum allowable simulation limit',
      valid: false,
      validationError: 'Simulation is capped at ₹50,00,000 (₹50 Lakhs) for demo safety.',
      requestedAt,
    };
  }

  const roundedGross = Math.round(hypotheticalGross);
  const defaultDesc = `What-if scenario: Hospital bill is ₹${roundedGross.toLocaleString('en-IN')}`;

  return {
    scenarioId,
    hypotheticalGross: roundedGross,
    scenarioDescription: scenarioDescription || defaultDesc,
    valid: true,
    requestedAt,
  };
}

// ─── SERVER TOOL 3: calculate_scenario ──────────────────────────────────────
/**
 * Computes hypothetical claim values by re-evaluating the authoritative twin-engine
 * against an isolated in-memory clone of JourneyState.
 *
 * ABSOLUTELY ZERO STATE MUTATION OCCURS ON realState.
 * Reuses deriveJourneyTwin() from src/lib/twin-engine.ts.
 */
export function calculateScenario(
  scenario: FinSimScenarioParams,
  realState?: Partial<JourneyState>
): {
  simulatedFinancials: FinSimFinancialValues;
  simulatedTwin: FinancialJourneyTwin;
} {
  if (!scenario.valid) {
    throw new Error(`Cannot calculate invalid scenario: ${scenario.validationError}`);
  }

  const baseState = getSafeBaseState(realState);

  // Pure in-memory clone with simulated gross bill
  const isolatedSimState: JourneyState = {
    ...baseState,
    claimDetails: {
      ...baseState.claimDetails!,
      totalBill: scenario.hypotheticalGross,
    },
  };

  // Reusing authoritative deriveJourneyTwin() from src/lib/twin-engine.ts
  const simulatedTwin = deriveJourneyTwin(isolatedSimState);
  const fin = simulatedTwin.financialSummary;

  const simulatedFinancials: FinSimFinancialValues = {
    grossHospitalBill: fin.grossHospitalBill,
    deductibles: fin.deductibles,
    estimatedPayable: fin.estimatedPayable,
    patientOutOfPocket: Math.max(0, fin.grossHospitalBill - fin.estimatedPayable),
    currency: 'INR',
  };

  return {
    simulatedFinancials,
    simulatedTwin,
  };
}

// ─── SERVER TOOL 4: compare_scenario ────────────────────────────────────────
/**
 * Calculates deterministic delta and impact comparison between real and simulated values.
 */
export function compareScenario(
  realFinancials: FinSimFinancialValues,
  simulatedFinancials: FinSimFinancialValues
): FinSimImpact {
  const grossDelta = simulatedFinancials.grossHospitalBill - realFinancials.grossHospitalBill;
  const payableDelta = simulatedFinancials.estimatedPayable - realFinancials.estimatedPayable;
  const outOfPocketDelta =
    simulatedFinancials.patientOutOfPocket - realFinancials.patientOutOfPocket;

  const percentageChange =
    realFinancials.estimatedPayable > 0
      ? Number(
          (
            ((simulatedFinancials.estimatedPayable - realFinancials.estimatedPayable) /
              realFinancials.estimatedPayable) *
            100
          ).toFixed(1)
        )
      : 0;

  const direction = payableDelta >= 0 ? 'increases' : 'decreases';
  const absPayableDelta = Math.abs(payableDelta).toLocaleString('en-IN');
  const absGrossDelta = Math.abs(grossDelta).toLocaleString('en-IN');

  let summary = '';
  if (grossDelta === 0) {
    summary = `Scenario matches current gross bill of ₹${realFinancials.grossHospitalBill.toLocaleString('en-IN')} with no change in payable amount.`;
  } else {
    summary = `If your hospital bill ${grossDelta > 0 ? 'increases' : 'decreases'} by ₹${absGrossDelta} to ₹${simulatedFinancials.grossHospitalBill.toLocaleString('en-IN')}, your estimated insurance payout ${direction} by ₹${absPayableDelta} (${percentageChange >= 0 ? '+' : ''}${percentageChange}%). Standard non-medical deductibles remain ₹${simulatedFinancials.deductibles.toLocaleString('en-IN')}.`;
  }

  return {
    grossDelta,
    payableDelta,
    outOfPocketDelta,
    percentageChange,
    summary,
  };
}

// ─── SERVER TOOL 5: reset_scenario ──────────────────────────────────────────
/**
 * Safely resets/clears any active simulation and returns the canonical baseline state.
 */
export function resetScenario(
  memberId?: string,
  stateSnapshot?: Partial<JourneyState>
): {
  activeScenario: null;
  realFinancials: FinSimFinancialValues;
  message: string;
} {
  const realFinancials = getCurrentFinancialState(memberId, stateSnapshot);
  return {
    activeScenario: null,
    realFinancials,
    message: 'Simulation cleared. Actual claim values retained at authoritative canonical state.',
  };
}

// ─── MASTER COMPOSITE RUNNER ────────────────────────────────────────────────
/**
 * Orchestrates the full FinSim flow: validate -> calculate -> compare.
 * Guarantees zero mutation of real claim state.
 */
export function runFinSimSimulation(
  hypotheticalGross: number,
  memberId?: string,
  stateSnapshot?: Partial<JourneyState>,
  description?: string
): FinSimScenarioResult {
  const realFinancials = getCurrentFinancialState(memberId, stateSnapshot);
  const scenario = createClaimScenario(hypotheticalGross, description);

  if (!scenario.valid) {
    throw new Error(scenario.validationError || 'Invalid simulation parameters.');
  }

  const { simulatedFinancials } = calculateScenario(scenario, stateSnapshot);
  const impact = compareScenario(realFinancials, simulatedFinancials);

  return {
    scenarioId: scenario.scenarioId,
    scenarioDescription: scenario.scenarioDescription,
    simulatedGross: scenario.hypotheticalGross,
    realFinancials,
    simulatedFinancials,
    impact,
    isSimulation: true,
    engineUsed: 'authoritative:src/lib/twin-engine.ts (CANONICAL_FINANCIALS & deriveJourneyTwin)',
    disclaimer:
      'FinSim What-If Projection only. This simulated calculation does NOT modify your active claim packet or constitute an insurer settlement guarantee.',
  };
}

// ─── INTENT & HYPOTHETICAL EXTRACTION PARSER ────────────────────────────────
/**
 * Extracts hypothetical bill amount and intent from user messages in English, Hindi, and Hinglish.
 * Also detects unauthorized claim mutation attempts (e.g. "change my actual bill to 1 lakh").
 */
export function extractFinSimIntent(userMessage: string): {
  isFinSim: boolean;
  isMutationAttempt: boolean;
  hypotheticalGross?: number;
  rawScenario?: string;
} {
  const text = userMessage.toLowerCase().trim();

  // Check if customer is asking to mutate/alter real claim
  const mutationKeywords = [
    'change my bill to',
    'change my actual bill to',
    'change bill to',
    'change actual bill to',
    'update my bill to',
    'update my actual bill to',
    'update bill to',
    'update actual bill to',
    'set bill to',
    'set my bill to',
    'modify my bill to',
    'modify bill to',
    'mera bill badal do',
    'bill change kar do',
    'bill update kar do',
    'बिल बदल दो',
    'बिल अपडेट करो',
  ];
  const isMutationRegex = /(?:change|update|set|modify)\s+(?:my\s+)?(?:actual\s+)?(?:hospital\s+)?bill\s+(?:to|as)/i;
  const isMutationAttempt = mutationKeywords.some((kw) => text.includes(kw)) || isMutationRegex.test(text);

  // Check what-if hypothetical markers
  const whatIfMarkers = [
    'what if',
    'what happens if',
    'suppose',
    'assume',
    'hypothetical',
    'simulate',
    'how much will i get if',
    'how much if bill is',
    'agar bill',
    'agar hospital bill',
    'agar mera bill',
    'yadi bill',
    'yadi hospital bill',
    'agar kharcha',
    'agar ... ho',
    'हो तो क्या होगा',
    'अगर बिल',
    'अगर अस्पताल बिल',
    'यदि बिल',
  ];

  const hasWhatIf = whatIfMarkers.some((kw) => text.includes(kw));

  // Regular expressions to extract monetary amounts:
  // e.g. "1 lakh", "1.2 lakh", "1.5 लाख", "1 lac", "2 lakhs", "50k", "₹1,00,000", "100000", "120000"
  let parsedAmount: number | undefined;

  // 1. Lakh / Lac pattern: e.g. "1.2 lakh", "1 lakh", "2.5 lacs", "1 लाख"
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|लाख)/i);
  if (lakhMatch) {
    const factor = parseFloat(lakhMatch[1]);
    if (!isNaN(factor)) {
      parsedAmount = Math.round(factor * 100000);
    }
  }

  // 2. K pattern: e.g. "50k", "90k"
  if (!parsedAmount) {
    const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
      const factor = parseFloat(kMatch[1]);
      if (!isNaN(factor)) {
        parsedAmount = Math.round(factor * 1000);
      }
    }
  }

  // 3. Currency / Raw integer pattern: e.g. "₹1,00,000", "1,20,000", "100000"
  if (!parsedAmount) {
    const numMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]+)?|[0-9]{4,7})/i);
    if (numMatch) {
      const cleanStr = numMatch[1].replace(/,/g, '');
      const num = parseFloat(cleanStr);
      if (!isNaN(num) && num >= 5000) {
        parsedAmount = Math.round(num);
      }
    }
  }

  const isFinSim = Boolean((hasWhatIf || isMutationAttempt) && parsedAmount) || (hasWhatIf && Boolean(parsedAmount));

  return {
    isFinSim: isFinSim || (hasWhatIf && typeof parsedAmount === 'number'),
    isMutationAttempt,
    hypotheticalGross: parsedAmount,
    rawScenario: userMessage,
  };
}
