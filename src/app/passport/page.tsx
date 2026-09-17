'use client';

import React from 'react';
import Link from 'next/link';
import { useJourney } from '@/context/JourneyContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { deriveJourneyPassport } from '@/lib/twin-engine';

export default function PassportPage() {
  const { twin, state } = useJourney();
  const passport = twin.passport || deriveJourneyPassport(twin);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/journey"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
        >
          <span>← Back to Claim Journey</span>
        </Link>
        <Badge variant="indigo" size="sm">
          Paytm Digital Financial Passport
        </Badge>
      </div>

      {/* Main Passport Card */}
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl overflow-hidden">
        {/* Passport Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-extrabold text-3xl shadow-lg">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-xs font-extrabold tracking-widest uppercase">
                    Official Paytm Financial Profile
                  </span>
                  <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[10px]">
                    Verified Dossier
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                  Financial Journey Passport
                </h1>
                <p className="text-xs sm:text-sm text-indigo-300 mt-1">
                  Unified multi-journey customer profile, verified health claims & cross-product financial readiness
                </p>
              </div>
            </div>
          </div>

          {/* Profile Identity Stripe */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-white/60 text-[11px] block">Passport Holder</span>
              <span className="font-bold text-white text-sm">{passport.holderName}</span>
            </div>
            <div>
              <span className="text-white/60 text-[11px] block">Passport ID</span>
              <span className="font-mono text-amber-300 font-semibold text-sm">{passport.passportId}</span>
            </div>
            <div>
              <span className="text-white/60 text-[11px] block">Member Reference</span>
              <span className="font-mono text-white/90 text-sm">{passport.memberId}</span>
            </div>
          </div>
        </div>

        {/* Passport Content Body */}
        <div className="p-6 sm:p-8 space-y-8 bg-slate-50/50">
          {/* SECTION 1: ACTIVE JOURNEY */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm font-bold text-indigo-950 uppercase tracking-wider">
                  Active Financial Journey (Health Insurance)
                </h2>
              </div>
              <Badge variant="success" size="sm">
                Live & Synchronized
              </Badge>
            </div>

            <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-indigo-950">
                    {passport.activeJourney.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {passport.activeJourney.type} · {passport.activeJourney.policyName} ({passport.activeJourney.policyNumber})
                  </p>
                </div>
                <Badge variant="indigo" size="sm" className="self-start sm:self-auto text-xs py-1 px-2.5">
                  {passport.activeJourney.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] text-text-muted block">Hospital / Network</span>
                  <span className="font-semibold text-indigo-950 truncate block mt-1">
                    {passport.activeJourney.hospitalName}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] text-text-muted block">Gross Hospital Bill</span>
                  <span className="font-semibold text-indigo-950 block mt-1">
                    ₹{passport.activeJourney.grossAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70">
                  <span className="text-[11px] text-emerald-800 font-medium block">Est. Settlement</span>
                  <span className="font-bold text-emerald-700 block mt-1 text-sm">
                    ₹{passport.activeJourney.estimatedPayable.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/70">
                  <span className="text-[11px] text-indigo-800 font-medium block">Readiness Score</span>
                  <span className="font-bold text-indigo-700 block mt-1 text-sm">
                    {passport.activeJourney.readinessScore}% Complete
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <span className="text-text-secondary text-xs">Next Recommended Action:</span>
                    <span className="font-bold text-indigo-950 block text-sm">
                      {passport.activeJourney.nextAction}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant={passport.activeJourney.verifiedDocsCount === 4 ? 'success' : 'warning'} size="sm">
                    {passport.activeJourney.verifiedDocsCount} of {passport.activeJourney.totalDocsCount} Docs Verified
                  </Badge>
                  <Link
                    href="/journey"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs"
                  >
                    Resume Journey →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: OTHER JOURNEYS (Lending & Fintech — Coming Soon) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-indigo-950 uppercase tracking-wider">
                  Upcoming Financial Journeys (Roadmap)
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Pre-configured architecture for multi-vertical fintech integration
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {passport.otherJourneys.map((journey) => (
                <div
                  key={journey.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2.5">
                      <Badge variant="default" size="sm" className="bg-slate-100 text-slate-700 text-[10px]">
                        {journey.category}
                      </Badge>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded">
                        {journey.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-indigo-950 mb-1.5 leading-snug">
                      {journey.title}
                    </h3>

                    <p className="text-xs text-text-secondary leading-relaxed mb-4">
                      {journey.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                      ✨ {journey.projectedBenefit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Passport Footer */}
        <div className="p-5 bg-white border-t border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <span>
            Synthesizes live Financial Journey Twin data. Zero duplicate state management.
          </span>
          <Link href="/journey">
            <Button variant="outline" size="sm">
              Return to Adjudication Workspace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
