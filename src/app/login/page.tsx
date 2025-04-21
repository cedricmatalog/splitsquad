'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const router = useRouter();
  const { login } = useAppContext();
  const searchParams = useSearchParams();

  // Check for email confirmation success
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      // Check if this is a redirect from email confirmation
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');

      if ((accessToken || refreshToken) && type === 'signup') {
        setMessage('Email confirmed successfully! You can now log in.');
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
        setError('Please confirm your email address before logging in.');

        // Resend confirmation email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

        if (!resendError) {
          setMessage('A new confirmation email has been sent to your inbox.');
        }

        setIsLoading(false);
        return;
      }

      // Try login via our app context
      const user = await login(email, password);

      if (user) {
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
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>

          <div className="mt-4">
            <button onClick={toggleDebugInfo} className="text-xs text-gray-500 hover:text-gray-700">
              {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>

            {showDebugInfo && (
              <div className="mt-2 text-left p-3 bg-gray-50 rounded text-xs">
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
