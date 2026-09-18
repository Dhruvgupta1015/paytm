'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { JourneyState, JourneyStep, JourneyStepStatus, ClaimDocument, FinancialJourneyTwin, SupportedLanguage } from '@/types';
import journeyStepsData from '@/data/journey-steps.json';
import { deriveJourneyTwin } from '@/lib/twin-engine';

// ─── Default State ───────────────────────────────────────────────

function buildInitialSteps(): JourneyStep[] {
  return journeyStepsData.steps.map((s, i) => ({
    ...s,
    status: (i === 0 ? 'current' : 'upcoming') as JourneyStepStatus,
  }));
}

const BASE_INITIAL_STATE: JourneyState = {
  steps: buildInitialSteps(),
  currentStepIndex: 0,
  currentStep: 1,
  progress: 0,
  selectedPolicyId: null,
  claimDetails: null,
  documents: [],
  claimId: null,
  claimStatus: null,
  activeMismatchScenario: 'none',
  simulateLowConfidence: false,
  language: 'en',
};

const INITIAL_STATE: JourneyState = {
  ...BASE_INITIAL_STATE,
  twin: deriveJourneyTwin(BASE_INITIAL_STATE),
};

const STORAGE_KEY = 'finjourney_state';

function withTwin(state: JourneyState): JourneyState {
  return {
    ...state,
    twin: deriveJourneyTwin(state),
  };
}

function loadState(): JourneyState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as JourneyState;
      const normalized: JourneyState = {
        ...parsed,
        currentStep: (parsed.currentStepIndex ?? 0) + 1,
        language: parsed.language || 'en',
      };
      return withTwin(normalized);
    }
  } catch {
    // ignore corrupt storage
  }
  return INITIAL_STATE;
}

function saveState(state: JourneyState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full — fine for demo
  }
}

// ─── Context ─────────────────────────────────────────────────────

