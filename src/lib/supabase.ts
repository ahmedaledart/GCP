import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://uqqbbaylcmmtyutymqpa.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_J-BGf6na5ax4-_oSdJ4Zsw_qdKaerP9';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
} else {
  console.log('Supabase initialized with URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
