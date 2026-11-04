import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pyhyndnildmhgezmqvfd.supabase.co'

let client: SupabaseClient | null = null

/** Browser Supabase client, created once. The key is a publishable (anon) key, safe to ship to the client. */
export function getSupabase(): SupabaseClient {
  if (client) return client
  const key = process.env.NEXT_PUBLIC_LIBRARY_SUPABASE_KEY
  if (!key) {
    throw new Error('Supabase key is missing. Make sure the "Key" environment variable is set.')
  }
  client = createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}
