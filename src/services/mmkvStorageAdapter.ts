import { MMKV } from 'react-native-mmkv';
import type { SupportedStorage } from '@supabase/supabase-js';

const authStorage = new MMKV({ id: 'supabase-auth' });

export const mmkvStorageAdapter: SupportedStorage = {
  getItem: (key: string): string | null => {
    return authStorage.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    authStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    authStorage.delete(key);
  },
};
