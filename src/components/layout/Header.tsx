'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useJourney } from '@/context/JourneyContext';
import { Button } from '@/components/ui/Button';

export function Header() {
  const pathname = usePathname();
  const { state, resetJourney } = useJourney();

  const isOfficer = pathname.startsWith('/officer');
  const currentStep = state.steps.find((s) => s.status === 'current');

  return (
    <header className="sticky top-0 z-30">
      {/* Synthetic Data & Hackathon Demo Disclaimer */}
      <div className="disclaimer-banner text-[11px] font-medium py-1 text-center bg-amber-500 text-amber-950 border-b border-amber-600/30">
        ⚠️ HACKATHON DEMO PROTOTYPE — All insurance policies, hospital data, and claims are synthetic demo records.
      </div>

      {/* Main header bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-indigo-100/60 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-sm font-semibold text-indigo-900">
                {isOfficer ? 'Claims Officer Adjudication' : 'Health Insurance Claim Journey'}
              </h2>
              {isOfficer ? (
                <p className="text-xs text-amber-700 font-medium mt-0.5">
                  Internal Escalation & Review Dashboard
                </p>
              ) : (
                currentStep && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    Current: <span className="font-medium text-indigo-600">{currentStep.label}</span>
                  </p>
                )
              )}
            </div>
          </div>

          {/* Perspective Toggle: Customer View / Officer View */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-indigo-100/80 text-xs">
              <Link
                href="/journey"
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  !isOfficer && pathname !== '/passport'
                    ? 'bg-white text-indigo-950 font-bold shadow-xs'
                    : 'text-text-secondary hover:text-indigo-900'
                }`}
              >
                Customer View
              </Link>
              <Link
                href="/officer"
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  isOfficer
                    ? 'bg-indigo-900 text-white font-bold shadow-xs'
                    : 'text-text-secondary hover:text-indigo-900'
                }`}
              >
                Officer View
              </Link>
              <Link
                href="/passport"
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  pathname === '/passport'
                    ? 'bg-amber-100 text-amber-950 font-bold shadow-xs'
                    : 'text-text-secondary hover:text-amber-900'
                }`}
              >
                <span>🛡️</span>
                <span>Passport</span>
              </Link>
            </div>

            {/* Customer progress pill & Reset button */}
            {!isOfficer && (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-indigo-50 rounded-full px-3 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                  <span className="text-xs font-semibold text-indigo-700">{state.progress}% Complete</span>
                </div>

                <Button variant="ghost" size="sm" onClick={resetJourney}>
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
