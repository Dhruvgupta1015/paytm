'use client';

import React from 'react';
import { useJourney } from '@/context/JourneyContext';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { VerificationChecklist } from '@/components/documents/VerificationChecklist';
import { JourneyTimeline } from '@/components/journey/JourneyTimeline';
import { ClaimDocument } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DocumentsPage() {
  const { state, addDocument, updateDocumentStatus, goToStep } = useJourney();
  const router = useRouter();

  const handleAddDocument = (doc: ClaimDocument) => {
    addDocument(doc);
  };

  const handleRemoveDocument = (docId: string) => {
    // In demo context, just set status or filter
    updateDocumentStatus(docId, 'rejected', 'Removed by user');
  };

  const handleVerifiedAll = (verifiedDocs: ClaimDocument[]) => {
    verifiedDocs.forEach((d) => {
      updateDocumentStatus(d.id, d.status, d.reason);
    });
  };

  const handleProceedToDraft = () => {
    // Advance to draft step deterministically
    goToStep('draft');
    router.push('/claim/draft');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-128px)] bg-slate-50/50">
      {/* Top Bar with timeline & breadcrumb */}
      <div className="bg-white border-b border-indigo-100/80 px-6 py-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link href="/journey" className="hover:text-indigo-600 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Copilot
            </Link>
            <span>/</span>
            <span className="font-semibold text-indigo-950">Document Upload & AI Verification</span>
          </div>

          <div className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-semibold border border-indigo-200/50">
            Step 4 & 5 of 8
          </div>
        </div>

        <JourneyTimeline orientation="horizontal" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
            Claim Document Center
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Upload hospital invoices, discharge summary, and identification. Our Sarvam-assisted document processor verifies data extraction instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Document Upload Box */}
          <DocumentUpload
            documents={state.documents}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
          />

          {/* Right: Verification Checklist */}
          <VerificationChecklist
            documents={state.documents}
            onVerifiedAll={handleVerifiedAll}
            onProceedToDraft={handleProceedToDraft}
          />
        </div>
      </div>
    </div>
  );
}
