'use client';

import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';
import type { AuthMe, LoginResponse } from '@/types/domain';

interface AuthCtx {
  user: AuthMe | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('pcs.token') : null;
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.get<AuthMe>('/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    setToken(res.accessToken);
    const me = await api.get<AuthMe>('/auth/me');
    setUser(me);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const hasRole = useCallback(
    (role: string) => Boolean(user?.roles.includes(role)),
    [user],
  );

  return (
    <Ctx.Provider value={{ user, loading, login, logout, hasRole }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be within <AuthProvider>');
  return ctx;
}
