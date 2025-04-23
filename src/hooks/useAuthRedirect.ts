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

  useEffect(() => {
    // Only check authentication after the context has loaded
    if (!contextLoading) {
      if (!currentUser) {
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
  }, [currentUser, contextLoading, router, redirectPath]);

  return { isReady: isReady && !contextLoading };
}
