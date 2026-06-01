import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name_in: 'messages' })
    .select('*');
  console.log("RPC Error:", JSON.stringify(error));
  console.log("RPC Data:", JSON.stringify(data));
  const res = await supabase.from('messages').select('*').limit(1);
  console.log("Select Error:", JSON.stringify(res.error));
  console.log("Select Data:", JSON.stringify(res.data));
  
  // also try forcing an error to see if RLS is on
  const res2 = await supabase.from('messages').insert([{ bad_column: "x" }]);
  console.log("Insert Error:", JSON.stringify(res2.error));
}
test();
