/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { User, UserRole, Badge } from '@/types';
import { authClient } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  currentBadge: Badge | null;
  nextBadge: Badge | null;
  progressToNextBadge: number;
  addPoints: (amount: number) => void;
}

export const badges: Badge[] = [
  { id: '1', name: 'Newbie', level: 1, requiredPoints: 20, icon: '🌱', color: 'badge-newbie' },
  { id: '2', name: 'Explorer', level: 2, requiredPoints: 40, icon: '🔍', color: 'badge-explorer' },
  { id: '3', name: 'Achiever', level: 3, requiredPoints: 60, icon: '⭐', color: 'badge-achiever' },
  { id: '4', name: 'Specialist', level: 4, requiredPoints: 80, icon: '🎯', color: 'badge-specialist' },
  { id: '5', name: 'Expert', level: 5, requiredPoints: 100, icon: '💎', color: 'badge-expert' },
  { id: '6', name: 'Master', level: 6, requiredPoints: 120, icon: '👑', color: 'badge-master' },
];

const getCurrentBadge = (points: number): Badge => {
  return [...badges].reverse().find(b => points >= b.requiredPoints) || badges[0];
};

const getNextBadge = (points: number): Badge | null => {
  return badges.find(b => b.requiredPoints > points) || null;
};

const getProgressToNextBadge = (points: number): number => {
  const current = getCurrentBadge(points);
  const next = getNextBadge(points);

  if (!next) return 100;

  const range = next.requiredPoints - current.requiredPoints;
  const progress = points - current.requiredPoints;

  if (range <= 0) return 100;

  return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get stored user data locally for gamification
const getStoredUserData = (uid: string) => {
  try {
    const stored = localStorage.getItem(`user_${uid}`);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

// Helper to save user data locally for gamification
const updateStoredUserData = (uid: string, data: Partial<User>) => {
  try {
    const current = getStoredUserData(uid) || {};
    const updated = { ...current, ...data };
    localStorage.setItem(`user_${uid}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return data;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Poll or check session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const { data, error } = await authClient.getSession();

        if (data?.session && data?.user) {
          const authUser = data.user;
          const storedData = getStoredUserData(authUser.id);

          const role = storedData?.role || 'learner';
          const totalPoints = storedData?.totalPoints || 0;

          // If neon auth gives a token, store for API calls
          if (data.session.token) {
            localStorage.setItem('neon_auth_token', data.session.token);
          }

          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.name || authUser.email?.split('@')[0] || 'User',
            avatar: authUser.image || undefined,
            role: role,
            totalPoints: totalPoints,
            createdAt: authUser.createdAt?.toString() || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed to get session:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  const login = useCallback(async (email: string, password: string, role?: UserRole) => {
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      throw new Error(result.error.message || 'Login failed');
    }

    const { data } = await authClient.getSession();
    if (data?.session && data?.user) {
      if (data.session.token) {
        localStorage.setItem('neon_auth_token', data.session.token);
      }

      const authUser = data.user;
      let finalRole = role;

      // If a role is specified during login, update it
      if (finalRole) {
        updateStoredUserData(authUser.id, { role: finalRole });
      } else {
        const storedData = getStoredUserData(authUser.id);
        finalRole = storedData?.role || 'learner';
      }

      const storedData = getStoredUserData(authUser.id);
      const totalPoints = storedData?.totalPoints || 0;

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.name || authUser.email?.split('@')[0] || 'User',
        avatar: authUser.image || undefined,
        role: finalRole,
        totalPoints: totalPoints,
        createdAt: authUser.createdAt?.toString() || new Date().toISOString(),
      });
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Registration failed');
    }

    const { data } = await authClient.getSession();
    if (data?.session && data?.user) {
      if (data.session.token) {
        localStorage.setItem('neon_auth_token', data.session.token);
      }

      const authUser = data.user;
      const photoURL = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
      let syncedRole = role;

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.token}`
          },
          body: JSON.stringify({ role })
        });

        if (response.ok) {
          const resData = await response.json();
          syncedRole = resData.role; // This sets the actual role (e.g., admin if matched)
        }
      } catch (err) {
        console.error("Failed to sync profile with backend:", err);
      }

      updateStoredUserData(authUser.id, {
        role: syncedRole,
        totalPoints: 20
      });

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.name || authUser.email?.split('@')[0] || 'User',
        avatar: photoURL,
        role: syncedRole,
        totalPoints: 20,
        createdAt: authUser.createdAt?.toString() || new Date().toISOString(),
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    localStorage.removeItem('neon_auth_token');
    setUser(null);
  }, []);

  const addPoints = useCallback((amount: number) => {
    setUser(prev => {
      if (!prev) return null;
      const newPoints = prev.totalPoints + amount;
      updateStoredUserData(prev.id, { totalPoints: newPoints });
      return { ...prev, totalPoints: newPoints };
    });
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      updateStoredUserData(user.id, { role });
      setUser({ ...user, role });
    }
  }, [user]);

  const currentBadge = user ? getCurrentBadge(user.totalPoints) : null;
  const nextBadge = user ? getNextBadge(user.totalPoints) : null;
  const progressToNextBadge = user ? getProgressToNextBadge(user.totalPoints) : 0;

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    switchRole,
    currentBadge,
    nextBadge,
    progressToNextBadge,
    addPoints
  }), [user, loading, login, register, logout, switchRole, currentBadge, nextBadge, progressToNextBadge, addPoints]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
