import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Configuration values for the Supabase client
 * These should be set in environment variables (.env.local)
 * Fallback values are provided for development to avoid complete breakage
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gcrxzivriujieyppigyp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjcnh6aXZyaXVqaWV5cHBpZ3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDczNjgsImV4cCI6MjA2MDc4MzM2OH0.KH7xUq9lp6DxMq1Knv9QwSeBseweStN_SxSNze0NpaI';

/**
 * Initialized Supabase client with typed database schema
 * Configured with authentication, headers, and schema settings
 *
 * @example
 * // Fetch data from a table
 * const { data, error } = await supabase.from('users').select('*');
 *
 * // Authenticate a user
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Client-Info': 'supabase-js/2.x',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
});

/**
 * Type definition for the result of Supabase queries
 * Standardizes the shape of data returned from query operations
 *
 * @template T - The type of data expected from the query
 */
type QueryResult<T> = { data: T | null; error: unknown };

/**
 * Safely executes a Supabase query with error handling
 * Works with different types of Supabase query objects
 *
 * @template T - The type of data expected from the query
 * @param {unknown} query - The Supabase query to execute
 * @returns {Promise<QueryResult<T>>} Object containing data or error
 *
 * @example
 * // Use with a regular Supabase query
 * const result = await safeQuery(supabase.from('users').select('*'));
 *
 * // Handle the result
 * if (result.error) {
 *   console.error('Error:', result.error);
 * } else {
 *   console.log('Data:', result.data);
 * }
 */
export async function safeQuery<T = unknown>(query: unknown): Promise<QueryResult<T>> {
  try {
    // For PostgrestBuilder objects with execute method
    if (
      query &&
      typeof query === 'object' &&
      'execute' in query &&
      typeof (query as { execute: unknown }).execute === 'function'
    ) {
      return await (query as { execute: () => Promise<QueryResult<T>> }).execute();
    }

    // For Promise objects
    if (query && typeof (query as Promise<QueryResult<T>>).then === 'function') {
      return (await query) as Promise<QueryResult<T>>;
    }

    // Fallback for unknown query types
    console.error('Unsupported query type:', query);
    return { data: null, error: new Error('Unsupported query type') };
  } catch (e) {
    console.error('Error executing query:', e);
    return { data: null, error: e };
  }
}

/**
 * Checks if Supabase is properly configured with valid credentials
 * Used to determine if the application should use real backend or fall back to demo mode
 *
 * @returns {boolean} True if Supabase is properly configured with valid credentials
 */
export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-project.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key-for-development'
  );
};
