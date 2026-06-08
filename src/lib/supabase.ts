import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://uqqbbaylcmmtyutymqpa.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'PUT_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'gcp-auth-clean-v3'
  }
});

console.log('Supabase URL:', supabaseUrl);

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
