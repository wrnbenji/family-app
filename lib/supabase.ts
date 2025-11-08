import { createClient } from '@supabase/supabase-js';

const url  = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// guard maradhat változatlanul
if (!url || !anon) {
  const msg =
    `Supabase env hiba: URL present=${!!url}, ANON present=${!!anon}. ` +
    `Ellenőrizd Vercelben az EXPO_PUBLIC_SUPABASE_URL és EXPO_PUBLIC_SUPABASE_ANON_KEY változókat, majd Redeploy.`;
  console.error(msg, { url, anonLen: anon?.length });
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `<pre style="padding:16px;background:#111;color:#fff">${msg}</pre>`;
  }
  throw new Error(msg);
}

export const supabase = createClient(url, anon);
