'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useJourney } from '@/context/JourneyContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ExplainMoneyModal } from '@/components/claim/ExplainMoneyModal';
import { ContradictionCard } from '@/components/journey/ContradictionCard';
import { EvidenceGraphModal } from '@/components/journey/EvidenceGraphModal';
import { FinancialJourneyPassportModal } from '@/components/journey/FinancialJourneyPassportModal';
import { deriveEvidenceGraph, deriveJourneyPassport } from '@/lib/twin-engine';

export const JourneyTwinCard: React.FC = () => {
  const { twin, state, setMismatchScenario, setSimulateLowConfidence } = useJourney();
  const [showReadinessDetails, setShowReadinessDetails] = useState(false);
  const [showExplainMoney, setShowExplainMoney] = useState(false);
  const [showEvidenceGraph, setShowEvidenceGraph] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const readiness = twin.readiness;
  const financial = twin.financialSummary;
  const hasContradictions = twin.contradictions.length > 0;
  const blockingContradiction = twin.contradictions.find((c) => c.severity === 'BLOCKING');

  const scoreVariant =
    readiness.overallScore >= 95
      ? 'success'
      : readiness.overallScore >= 75
      ? 'indigo'
      : readiness.overallScore >= 40
      ? 'warning'
      : 'danger';

  return (
    <div className="bg-white rounded-2xl border border-indigo-100/90 shadow-xs overflow-hidden transition-all duration-200">
      {/* Header Accent Bar */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-400 text-indigo-950 flex items-center justify-center font-bold text-xs shadow-xs">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-tight">
                Financial Journey Twin
              </h4>
              <Badge variant="indigo" size="sm" className="bg-white/10 text-indigo-200 border-indigo-400/30 text-[9px] py-0 px-1.5">
                Active State Engine
              </Badge>
            </div>
            <p className="text-[10px] text-indigo-300">
              Synchronized customer dossier & adjudication readiness
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEvidenceGraph(true)}
            className="text-[11px] font-semibold text-indigo-100 bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🕸️</span>
            <span>Evidence Graph</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPassport(true)}
            className="text-[11px] font-semibold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🛡️</span>
            <span>Passport</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-indigo-200 hover:text-white text-xs font-medium px-2 py-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isExpanded ? 'Hide' : 'Dossier'}
          </button>
        </div>
      </div>

      {/* Main Highlights Row */}
      <div className="p-4 space-y-3.5">
        {/* Contradiction Alert Card (if detected) */}
        {hasContradictions && (
          <div className="animate-fade-in">
            <ContradictionCard
              contradiction={twin.contradictions[0]}
              onResolve={() => setMismatchScenario('none')}
            />
          </div>
        )}

        {/* Readiness Score Summary */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
            blockingContradiction
              ? 'bg-red-50/70 border-red-200'
              : 'bg-gradient-to-r from-slate-50 to-indigo-50/40 border-indigo-100/80'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950">Claim Readiness</span>
              <Badge variant={scoreVariant} size="sm">
                {readiness.overallScore}% Ready
              </Badge>
              {blockingContradiction && (
                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                  Submission Blocked
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">
              {readiness.explanation}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowReadinessDetails(!showReadinessDetails)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline ml-2 whitespace-nowrap cursor-pointer"
          >
            {showReadinessDetails ? 'Hide Breakdown' : 'Why this score?'}
          </button>
        </div>

        {/* Readiness Breakdown List (when clicked) */}
        {showReadinessDetails && (
          <div className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100/60">
              <span className="font-bold text-indigo-950">Deterministic Scoring Breakdown:</span>
              <span className="font-mono text-xs font-bold text-indigo-700">
                {readiness.overallScore} / 100 pts
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {readiness.components.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-start justify-between gap-2 py-1 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-start gap-1.5">
                    <span
                      className={`text-xs mt-0.5 ${
                        comp.score === comp.weight
                          ? 'text-emerald-600 font-bold'
                          : comp.score > 0
                          ? 'text-amber-600 font-bold'
                          : 'text-text-muted'
                      }`}
                    >
                      {comp.score === comp.weight ? '✓' : comp.score > 0 ? '◐' : '○'}
                    </span>
                    <div>
                      <span className="font-semibold text-indigo-950 block text-[11px]">
                        {comp.label}
                      </span>
                      <span className="text-[10px] text-text-muted block">
                        {comp.detail}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-text-secondary whitespace-nowrap">
                    {comp.score} / {comp.weight} pts
                  </span>
                </div>
              ))}
            </div>

            {readiness.blockingReasons.length > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                <strong>Pending / Blocking reasons:</strong>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[10px]">
                  {readiness.blockingReasons.map((reason, idx) => (
                    <li key={idx} className={reason.includes('Blocking') ? 'text-red-700 font-semibold' : ''}>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Financial Status Summary */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-indigo-100/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
              Financial Status
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xs text-text-secondary">Gross: ₹{financial.grossHospitalBill.toLocaleString('en-IN')}</span>
              <span className="text-text-muted">·</span>
              <span className="text-xs font-bold text-emerald-700">
                Est. Payable: ₹{financial.estimatedPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowExplainMoney(true)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
          >
            Explain My Money
          </button>
        </div>

        {/* Next Best Action Card (Evaluates state, documents, evidence, contradictions, readiness) */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
            blockingContradiction
              ? 'bg-red-50/80 border-red-200'
              : state.simulateLowConfidence
              ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-gradient-to-r from-emerald-50/60 to-indigo-50/40 border-emerald-100'
          }`}
        >
          <div className="flex items-start gap-2 min-w-0">
            <span
              className={`font-bold text-sm leading-none mt-0.5 ${
                blockingContradiction
                  ? 'text-red-600'
                  : state.simulateLowConfidence
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              ➔
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    blockingContradiction
                      ? 'text-red-800'
                      : state.simulateLowConfidence
                      ? 'text-amber-800'
                      : 'text-emerald-800'
                  }`}
                >
                  {blockingContradiction
                    ? 'Action Required:'
                    : state.simulateLowConfidence
                    ? 'Safeguard Recommended:'
                    : 'Recommended Next Action:'}
                </span>
                <Badge
                  variant={
                    twin.nextBestAction.priority === 'critical'
                      ? 'danger'
                      : twin.nextBestAction.priority === 'high'
                      ? 'warning'
                      : 'indigo'
                  }
                  size="sm"
                  className="text-[9px] py-0 px-1 font-bold"
                >
                  {twin.nextBestAction.priority.toUpperCase()}
                </Badge>
                <span className="text-[10px] font-mono font-bold text-text-muted">
                  {(twin.nextBestAction.confidence * 100).toFixed(0)}% Conf.
                </span>
              </div>
              <div className="font-bold text-indigo-950 truncate mt-0.5">
                {twin.nextBestAction.action}
              </div>
              <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                {twin.nextBestAction.reason}
              </p>
            </div>
          </div>

          <Link
            href={twin.nextBestAction.targetRoute || '/journey'}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors shrink-0 shadow-xs text-white ${
              blockingContradiction
                ? 'bg-red-600 hover:bg-red-700'
                : state.simulateLowConfidence
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {blockingContradiction
              ? 'Inspect'
              : state.simulateLowConfidence
              ? 'Escalate Desk →'
              : 'Execute →'}
          </Link>
        </div>

        {/* Low Confidence Escalation Banner (TEST 5) */}
        {state.simulateLowConfidence && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <div>
                <span className="font-bold text-amber-950 block text-[11px]">
                  Human Escalation Safeguard Available (TEST 5)
                </span>
                <span className="text-[10px] text-amber-800">
                  AI confidence is 62%. Dedicated Paytm Senior Adjudicator Priya Verma is on standby.
                </span>
              </div>
            </div>
            <Link
              href="/escalation"
              className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-[11px] shrink-0"
            >
              Talk to Officer
            </Link>
          </div>
        )}

        {/* Expanded Twin Dossier Details */}
        {isExpanded && (
          <div className="pt-2 border-t border-indigo-100 space-y-2 text-[11px] text-indigo-950">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-text-muted block text-[10px]">Insured Profile</span>
                <span className="font-bold text-indigo-950">{twin.customer.name}</span> ({twin.customer.age} yrs)
                <span className="block text-[10px] text-text-muted font-mono">{twin.customer.memberId}</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-text-muted block text-[10px]">Active Policy</span>
                <span className="font-bold text-indigo-950 truncate block">
                  {twin.policy?.name || 'Paytm Health Secure Plus'}
                </span>
                <span className="block text-[10px] text-emerald-700 font-semibold">
                  ₹{twin.policy?.sumInsured.toLocaleString('en-IN') || '5,00,000'} Sum Insured
                </span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex justify-between items-center">
              <div>
                <span className="text-text-muted block text-[10px]">Clinical Evidence</span>
                <span className="font-semibold text-indigo-950">
                  {twin.evidence.verifiedCount} of 4 Documents Verified
                </span>
              </div>
              <Badge variant={twin.evidence.verifiedCount === 4 ? 'success' : 'warning'} size="sm">
                {twin.evidence.verifiedCount === 4 ? 'All Clear' : `${4 - twin.evidence.verifiedCount} Pending`}
              </Badge>
            </div>
          </div>
        )}

        {/* Demo Intelligence Simulator (Opt-in only; protects canonical happy path) */}
        <div className="pt-3 border-t border-indigo-100 flex flex-col gap-2 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <span>🧪 Intelligence Simulator Controls</span>
            </span>
            <div className="flex items-center gap-1">
              {state.activeMismatchScenario && state.activeMismatchScenario !== 'none' && (
                <span className="text-red-600 font-bold text-[9px] bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                  Mismatch Active
                </span>
              )}
              {state.simulateLowConfidence && (
                <span className="text-amber-700 font-bold text-[9px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Low Conf (62%)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setMismatchScenario('none')}
              className={`py-1 px-1.5 rounded-md font-medium text-[10px] border transition-all cursor-pointer ${
                !state.activeMismatchScenario || state.activeMismatchScenario === 'none'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-2xs'
                  : 'bg-white text-text-secondary border-slate-200 hover:bg-slate-50'
              }`}
            >
              Normal (0 Issues)
            </button>
            <button
              type="button"
              onClick={() => setMismatchScenario('date_mismatch')}
              className={`py-1 px-1.5 rounded-md font-medium text-[10px] border transition-all cursor-pointer ${
                state.activeMismatchScenario === 'date_mismatch'
                  ? 'bg-red-50 text-red-800 border-red-300 font-bold shadow-2xs'
                  : 'bg-white text-text-secondary border-slate-200 hover:bg-slate-50'
              }`}
            >
              Date Mismatch
            </button>
            <button
              type="button"
              onClick={() => setMismatchScenario('amount_mismatch')}
              className={`py-1 px-1.5 rounded-md font-medium text-[10px] border transition-all cursor-pointer ${
                state.activeMismatchScenario === 'amount_mismatch'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-2xs'
                  : 'bg-white text-text-secondary border-slate-200 hover:bg-slate-50'
              }`}
            >
              Amount Mismatch
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setSimulateLowConfidence(!state.simulateLowConfidence)}
              className={`w-full py-1 px-2 rounded-md font-medium text-[10px] border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                state.simulateLowConfidence
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-slate-50 text-text-secondary border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{state.simulateLowConfidence ? '⚡' : '⚙️'}</span>
              <span>
                {state.simulateLowConfidence
                  ? 'Disable Low Confidence Simulation'
                  : 'Simulate Low AI Confidence (Test 5 → Escalation Desk)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Explain My Money Modal */}
      <ExplainMoneyModal
        isOpen={showExplainMoney}
        onClose={() => setShowExplainMoney(false)}
        financialSummary={financial}
      />

      {/* Evidence Graph Modal */}
      <EvidenceGraphModal
        isOpen={showEvidenceGraph}
        onClose={() => setShowEvidenceGraph(false)}
        graph={twin.evidenceGraph || deriveEvidenceGraph(state, twin.contradictions)}
      />

      {/* Financial Journey Passport Modal */}
      <FinancialJourneyPassportModal
        isOpen={showPassport}
        onClose={() => setShowPassport(false)}
        passport={twin.passport || deriveJourneyPassport(twin)}
      />
    </div>
  );
};
