import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

/**
 * Hook to handle authentication redirects with proper loading states
 * Prevents redirects to login before the authentication state is fully loaded
 *
 * @param redirectPath Optional path to save for redirection after login
 * @returns { isReady } - Whether the authentication check is complete and UI can render
 */
export default function useAuthRedirect(redirectPath?: string) {
  const { currentUser, isLoading: contextLoading } = useAppContext();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [hasLocalUser, setHasLocalUser] = useState(false);

  // Check for user in localStorage immediately to prevent flicker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setHasLocalUser(true);
          setIsReady(true); // Consider UI ready if we have a localStorage user
        }
      } catch (e) {
        console.error('Error checking localStorage in redirect hook:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Only check authentication after the context has loaded
    if (!contextLoading) {
      if (!currentUser && !hasLocalUser) {
        // Save current URL for redirection after login if not specified
        const pathToSave =
          redirectPath || (typeof window !== 'undefined' ? window.location.pathname : undefined);

        if (pathToSave && typeof window !== 'undefined') {
          localStorage.setItem('redirectAfterLogin', pathToSave);
        }

        router.push('/login');
      } else {
        // Auth check complete and user is authenticated
        setIsReady(true);
      }
    }
  }, [currentUser, contextLoading, router, redirectPath, hasLocalUser]);

  return { isReady: isReady || hasLocalUser };
}
