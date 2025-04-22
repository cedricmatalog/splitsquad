'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/services/auth';
import { useAppContext } from '@/context/AppContext';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectInfo, setRedirectInfo] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAppContext();
  const searchParams = useSearchParams();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate form inputs
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    try {
      // Register user
      const user = await signUp(email, password, name);

      if (!user) {
        setError('Registration failed. Please try again.');
        return;
      }

      // Check if there's a redirect URL to set a more specific success message
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      if (redirectUrl && redirectUrl.includes('/groups/')) {
        setSuccess('Account created successfully! Redirecting you to join the group...');
      } else {
        setSuccess('Account created successfully! Logging you in...');
      }

      // Immediately log the user in instead of redirecting to login page
      const loggedInUser = await login(email, password);

      if (loggedInUser) {
        // Check if there's a redirect URL in localStorage (for group invites)
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          // Clear the redirect URL from localStorage
          localStorage.removeItem('redirectAfterLogin');
          // Redirect to the saved URL (group page)
          router.push(redirectUrl);
        } else {
          // Default redirect to dashboard
          router.push('/dashboard');
        }
      } else {
        setError('Account created but automatic login failed. Please go to the login page.');
      }
    } catch (err: unknown) {
      console.error('Error during signup:', err);
      if (
        typeof err === 'object' &&
        err &&
        'message' in err &&
        typeof err.message === 'string' &&
        err.message?.includes('Email already registered')
      ) {
        setError('Email already in use. Please try a different email or log in.');
      } else {
        setError(
          typeof err === 'object' && err && 'message' in err && typeof err.message === 'string'
            ? err.message
            : 'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if there's a redirect pending when the component loads
  useEffect(() => {
    // Check if we have a redirect parameter from login page
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      // Store it in localStorage to use after signup
      localStorage.setItem('redirectAfterLogin', redirectParam);
      setRedirectInfo(`After signup, you'll be redirected to join the group.`);
    } else if (typeof window !== 'undefined') {
      // Check if there's already a redirect URL in localStorage
      const storedRedirect = localStorage.getItem('redirectAfterLogin');
      if (storedRedirect && storedRedirect.includes('/groups/')) {
        setRedirectInfo(`After signup, you'll be redirected to join the group.`);
      }
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="mt-2 text-gray-600">Join SplitSquad to start splitting expenses</p>
        </div>

        {redirectInfo && (
          <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">{redirectInfo}</div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 text-red-500 rounded-md text-sm">{error}</div>}
          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">{success}</div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="John Doe"
            />
          </div>

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
              placeholder="******"
            />
            <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="******"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
