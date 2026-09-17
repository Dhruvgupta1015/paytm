'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { OfficerQueueCase } from '@/types';

export interface EscalationPanelProps {
  caseData?: OfficerQueueCase;
  isOfficerMode?: boolean;
  onClose?: () => void;
}

export const EscalationPanel: React.FC<EscalationPanelProps> = ({
  caseData,
  isOfficerMode = false,
  onClose,
}) => {
  const [callActive, setCallActive] = useState(false);
  const [notes, setNotes] = useState('');
  const [sentNotes, setSentNotes] = useState(false);

  // Read-only local state for officer demo interactions
  const [isAssignedToMe, setIsAssignedToMe] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);

  // Defaults match the existing customer escalation desk exactly
  const ticketId = caseData?.caseId ?? 'ESC-2026-8819';
  const officerName = caseData?.officerName ?? 'Priya Verma';
  const officerInitials = caseData?.officerInitials ?? 'PV';
  const officerTitle = caseData?.officerTitle ?? 'Senior Claims Adjudicator';
  const officerBadge = caseData?.officerBadge ?? 'Paytm Insurance Officer #9042';
  const aiConfidence = caseData?.aiConfidence ?? 68;
  const triggerReason = caseData?.triggerReason ?? 'Human assistance requested';
  const statusLabel = isReviewed
    ? 'Reviewed by Officer'
    : isAssignedToMe
    ? 'Assigned to Current Officer'
    : (caseData?.status ?? 'Live Agent Connected');

  const summaryText =
    caseData?.summary ??
    'Insured Rahul Sharma (32) has submitted claim draft for Inpatient Dengue treatment at Apollo Hospital Delhi (01 Sep – 05 Sep).';
  const claimedGross = caseData?.claimedGross ?? '₹85,000';
  const estimatedPayable = caseData?.estimatedPayable ?? '₹78,500';
  const deductiblesInfo = caseData?.deductiblesInfo ?? 'Deductibles: ₹6,500 non-medical items';
  const policyInfo = caseData
    ? `${caseData.policyName} (${caseData.policyNumber})`
    : 'Paytm Health Secure Plus (POL-HEALTH-001, Sum Insured ₹5,00,000, 100% active balance)';
  const attachedDocs =
    caseData?.attachedDocsSummary ??
    'Discharge Summary (verified), Bills (verified), Aadhaar (verified), Prescription (verified)';

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6 md:p-8 shadow-sm">
      {/* Header with Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-indigo-100/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-indigo-950">
              {isOfficerMode ? 'Claims Officer Adjudication Console' : 'Human Claims Escalation Desk'}
            </h2>
            <Badge
              variant={
                isReviewed
                  ? 'success'
                  : isAssignedToMe
                  ? 'indigo'
                  : statusLabel === 'Live Agent Connected'
                  ? 'warning'
                  : 'default'
              }
              size="sm"
            >
              {statusLabel}
            </Badge>

            {isOfficerMode && caseData?.priority && (
              <Badge
                variant={
                  caseData.priority === 'Critical'
                    ? 'danger'
                    : caseData.priority === 'High'
                    ? 'warning'
                    : 'indigo'
                }
                size="sm"
              >
                {caseData.priority} Priority
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {isOfficerMode
              ? 'Real-time claim escalation review with AI confidence triage and verified clinical documents.'
              : 'Responsible human-in-the-loop escalation safeguard for high-value or ambiguous claims.'}
          </p>
        </div>

        <div className="text-right flex flex-col sm:items-end">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Escalation Ticket
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="text-text-muted hover:text-indigo-950 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close case view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <span className="font-mono text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 mt-0.5">
            {ticketId}
          </span>
        </div>
      </div>

      {/* Officer Profile & Ticket Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {/* Officer Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/90 to-sky-50/50 border border-indigo-100 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {officerInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <h3 className="text-sm font-bold text-indigo-950">{officerName}</h3>
          <p className="text-xs text-text-secondary">{officerTitle}</p>
          <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full mt-2 font-medium">
            {officerBadge}
          </span>

          <div className="w-full mt-4 pt-3 border-t border-indigo-200/60 space-y-2">
            <Button
              variant={callActive ? 'danger' : 'primary'}
              size="sm"
              onClick={() => setCallActive(!callActive)}
              className="w-full text-xs"
            >
              {callActive ? (
                <>
                  <span className="animate-pulse mr-1">🔴</span>
                  End Voice Call (01:14)
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Connect via Instant Voice
                </>
              )}
            </Button>

            {/* Officer Action Buttons (Local state only, non-blocking UI interactions) */}
            {isOfficerMode && (
              <div className="pt-2 flex flex-col gap-1.5 w-full">
                <Button
                  variant={isAssignedToMe ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setIsAssignedToMe((prev) => !prev)}
                  className="w-full text-xs"
                >
                  {isAssignedToMe ? '✓ Assigned to Me' : 'Assign to Me'}
                </Button>
                <Button
                  variant={isReviewed ? 'success' : 'secondary'}
                  size="sm"
                  onClick={() => setIsReviewed((prev) => !prev)}
                  className="w-full text-xs"
                >
                  {isReviewed ? '✓ Mark Completed' : 'Mark Reviewed'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* AI Handover Context Card */}
        <div className="md:col-span-2 p-5 rounded-xl bg-slate-50/80 border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <span>Automated Handover Packet</span>
              <Badge
                variant={aiConfidence < 50 ? 'warning' : 'indigo'}
                size="sm"
              >
                AI Confidence: {aiConfidence}%
              </Badge>
            </h4>
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
              Trigger: {triggerReason}
            </span>
          </div>

          <div className="text-xs text-indigo-950 space-y-2 bg-white p-3 rounded-lg border border-indigo-100/60 leading-relaxed">
            <p>
              <strong>Summary:</strong> {summaryText}
            </p>
            <p>
              <strong>Claimed Gross:</strong> {claimedGross} | <strong>Estimated Payable:</strong> {estimatedPayable} ({deductiblesInfo}).
            </p>
            <p>
              <strong>Policy:</strong> {policyInfo}.
            </p>
            <p>
              <strong>Attached Docs:</strong> {attachedDocs}.
            </p>
          </div>

          {/* Officer Live Note Box */}
          <div>
            <label className="text-xs font-semibold text-indigo-950 block mb-1">
              Add Direct Note to Officer {officerName}:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please expedite review for pre-hospitalization lab expenses..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 text-indigo-950"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (notes.trim()) {
                    setSentNotes(true);
                    setNotes('');
                  }
                }}
                disabled={!notes.trim()}
                className="text-xs"
              >
                Send Note
              </Button>
            </div>
            {sentNotes && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                ✓ Note transmitted to officer console.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Human Escalation Safeguards */}
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed mb-6">
        <h5 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Responsible Claims Design — Human Oversight Safeguards
        </h5>
        FinJourney AI operates with human oversight safeguards. Automated claim copilot suggestions can be transferred to a human claims specialist upon policyholder request or whenever clause interpretation involves complex medical history.
      </div>

      {/* Footer Navigation CTA */}
      <div className="pt-4 border-t border-indigo-100 flex items-center justify-between">
        {isOfficerMode ? (
          <>
            {onClose ? (
              <button
                onClick={onClose}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to Queue Table
              </button>
            ) : (
              <Link
                href="/journey"
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Switch to Customer Copilot
              </Link>
            )}

            <span className="text-[11px] text-text-muted">
              Demo Console · Read-only simulated adjudications
            </span>
          </>
        ) : (
          <>
            <Link
              href="/journey"
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Claim Copilot
            </Link>

            <Link
              href="/claim/tracking"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View Claim Tracking →
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
