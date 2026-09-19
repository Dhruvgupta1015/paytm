import React from 'react';
import { ChatMessage as ChatMessageType, ProposedAction } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DecisionTraceView } from './DecisionTraceView';
import { FinSimCard } from '@/components/journey/FinSimCard';

export interface ActionButton {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

interface ChatMessageProps {
  message: ChatMessageType;
  actionButtons?: ActionButton[];
  onExplainClause?: (clause: string) => void;
  onExecuteProposedAction?: (action: ProposedAction) => void;
  onSelectSimulationScenario?: (amount: number) => void;
  onResetSimulation?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  actionButtons,
  onExecuteProposedAction,
  onSelectSimulationScenario,
  onResetSimulation,
}) => {
  const isUser = message.role === 'user';
  const isHindi = /[\u0900-\u097F]/.test(message.content);

  return (
    <div
      className={`flex items-start gap-3 my-3.5 transition-all duration-300 animate-fade-in ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-indigo-50">
            RS
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Bubble Container */}
      <div
        className={`max-w-[85%] md:max-w-[78%] flex flex-col ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Name & Badge */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[11px] font-medium text-text-muted">
            {isUser ? 'You (Rahul Sharma)' : 'FinJourney AI Copilot'}
          </span>
          {!isUser && message.isLiveSarvam === true && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sarvam API (sarvam-105b-conversations)
            </span>
          )}
          {!isUser && message.isLiveSarvam === false && (
            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Deterministic Demo Fallback
            </span>
          )}
          {!isUser && isHindi && (
            <Badge variant="warning" size="sm">
              हिन्दी
            </Badge>
          )}
        </div>

        {/* Message Body */}
        <div
          className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-white border border-indigo-100/80 text-indigo-950 rounded-tl-none shadow-indigo-50/50'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* AI Decision Trace Viewer */}
          {!isUser && message.decisionTrace && message.decisionTrace.length > 0 && (
            <DecisionTraceView events={message.decisionTrace} />
          )}

          {/* FinSim What-If Simulation Card */}
          {!isUser && message.simulationResult && (
            <FinSimCard
              simulation={message.simulationResult}
              onSelectScenario={onSelectSimulationScenario}
              onReset={onResetSimulation}
            />
          )}

          {/* Proposed Action Card (Requires Explicit User Approval) */}
          {!isUser && message.proposedAction && onExecuteProposedAction && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-50/90 border border-amber-200/90 text-amber-950 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span>➡️</span>
                  <span>{message.proposedAction.label}</span>
                </span>
                <span className="text-[10px] bg-white text-amber-800 px-1.5 py-0.5 rounded border border-amber-300 font-medium">
                  Approval Required
                </span>
              </div>
              {message.proposedAction.description && (
                <p className="text-[11px] text-amber-800 leading-normal">
                  {message.proposedAction.description}
                </p>
              )}
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                  <span>🔒</span> State transition executed deterministically on click
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onExecuteProposedAction(message.proposedAction!)}
                  className="text-xs py-1 px-3 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs cursor-pointer"
                >
                  Confirm & Proceed
                </Button>
              </div>
            </div>
          )}

          {/* Interactive Action Buttons inside assistant bubbles */}
          {!isUser && actionButtons && actionButtons.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-indigo-100 flex flex-wrap gap-2">
              {actionButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant={btn.variant || 'primary'}
                  onClick={btn.action}
                  className="text-xs py-1 px-3 shadow-xs"
                >
                  {btn.icon && <span className="mr-1.5">{btn.icon}</span>}
                  {btn.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span suppressHydrationWarning className="text-[10px] text-text-muted mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};
