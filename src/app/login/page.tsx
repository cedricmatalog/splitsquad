'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

// Component that uses searchParams - wrap in Suspense
function LoginWithSearchParams() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [redirectInfo, setRedirectInfo] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAppContext();
  const searchParams = useSearchParams();

  // Check for email confirmation success or redirect parameter
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      // Check if this is a redirect from email confirmation
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');

      if ((accessToken || refreshToken) && type === 'signup') {
        setMessage('Email confirmed successfully! You can now log in.');
      }

      // Check if we have a redirect parameter from signup page
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        // Store it in localStorage to use after login
        localStorage.setItem('redirectAfterLogin', redirectParam);
        // Display redirect info to the user
        setRedirectInfo(`After login, you'll be redirected to continue joining the group.`);
      } else if (typeof window !== 'undefined') {
        // Check if there's a redirect URL in localStorage
        const storedRedirect = localStorage.getItem('redirectAfterLogin');
        if (storedRedirect && storedRedirect.includes('/groups/')) {
          setRedirectInfo(`After login, you'll be redirected to continue joining the group.`);
        }
      }
    };

    checkEmailConfirmation();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      // First try to sign in directly with Supabase to check if email is confirmed
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Handle email confirmation error specifically
      if (authError && authError.message.includes('Email not confirmed')) {
        // Email confirmation is now disabled in database, proceed with login
        console.log('Email confirmation is disabled, attempting login via app context');
      } else if (authError) {
        // Handle other auth errors
        console.error('Authentication error:', authError);
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Try login via our app context
      const user = await login(email, password);

      if (user) {
        // Check if there's a redirect URL in localStorage
        if (typeof window !== 'undefined') {
          const redirectUrl = localStorage.getItem('redirectAfterLogin');
          if (redirectUrl) {
            // Clear the redirect URL from localStorage
            localStorage.removeItem('redirectAfterLogin');
            // Redirect to the saved URL
            router.push(redirectUrl);
            return;
          }
        }
        // Default redirect to dashboard
        router.push('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  // Helper function to get the signup URL
  const getSignupUrl = () => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        return `/signup?redirect=${encodeURIComponent(redirectUrl)}`;
      }
    }
    return '/signup';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Login to SplitSquad</h1>
          <p className="mt-2 text-gray-600">Track and split expenses with friends</p>
        </div>

        {message && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">{message}</div>
        )}

        {redirectInfo && (
          <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">{redirectInfo}</div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 text-red-500 rounded-md text-sm">{error}</div>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href={getSignupUrl()} className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>

          <div className="mt-4">
            <button onClick={toggleDebugInfo} className="text-xs text-gray-500 hover:text-gray-700">
              {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>

            {showDebugInfo && (
              <div className="mt-2 text-left p-3  rounded text-xs">
                <p>For testing with seeded users:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Email: any email from users.json</li>
                  <li>Password: password123</li>
                </ul>
                <div className="mt-2">
                  <Link href="/debug" className="text-blue-600 hover:underline">
                    Go to Debug Page
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl">Loading...</h2>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingLoginPage />}>
      <LoginWithSearchParams />
    </Suspense>
  );
}
