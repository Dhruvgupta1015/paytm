'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic client-side checks only
  const validate = (): boolean => {
    const errs: { phone?: string; email?: string } = {};

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Please enter your 10-digit mobile number.';
    } else if (cleanPhone.length !== 10) {
      errs.phone = 'Mobile number must be exactly 10 digits.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email format (e.g. name@domain.com).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Pure cosmetic demo session — no backend or credentials stored
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('finjourney_demo_session', 'true');
        localStorage.setItem(
          'finjourney_demo_user',
          JSON.stringify({
            name: 'Rahul Sharma',
            phone: phone.trim(),
            email: email.trim(),
            loginTime: new Date().toISOString(),
          })
        );
      } catch {
        // LocalStorage fallback
      }
    }

    setTimeout(() => {
      router.push('/journey');
    }, 400);
  };

  const handleFillDemo = () => {
    setPhone('9876543210');
    setEmail('rahul.sharma@paytm.demo');
    setErrors({});
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <Badge variant="success" size="sm">
                Demo Entry Gate
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Welcome to FinJourney AI
            </h1>
            <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed">
              Experience the next generation of AI-assisted health insurance claims navigation.
            </p>
          </div>

          {/* Form Area */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {/* Quick Demo Autofill Button */}
            <div className="flex items-center justify-between pb-3 border-b border-indigo-50">
              <span className="text-xs text-text-secondary">Testing the prototype?</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
              >
                <span>⚡ Fill Demo Details</span>
              </button>
            </div>

            {/* Mobile Number Field */}
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted text-xs font-semibold">
                  +91
                </div>
                <input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ''));
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="9876543210"
                  className={`w-full pl-12 pr-4 py-2.5 text-sm rounded-xl border bg-white text-indigo-950 placeholder-slate-400 focus:outline-none transition-all ${
                    errors.phone
                      ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.phone}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="rahul.sharma@example.com"
                className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white text-indigo-950 placeholder-slate-400 focus:outline-none transition-all ${
                  errors.email
                    ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                loading={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md"
              >
                <span>Continue to Claim Copilot</span>
                <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>

            {/* Honesty-first disclaimer */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center">
              <p className="text-[11px] text-amber-900 leading-snug">
                🔒 <strong>Demo login:</strong> No real credentials are stored or verified. This screen is an optional cosmetic entry gate for demonstration purposes.
              </p>
            </div>

            {/* Direct bypass link */}
            <div className="text-center pt-1 border-t border-indigo-50">
              <Link
                href="/journey"
                className="text-xs font-semibold text-text-secondary hover:text-indigo-600 transition-colors"
              >
                Skip login and open Claim Copilot directly →
              </Link>
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
