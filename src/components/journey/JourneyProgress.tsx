'use client';

import React from 'react';
import { useJourney } from '@/context/JourneyContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface JourneyProgressProps {
  compact?: boolean;
}

export const JourneyProgress: React.FC<JourneyProgressProps> = ({ compact = false }) => {
  const { state, setStep, advanceStep, resetJourney } = useJourney();

  const getStepRoute = (key: string) => {
    switch (key) {
      case 'documents':
      case 'verify':
        return '/documents';
      case 'draft':
      case 'submit':
        return '/claim/draft';
      case 'tracking':
        return '/claim/tracking';
      default:
        return '/journey';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Title & Badge */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-indigo-950">Claim Journey</h3>
            <Badge variant="success" size="sm">
              Live Progress
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Deterministic step tracking with automated milestones
          </p>
        </div>
        <span className="text-2xl font-black text-indigo-600 font-mono">
          {state.progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <ProgressBar
          value={state.progress}
          variant="gradient"
          size="md"
          showLabel={false}
          animated={true}
        />
        <div className="flex justify-between items-center text-[11px] text-text-muted mt-1.5 px-0.5">
          <span>Started</span>
          <span>
            {state.steps.filter((s) => s.status === 'completed').length} of{' '}
            {state.steps.length} milestones cleared
          </span>
          <span>Settlement</span>
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
        {state.steps.map((step, index) => {
          const isCurrent = step.status === 'current';
          const isCompleted = step.status === 'completed';
          const isUpcoming = step.status === 'upcoming';
          const route = getStepRoute(step.key);

          return (
            <div
              key={step.id}
              onClick={() => {
                // Allow clicking past or current steps for quick demo navigation
                if (isCompleted || isCurrent) {
                  setStep(step.id);
                }
              }}
              className={`
                group relative flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200
                ${
                  isCurrent
                    ? 'bg-gradient-to-r from-indigo-50/90 to-white border-indigo-300 shadow-sm ring-1 ring-indigo-200/50'
                    : isCompleted
                      ? 'bg-white border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/30 cursor-pointer'
                      : 'bg-gray-50/60 border-gray-200/60 opacity-60'
                }
              `}
            >
              {/* Step indicator node */}
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <svg
                      className="w-4 h-4 stroke-[3]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-300 animate-pulse-soft">
                    {index + 1}
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-semibold text-xs">
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Step Label & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-sm font-semibold truncate ${
                      isCurrent
                        ? 'text-indigo-950 font-bold'
                        : isCompleted
                          ? 'text-emerald-900'
                          : 'text-text-muted'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <Badge variant="indigo" size="sm">
                      Current
                    </Badge>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                      Done
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                  {step.description}
                </p>

                {/* Direct Action link if available */}
                {isCurrent && route !== '/journey' && (
                  <div className="mt-2 pt-2 border-t border-indigo-100 flex items-center justify-between">
                    <span className="text-[11px] text-indigo-600 font-medium">
                      Action required on screen
                    </span>
                    <Link
                      href={route}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 hover:bg-indigo-200 px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1"
                    >
                      Open Screen
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo Controls Footer */}
      <div className="mt-4 pt-3 border-t border-indigo-100/80 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={resetJourney}
          className="text-xs text-text-secondary hover:text-red-600 hover:border-red-200"
          title="Reset journey to step 1 for testing"
        >
          <svg
            className="w-3.5 h-3.5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset Demo
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={advanceStep}
          disabled={state.currentStep >= state.steps.length}
          className="text-xs"
        >
          Next Step
          <svg
            className="w-3.5 h-3.5 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
};
