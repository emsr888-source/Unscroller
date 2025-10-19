import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';
import { CONFIG } from '../config/environment';

const storage = new MMKV({ id: 'supabase-storage' });

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => {
        return storage.getString(key) || null;
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const getAccessToken = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
};
