'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface UserInfo {
  role: 'customer' | 'officer';
  name?: string;
  memberId?: string;
  officerId?: string;
  email?: string;
}

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = searchParams.get('target') || '';
  const paramRole = searchParams.get('role') || '';

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.ok && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Fallback to param if fetch fails
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // safe ignore
    } finally {
      router.push('/login');
    }
  };

  const currentRole = user?.role || paramRole || 'customer';
  const isCustomerAttemptingOfficer = currentRole === 'customer' || target === 'officer';

  return (
    <div className="min-h-[calc(100vh-128px)] bg-gradient-to-b from-slate-50 via-white to-amber-50/30 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xl overflow-hidden">
          {/* Accent Header */}
          <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-900 text-white p-6 sm:p-8 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center text-2xl shadow-sm">
                🔒
              </div>
              <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-300 border-amber-400/40 text-[10px] font-bold uppercase tracking-wider">
                Access Restricted
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isCustomerAttemptingOfficer
                ? 'Officer Console Restricted'
                : 'Customer Journey Restricted'}
            </h1>
            <p className="text-xs text-amber-200/90 mt-1.5 leading-relaxed">
              {isCustomerAttemptingOfficer
                ? 'You do not have permission to access the internal Claims Officer Console with your current policyholder account.'
                : 'Customer claim filing workflows cannot be accessed from an Officer session.'}
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Active Session Context Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-indigo-100/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-muted uppercase tracking-wider text-[10px]">
                  Current Authenticated Session
                </span>
                <Badge
                  variant={currentRole === 'officer' ? 'indigo' : 'success'}
                  size="sm"
                  className="capitalize font-semibold text-[10px]"
                >
                  {currentRole} Role
                </Badge>
              </div>

              <div className="text-xs text-indigo-950 space-y-1 pt-1">
                <p>
                  <strong>User:</strong> {user?.name || (currentRole === 'officer' ? 'Priya Verma' : 'Rahul Sharma')}
                </p>
                <p>
                  <strong>Identifier:</strong>{' '}
                  <span className="font-mono font-medium text-indigo-900">
                    {user?.memberId || user?.officerId || (currentRole === 'officer' ? 'PAYTM-ESC-9042' : 'MEM-2024-78432')}
                  </span>
                </p>
                <p>
                  <strong>Scope Status:</strong>{' '}
                  <span className="text-amber-800 font-medium">
                    {isCustomerAttemptingOfficer
                      ? 'Restricted from Claims Adjudication Queue'
                      : 'Restricted from Customer Journey Forms'}
                  </span>
                </p>
              </div>
            </div>

            {/* Explanation Notice */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
              <p className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Server-Enforced Role Isolation</span>
              </p>
              <p>
                FinJourney AI enforces strict server-side role boundaries. Client headers, URL tampering, and browser storage cannot bypass these controls. Your session is authenticated, but this route requires an authorized {isCustomerAttemptingOfficer ? 'Claims Officer' : 'Customer'} identity.
              </p>
            </div>

            {/* Navigation Actions */}
            <div className="pt-2 space-y-3">
              {isCustomerAttemptingOfficer ? (
                <Link href="/journey" className="block w-full">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                  >
                    <span>← Return to My Claim Journey</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/officer" className="block w-full">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                  >
                    <span>← Return to Officer Console</span>
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={handleSignOut}
                loading={loggingOut}
                className="w-full text-xs border-slate-200 text-text-secondary hover:text-indigo-950 hover:bg-slate-50"
              >
                <span>Sign Out & Switch Account</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-xs text-text-muted hover:text-indigo-600 transition-colors">
            ← Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-128px)] flex items-center justify-center p-6 text-xs text-text-muted">
          Loading access verification...
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
