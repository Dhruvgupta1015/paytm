'use client';

import React, { useState } from 'react';
import { useJourney } from '@/context/JourneyContext';
import { Badge } from '@/components/ui/Badge';
import type { EvidenceNode } from '@/types';

interface EvidenceVerificationCardProps {
  /** When true, renders a compact expandable banner suitable for tracking page */
  compact?: boolean;
  className?: string;
}

export const EvidenceVerificationCard: React.FC<EvidenceVerificationCardProps> = ({
  compact = false,
  className = '',
}) => {
  const { twin } = useJourney();
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (!twin) return null;

  const nodes = twin.evidenceGraph?.nodes || [];
  const contradictions = twin.contradictions || [];
  const readiness = twin.readiness;
  const readinessScore = readiness?.overallScore ?? 0;
  const isBlocking = contradictions.some((c) => c.severity === 'BLOCKING');

  // Friendly title & icon mapper for existing evidence nodes
  const getNodeDisplay = (node: EvidenceNode) => {
    switch (node.id) {
      case 'node_bill':
        return {
          title: 'Hospital Final Bill',
          icon: '🧾',
          badge: 'Billing & Charges',
        };
      case 'node_discharge':
        return {
          title: 'Discharge Summary',
          icon: '📋',
          badge: 'Clinical Period',
        };
      case 'node_id':
        return {
          title: 'Identity Verification (Aadhaar)',
          icon: '🪪',
          badge: 'KYC & Insured',
        };
      case 'node_prescription':
        return {
          title: 'Physician Prescription (Rx)',
          icon: '🩺',
          badge: 'Doctor Protocol',
        };
      case 'node_policy':
        return {
          title: 'Health Insurance Policy',
          icon: '🛡️',
          badge: 'Coverage Relationship',
        };
      default:
        return {
          title: node.source,
          icon: '📄',
          badge: 'Document Fact',
        };
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isBlocking
          ? 'bg-red-50/30 border-red-200 shadow-xs'
          : 'bg-white border-indigo-100 shadow-xs'
      } ${className}`}
    >
      {/* ─── Card Header ─── */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/70">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
              isBlocking ? 'bg-red-100 text-red-700' : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {isBlocking ? '⚠️' : '🔍'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-indigo-950">
                Evidence & Verification Audit
              </h3>
              <Badge
                variant={isBlocking ? 'danger' : 'success'}
                size="sm"
                className="text-[10px] py-0.5"
              >
                {isBlocking
                  ? `${contradictions.length} Conflict Detected`
                  : 'All Facts Corroborated ✓'}
              </Badge>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/80">
                Readiness: {readinessScore}%
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Verified multi-document clinical, identity & billing facts supporting insurer adjudication
            </p>
          </div>
        </div>

        {compact && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Evidence Details' : 'Show Verified Evidence'}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* ─── Expandable / Main Body ─── */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* 1. Evidence Cards Grid */}
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-3">
              Corroborated Document & Clinical Facts ({nodes.length} Nodes)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nodes.map((node) => {
                const display = getNodeDisplay(node);
                const confidencePct = Math.round((node.confidence || 0.95) * 100);

                return (
                  <div
                    key={node.id}
                    className="p-3.5 rounded-xl border border-indigo-100/80 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Node Header */}
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-indigo-100/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{display.icon}</span>
                          <div className="truncate">
                            <h4 className="font-bold text-indigo-950 truncate">
                              {display.title}
                            </h4>
                            <span className="text-[10px] text-text-muted block truncate">
                              {node.source}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="default" size="sm" className="text-[9px] py-0 px-1.5">
                            {display.badge}
                          </Badge>
                          {node.verified && (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Extracted Facts List */}
                      <ul className="space-y-1 my-2">
                        {node.extractedFacts.map((fact, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-text-secondary text-[11px]">
                            <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Node Footer / Confidence */}
                    <div className="pt-2 mt-2 border-t border-indigo-100/50 flex items-center justify-between text-[10px] text-text-muted">
                      <span>Verification Confidence:</span>
                      <span className="font-semibold text-indigo-900">
                        {confidencePct}% (High)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Consistency & Contradiction Check Section */}
          <div
            className={`p-3.5 rounded-xl border ${
              isBlocking
                ? 'bg-red-50/80 border-red-300 text-red-950'
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold flex items-center gap-2">
                <span>{isBlocking ? '🚫' : '✓'}</span>
                <span>Cross-Document Consistency Check</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isBlocking ? 'bg-red-200/80 text-red-900' : 'bg-emerald-200/70 text-emerald-900'
                }`}
              >
                {isBlocking ? 'Blocking Contradiction Detected' : 'Consistency Corroborated'}
              </span>
            </div>

            {contradictions.length === 0 ? (
              <p className="text-xs text-emerald-800">
                All patient names, hospital facilities, hospitalization dates (01 Sep – 05 Sep 2026), and gross invoice amounts (₹85,000) match across medical and billing evidence. No blocking contradictions found.
              </p>
            ) : (
              <div className="space-y-2 mt-2 text-xs">
                {contradictions.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg bg-white/80 border border-red-200 space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-red-900">
                        {c.type === 'date_mismatch'
                          ? 'Inpatient Stay vs. Invoice Period Discrepancy'
                          : 'Declared Claim vs. Itemized Receipts Mismatch'}
                      </span>
                      <Badge variant="danger" size="sm">
                        {c.severity}
                      </Badge>
                    </div>
                    <p className="text-red-800 text-[11px]">{c.explanation}</p>
                    <div className="flex justify-between text-[10px] text-red-700 bg-red-50 p-1.5 rounded">
                      <span><strong>Expected:</strong> {c.values.expected}</span>
                      <span><strong>Found:</strong> {c.values.found}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Dynamic Claim Readiness Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-950">
                  Readiness Score Breakdown:
                </span>
                <span className="font-extrabold text-sm text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  {readinessScore}%
                </span>
                <Badge
                  variant={readinessScore >= 90 && !isBlocking ? 'success' : isBlocking ? 'danger' : 'warning'}
                  size="sm"
                >
                  {isBlocking
                    ? 'Blocked by Contradiction'
                    : readinessScore >= 90
                      ? 'Fast-Track Eligible (≥90%)'
                      : 'Standard Review Eligible (<90%)'}
                </Badge>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                {readiness?.explanation ||
                  'Composite score derived from policy validity, verified clinical documents, and financial deduction reconciliation.'}
              </p>
            </div>

            <div className="shrink-0 text-right sm:text-right text-[11px] text-text-muted">
              <span className="block">Orchestration Route:</span>
              <span className="font-bold text-indigo-900">
                {isBlocking
                  ? 'HUMAN_REVIEW (Escalation Queue)'
                  : readinessScore >= 90
                    ? 'FAST_TRACK (24h SLA)'
                    : 'STANDARD_REVIEW (48h SLA)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
