'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { JourneyState, JourneyStep, JourneyStepStatus, ClaimDocument } from '@/types';
import journeyStepsData from '@/data/journey-steps.json';

// ─── Default State ───────────────────────────────────────────────

function buildInitialSteps(): JourneyStep[] {
  return journeyStepsData.steps.map((s, i) => ({
    ...s,
    status: (i === 0 ? 'current' : 'upcoming') as JourneyStepStatus,
  }));
}

const INITIAL_STATE: JourneyState = {
  steps: buildInitialSteps(),
  currentStepIndex: 0,
  progress: 0,
  selectedPolicyId: null,
  claimDetails: null,
  documents: [],
  claimId: null,
  claimStatus: null,
};

const STORAGE_KEY = 'finjourney_state';

function loadState(): JourneyState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as JourneyState;
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
  /** Advance to the next step (triggered by explicit UI action only) */
  advanceStep: () => void;
  /** Go to a specific step by key */
  goToStep: (key: string) => void;
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
    setState(loadState());
    setHydrated(true);
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
      return {
        ...prev,
        steps: newSteps,
        currentStepIndex: newIndex,
        progress: computeProgress(newSteps),
      };
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

        return {
          ...prev,
          steps: newSteps,
          currentStepIndex: targetIndex,
          progress: computeProgress(newSteps),
        };
      });
    },
    [computeProgress],
  );

  const selectPolicy = useCallback((policyId: string) => {
    setState((prev) => ({ ...prev, selectedPolicyId: policyId }));
  }, []);

  const setClaimDetails = useCallback((details: JourneyState['claimDetails']) => {
    setState((prev) => ({ ...prev, claimDetails: details }));
  }, []);

  const addDocument = useCallback((doc: ClaimDocument) => {
    setState((prev) => ({
      ...prev,
      documents: [...prev.documents, doc],
    }));
  }, []);

  const updateDocumentStatus = useCallback(
    (docId: string, status: ClaimDocument['status'], reason?: string) => {
      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === docId ? { ...d, status, reason } : d,
        ),
      }));
    },
    [],
  );

  const setClaimId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, claimId: id }));
  }, []);

  const setClaimStatus = useCallback((status: JourneyState['claimStatus']) => {
    setState((prev) => ({ ...prev, claimStatus: status }));
  }, []);

  const resetJourney = useCallback(() => {
    setState(INITIAL_STATE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <JourneyContext.Provider
      value={{
        state,
        advanceStep,
        goToStep,
        selectPolicy,
        setClaimDetails,
        addDocument,
        updateDocumentStatus,
        setClaimId,
        setClaimStatus,
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
