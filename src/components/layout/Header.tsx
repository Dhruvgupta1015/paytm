'use client';

import React from 'react';
import { useJourney } from '@/context/JourneyContext';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { state, resetJourney } = useJourney();

  // Current step label
  const currentStep = state.steps.find((s) => s.status === 'current');

  return (
    <header className="sticky top-0 z-30">
      {/* Synthetic Data & Hackathon Demo Disclaimer */}
      <div className="disclaimer-banner text-[11px] font-medium py-1 text-center bg-amber-500 text-amber-950 border-b border-amber-600/30">
        ⚠️ HACKATHON DEMO PROTOTYPE — All insurance policies, hospital data, and claims are synthetic demo records.
      </div>

      {/* Main header bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-indigo-100/60 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-sm font-semibold text-indigo-900">
                Health Insurance Claim Journey
              </h2>
              {currentStep && (
                <p className="text-xs text-text-secondary mt-0.5">
                  Current: <span className="font-medium text-indigo-600">{currentStep.label}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress pill */}
            <div className="flex items-center gap-2 bg-indigo-50 rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
              <span className="text-xs font-semibold text-indigo-700">{state.progress}% Complete</span>
            </div>

            <Button variant="ghost" size="sm" onClick={resetJourney}>
              Reset
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
