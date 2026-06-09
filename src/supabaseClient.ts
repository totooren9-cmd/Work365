import { createClient } from '@supabase/supabase-js'

const defaultUrl = 'https://lodbyjjaipyjzcazocsb.supabase.co'
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZGJ5amphaXB5anpjYXpvY3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTIyODMsImV4cCI6MjA5NTUyODI4M30.b0c53pGXWXtfkpfdnJIrUJAY9uQDINPz04Z88w6pwRA'

// Check for system injected context & Netlify environment variables
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

console.log('🔌 [Supabase Environment Verification]');
if (envUrl) {
  console.log(`✅ [NETLIFY / VITE ENV] Found VITE_SUPABASE_URL injected successfully: "${envUrl}"`);
} else {
  console.warn(`⚠️ [NETLIFY / VITE ENV] VITE_SUPABASE_URL was NOT injected in Netlify/Vite. Falling back to default URL: "${defaultUrl}"`);
}

if (envAnonKey) {
  const maskedKey = envAnonKey.slice(0, 8) + '...' + envAnonKey.slice(-8);
  console.log(`✅ [NETLIFY / VITE ENV] Found VITE_SUPABASE_ANON_KEY injected successfully: "${maskedKey}" (Length: ${envAnonKey.length} chars)`);
} else {
  console.warn(`⚠️ [NETLIFY / VITE ENV] VITE_SUPABASE_ANON_KEY was NOT injected in Netlify/Vite. Falling back to default shared preview key.`);
}

const supabaseUrl = envUrl || defaultUrl;
const supabaseAnonKey = envAnonKey || defaultAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

