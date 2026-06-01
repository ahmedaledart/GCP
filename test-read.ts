import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('messages').select('*');
  console.log("Error:", JSON.stringify(error));
  console.log("Data:", JSON.stringify(data, null, 2));
}
test();
