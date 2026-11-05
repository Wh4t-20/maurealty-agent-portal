// src/supabaseClient.ts
// The one Supabase client the whole app shares. The URL and anon key come from .env.local
// (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Never put the service-role key in a VITE_ variable:
// anything starting with VITE_ ends up in the browser bundle.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Make sure to set your Supabase environment variables in the .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
