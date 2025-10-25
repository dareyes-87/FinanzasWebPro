// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Las variables de entorno de Supabase (REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY) no están definidas.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);