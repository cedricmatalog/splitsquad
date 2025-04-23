'use client';

import { ReactNode } from 'react';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { useAppContext } from '@/context/AppContext';

interface AuthCheckProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectPath?: string;
}

/**
 * Component that handles authentication checks and loading states consistently.
 *
 * @param children - The content to render when authenticated
 * @param fallback - Optional loading UI to show while checking auth state
 * @param redirectPath - Optional path to save for redirect after login
 */
export function AuthCheck({ children, fallback, redirectPath }: AuthCheckProps) {
  const { isLoading } = useAppContext();
  const { isReady } = useAuthRedirect(redirectPath);

  // Show loading state or fallback while checking authentication
  if (isLoading || !isReady) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )
    );
  }

  // Auth check passed, render children
  return <>{children}</>;
}
