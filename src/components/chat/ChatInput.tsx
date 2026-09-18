'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { useJourney } from '@/context/JourneyContext';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const { state } = useJourney();
  const language = state.language || 'en';
  const [input, setInput] = useState('');

  const speechLang = language === 'hi' ? 'hi-IN' : language === 'hinglish' ? 'hi-IN' : 'en-IN';

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({ lang: speechLang });

  // When speech transcript updates, populate input box without auto-submitting
  const prevTranscriptRef = useRef(transcript);
  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current) {
      prevTranscriptRef.current = transcript;
      const tId = setTimeout(() => {
        setInput(transcript);
      }, 0);
      return () => clearTimeout(tId);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    if (isListening) {
      stopListening();
    }
    onSendMessage(input.trim());
    setInput('');
    resetTranscript();
  };

  const handleQuickPrompt = (text: string) => {
    if (isLoading || disabled) return;
    onSendMessage(text);
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  // Dynamic language-aware prompt suggestions
  const quickPrompts = [
    // Dynamic Help Button (Change 3)
    language === 'hi'
      ? { label: '🇮🇳 हिन्दी में मदद', text: 'मुझे अपने हेल्थ इंश्योरेंस क्लेम की प्रक्रिया समझाइए।' }
      : language === 'hinglish'
      ? { label: '🆘 Help / Madad', text: 'Mujhe health insurance claim process step-by-step samjhaiye.' }
      : { label: '🆘 Help', text: 'Please explain the health insurance claim process step by step.' },

    // Hospitalization claim
    language === 'hi'
      ? { label: '🏥 क्लेम फाइल करें', text: 'मैं डेंगू के उपचार हेतु अपोलो अस्पताल में भर्ती था और क्लेम फाइल करना चाहता हूँ।' }
      : language === 'hinglish'
      ? { label: '🏥 File Dengue Claim', text: 'Main Apollo Hospital mein dengue treatment ke liye admit tha aur claim file karna chahta hoon.' }
      : { label: '🏥 File Hospitalization Claim', text: 'I was admitted to Apollo Hospital for dengue fever and need to file a claim.' },

    // Room rent limit
    language === 'hi'
      ? { label: '📜 रूम रेंट सीमा', text: 'मेरी Paytm Health Secure Plus पॉलिसी में रूम रेंट की क्या सीमा है?' }
      : language === 'hinglish'
      ? { label: '📜 Explain Room Rent', text: 'Meri Paytm Health Secure Plus policy mein room rent limit kya hai?' }
      : { label: '📜 Explain Room Rent', text: 'Explain the room rent limit on my Paytm Health Secure Plus policy.' },

    // Human escalation
    language === 'hi'
      ? { label: '🧑‍💼 अधिकारी से बात करें', text: 'मुझे क्लेम अधिकारी से बात करनी है।' }
      : language === 'hinglish'
      ? { label: '🧑‍💼 Talk to Officer', text: 'Mujhe claims officer se baat karni hai.' }
      : { label: '🧑‍💼 Talk to Human Agent', text: 'I want to talk to a human agent right now.' },
  ];

  const placeholderText =
    language === 'hi'
      ? 'अपना क्लेम प्रश्न यहाँ लिखें या माइक से बोलें...'
      : language === 'hinglish'
      ? 'Apna claim query yahan type karein ya mic se bolein...'
      : 'Type your claim query or speak via mic (Hindi & English supported)...';

  return (
    <div className="p-3 md:p-4 bg-white border-t border-indigo-100">
      {/* Quick Prompt Chips (Language-Aware) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-1 scrollbar-none">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex-shrink-0 mr-1">
          {language === 'hi' ? 'सुझाव:' : language === 'hinglish' ? 'Suggestions:' : 'Suggestions:'}
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickPrompt(prompt.text)}
            disabled={isLoading || disabled}
            className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs font-medium cursor-pointer"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Voice Listening / Error Status Indicator */}
      {isListening && (
        <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-900 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="font-semibold">
              🎙️ Listening ({speechLang})... Speak clearly. Your transcript will appear below.
            </span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="text-[11px] font-bold text-red-700 hover:text-red-900 underline ml-2 cursor-pointer"
          >
            Stop Mic
          </button>
        </div>
      )}

      {speechError && (
        <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <span>⚠️ {speechError}</span>
          <span className="text-[10px] text-text-muted ml-2">You can continue typing normally</span>
        </div>
      )}

      {/* Input Form with Microphone & Send */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholderText}
            disabled={isLoading || disabled}
            className="w-full px-4 py-2.5 bg-gray-50/80 hover:bg-gray-50 focus:bg-white text-sm text-indigo-950 rounded-xl border border-indigo-200/80 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400 pr-10"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput('');
                resetTranscript();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
              title="Clear input"
            >
              ✕
            </button>
          )}
        </div>

        {/* 🎙️ Voice Input Microphone Button (Change 1) */}
        <button
          type="button"
          onClick={toggleVoiceRecording}
          disabled={isLoading || disabled || !isSupported}
          title={
            !isSupported
              ? 'Voice input is not supported in this browser. You can continue typing.'
              : isListening
              ? 'Click to stop listening'
              : 'Click to speak via microphone'
          }
          className={`px-3 py-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            isListening
              ? 'bg-red-500 text-white border-red-600 shadow-md ring-2 ring-red-300 animate-pulse'
              : !isSupported
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:border-indigo-300 shadow-2xs'
          }`}
        >
          {isListening ? (
            <span className="text-sm font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>⏹️</span>
            </span>
          ) : (
            <span className="text-sm">🎙️</span>
          )}
        </button>

        {/* Send Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={!input.trim() || disabled}
          className="rounded-xl px-4 flex-shrink-0 shadow-sm"
        >
          <span>{language === 'hi' ? 'भेजें' : 'Send'}</span>
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
        <span>
          {language === 'hi'
            ? 'Sarvam AI भाषा मॉडल (sarvam-105b) द्वारा संचालित'
            : language === 'hinglish'
            ? 'Powered by Sarvam AI language models (sarvam-105b)'
            : 'Responses generated using Sarvam AI language models'}
        </span>
        <span>
          {language === 'hi'
            ? 'सुरक्षित माइक्रोफोन इनपुट'
            : language === 'hinglish'
            ? 'Safe browser voice input'
            : 'Browser-native voice speech input'}
        </span>
      </div>
    </div>
  );
};
