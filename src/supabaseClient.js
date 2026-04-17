import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihytozgpezoqromatba.supabase.co';
const supabaseAnonKey = 'eyJhbG...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
