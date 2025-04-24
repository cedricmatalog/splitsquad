'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { User } from '@/types';
import { signIn, signOut, getCurrentUser } from '@/services/auth';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  lastError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  // Login function using Supabase
  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
      const user = await signIn(email, password);
      if (user) {
        console.log('User logged in successfully:', user.id);
        setCurrentUser(user);

        // Store in localStorage if in browser environment
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('currentUser', JSON.stringify(user));
          } catch (e) {
            console.error('Error storing user in localStorage:', e);
          }
        }
      }
      return user;
    } catch (error) {
      console.error('Login error:', error);
      setLastError('Login failed. Please check your credentials and try again.');
      return null;
    }
  }, []);

  // Logout function using Supabase
  const logout = useCallback(async () => {
    try {
      console.log('Logging out user');
      await signOut();
      setCurrentUser(null);

      // Remove from localStorage if in browser environment
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('currentUser');
        } catch (e) {
          console.error('Error removing user from localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLastError('Logout failed. Please try again.');
    }
  }, []);

  // Load current user from Supabase on mount
  useEffect(() => {
    async function loadUser() {
      try {
        setIsLoading(true);
        console.log('Loading current user from auth service');

        // Try to get from localStorage first
        let user: User | null = null;
        if (typeof window !== 'undefined') {
          try {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
              user = JSON.parse(storedUser);
              console.log('Found user in localStorage');
            }
          } catch (e) {
            console.error('Error reading from localStorage:', e);
          }
        }

        // If not in localStorage or it failed, try auth service
        if (!user) {
          user = await getCurrentUser();
        }

        if (user) {
          console.log('Found authenticated user:', user.id);
          setCurrentUser(user);
        } else {
          console.log('No authenticated user found');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setLastError('Failed to authenticate. Please try logging in again.');
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  // Compute isAuthenticated based on currentUser
  const isAuthenticated = !!currentUser;

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    lastError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
