'use client';

import { createContext, ReactNode } from 'react';
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
      <DataProvider>{children}</DataProvider>
    </AuthProvider>
  );
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
