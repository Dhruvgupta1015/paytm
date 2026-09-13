'use client';

import React from 'react';
import { useJourney } from '@/context/JourneyContext';

interface JourneyTimelineProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  orientation = 'horizontal',
  className = '',
}) => {
  const { state, setStep } = useJourney();

  if (orientation === 'horizontal') {
    return (
      <div className={`w-full overflow-x-auto py-2 ${className}`}>
        <div className="flex items-center min-w-[700px] justify-between relative px-2">
          {/* Background rail */}
          <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-gray-200 -z-0" />
          
          {/* Active progress rail */}
          <div
            className="absolute left-6 top-3.5 h-0.5 bg-gradient-to-r from-emerald-500 to-indigo-600 -z-0 transition-all duration-500"
            style={{
              width: `calc(${(Math.max(0, state.currentStep - 1) / (state.steps.length - 1)) * 100}% - 3rem)`,
            }}
          />

          {state.steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';

            return (
              <button
                key={step.id}
                onClick={() => {
                  if (isCompleted || isCurrent) setStep(step.id);
                }}
                disabled={!isCompleted && !isCurrent}
                className="group flex flex-col items-center z-10 focus:outline-none disabled:cursor-not-allowed"
              >
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-white'
                        : isCurrent
                          ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-100 scale-110'
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`
                    text-[11px] font-medium mt-1.5 max-w-[76px] text-center leading-tight transition-colors
                    ${
                      isCurrent
                        ? 'text-indigo-900 font-bold'
                        : isCompleted
                          ? 'text-emerald-700'
                          : 'text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical timeline
  return (
    <div className={`relative pl-6 space-y-6 ${className}`}>
      <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-gray-200" />
      {state.steps.map((step, idx) => {
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';

        return (
          <div key={step.id} className="relative flex items-start gap-3">
            <div
              className={`
                absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-white
                ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-indigo-600 text-white ring-indigo-100 animate-pulse-soft'
                      : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {isCompleted ? '✓' : idx + 1}
            </div>
            <div>
              <p
                className={`text-xs font-semibold ${
                  isCurrent ? 'text-indigo-900' : isCompleted ? 'text-emerald-800' : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
              <p className="text-[11px] text-gray-500">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
