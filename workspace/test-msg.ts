import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const payload = {
    full_name: 'Test',
    email: 'test@example.com',
    phone: null,
    subject: 'Test subject',
    message: 'Test message',
    status: 'unread',
    is_read: false,
    source: 'contact_form',
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('messages').insert([payload]);
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
