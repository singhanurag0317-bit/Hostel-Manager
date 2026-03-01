'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile } from '@/lib/supabase';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string, role: 'ADMIN' | 'STUDENT') => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string, role: 'ADMIN' | 'STUDENT', phone?: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: () => { },
});

const USERS_KEY = 'hostel_users';
const SESSION_KEY = 'hostel_session';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'ADMIN' | 'STUDENT';
  created_at: string;
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

function setStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}

function setSession(user: StoredUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser({ id: session.id, email: session.email });
      setProfile({ id: session.id, name: session.name, email: session.email, role: session.role, phone: session.phone, created_at: session.created_at });
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string, role: 'ADMIN' | 'STUDENT'): Promise<{ error?: string }> => {
    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role);
    if (!found) return { error: 'Invalid credentials. Please check your email, password, and role.' };
    setSession(found);
    setUser({ id: found.id, email: found.email });
    setProfile({ id: found.id, name: found.name, email: found.email, role: found.role, phone: found.phone, created_at: found.created_at });
    return {};
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string, role: 'ADMIN' | 'STUDENT', phone?: string): Promise<{ error?: string }> => {
    const users = getStoredUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role)) {
      return { error: 'An account with this email already exists for this role' };
    }
    const newUser: StoredUser = { id: `${role.toLowerCase()}-${Date.now()}`, name, email, password, phone, role, created_at: new Date().toISOString() };
    users.push(newUser);
    setStoredUsers(users);
    setSession(newUser);
    setUser({ id: newUser.id, email: newUser.email });
    setProfile({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone, created_at: newUser.created_at });
    return {};
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, session: user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
