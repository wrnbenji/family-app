import { createClient } from '@supabase/supabase-js';

const url  = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// guard maradhat változatlanul
if (!url || !anon) {
    const msg = `…`;
    if (process.env.NODE_ENV !== 'production' && typeof document !== 'undefined') {
      document.body.innerHTML = `<pre …>${msg}</pre>`;
    }
    throw new Error(msg);
  }
export const supabase = createClient(url, anon);
