import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';
import { mmkvStorageAdapter } from './mmkvStorageAdapter';

console.log('SUPABASE_URL:', Config.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', Config.SUPABASE_ANON_KEY);

const supabaseUrl = Config.SUPABASE_URL || '';
const supabaseAnonKey = Config.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: mmkvStorageAdapter,
  },
});
