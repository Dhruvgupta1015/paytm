'use client';

import React, { useState } from 'react';
import { useJourney } from '@/context/JourneyContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export const ClaimDraft: React.FC = () => {
  const { state, setClaimId, goToStep } = useJourney();
  const router = useRouter();
  const [isDeclarationChecked, setIsDeclarationChecked] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const claimId = state.claimId || 'CLM-2026-00142';

  const handleSubmitClaim = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.submitClaim(claimId);
      setClaimId(res.id || claimId);
      goToStep('tracking');
      router.push('/claim/tracking');
    } catch (error) {
      console.error('Submit error:', error);
      setClaimId(claimId);
      goToStep('tracking');
      router.push('/claim/tracking');
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-6 md:p-8 shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-indigo-100/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-indigo-950">
              Claim Summary & Review
            </h2>
            <Badge variant="warning" size="sm">
              Draft — Pending Approval
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Please inspect all details carefully before submitting for insurer medical review.
          </p>
        </div>

        <div className="text-right flex flex-col sm:items-end">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Draft Reference
          </span>
          <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
            {claimId}
          </span>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Policy & Insured Card */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-indigo-100/60">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Policy & Insured Details
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200/50">
              <span className="text-text-muted">Policy Name:</span>
              <span className="font-semibold text-indigo-950">Paytm Health Secure Plus</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/50">
              <span className="text-text-muted">Policy Number:</span>
              <span className="font-mono font-medium text-indigo-900">POL-HEALTH-001</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/50">
              <span className="text-text-muted">Primary Insured:</span>
              <span className="font-medium text-indigo-950">Rahul Sharma (Age 32)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Total Sum Insured:</span>
              <span className="font-bold text-emerald-700">₹5,00,000 (100% Available)</span>
            </div>
          </div>
        </div>

        {/* Hospitalization Card */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-indigo-100/60">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Hospitalization Event
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200/50">
              <span className="text-text-muted">Hospital:</span>
              <span className="font-semibold text-indigo-950">Apollo Hospital, Delhi</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/50">
              <span className="text-text-muted">Dates of Stay:</span>
              <span className="font-medium text-indigo-950">01 Sep 2026 – 05 Sep 2026 (4 days)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/50">
              <span className="text-text-muted">Diagnosis:</span>
              <span className="font-medium text-indigo-950">Viral Dengue Fever (Thrombocytopenia)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Claim Type:</span>
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Inpatient Hospitalization (Reimbursement)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Settlement Breakdown */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-emerald-50/50 border border-indigo-100 my-6">
        <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Estimated Claim Settlement Breakdown</span>
          <span className="text-[11px] font-normal text-text-muted">Standard Policy Deductibles</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-indigo-100/60">
            <span className="text-text-secondary">Room Rent & Nursing (Single AC Room):</span>
            <span className="font-medium text-indigo-950">₹18,000</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-indigo-100/60">
            <span className="text-text-secondary">Pharmacy, IV Fluids & Medication:</span>
            <span className="font-medium text-indigo-950">₹24,000</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-indigo-100/60">
            <span className="text-text-secondary">Diagnostic Lab Work & Platelet Monitoring:</span>
            <span className="font-medium text-indigo-950">₹16,000</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-indigo-100/60">
            <span className="text-text-secondary">Treating Physician & Specialist Fees:</span>
            <span className="font-medium text-indigo-950">₹27,000</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-indigo-100/60 font-semibold">
            <span className="text-indigo-950">Gross Hospital Bill:</span>
            <span className="text-indigo-950">₹85,000</span>
          </div>
          <div className="flex justify-between py-1.5 text-amber-800">
            <span>Less: Non-Medical Consumables & Admin Charges:</span>
            <span>- ₹6,500</span>
          </div>
          <div className="flex justify-between pt-3 border-t-2 border-indigo-200 text-sm sm:text-base font-extrabold text-indigo-950">
            <span className="text-indigo-900">Estimated Payable Amount:</span>
            <span className="text-emerald-600 font-mono text-lg">₹78,500</span>
          </div>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
          Attached Verified Documents
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/30">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="truncate">discharge_summary_apollo.pdf</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/30">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="truncate">hospital_final_bill_85000.pdf</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/30">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="truncate">aadhaar_rahul_sharma.pdf</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/30">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="truncate">doctor_dengue_treatment_rx.pdf</span>
          </div>
        </div>
      </div>

      {/* User Declaration */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 mb-6">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDeclarationChecked}
            onChange={(e) => setIsDeclarationChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
          />
          <div className="text-xs text-amber-950 leading-relaxed">
            <span className="font-bold">User Declaration:</span>{' '}
            I confirm the information provided above is accurate to the best of my knowledge.
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-indigo-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/documents')}
          className="text-xs w-full sm:w-auto"
        >
          ← Edit Documents
        </Button>

        <Button
          variant="primary"
          size="lg"
          disabled={!isDeclarationChecked || isSubmitting}
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto shadow-md bg-indigo-600 hover:bg-indigo-700 px-8"
        >
          <span>I Approve & Submit This Claim</span>
          <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Claim Submission"
      >
        <div className="space-y-4 text-xs sm:text-sm text-indigo-950">
          <p>
            You are submitting claim reference <strong>{claimId}</strong> for <strong>₹85,000</strong> to the insurer.
          </p>
          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-text-muted">Estimated Payout:</span>
              <span className="font-bold text-emerald-700">₹78,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Initial Review Window:</span>
              <span className="font-medium text-indigo-900">24 – 48 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Status upon submission:</span>
              <span className="font-semibold text-amber-700">Submitted for Review</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary">
            Note: This claim will enter the regulatory review pipeline. A formal notification SMS and Email will be dispatched.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleSubmitClaim}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm & Submit Claim
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
