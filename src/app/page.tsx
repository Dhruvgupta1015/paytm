'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useJourney } from '@/context/JourneyContext';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { resetJourney, goToStep } = useJourney();

  const handleStartHappyPath = () => {
    resetJourney();
    router.push('/journey');
  };

  return (
    <div className="min-h-[calc(100vh-128px)] bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-16">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Hackathon Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-900 mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Paytm Build for India AI Hackathon · AI Financial Journeys</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-indigo-950 tracking-tight leading-[1.15]">
            FinJourney AI{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-500 bg-clip-text text-transparent">
              Claim Copilot
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl">
            Navigate complex health insurance claims with a deterministic, bilingual AI copilot. From hospital admission to document verification and claim review — in under 3 minutes.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <Button
              size="lg"
              onClick={handleStartHappyPath}
              className="w-full sm:w-auto px-8 shadow-lg hover:shadow-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700"
            >
              <span>Launch Demo Claim Journey</span>
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>

            <Link href="/profile" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-sm font-semibold"
              >
                View Customer Policies & Profile
              </Button>
            </Link>

            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm font-semibold border-indigo-200 text-indigo-900 hover:bg-indigo-50"
              >
                <span>Demo Sign In</span>
                <svg className="w-4 h-4 ml-1.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Button>
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Deterministic Happy Path Demo</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Sarvam AI Bilingual Processing</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Human Escalation Safeguards</span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-indigo-950 mb-1.5">
              Sarvam AI Bilingual Copilot
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Converses naturally in Hindi, Hinglish, and English. Explains tricky room rent clauses, waiting periods, and policy exclusions in simple terms.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-indigo-950 mb-1.5">
              Deterministic 8-Step State Engine
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Progress advances only through explicit user actions and verifications — never through free-text LLM hallucination. 100% predictable for hackathon demo reliability.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-indigo-950 mb-1.5">
              Responsible Human Safeguard Desk
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Seamless human-in-the-loop escalation transfers claim context instantly to an adjudication officer whenever confidence thresholds drop.
            </p>
          </div>
        </div>

        {/* Happy Path Step Walkthrough Cards */}
        <div className="mt-16 bg-white rounded-2xl border border-indigo-100/90 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-100 gap-2 mb-6">
            <div>
              <h3 className="text-lg font-bold text-indigo-950">
                Deterministic Demo Path (2-Minute Walkthrough)
              </h3>
              <p className="text-xs text-text-secondary">
                Click any milestone below to jump directly into that demo step
              </p>
            </div>
            <Badge variant="indigo" size="sm">
              Happy Path Scripted Flow
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => {
                resetJourney();
                goToStep('intent');
                router.push('/journey');
              }}
              className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span className="text-xs font-bold text-indigo-700 block mb-1">Step 1 — 3</span>
              <h4 className="text-sm font-bold text-indigo-950 mb-1">AI Copilot Chat</h4>
              <p className="text-[11px] text-text-secondary">
                Incident intake, policy selection (POL-HEALTH-001), and Apollo hospital logging.
              </p>
            </div>

            <div
              onClick={() => {
                goToStep('documents');
                router.push('/documents');
              }}
              className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span className="text-xs font-bold text-indigo-700 block mb-1">Step 4 & 5</span>
              <h4 className="text-sm font-bold text-indigo-950 mb-1">Document Verification</h4>
              <p className="text-[11px] text-text-secondary">
                Upload discharge summary, final bills, Aadhaar & prescription with live automated checks.
              </p>
            </div>

            <div
              onClick={() => {
                goToStep('draft');
                router.push('/claim/draft');
              }}
              className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span className="text-xs font-bold text-indigo-700 block mb-1">Step 6 & 7</span>
              <h4 className="text-sm font-bold text-indigo-950 mb-1">Claim Draft & Approval</h4>
              <p className="text-[11px] text-text-secondary">
                Breakdown of ₹85,000 bill, ₹78,500 payable, user declaration & claim approval.
              </p>
            </div>

            <div
              onClick={() => {
                goToStep('tracking');
                router.push('/claim/tracking');
              }}
              className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span className="text-xs font-bold text-indigo-700 block mb-1">Step 8</span>
              <h4 className="text-sm font-bold text-indigo-950 mb-1">Live Claim Tracking</h4>
              <p className="text-[11px] text-text-secondary">
                Status progression (Under Review), receipt download & adjudication timeline.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Disclaimer */}
        <div className="mt-8 text-center text-xs text-text-muted">
          <p>
            ⚖️ Synthetic Data Prototype created for Paytm Build for India AI Hackathon (Delhi Edition). All policy terms and numbers are simulated.
          </p>
        </div>
      </div>
    </div>
  );
}
