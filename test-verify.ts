import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const payload = {
    full_name: 'Blatant Test',
    email: 'blatant@example.com',
    bad_col: "this_should_fail"
  };
  const { data, error } = await supabase.from('messages').insert([payload]);
  console.log("Bad Payload Error:", JSON.stringify(error));
  
  const payload2 = {
    full_name: 'Test Name 55',
    email: 'test@example.com',
    phone: '123456',
    subject: 'Test subject',
    message: 'Test message',
    status: 'unread',
    is_read: false,
    source: 'contact_form',
    updated_at: new Date().toISOString()
  };
  const res2 = await supabase.from('messages').insert([payload2]);
  console.log("Good Payload Error with no select:", JSON.stringify(res2.error));
}
test();
