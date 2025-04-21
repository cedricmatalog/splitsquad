/* eslint-disable */
// @ts-nocheck

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

export default function DebugPage() {
  const router = useRouter();
  const { logout } = useAppContext();
  const [authSession, setAuthSession] = useState<any>(null);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [localStorageUsers, setLocalStorageUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [debugResults, setDebugResults] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Check current session
        const { data: sessionData } = await supabase.auth.getSession();
        setAuthSession(sessionData.session);

        // Load users from database
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(10);

        if (usersError) throw usersError;
        setDbUsers(usersData || []);

        // Load users from localStorage
        try {
          const storedUsers = localStorage.getItem('users');
          if (storedUsers) {
            setLocalStorageUsers(JSON.parse(storedUsers));
          }
        } catch (e) {
          console.error('Error reading localStorage:', e);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function checkUserByEmail() {
    if (!email) return;

    setDebugResults(null);
    setLoading(true);

    try {
      // Check if user exists in auth
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

      let authUser = null;
      if (!authError && authData) {
        authUser = authData.users.find((u: any) => u.email === email);
      }

      // Check if user exists in database
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      // Check if user exists in localStorage
      let localUser = null;
      try {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          localUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        }
      } catch (e) {
        console.error('Error checking localStorage:', e);
      }

      setDebugResults({
        authUser: authUser || (authError ? `Error: ${authError.message}` : 'Not found'),
        dbUser: dbUser || (dbError ? `Error: ${dbError.message}` : 'Not found'),
        localUser: localUser || 'Not found',
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Also sign out from application context
      await logout();

      // Reload the page to refresh the session data
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Error signing out');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Debug Authentication Status</h1>

        {authSession && (
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">Current Auth Session</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(authSession, null, 2) || 'No active session'}
            </pre>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Database Users (First 10)</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(dbUsers, null, 2) || 'No users found'}
            </pre>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">LocalStorage Users</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(localStorageUsers, null, 2) || 'No users found'}
            </pre>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Check User by Email</h2>
            <div className="flex space-x-2 mb-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email to check"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={checkUserByEmail}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Check
              </button>
            </div>

            {debugResults && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Results for {email}</h3>
                <div className="bg-gray-100 p-4 rounded">
                  <div className="mb-2">
                    <span className="font-medium">Auth User:</span>
                    <pre className="mt-1 text-sm">
                      {typeof debugResults.authUser === 'object'
                        ? JSON.stringify(debugResults.authUser, null, 2)
                        : debugResults.authUser}
                    </pre>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">DB User:</span>
                    <pre className="mt-1 text-sm">
                      {typeof debugResults.dbUser === 'object'
                        ? JSON.stringify(debugResults.dbUser, null, 2)
                        : debugResults.dbUser}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium">LocalStorage User:</span>
                    <pre className="mt-1 text-sm">
                      {typeof debugResults.localUser === 'object'
                        ? JSON.stringify(debugResults.localUser, null, 2)
                        : debugResults.localUser}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="mt-8 text-center">
            <a href="/login" className="text-blue-600 hover:underline">
              Back to Login
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
