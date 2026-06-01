import * as dotenv from 'dotenv';
import https from 'https';
dotenv.config();

const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`;

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const swagger = JSON.parse(body);
      const messagesSchema = swagger.definitions.messages.properties;
      console.log('Messages Schema:', Object.keys(messagesSchema));
    } catch (e) {
      console.error(e);
      console.log(body);
    }
  });
});
