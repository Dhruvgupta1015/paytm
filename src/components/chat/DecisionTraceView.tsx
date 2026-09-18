'use client';

import React, { useState } from 'react';
import type { DecisionTraceEvent } from '@/types';

interface DecisionTraceViewProps {
  events: DecisionTraceEvent[];
  defaultExpanded?: boolean;
}

export const DecisionTraceView: React.FC<DecisionTraceViewProps> = ({
  events,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!events || events.length === 0) {
    return null;
  }

  const toolCallsCount = events.filter((e) => e.type === 'tool_call' || e.type === 'tool_result').length / 2;

  const getEventIcon = (type: DecisionTraceEvent['type']) => {
    switch (type) {
      case 'navigator_intent':
        return '🧠';
      case 'tool_call':
        return '⚙️';
      case 'tool_result':
        return '📄';
      case 'authoritative_read':
        return '📊';
      case 'proposed_action':
        return '➡️';
      case 'deterministic_authority':
        return '🔒';
      default:
        return '⚡';
    }
  };

  const getStatusBadge = (status: DecisionTraceEvent['status']) => {
    switch (status) {
      case 'ok':
        return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">OK</span>;
      case 'warning':
        return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Warning</span>;
      case 'info':
        return <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Info</span>;
      case 'blocked':
        return <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Blocked</span>;
    }
  };

  return (
    <div className="mt-2.5 rounded-lg border border-indigo-100/90 bg-indigo-50/40 text-xs overflow-hidden transition-all">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50/70 hover:bg-indigo-100/60 transition-colors text-left font-medium text-indigo-900 select-none cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🧠</span>
          <span className="font-semibold text-xs text-indigo-950">AI Decision Trace</span>
          <span className="text-[10px] font-medium bg-white text-indigo-700 px-1.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
            {Math.max(1, Math.round(toolCallsCount))} tool{Math.round(toolCallsCount) !== 1 ? 's' : ''} executed
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-indigo-600">
          <span className="text-[11px]">{isExpanded ? 'Collapse' : 'Inspect'}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Timeline */}
      {isExpanded && (
        <div className="p-3 space-y-2.5 bg-white/80 border-t border-indigo-100/80">
          <div className="relative pl-5 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
            {events.map((event) => {
              const isAuthority = event.type === 'deterministic_authority';
              const isProposed = event.type === 'proposed_action';

              return (
                <div
                  key={event.id}
                  className={`relative text-xs rounded-md p-2 transition-colors ${
                    isAuthority
                      ? 'bg-emerald-50/90 border border-emerald-200/80 text-emerald-950 shadow-2xs'
                      : isProposed
                      ? 'bg-amber-50/80 border border-amber-200 text-amber-950 shadow-2xs'
                      : 'bg-white/90 border border-slate-200/80 text-slate-800'
                  }`}
                >
                  {/* Timeline Dot */}
                  <span
                    className={`absolute -left-[21px] top-2.5 w-3 h-3 rounded-full flex items-center justify-center border-2 border-white ${
                      isAuthority
                        ? 'bg-emerald-600 ring-2 ring-emerald-100'
                        : isProposed
                        ? 'bg-amber-500 ring-2 ring-amber-100'
                        : 'bg-indigo-600 ring-2 ring-indigo-100'
                    }`}
                  />

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span>{getEventIcon(event.type)}</span>
                      <span className={isAuthority ? 'text-emerald-900 font-bold' : isProposed ? 'text-amber-900 font-bold' : 'text-slate-900'}>
                        {event.title}
                      </span>
                    </div>
                    {getStatusBadge(event.status)}
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {event.summary}
                  </p>

                  {isAuthority && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                      <span>🔒</span>
                      <span>Final Authority: Zero Direct LLM State Mutation</span>
                    </div>
                  )}

                  {isProposed && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-white/80 px-2 py-0.5 rounded border border-amber-300">
                      <span>👤</span>
                      <span>Explicit User Approval Required</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
