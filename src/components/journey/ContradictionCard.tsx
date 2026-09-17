'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Contradiction } from '@/types';

interface ContradictionCardProps {
  contradiction: Contradiction;
  onResolve?: () => void;
}

export const ContradictionCard: React.FC<ContradictionCardProps> = ({
  contradiction,
  onResolve,
}) => {
  const isBlocking = contradiction.severity === 'BLOCKING';

  return (
    <div
      className={`rounded-2xl border p-4.5 transition-all duration-200 ${
        isBlocking
          ? 'bg-gradient-to-br from-red-50/90 via-white to-amber-50/40 border-red-200 shadow-sm'
          : 'bg-amber-50/80 border-amber-200 shadow-xs'
      }`}
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-red-100">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            {isBlocking && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isBlocking ? 'bg-red-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <h4 className="text-xs font-bold text-red-950 uppercase tracking-wider">
            {isBlocking ? 'Blocking Document Discrepancy' : 'Document Warning'}
          </h4>
        </div>

        <Badge variant={isBlocking ? 'danger' : 'warning'} size="sm">
          {contradiction.severity}
        </Badge>
      </div>

      {/* Discrepancy Facts Comparison */}
      <div className="my-3 space-y-2">
        <div className="text-xs font-bold text-indigo-950">
          {contradiction.type.replace(/_/g, ' ').toUpperCase()}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-red-100 shadow-2xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
              Clinical Discharge Record
            </span>
            <span className="font-semibold text-indigo-950 mt-0.5 block">
              {contradiction.values.expected}
            </span>
            <span className="text-[10px] text-text-muted block mt-0.5 font-mono">
              Doc: {contradiction.documents[0]}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200 shadow-2xs">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
              Conflicting Billing Document
            </span>
            <span className="font-semibold text-red-950 mt-0.5 block">
              {contradiction.values.found}
            </span>
            <span className="text-[10px] text-red-600 block mt-0.5 font-mono">
              Doc: {contradiction.documents[1] || 'Billing Record'}
            </span>
          </div>
        </div>
      </div>

      {/* Explanation: What mismatched & Why it matters */}
      <div className="p-3 rounded-xl bg-white/90 border border-red-100 text-xs text-indigo-950 space-y-1 leading-relaxed mb-3">
        <p>
          <strong className="text-red-900">Why this matters:</strong> {contradiction.explanation}
        </p>
        <p className="text-text-secondary text-[11px]">
          <strong className="text-indigo-950">Recommended Action:</strong> {contradiction.resolution}
        </p>
      </div>

      {/* Action footer */}
      {onResolve && (
        <div className="flex items-center justify-between pt-2 border-t border-red-100 text-xs">
          <span className="text-[11px] text-red-700 font-medium">
            Claim submission is locked until this discrepancy is reconciled.
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onResolve}
            className="text-xs bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            Resolve Discrepancy
          </Button>
        </div>
      )}
    </div>
  );
};
