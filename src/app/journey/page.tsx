'use client';

import React from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { JourneyProgress } from '@/components/journey/JourneyProgress';
import { JourneyTimeline } from '@/components/journey/JourneyTimeline';

export default function JourneyPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-128px)]">
      {/* Horizontal Top Timeline for easy bird's-eye view */}
      <div className="bg-white border-b border-indigo-100/80 px-6 py-2.5 shadow-2xs">
        <JourneyTimeline orientation="horizontal" />
      </div>

      {/* Main Split Layout: Left = AI Chat Copilot, Right = Journey Progress Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side — Interactive Chat */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-indigo-100/80 h-full overflow-hidden">
          <ChatPanel />
        </div>

        {/* Right Side — Journey Progress Checklist & Status */}
        <div className="w-full lg:w-96 xl:w-[420px] flex-shrink-0 bg-white p-5 lg:p-6 overflow-y-auto shadow-sm">
          <JourneyProgress />
        </div>
      </div>
    </div>
  );
}
