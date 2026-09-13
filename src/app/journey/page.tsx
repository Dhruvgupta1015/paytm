'use client';

import { useJourney } from '@/context/JourneyContext';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

export default function JourneyPage() {
  const { state } = useJourney();

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left side — Chat placeholder (Phase 3) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-indigo-100/60">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">AI Chat Assistant</h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Chat with FinJourney AI to navigate your claim process. Coming in Phase 3.
          </p>
        </div>
      </div>

      {/* Right side — Journey Progress Panel */}
      <div className="w-96 flex-shrink-0 bg-white p-6 overflow-y-auto">
        <h3 className="text-lg font-bold text-indigo-900 mb-1">Claim Journey</h3>
        <p className="text-xs text-text-secondary mb-5">Your step-by-step progress</p>

        <ProgressBar value={state.progress} className="mb-6" />

        {/* Step checklist */}
        <div className="space-y-1">
          {state.steps.map((step, index) => (
            <div
              key={step.id}
              className={`
                flex items-start gap-3 p-3 rounded-xl transition-all duration-200
                ${step.status === 'current' ? 'bg-indigo-50 border border-indigo-200' : ''}
                ${step.status === 'completed' ? 'opacity-80' : ''}
              `}
            >
              {/* Step indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {step.status === 'completed' ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : step.status === 'current' ? (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse-soft">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-indigo-400">{index + 1}</span>
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    step.status === 'current'
                      ? 'text-indigo-900'
                      : step.status === 'completed'
                        ? 'text-emerald-700'
                        : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
