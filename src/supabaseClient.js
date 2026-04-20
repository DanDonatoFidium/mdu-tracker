import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihytozgpezoqromatba.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHl0b3pncGV6b3Fyb21hdGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzkzMzMsImV4cCI6MjA5MjAxNTMzM30.Kejkb6SRg7Czrd55zoOxQdCzsr0Pw6huBug5uGzg2OA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
