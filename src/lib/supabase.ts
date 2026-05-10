import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables! Please check your .env file or configuration.');
} else {
  console.log('Supabase initialized with URL:', supabaseUrl);
}

// Provide fallback string to prevent immediate crash if env vars are missing,
// which allows the React app to mount and the ErrorBoundary/UI to show the missing configuration error gracefully.
export const supabase = createClient(
  supabaseUrl || 'https://MISSING-CONFIG.supabase.co', 
  supabaseKey || 'MISSING-KEY'
);

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
