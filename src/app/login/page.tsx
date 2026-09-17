'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('rahul.sharma@paytm.demo');
  const [pin, setPin] = useState('1234');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !pin.trim()) {
      setErrorMessage('Please enter both demo email and PIN.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), pin.trim());
      if (!result.ok) {
        setErrorMessage(result.error || 'Invalid credentials. Please verify your email and PIN.');
        setIsSubmitting(false);
        return;
      }

      // Server-authoritative routing based on verified session role
      if (result.role === 'officer') {
        router.push('/officer');
      } else {
        router.push('/journey');
      }
    } catch {
      setErrorMessage('Unable to connect to authentication server. Please try again.');
      setIsSubmitting(false);
    }
  };

  const selectDemoPersona = (demoEmail: string, demoPin: string) => {
    setEmail(demoEmail);
    setPin(demoPin);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-128px)] bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-xl overflow-hidden">
          {/* Header Accent */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <Badge variant="success" size="sm">
                Secure Session Gate
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Sign In to FinJourney AI
            </h1>
            <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed">
              Server-authoritative HMAC session protection for customers and claims officers.
            </p>
          </div>

          {/* Form Area */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {/* Quick Demo Autofill Selector */}
            <div className="space-y-2 pb-3 border-b border-indigo-50">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                Select Demo Account
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectDemoPersona('rahul.sharma@paytm.demo', '1234')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'rahul.sharma@paytm.demo'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-indigo-200 bg-slate-50/50'
                  }`}
                >
                  <div className="font-bold text-xs text-indigo-950">Rahul Sharma</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Customer (PIN: 1234)</div>
                </button>

                <button
                  type="button"
                  onClick={() => selectDemoPersona('priya.verma@paytm.officer', '9042')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'priya.verma@paytm.officer'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-indigo-200 bg-slate-50/50'
                  }`}
                >
                  <div className="font-bold text-xs text-indigo-950">Priya Verma</div>
                  <div className="text-[10px] text-indigo-700 font-medium">Claims Officer (PIN: 9042)</div>
                </button>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-fade-in">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1.5">
                Demo Account Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@paytm.demo"
                required
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white text-indigo-950 placeholder-slate-400 focus:outline-none transition-all font-mono"
              />
            </div>

            {/* PIN Field */}
            <div>
              <label htmlFor="pin" className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1.5">
                Security PIN (4 Digits)
              </label>
              <input
                id="pin"
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                required
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white text-indigo-950 placeholder-slate-400 focus:outline-none transition-all font-mono text-center tracking-widest text-lg"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                loading={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md"
              >
                <span>Authenticate Session</span>
                <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>

            {/* Security Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-[11px] text-text-secondary leading-snug">
                🛡️ <strong>Server-Authoritative:</strong> Creates an HTTP-only HMAC signed session. Credentials and roles are verified server-side.
              </p>
            </div>
          </form>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link href="/" className="text-xs text-text-muted hover:text-indigo-600 transition-colors">
            ← Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