interface JourneyContextValue {
  state: JourneyState;
  /** Complete Financial Journey Twin state */
  twin: FinancialJourneyTwin;
  /** Advance to the next step (triggered by explicit UI action only) */
  advanceStep: () => void;
  /** Go to a specific step by key */
  goToStep: (key: string) => void;
  /** Set step directly by step id (1 to 8) */
  setStep: (stepId: number) => void;
  /** Select a policy */
  selectPolicy: (policyId: string) => void;
  /** Set claim details */
  setClaimDetails: (details: JourneyState['claimDetails']) => void;
  /** Add an uploaded document */
  addDocument: (doc: ClaimDocument) => void;
  /** Update a document's status */
  updateDocumentStatus: (docId: string, status: ClaimDocument['status'], reason?: string) => void;
  /** Set claim ID after submission */
  setClaimId: (id: string) => void;
  /** Set claim status */
  setClaimStatus: (status: JourneyState['claimStatus']) => void;
  /** Set demo mismatch scenario for testing contradictions (opt-in only) */
  setMismatchScenario: (scenario: 'none' | 'date_mismatch' | 'amount_mismatch') => void;
  /** Toggle low AI confidence simulation to demonstrate human escalation path */
  setSimulateLowConfidence: (val: boolean) => void;
  /** Set selected language for conversational copilot */
  setLanguage: (lang: SupportedLanguage) => void;
  /** Reset entire journey */
  resetJourney: () => void;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<JourneyState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    const loaded = loadState();
    const tId = setTimeout(() => {
      setState(loaded);
      setHydrated(true);
    }, 0);
    return () => clearTimeout(tId);
  }, []);

  // Persist on every change (after hydration)
  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const computeProgress = useCallback((steps: JourneyStep[]) => {
    const completed = steps.filter((s) => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  }, []);

  const advanceStep = useCallback(() => {
    setState((prev) => {
      const { steps, currentStepIndex } = prev;
      if (currentStepIndex >= steps.length - 1) return prev;

      const newSteps = steps.map((step, i) => {
        if (i === currentStepIndex) return { ...step, status: 'completed' as const };
        if (i === currentStepIndex + 1) return { ...step, status: 'current' as const };
        return step;
      });
      const newIndex = currentStepIndex + 1;
      return withTwin({
        ...prev,
        steps: newSteps,
        currentStepIndex: newIndex,
        currentStep: newIndex + 1,
        progress: computeProgress(newSteps),
      });
    });
  }, [computeProgress]);

  const goToStep = useCallback(
    (key: string) => {
      setState((prev) => {
        const targetIndex = prev.steps.findIndex((s) => s.key === key);
        if (targetIndex === -1) return prev;

        const newSteps = prev.steps.map((step, i) => {
          if (i < targetIndex) return { ...step, status: 'completed' as const };
          if (i === targetIndex) return { ...step, status: 'current' as const };
          return step;
        });

        return withTwin({
          ...prev,
          steps: newSteps,
          currentStepIndex: targetIndex,
          currentStep: targetIndex + 1,
          progress: computeProgress(newSteps),
        });
      });
    },
    [computeProgress],
  );

  const setStep = useCallback(
    (stepId: number) => {
      const targetIndex = stepId - 1;
      setState((prev) => {
        if (targetIndex < 0 || targetIndex >= prev.steps.length) return prev;

        const newSteps = prev.steps.map((step, i) => {
          if (i < targetIndex) return { ...step, status: 'completed' as const };
          if (i === targetIndex) return { ...step, status: 'current' as const };
          return { ...step, status: 'upcoming' as const };
        });

        return withTwin({
          ...prev,
          steps: newSteps,
          currentStepIndex: targetIndex,
          currentStep: targetIndex + 1,
          progress: computeProgress(newSteps),
        });
      });
    },
    [computeProgress],
  );

  const selectPolicy = useCallback((policyId: string) => {
    setState((prev) => withTwin({ ...prev, selectedPolicyId: policyId }));
  }, []);

  const setClaimDetails = useCallback((details: JourneyState['claimDetails']) => {
    setState((prev) => withTwin({ ...prev, claimDetails: details }));
  }, []);

  const addDocument = useCallback((doc: ClaimDocument) => {
    setState((prev) =>
      withTwin({
        ...prev,
        documents: [...prev.documents, doc],
      })
    );
  }, []);

  const updateDocumentStatus = useCallback(
    (docId: string, status: ClaimDocument['status'], reason?: string) => {
      setState((prev) =>
        withTwin({
          ...prev,
          documents: prev.documents.map((d) =>
            d.id === docId ? { ...d, status, reason } : d
          ),
        })
      );
    },
    []
  );

  const setClaimId = useCallback((id: string) => {
    setState((prev) => withTwin({ ...prev, claimId: id }));
  }, []);

  const setClaimStatus = useCallback((status: JourneyState['claimStatus']) => {
    setState((prev) => withTwin({ ...prev, claimStatus: status }));
  }, []);

  const setMismatchScenario = useCallback(
    (scenario: 'none' | 'date_mismatch' | 'amount_mismatch') => {
      setState((prev) => withTwin({ ...prev, activeMismatchScenario: scenario }));
    },
    []
  );

  const setSimulateLowConfidence = useCallback((val: boolean) => {
    setState((prev) => withTwin({ ...prev, simulateLowConfidence: val }));
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setState((prev) => withTwin({ ...prev, language: lang }));
  }, []);

  const resetJourney = useCallback(() => {
    setState(INITIAL_STATE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('finjourney_n8n_exec_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        // Safe fallback for restricted storage environments
      }
    }
  }, []);

  const activeTwin = state.twin || deriveJourneyTwin(state);

  return (
    <JourneyContext.Provider
      value={{
        state,
        twin: activeTwin,
        advanceStep,
        goToStep,
        setStep,
        selectPolicy,
        setClaimDetails,
        addDocument,
        updateDocumentStatus,
        setClaimId,
        setClaimStatus,
        setMismatchScenario,
        setSimulateLowConfidence,
        setLanguage,
        resetJourney,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────

export function useJourney(): JourneyContextValue {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used within a JourneyProvider');
  return ctx;
}
