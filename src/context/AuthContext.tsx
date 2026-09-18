'use client';

/**
 * Client-Side Authentication State Context
 *
 * FinJourney AI — Phase 5 Authenticated UI Architecture
 *
 * IMPORTANT:
 * - This context is strictly for reactive UI state (displaying name, role badge, navigation).
 * - It obtains authenticated identity SOLELY from the server endpoint: GET /api/auth/me.
 * - It NEVER determines role or identity from localStorage, headers, or query parameters.
 * - Server-side session cookie remains the sole source of truth for authorization.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthIdentity, AuthRole } from '@/types';

interface AuthContextType {
  user: AuthIdentity | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pin: string) => Promise<{ ok: boolean; error?: string; role?: AuthRole }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthIdentity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authoritative server sync via GET /api/auth/me
  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (active && data.ok && data.user) {
            setUser(data.user);
            setIsLoading(false);
            return;
          }
        }
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
      } catch {
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Authoritative login via POST /api/auth/login
  const login = async (email: string, pin: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setIsLoading(false);
        return { ok: false, error: data.error || 'Authentication failed' };
      }

      setUser(data.user);
      setIsLoading(false);
      return { ok: true, role: data.user?.role };
    } catch {
      setIsLoading(false);
      return { ok: false, error: 'Connection error during login' };
    }
  };

  // Authoritative logout via POST /api/auth/logout
  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // safe ignore
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push('/login');
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
