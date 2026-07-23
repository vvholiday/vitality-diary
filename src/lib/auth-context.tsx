'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { createClient } from './supabase/client';
import type { User } from './mock-data';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, nickname: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient() as any;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        // Fetch profile from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, role')
          .eq('id', session.user.id)
          .single();
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          nickname: profile?.nickname || session.user.email?.split('@')[0] || '用户',
          role: profile?.role || 'user',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const supabase = createClient() as any;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    // Set user directly so the UI updates immediately (before onAuthStateChange fires)
    if (data.session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, role')
        .eq('id', data.session.user.id)
        .single();
      setUser({
        id: data.session.user.id,
        email: data.session.user.email || '',
        nickname: profile?.nickname || data.session.user.email?.split('@')[0] || '用户',
        role: profile?.role || 'user',
      });
    }
    return null;
  }, []);

  const register = useCallback(async (email: string, nickname: string, password: string) => {
    const supabase = createClient() as any;
    // First register with Supabase Auth (trigger will create profile)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });
    if (error) return error.message;
    // If user was created but profile trigger didn't fire yet, insert profile manually
    if (data.user && !data.session) {
      // Email confirmation required — that's fine, just tell user
      return null;
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient() as any;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'admin' as const,
    loading,
    login,
    register,
    logout,
  }), [user, loading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
