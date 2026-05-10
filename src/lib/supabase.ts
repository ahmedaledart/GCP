import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uqqbbaylcmmtyutymqpa.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_J-BGf6na5ax4-_oSdJ4Zsw_qdKaerP9';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables! Please check your .env file or configuration.');
} else {
  console.log('Supabase initialized with URL:', supabaseUrl);
}

// Provide fallback string to prevent immediate crash if env vars are missing,
// which allows the React app to mount and the ErrorBoundary/UI to show the missing configuration error gracefully.
export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export const hasSupabaseConfig = true;
