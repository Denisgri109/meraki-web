'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

// Singleton — one client instance for the entire app
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined');
  }

  client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  );

  return client;
}
