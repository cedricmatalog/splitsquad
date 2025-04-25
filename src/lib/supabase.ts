import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// These values should be in .env.local
// Provide reasonable defaults to avoid complete breakage when not set
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gcrxzivriujieyppigyp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-development';

// Create the Supabase client with proper headers and configuration
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

// Type definitions for Supabase query objects
type QueryResult<T> = { data: T | null; error: unknown };

// This version of safeQuery handles different types of Supabase queries
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

// Utility to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-project.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key-for-development'
  );
};
