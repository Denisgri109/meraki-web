'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

// ─── Types ─────────────────────────────────────────────────────────────────
export type UserRole = 'client' | 'master' | 'owner';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  is_master: boolean;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  specialty: string | null;
  push_token: string | null;
  tos_accepted: boolean | null;
  tos_accepted_at: string | null;
  tos_version: string | null;
  created_at: string | null;
  updated_at: string | null;
  stripe_customer_id: string | null;
  [key: string]: unknown;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  sessionError: AuthError | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole,
    tosAccepted?: boolean,
    tosVersion?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────
// Stable module-level client — prevents lock contention from re-creation
const supabase = createClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<AuthError | null>(null);

  // ── Fetch profile from Supabase ──────────────────────────────────────
  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setProfile(data as unknown as Profile);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Bootstrap: get initial session ───────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 1500);

    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
        setSessionError(error);
      }
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        setSessionError(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSessionError(null);
        if (s?.user) {
          setSession(s);
          setUser(s.user);
          await fetchProfile(s.user.id);
        }
      } else if (event === 'USER_UPDATED') {
        if (s?.user) {
          setSession(s);
          setUser(s.user);
          await fetchProfile(s.user.id);
        }
      }
    });

    // ── Visibility-based session refresh ────────────────────────────
    // When the tab is backgrounded the internal refresh timer can freeze,
    // causing the JWT to expire. Force a refresh whenever the tab comes back.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session: s }, error }) => {
          if (error) {
            console.warn('[Auth] visibility refresh error:', error.message);
            setSessionError(error);
            return;
          }
          if (s) {
            setSession(s);
            setUser(s.user);
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Periodic keep-alive (every 4 min) ──────────────────────────
    // Prevents token expiry even when the tab stays in foreground for hours.
    const keepAlive = setInterval(() => {
      supabase.auth.getSession();
    }, 4 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(keepAlive);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth actions ────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'client',
    tosAccepted = false,
    tosVersion = '1.0'
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase
          .from('profiles')
          .update({
            role,
            is_master: role === 'master',
            full_name: fullName,
            tos_accepted: tosAccepted,
            tos_accepted_at: tosAccepted ? new Date().toISOString() : null,
            tos_version: tosVersion,
          })
          .eq('id', data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      if (user?.id) {
        await supabase.from('profiles').update({ push_token: null }).eq('id', user.id);
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('profiles').update(updates as any).eq('id', user.id);
      if (error) throw error;
      await fetchProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role: (profile?.role as UserRole) ?? null,
        loading,
        sessionError,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
