'use client';

import { createBrowserClient } from '@supabase/ssr';

// Client Supabase navigateur (clé anon) — pour signUp / signIn / signOut côté client.
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
