'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const EscalationPanel: React.FC = () => {
  const [callActive, setCallActive] = useState(false);
  const [notes, setNotes] = useState('');
  const [sentNotes, setSentNotes] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6 md:p-8 shadow-sm">
      {/* Header with Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-indigo-100/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-indigo-950">
              Human Claims Escalation Desk
            </h2>
            <Badge variant="warning" size="sm">
              Live Agent Connected
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            IRDAI Compliant human-in-the-loop escalation safeguard for high-value or ambiguous claims.
          </p>
        </div>

        <div className="text-right flex flex-col sm:items-end">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Escalation Ticket
          </span>
          <span className="font-mono text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
            ESC-2026-8819
          </span>
        </div>
      </div>

      {/* Officer Profile & Ticket Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {/* Officer Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/90 to-sky-50/50 border border-indigo-100 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xl shadow-md">
              PV
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <h3 className="text-sm font-bold text-indigo-950">Priya Verma</h3>
          <p className="text-xs text-text-secondary">Senior Claims Adjudicator</p>
          <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full mt-2 font-medium">
            Paytm Insurance Officer #9042
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
          </div>
        </div>

        {/* AI Handover Context Card */}
        <div className="md:col-span-2 p-5 rounded-xl bg-slate-50/80 border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <span>Automated Handover Packet</span>
              <Badge variant="indigo" size="sm">
                AI Confidence: 68%
              </Badge>
            </h4>
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
              Trigger: Human assistance requested
            </span>
          </div>

          <div className="text-xs text-indigo-950 space-y-2 bg-white p-3 rounded-lg border border-indigo-100/60 leading-relaxed">
            <p>
              <strong>Summary:</strong> Insured Rahul Sharma (32) has submitted claim draft for Inpatient Dengue treatment at Apollo Hospital Delhi (01 Sep – 05 Sep).
            </p>
            <p>
              <strong>Claimed Gross:</strong> ₹85,000 | <strong>Estimated Payable:</strong> ₹78,500 (Deductibles: ₹6,500 non-medical items).
            </p>
            <p>
              <strong>Policy:</strong> Paytm Health Secure Plus (POL-HEALTH-001, Sum Insured ₹5,00,000, 100% active balance).
            </p>
            <p>
              <strong>Attached Docs:</strong> Discharge Summary (verified), Bills (verified), Aadhaar (verified), Prescription (verified).
            </p>
          </div>

          {/* Officer Live Note Box */}
          <div>
            <label className="text-xs font-semibold text-indigo-950 block mb-1">
              Add Direct Note to Officer Priya Verma:
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

      {/* Human Escalation Safeguards (Regulatory) */}
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed mb-6">
        <h5 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          IRDAI Customer Protection Charter — Human Oversight Mandate
        </h5>
        FinJourney AI operates under strict Human-In-The-Loop (HITL) guidelines. Automated claim copilot suggestions are subject to human verification upon policyholder request or whenever clause interpretation involves pre-existing condition ambiguity.
      </div>

      {/* Return CTA */}
      <div className="pt-4 border-t border-indigo-100 flex items-center justify-between">
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
      </div>
    </div>
  );
};
