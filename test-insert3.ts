import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function test() {
  const payload = {
    id: uuidv4(),
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
  const { data, error } = await supabase.from('messages').insert([payload]);
  console.log("Error:", JSON.stringify(error));
}
test();
