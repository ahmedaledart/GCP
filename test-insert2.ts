import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const payload = {
    full_name: 'Test Name',
    email: 'test@example.com',
    phone: '123456',
    subject: 'Test subject',
    message: 'Test message',
    status: 'unread',
    is_read: false,
    source: 'contact_form',
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('messages').insert([payload]).select();
  console.log("Error:", JSON.stringify(error));
  console.log("Data:", JSON.stringify(data));
}
test();
