'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/lib/constants';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-8 py-12">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        {/* Hero Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-lg mb-8">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-indigo-900 mb-3">
          Welcome to FinJourney AI
        </h1>
        <p className="text-lg text-text-secondary mb-8 max-w-lg mx-auto">
          Your AI-powered copilot for navigating health insurance claims. 
          We&apos;ll guide you step by step — from incident to settlement.
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { value: '8', label: 'Guided Steps', icon: '📋' },
            { value: 'AI', label: 'Powered Chat', icon: '🤖' },
            { value: '100%', label: 'Transparent', icon: '🔍' },
          ].map((stat) => (
            <Card key={stat.label} padding="sm" hover>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-indigo-900">{stat.value}</div>
              <div className="text-xs text-text-secondary">{stat.label}</div>
            </Card>
          ))}
        </div>

        <Button
          size="lg"
          onClick={() => router.push(ROUTES.JOURNEY)}
          className="px-10 shadow-lg hover:shadow-xl transition-shadow"
        >
          Start Your Claim Journey →
        </Button>

        <p className="mt-6 text-xs text-text-muted">
          ⚠️ This is a demo with synthetic data. No real claims are processed.
        </p>
      </div>
    </div>
  );
}
