'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useJourney } from '@/context/JourneyContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function Header() {
  const pathname = usePathname();
  const { state, resetJourney } = useJourney();
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();

  const isLoginPage = pathname === '/login';
  const isOfficerRoute = pathname.startsWith('/officer');
  const isOfficerUser = role === 'officer';
  const currentStep = state.steps.find((s) => s.status === 'current');

  return (
    <header className="sticky top-0 z-30">
      {/* Synthetic Data & Hackathon Demo Disclaimer */}
      <div className="disclaimer-banner text-[11px] font-medium py-1 text-center bg-amber-500 text-amber-950 border-b border-amber-600/30">
        ⚠️ HACKATHON DEMO PROTOTYPE — All insurance policies, hospital data, and claims are synthetic demo records.
      </div>

      {/* Main header bar */}
      <div className="bg-white/85 backdrop-blur-md border-b border-indigo-100/60 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Context / Title */}
          <div className="flex items-center gap-4">
            <div>
              {isLoginPage ? (
                <>
                  <h2 className="text-sm font-semibold text-indigo-900">
                    FinJourney AI Secure Access
                  </h2>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">
                    Authentication & Session Gateway
                  </p>
                </>
              ) : isLoading ? (
                <>
                  <h2 className="text-sm font-semibold text-indigo-900">
                    FinJourney AI Copilot
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Verifying session...
                  </p>
                </>
              ) : isAuthenticated && user ? (
                <>
                  <h2 className="text-sm font-semibold text-indigo-900">
                    {isOfficerRoute || isOfficerUser
                      ? 'Claims Officer Adjudication'
                      : 'Health Insurance Claim Journey'}
                  </h2>
                  {isOfficerRoute || isOfficerUser ? (
                    <p className="text-xs text-amber-700 font-medium mt-0.5">
                      Internal Escalation & Review Dashboard
                    </p>
                  ) : (
                    currentStep && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        Current: <span className="font-medium text-indigo-600">{currentStep.label}</span>
                      </p>
                    )
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-sm font-semibold text-indigo-900">
                    {isOfficerRoute ? 'Claims Officer Adjudication' : 'Health Insurance Claim Journey'}
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Deterministic AI Financial Journey Copilot
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right: Authenticated Identity & Navigation */}
          <div className="flex items-center gap-3">
            {isLoginPage ? (
              // Clean neutral shell for /login page — no old user identity or persona controls (Phase 11)
              <div className="flex items-center gap-1.5 text-xs text-indigo-800 bg-indigo-50 border border-indigo-200/60 px-3 py-1.5 rounded-xl font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Secure Session Gate</span>
              </div>
            ) : isLoading ? (
              // Neutral loading skeleton while checking server session (Phase 6 & 15)
              <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs animate-pulse">
                <div className="w-6 h-6 rounded-full bg-slate-200" />
                <div className="w-20 h-3 bg-slate-200 rounded" />
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                {/* Persona Navigation (Role-specific verified destination) */}
                {role === 'customer' && (
                  <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-indigo-100/80 text-xs">
                    <Link
                      href="/journey"
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        pathname === '/journey'
                          ? 'bg-white text-indigo-950 font-bold shadow-xs'
                          : 'text-text-secondary hover:text-indigo-900'
                      }`}
                    >
                      Journey
                    </Link>
                    <Link
                      href="/passport"
                      className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                        pathname === '/passport'
                          ? 'bg-amber-100 text-amber-950 font-bold shadow-xs'
                          : 'text-text-secondary hover:text-amber-900'
                      }`}
                    >
                      <span>🛡️</span>
                      <span>Passport</span>
                    </Link>
                  </div>
                )}

                {role === 'officer' && (
                  <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-indigo-100/80 text-xs">
                    <span className="px-3 py-1 rounded-lg bg-indigo-900 text-white font-bold text-xs shadow-xs flex items-center gap-1.5">
                      <span>🛡️</span>
                      <span>Adjudication Console</span>
                    </span>
                  </div>
                )}

                {/* Authenticated Identity Pill (Authoritative from /api/auth/me only) */}
                <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {user.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'U'}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-indigo-950 text-xs leading-none">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5 leading-none">
                      <Badge
                        variant={role === 'officer' ? 'indigo' : 'success'}
                        size="sm"
                        className="capitalize font-semibold text-[9px] px-1 py-0"
                      >
                        {role === 'officer' ? 'Claims Officer' : 'Customer'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-xs border-slate-200 text-text-secondary hover:text-red-700 hover:border-red-200 hover:bg-red-50"
                  title="Sign Out"
                >
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              // Unauthenticated visitor
              <Link href="/login">
                <Button variant="primary" size="sm" className="text-xs">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Customer progress pill & Reset button (Only visible when verified customer on customer routes) */}
            {!isLoginPage && !isLoading && isAuthenticated && role === 'customer' && !isOfficerRoute && (
              <div className="flex items-center gap-2 pl-2 border-l border-indigo-100">
                <div className="hidden lg:flex items-center gap-2 bg-indigo-50 rounded-full px-3 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                  <span className="text-xs font-semibold text-indigo-700">{state.progress}% Complete</span>
                </div>

                <Button variant="ghost" size="sm" onClick={resetJourney} className="text-xs text-text-muted hover:text-indigo-950">
                  Reset
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
