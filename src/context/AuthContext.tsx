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

              // Set the user immediately from localStorage to avoid flicker
              setCurrentUser(user);
            }
          } catch (e) {
            console.error('Error reading from localStorage:', e);
          }
        }

        // Always try auth service for verification
        const verifiedUser = await getCurrentUser();

        if (verifiedUser) {
          // Update with the verified user data
          console.log('Found authenticated user from server:', verifiedUser.id);
          setCurrentUser(verifiedUser);

          // Update localStorage with the latest user data
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('currentUser', JSON.stringify(verifiedUser));
            } catch (e) {
              console.error('Error updating localStorage with verified user:', e);
            }
          }
        } else if (user) {
          // We have a localStorage user but couldn't verify with the server
          // For better UX, we'll keep the user logged in using localStorage data
          console.log('Using unverified localStorage user - server verification failed');
          // Keep the localStorage user that was already set
        } else {
          // No user in localStorage and none from server
          console.log('No authenticated user found');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setLastError('Failed to authenticate. Please try logging in again.');

        // On error, don't clear the user if we got one from localStorage
        // This improves offline and error resilience
        if (!currentUser) {
          setCurrentUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
