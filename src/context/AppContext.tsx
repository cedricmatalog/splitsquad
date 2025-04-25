'use client';

import { createContext, ReactNode, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { DataProvider, useData } from './DataContext';

/**
 * Combined type for the AppContext
 * This is a placeholder for any app-level context values that might be needed in the future
 */
type AppContextType = Record<string, unknown>;

// We're not using this context directly, but keeping it for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Main application provider component
 * Composes AuthProvider and DataProvider to provide all application state
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to the app context
 * @returns {JSX.Element} Provider component
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthLoadingGuard>
        <DataProvider>{children}</DataProvider>
      </AuthLoadingGuard>
    </AuthProvider>
  );
}

/**
 * Component that ensures authentication state is loaded before rendering children
 * Prevents UI flicker during authentication state loading
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render after auth loading is complete
 * @returns {JSX.Element} Component with loading state handling
 */
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

/**
 * Deprecated hook that combines auth and data contexts
 * Kept for backwards compatibility with older components
 *
 * @returns {Object} Combined auth and data context values
 * @deprecated Use specific hooks (useAuth, useData) instead
 */
export function useAppContext() {
  const auth = useAuth();
  const data = useData();

  // Combine all values from both contexts
  return {
    ...auth,
    ...data,
  };
}
