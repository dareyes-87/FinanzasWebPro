import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqwnnlpnqvmkuzkzpfmr.supabase.co'; // <-- REEMPLAZA ESTO
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxd25ubHBucXZta3V6a3pwZm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NjMyOTAsImV4cCI6MjA3NjEzOTI5MH0.F8Bsl_ytgrAIoSZUp8Tk2oQhQ4shnT1eZqv23N8-o4E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);