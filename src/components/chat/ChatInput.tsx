'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  { label: '🏥 File Hospitalization Claim', text: 'I was admitted to Apollo Hospital for dengue fever and need to file a claim.' },
  { label: '🇮🇳 हिंदी में मदद', text: 'मुझे अपने हेल्थ इंश्योरेंस क्लेम की प्रक्रिया समझाइए।' },
  { label: '📜 Explain Room Rent', text: 'Explain the room rent limit on my Paytm Health Secure Plus policy.' },
  { label: '🧑‍💼 Talk to Human Agent', text: 'I want to talk to a human agent right now.' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleQuickPrompt = (text: string) => {
    if (isLoading || disabled) return;
    onSendMessage(text);
  };

  return (
    <div className="p-3 md:p-4 bg-white border-t border-indigo-100">
      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-1 scrollbar-none">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex-shrink-0 mr-1">
          Suggestions:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickPrompt(prompt.text)}
            disabled={isLoading || disabled}
            className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your claim query or response (Hindi & English supported)..."
            disabled={isLoading || disabled}
            className="w-full px-4 py-2.5 bg-gray-50/80 hover:bg-gray-50 focus:bg-white text-sm text-indigo-950 rounded-xl border border-indigo-200/80 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={!input.trim() || disabled}
          className="rounded-xl px-4 flex-shrink-0 shadow-sm"
        >
          <span>Send</span>
          <svg
            className="w-4 h-4 ml-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </Button>
      </form>

      <div className="flex items-center justify-between text-[10px] text-text-muted mt-2 px-1">
        <span>Responses generated using Sarvam AI language models</span>
        <span>Deterministic journey state tracking active</span>
      </div>
    </div>
  );
};
