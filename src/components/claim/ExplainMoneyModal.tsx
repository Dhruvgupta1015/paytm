'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CANONICAL_FINANCIALS } from '@/lib/twin-engine';
import type { FinancialSummary } from '@/types';

interface ExplainMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  financialSummary?: FinancialSummary;
}

export const ExplainMoneyModal: React.FC<ExplainMoneyModalProps> = ({
  isOpen,
  onClose,
  financialSummary,
}) => {
  const summary = financialSummary || {
    grossHospitalBill: CANONICAL_FINANCIALS.grossHospitalBill,
    deductibles: CANONICAL_FINANCIALS.deductibles,
    estimatedPayable: CANONICAL_FINANCIALS.estimatedPayable,
    deductibleItems: CANONICAL_FINANCIALS.deductibleItems,
    sumInsured: 500000,
    remainingCoverage: 500000,
    copayPercent: 0,
    disclaimer: CANONICAL_FINANCIALS.disclaimer,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Financial Breakdown & Deductions Explained">
      <div className="space-y-5 text-indigo-950">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50/60 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Estimated Payable Calculation
            </span>
            <Badge variant="indigo" size="sm">
              Prototype Estimate
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-lg bg-white/80 border border-indigo-100/60">
              <span className="text-[10px] text-text-muted uppercase block">Gross Bill</span>
              <span className="text-sm font-extrabold text-indigo-950">
                ₹{summary.grossHospitalBill.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60">
              <span className="text-[10px] text-amber-700 uppercase block">Non-Covered</span>
              <span className="text-sm font-extrabold text-amber-800">
                - ₹{summary.deductibles.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/60">
              <span className="text-[10px] text-emerald-700 uppercase block">Estimated Payable</span>
              <span className="text-sm font-extrabold text-emerald-700">
                ₹{summary.estimatedPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Why was ₹6,500 deducted? Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>Why was ₹{summary.deductibles.toLocaleString('en-IN')} deducted?</span>
            </h4>
            <span className="text-[11px] text-text-muted">Standard Non-Medical Consumables</span>
          </div>

          <div className="space-y-2.5">
            {summary.deductibleItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-indigo-100/80 bg-slate-50/70 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-indigo-950">{item.item}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    - ₹{item.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary pl-7 leading-relaxed">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-Step Mathematical Explanation */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1.5 text-indigo-900 leading-relaxed">
          <h5 className="font-bold text-indigo-950 flex items-center gap-1.5 mb-1">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How the Estimated Payable is Derived:
          </h5>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
            <li>
              <strong>Gross Total Billed:</strong> ₹85,000 across room rent (₹18,000), pharmacy (₹24,000), diagnostics (₹16,000), and specialist care (₹27,000).
            </li>
            <li>
              <strong>Non-Medical Consumable Exclusions:</strong> Non-clinical items totaling ₹6,500 are segregated from medical expenses.
            </li>
            <li>
              <strong>Coverage Verification:</strong> ₹78,500 falls comfortably within your ₹5,00,000 sum insured balance (100% active, 0% copay applied).
            </li>
            <li>
              <strong>Final Estimated Payable:</strong> ₹85,000 − ₹6,500 = ₹78,500.
            </li>
          </ol>
        </div>

        {/* Product Safety & Honesty Disclosure */}
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-950 leading-snug">
          ⚖️ <strong>Important Disclaimer:</strong> {summary.disclaimer} Final claim admissibility and payment are determined strictly by your insurance adjudication team upon reviewing original hospital records.
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose} className="px-6 text-xs font-semibold">
            I Understand
          </Button>
        </div>
      </div>
    </Modal>
  );
};
