'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useJourney } from '@/context/JourneyContext';
import { ChatMessage as ChatMessageType } from '@/types';
import { ChatMessage, ActionButton } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export const ChatPanel: React.FC = () => {
  const { state, setStep, advanceStep, selectPolicy } = useJourney();
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Namaste Rahul! I am FinJourney AI, your 24x7 Health Insurance Copilot.\n\nI can help you file a cashless or reimbursement claim, explain clauses in simple Hindi/English, or guide you through document submission. How can I assist you today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [humanEscalated, setHumanEscalated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Check for human escalation trigger
    const lower = content.toLowerCase();
    if (
      lower.includes('human') ||
      lower.includes('agent') ||
      lower.includes('executive') ||
      lower.includes('talk to someone') ||
      lower.includes('representative')
    ) {
      setHumanEscalated(true);
      setTimeout(() => {
        const escalationMsg: ChatMessageType = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content:
            'I have connected you with Senior Claims Support Officer Priya Verma (Employee ID: PAYTM-ESC-9042). She is reviewing your claim file right now.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, escalationMsg]);
        setIsLoading(false);
      }, 700);
      return;
    }

    try {
      const response = await api.sendChatMessage(content, messages);
      const assistantMsg: ChatMessageType = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        isLiveSarvam: response.isLiveSarvam,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessageType = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          'I apologize, but I encountered a momentary connection issue. You can continue advancing through the step actions below or try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate explicit UI Action Buttons based on current deterministic journey step
  const getContextualActionButtons = (): ActionButton[] => {
    switch (state.currentStep) {
      case 1: // Intent
        return [
          {
            label: '🏥 Confirm Hospitalization (Dengue, 4 Days)',
            action: () => {
              advanceStep();
              setMessages((prev) => [
                ...prev,
                {
                  id: `asst-${Date.now()}`,
                  role: 'assistant',
                  content:
                    'Understood. I have recorded your hospitalization incident. Please select which of your active policies you would like to file this claim against.',
                  timestamp: new Date().toISOString(),
                },
              ]);
            },
          },
        ];

      case 2: // Policy Selection
        return [
          {
            label: 'Paytm Health Secure Plus (₹5,00,000 Sum Insured)',
            action: () => {
              selectPolicy('POL-HEALTH-001');
              advanceStep();
              setMessages((prev) => [
                ...prev,
                {
                  id: `asst-${Date.now()}`,
                  role: 'assistant',
                  content:
                    'Selected "Paytm Health Secure Plus". Next, let us confirm your hospital and treatment details. Apollo Hospital Delhi has cashless tie-ups with your insurer.',
                  timestamp: new Date().toISOString(),
                },
              ]);
            },
          },
          {
            label: 'Paytm Family Shield (₹10,00,000 Sum Insured)',
            variant: 'outline',
            action: () => {
              selectPolicy('POL-HEALTH-002');
              advanceStep();
              setMessages((prev) => [
                ...prev,
                {
                  id: `asst-${Date.now()}`,
                  role: 'assistant',
                  content:
                    'Selected "Paytm Family Shield". Next, let us confirm your hospital and treatment details.',
                  timestamp: new Date().toISOString(),
                },
              ]);
            },
          },
        ];

      case 3: // Claim Details
        return [
          {
            label: 'Confirm Apollo Hospital (1-5 Sep, Total: ₹85,000)',
            action: () => {
              advanceStep();
              setMessages((prev) => [
                ...prev,
                {
                  id: `asst-${Date.now()}`,
                  role: 'assistant',
                  content:
                    'Hospitalization details logged. Now we need to submit your supporting documents (Discharge Summary, Bills, Identity Proof, Doctor Prescription).',
                  timestamp: new Date().toISOString(),
                },
              ]);
            },
          },
        ];

      case 4: // Documents
      case 5: // Verify
        return [
          {
            label: 'Go to Document Upload & Verification',
            action: () => {
              window.location.href = '/documents';
            },
          },
        ];

      case 6: // Draft
      case 7: // Submit
        return [
          {
            label: 'Review Claim Draft & Submit',
            action: () => {
              window.location.href = '/claim/draft';
            },
          },
          {
            label: '💡 Why ₹78,500? Explain Deductions',
            variant: 'outline',
            action: () => {
              handleSendMessage('Why was ₹6,500 deducted from my ₹85,000 bill? Explain my payout calculation.');
            },
          },
        ];

      case 8: // Tracking
        return [
          {
            label: 'Track Submitted Claim Status',
            action: () => {
              window.location.href = '/claim/tracking';
            },
          },
        ];

      default:
        return [];
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-indigo-100/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-700 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-indigo-950">
                FinJourney Assistant
              </h2>
              <Badge variant="indigo" size="sm">
                Sarvam AI
              </Badge>
            </div>
            <p className="text-[11px] text-text-muted">
              Bilingual Copilot · Health Claims Specialist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {humanEscalated ? (
            <Badge variant="warning" size="md">
              Agent Connected
            </Badge>
          ) : (
            <button
              onClick={() => handleSendMessage('I want to talk to a human agent')}
              className="text-xs font-semibold text-text-secondary hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200/80 flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Escalate to Human
            </button>
          )}
        </div>
      </div>

      {/* Human Escalation Alert Banner */}
      {humanEscalated && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 animate-slide-down">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>
              <strong>Case #ESC-2026-8819</strong> transferred to Claims Officer
              Priya Verma.
            </span>
          </div>
          <Link
            href="/escalation"
            className="font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 flex items-center gap-1"
          >
            Open Escalation Desk
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

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((msg, index) => {
          const isLatestAssistantMsg =
            !isLoading &&
            msg.role === 'assistant' &&
            index === messages.length - 1;

          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              actionButtons={
                isLatestAssistantMsg ? getContextualActionButtons() : undefined
              }
            />
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-center gap-3 my-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-white text-xs">
              🤖
            </div>
            <div className="bg-white border border-indigo-100 rounded-2xl rounded-tl-none p-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-text-muted ml-2 font-medium">
                  FinJourney AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};
