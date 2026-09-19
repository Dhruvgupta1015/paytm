'use client';

/**
 * Client-Side Authentication State Context
 *
 * FinJourney AI — Authoritative Server Synchronization
 *
 * LIFECYCLE:
 * INITIALIZING (user = null, isLoading = true)
 *     ↓
 * CHECKING_SERVER_SESSION (GET /api/auth/me with cache: no-store, request sequencing)
 *     ↓
 * AUTHENTICATED (verified server user) OR UNAUTHENTICATED (user = null)
 *
 * CRITICAL RULES:
 * - Obtains identity SOLELY from the server endpoint: GET /api/auth/me.
 * - NEVER determines role or identity from localStorage, headers, or query parameters.
 * - Request sequence guard prevents out-of-order race conditions.
 * - Server-side session cookie remains the sole source of truth for authorization.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthIdentity, AuthRole } from '@/types';

interface AuthContextType {
  user: AuthIdentity | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pin: string) => Promise<{ ok: boolean; error?: string; role?: AuthRole; user?: AuthIdentity }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Initial state: strictly null user, loading until server confirms session
  const [user, setUser] = useState<AuthIdentity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Request sequencing counter to prevent out-of-order race conditions (Phase 7)
  const latestReqIdRef = useRef<number>(0);
  const isSubmittingLoginRef = useRef<boolean>(false);

  // Authoritative server sync via GET /api/auth/me
  const refreshAuth = useCallback(async (): Promise<void> => {
    const currentReqId = ++latestReqIdRef.current;
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      // Ignore if a newer request was dispatched
      if (currentReqId !== latestReqIdRef.current) return;

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          setUser(data.user);
          setIsLoading(false);
          return;
        }
      }
      setUser(null);
    } catch {
      if (currentReqId === latestReqIdRef.current) {
        setUser(null);
      }
    } finally {
      if (currentReqId === latestReqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial application load verification (Phase 6)
  useEffect(() => {
    let active = true;
    const currentReqId = ++latestReqIdRef.current;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!active || currentReqId !== latestReqIdRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.user) {
            setUser(data.user);
            setIsLoading(false);
            return;
          }
        }
        setUser(null);
      } catch {
        if (active && currentReqId === latestReqIdRef.current) {
          setUser(null);
        }
      } finally {
        if (active && currentReqId === latestReqIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  // Authoritative login via POST /api/auth/login + GET /api/auth/me verification (Phase 8)
  const login = async (
    email: string,
    pin: string
  ): Promise<{ ok: boolean; error?: string; role?: AuthRole; user?: AuthIdentity }> => {
    // Prevent duplicate concurrent login submissions
    if (isSubmittingLoginRef.current) {
      return { ok: false, error: 'Authentication already in progress' };
    }

    isSubmittingLoginRef.current = true;
    setIsLoading(true);

    try {
      // Step 1: Submit credentials to authoritative login gate
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ email, pin }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok || !loginData.ok) {
        isSubmittingLoginRef.current = false;
        setIsLoading(false);
        return { ok: false, error: loginData.error || 'Authentication failed' };
      }

      // Step 2: Authoritatively verify the newly set HttpOnly cookie with GET /api/auth/me
      const meReqId = ++latestReqIdRef.current;
      const meRes = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!meRes.ok) {
        setUser(null);
        isSubmittingLoginRef.current = false;
        setIsLoading(false);
        return { ok: false, error: 'Session verification failed after authentication' };
      }

      const meData = await meRes.json();
      if (meReqId === latestReqIdRef.current && meData.ok && meData.user) {
        setUser(meData.user);
        setIsLoading(false);
        isSubmittingLoginRef.current = false;
        return { ok: true, role: meData.user.role, user: meData.user };
      }

      // Fallback if payload verification incomplete
      setUser(null);
      setIsLoading(false);
      isSubmittingLoginRef.current = false;
      return { ok: false, error: 'Invalid session payload returned from server' };
    } catch {
      setUser(null);
      setIsLoading(false);
      isSubmittingLoginRef.current = false;
      return { ok: false, error: 'Network error during authentication' };
    }
  };

  // Authoritative logout via POST /api/auth/logout (Phase 7)
  const logout = async (): Promise<void> => {
    // Invalidate pending auth checks
    ++latestReqIdRef.current;
    setUser(null);
    setIsLoading(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
    } catch {
      // safe ignore network issues on logout
    } finally {
      setUser(null);
      setIsLoading(false);
      // Invalidate Next.js App Router cache so server components re-evaluate
      router.refresh();
      router.replace('/login');
    }
  };

  const role = user?.role || null;
  const isAuthenticated = Boolean(user && role);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
