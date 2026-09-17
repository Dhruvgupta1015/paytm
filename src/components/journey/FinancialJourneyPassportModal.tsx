'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { FinancialJourneyPassport } from '@/types';

interface FinancialJourneyPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  passport: FinancialJourneyPassport;
}

export const FinancialJourneyPassportModal: React.FC<FinancialJourneyPassportModalProps> = ({
  isOpen,
  onClose,
  passport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Passport Header with Premium Gold/Indigo Gradient */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-extrabold text-2xl shadow-md">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-[11px] font-extrabold tracking-widest uppercase">
                    Paytm Digital Financial Identity
                  </span>
                  <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[10px]">
                    Verified Dossier
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Financial Journey Passport
                </h3>
                <p className="text-xs text-indigo-300 mt-0.5">
                  Unified multi-journey financial profile & verified health adjudication records
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-white/70 hover:text-white text-xl p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Profile Identity Stripe */}
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-white/60 text-[10px] block">Passport Holder</span>
              <span className="font-bold text-white">{passport.holderName}</span>
            </div>
            <div>
              <span className="text-white/60 text-[10px] block">Passport ID</span>
              <span className="font-mono text-amber-300 font-semibold">{passport.passportId}</span>
            </div>
            <div>
              <span className="text-white/60 text-[10px] block">Member Reference</span>
              <span className="font-mono text-white/90">{passport.memberId}</span>
            </div>
          </div>
        </div>

        {/* Passport Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* SECTION 1: ACTIVE JOURNEY (Health Insurance Claims Copilot) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Active Financial Journey
                </h4>
              </div>
              <Badge variant="success" size="sm">
                Live & Synchronized
              </Badge>
            </div>

            <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h5 className="font-bold text-sm text-indigo-950">
                    {passport.activeJourney.title}
                  </h5>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {passport.activeJourney.type} · {passport.activeJourney.policyName}
                  </p>
                </div>
                <Badge variant="indigo" size="sm" className="self-start sm:self-auto">
                  {passport.activeJourney.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-text-muted block">Provider / Facility</span>
                  <span className="font-semibold text-indigo-950 truncate block mt-0.5">
                    {passport.activeJourney.hospitalName}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-text-muted block">Gross Hospital Bill</span>
                  <span className="font-semibold text-indigo-950 block mt-0.5">
                    ₹{passport.activeJourney.grossAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70">
                  <span className="text-[10px] text-emerald-800 font-medium block">Est. Settlement</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">
                    ₹{passport.activeJourney.estimatedPayable.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/70">
                  <span className="text-[10px] text-indigo-800 font-medium block">Readiness Score</span>
                  <span className="font-bold text-indigo-700 block mt-0.5">
                    {passport.activeJourney.readinessScore}% Complete
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <div>
                    <span className="text-text-secondary text-[11px]">Next Recommended Step:</span>
                    <span className="font-bold text-indigo-950 block">
                      {passport.activeJourney.nextAction}
                    </span>
                  </div>
                </div>
                <Badge variant={passport.activeJourney.verifiedDocsCount === 4 ? 'success' : 'warning'} size="sm">
                  {passport.activeJourney.verifiedDocsCount} of {passport.activeJourney.totalDocsCount} Docs Verified
                </Badge>
              </div>
            </div>
          </div>

          {/* SECTION 2: OTHER JOURNEYS (Lending & Fintech — Coming Soon) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Upcoming Financial Journeys (Roadmap)
              </h4>
              <span className="text-[11px] text-text-muted">
                Pre-configured for future expansion
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {passport.otherJourneys.map((journey) => (
                <div
                  key={journey.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between opacity-90 hover:opacity-100 transition-opacity"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <Badge variant="default" size="sm" className="bg-slate-100 text-slate-700 text-[10px]">
                        {journey.category}
                      </Badge>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded">
                        {journey.status}
                      </span>
                    </div>

                    <h5 className="font-bold text-xs text-indigo-950 mb-1 leading-snug">
                      {journey.title}
                    </h5>

                    <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                      {journey.description}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100">
                    <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                      ✨ {journey.projectedBenefit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-indigo-100 flex items-center justify-between text-xs text-text-muted shrink-0">
          <span>
            Reuses active Financial Journey Twin state with zero duplicate state management.
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
