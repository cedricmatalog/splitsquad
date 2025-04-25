'use client';

import { createContext, ReactNode, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { DataProvider, useData } from './DataContext';

// Create a combined type that includes all context values
// Use Record<string, unknown> instead of empty interface
type AppContextType = Record<string, unknown>;

// We're not using this context directly, but keeping it for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthLoadingGuard>
        <DataProvider>{children}</DataProvider>
      </AuthLoadingGuard>
    </AuthProvider>
  );
}

// Component to ensure auth state is loaded before rendering children
function AuthLoadingGuard({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();
  const [localStorageChecked, setLocalStorageChecked] = useState(false);

  // Check if we have a user in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // const hasLocalUser = Boolean(localStorage.getItem('currentUser'));
        setLocalStorageChecked(true);
      } catch (e) {
        console.error('Error checking localStorage in AuthLoadingGuard:', e);
        setLocalStorageChecked(true); // Proceed anyway
      }
    }
  }, []);

  // Show loading state while checking auth
  if (isLoading && !localStorageChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <>{children}</>;
}

// Re-export the useAuth and useData hooks
export { useAuth, useData };

// Also re-export the specialized hooks
export { useUserData, useGroupData, useExpenseData, usePaymentData } from './DataContext';

// For backwards compatibility
export function useAppContext() {
  const auth = useAuth();
  const data = useData();

  // Combine all values from both contexts
  return {
    ...auth,
    ...data,
  };
}
