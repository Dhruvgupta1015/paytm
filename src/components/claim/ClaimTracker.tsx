'use client';

import React, { useState } from 'react';
import { useJourney } from '@/context/JourneyContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface Stage {
  title: string;
  subtitle: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
  notes?: string;
}

export const ClaimTracker: React.FC = () => {
  const { state } = useJourney();
  const claimId = state.claimId || 'CLM-2026-00142';

  const [activeStageIndex, setActiveStageIndex] = useState(2); // 0-indexed: 0=Initiated, 1=Docs Verified, 2=Submitted for Review, 3=Insurer Adjudication, 4=Settlement

  const stages: Stage[] = [
    {
      title: 'Claim Initiated',
      subtitle: 'Hospitalization incident recorded via Copilot',
      date: '10 Sep 2026, 02:30 PM',
      status: activeStageIndex > 0 ? 'completed' : activeStageIndex === 0 ? 'current' : 'upcoming',
    },
    {
      title: 'Documents Uploaded & AI Verified',
      subtitle: '4 of 4 required documents successfully verified',
      date: '11 Sep 2026, 11:15 AM',
      status: activeStageIndex > 1 ? 'completed' : activeStageIndex === 1 ? 'current' : 'upcoming',
    },
    {
      title: 'Submitted for Insurer Review',
      subtitle: 'Formal claim packet transmitted to Care Health Insurance',
      date: 'Today, Just now',
      status: activeStageIndex > 2 ? 'completed' : activeStageIndex === 2 ? 'current' : 'upcoming',
      notes: 'Standard review window: First assessment within 48 business hours.',
    },
    {
      title: 'Insurer Medical Adjudication',
      subtitle: 'Senior medical underwriter inspecting hospital bills & test reports',
      date: activeStageIndex >= 3 ? 'In Progress' : 'Estimated 15 Sep 2026',
      status: activeStageIndex > 3 ? 'completed' : activeStageIndex === 3 ? 'current' : 'upcoming',
      notes: 'Adjudication in progress. No additional documentation requested yet.',
    },
    {
      title: 'Final Settlement & Direct Bank Transfer',
      subtitle: 'Amount credited directly via Paytm Payments Bank / IMPS',
      date: activeStageIndex >= 4 ? 'Completed' : 'Expected 17 Sep 2026',
      status: activeStageIndex >= 4 ? 'completed' : 'upcoming',
    },
  ];

  const handleSimulateNextStage = () => {
    setActiveStageIndex((prev) => Math.min(stages.length - 1, prev + 1));
  };

  const handleDownloadReceipt = () => {
    const textContent = `PAYTM INSURANCE BROKING - CLAIM ACKNOWLEDGMENT
Claim Reference: ${claimId}
Date: ${new Date().toLocaleDateString()}
Policyholder: Rahul Sharma
Policy ID: POL-HEALTH-001 (Paytm Health Secure Plus)
Hospital: Apollo Hospital, Delhi
Estimated Payable: ₹78,500
Status: Submitted for Review
Statutory Notice: Synthetic demo claim for Paytm Build for India AI Hackathon.`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Paytm_Claim_Acknowledgment_${claimId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6 md:p-8 shadow-sm">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-indigo-100/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-indigo-950">
              Live Claim Tracking
            </h2>
            <Badge variant="warning" size="sm">
              Submitted for Review
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time status updates synced with insurer claim adjudication portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReceipt}
            className="text-xs"
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Receipt
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSimulateNextStage}
            disabled={activeStageIndex >= stages.length - 1}
            className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            title="Advance stage for demo presentation"
          >
            Advance Stage (Demo)
          </Button>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 p-4 rounded-xl bg-slate-50/80 border border-indigo-100/60 text-xs">
        <div>
          <span className="text-text-muted block">Claim Reference</span>
          <span className="font-mono font-bold text-indigo-950 text-sm">{claimId}</span>
        </div>
        <div>
          <span className="text-text-muted block">Estimated Settlement</span>
          <span className="font-bold text-emerald-700 text-sm">₹78,500</span>
        </div>
        <div>
          <span className="text-text-muted block">Hospital</span>
          <span className="font-semibold text-indigo-950 truncate block">Apollo Hospital, Delhi</span>
        </div>
        <div>
          <span className="text-text-muted block">Expected Adjudication</span>
          <span className="font-semibold text-indigo-700">3–5 Business Days</span>
        </div>
      </div>

      {/* Vertical Status Timeline */}
      <div className="my-8 relative pl-6 space-y-8">
        {/* Connecting Background Rail */}
        <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-gray-200" />

        {stages.map((stage, idx) => {
          const isCompleted = stage.status === 'completed';
          const isCurrent = stage.status === 'current';

          return (
            <div key={idx} className="relative flex items-start gap-4">
              {/* Node Icon */}
              <div
                className={`
                  absolute -left-6 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white z-10 transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isCurrent
                        ? 'bg-indigo-600 text-white shadow-md ring-indigo-100 scale-110 animate-pulse-soft'
                        : 'bg-gray-100 text-gray-400 border border-gray-300'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>

              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-indigo-950'
                          : isCompleted
                            ? 'text-emerald-900'
                            : 'text-gray-400'
                      }`}
                    >
                      {stage.title}
                    </span>
                    {isCurrent && (
                      <Badge variant="indigo" size="sm">
                        In Progress
                      </Badge>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Cleared
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted font-medium">
                    {stage.date}
                  </span>
                </div>

                <p className="text-xs text-text-secondary mt-1">
                  {stage.subtitle}
                </p>

                {stage.notes && isCurrent && (
                  <div className="mt-2 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                    <span className="text-base">ℹ️</span>
                    <span>{stage.notes}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-indigo-100/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/journey"
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to FinJourney Copilot
        </Link>

        <Link
          href="/escalation"
          className="text-xs font-medium text-text-secondary hover:text-indigo-600 flex items-center gap-1"
        >
          <span>Need help with this claim?</span>
          <span className="underline font-semibold text-indigo-600">Connect to Human Claims Officer</span>
        </Link>
      </div>
    </div>
  );
};
