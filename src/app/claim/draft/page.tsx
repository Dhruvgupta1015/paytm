'use client';

import React from 'react';
import { ClaimDraft } from '@/components/claim/ClaimDraft';
import { JourneyTimeline } from '@/components/journey/JourneyTimeline';
import Link from 'next/link';

export default function ClaimDraftPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-128px)] bg-slate-50/50">
      {/* Top Bar with timeline */}
      <div className="bg-white border-b border-indigo-100/80 px-6 py-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link href="/documents" className="hover:text-indigo-600 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Documents
            </Link>
            <span>/</span>
            <span className="font-semibold text-indigo-950">Claim Review & Approval</span>
          </div>

          <div className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-semibold border border-indigo-200/50">
            Step 6 & 7 of 8
          </div>
        </div>

        <JourneyTimeline orientation="horizontal" />
      </div>

      {/* Main Container */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <ClaimDraft />
      </div>
    </div>
  );
}
