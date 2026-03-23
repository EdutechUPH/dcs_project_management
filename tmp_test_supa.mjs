import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const res = await fetch(`${url}/rest/v1/projects?select=id,due_date,status,videos(status)&limit=1`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
});

const body = await res.json();
console.log("STATUS:", res.status);
console.log("RESPONSE:", JSON.stringify(body, null, 2));

