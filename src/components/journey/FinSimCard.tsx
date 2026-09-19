'use client';

import React from 'react';
import type { FinSimScenarioResult } from '@/types';

interface FinSimCardProps {
  simulation: FinSimScenarioResult;
  onSelectScenario?: (amount: number) => void;
  onReset?: () => void;
}

export const FinSimCard: React.FC<FinSimCardProps> = ({
  simulation,
  onSelectScenario,
  onReset,
}) => {
  const { realFinancials, simulatedFinancials, impact, disclaimer } = simulation;

  const quickScenarios = [
    { label: '₹1 Lakh', amount: 100000 },
    { label: '₹1.2 Lakh', amount: 120000 },
    { label: '₹1.5 Lakh', amount: 150000 },
    { label: '₹50,000', amount: 50000 },
  ];

  const isPositiveDelta = impact.payableDelta >= 0;

  return (
    <div className="mt-3 p-3.5 bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-white rounded-xl border border-indigo-200 shadow-sm text-indigo-950 font-sans">
      {/* Header & Badges */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <span className="text-base">💰</span>
          <div>
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
              FinSim — Financial What-If Simulator
            </h4>
            <p className="text-[11px] text-indigo-600">
              Hypothetical in-memory scenario (Real claim is strictly preserved)
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 border border-indigo-300">
          Simulation Mode
        </span>
      </div>

      {/* Comparison Grid: Real vs Simulated vs Impact */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Real Baseline */}
        <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
            <span>REAL CLAIM (ACTUAL)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Claim Dossier" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Bill:</span>
              <span className="font-semibold text-slate-900">
                ₹{realFinancials.grossHospitalBill.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Deductibles:</span>
              <span>-₹{realFinancials.deductibles.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-1 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>Est. Payable:</span>
              <span className="text-emerald-700">
                ₹{realFinancials.estimatedPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Simulated Scenario */}
        <div className="p-2.5 bg-indigo-50/80 rounded-lg border border-indigo-200 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-indigo-700 font-semibold mb-1">
            <span>SIMULATED SCENARIO</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="In-Memory Simulation" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-indigo-800">Simulated Gross:</span>
              <span className="font-bold text-indigo-950">
                ₹{simulatedFinancials.grossHospitalBill.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Deductibles (Twin):</span>
              <span>-₹{simulatedFinancials.deductibles.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-1 border-t border-indigo-100 flex justify-between font-bold text-indigo-950">
              <span>Est. Payable:</span>
              <span className="text-indigo-700">
                ₹{simulatedFinancials.estimatedPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Impact / Delta */}
        <div className="p-2.5 bg-sky-50/80 rounded-lg border border-sky-200 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-sky-800 font-semibold mb-1">
            <span>FINANCIAL IMPACT</span>
            <span className="text-xs">{isPositiveDelta ? '📈' : '📉'}</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-sky-900">Gross Delta:</span>
              <span className="font-semibold text-sky-950">
                {impact.grossDelta >= 0 ? '+' : ''}₹{impact.grossDelta.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sky-900">Payable Delta:</span>
              <span className={`font-bold ${isPositiveDelta ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isPositiveDelta ? '+' : ''}₹{impact.payableDelta.toLocaleString('en-IN')} ({impact.percentageChange >= 0 ? '+' : ''}{impact.percentageChange}%)
              </span>
            </div>
            <div className="pt-1 border-t border-sky-100 flex justify-between font-bold text-sky-950">
              <span>Out-of-Pocket:</span>
              <span className="text-slate-800">
                ₹{simulatedFinancials.patientOutOfPocket.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="mt-2.5 p-2 bg-indigo-100/50 rounded-md text-[11px] text-indigo-900 leading-snug">
        <span className="font-semibold">Insight: </span>
        {impact.summary}
      </div>

      {/* Quick Scenario Preset Chips */}
      {onSelectScenario && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-indigo-100">
          <span className="text-[11px] font-medium text-indigo-700 mr-1">Quick Scenarios:</span>
          {quickScenarios.map((sc) => (
            <button
              key={sc.amount}
              type="button"
              onClick={() => onSelectScenario(sc.amount)}
              className="px-2.5 py-1 text-xs font-medium rounded-full bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              {sc.label}
            </button>
          ))}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="ml-auto px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>↺</span> Back to Actual Claim
            </button>
          )}
        </div>
      )}

      {/* Single Source of Truth & Safe Disclaimer */}
      <div className="mt-2.5 pt-2 border-t border-indigo-100/80 flex flex-col gap-1 text-[10px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>
            🔒 <strong>Single Source of Truth:</strong> Reused{' '}
            <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[9px]">
              CANONICAL_FINANCIALS
            </code>{' '}
            &{' '}
            <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[9px]">
              deriveJourneyTwin()
            </code>
          </span>
          <span className="font-medium text-emerald-700">Real Claim: Unmutated</span>
        </div>
        <p className="italic">{disclaimer}</p>
      </div>
    </div>
  );
};
