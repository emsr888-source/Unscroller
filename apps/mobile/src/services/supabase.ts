import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../config/environment';

const KEY_PREFIX = 'supabase';

const namespacedKey = (key: string) => `${KEY_PREFIX}_${key}`;

const secureStorage = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(namespacedKey(key));
    } catch (error) {
      console.warn('[Supabase] Failed to read secure item:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(namespacedKey(key), value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.warn('[Supabase] Failed to persist secure item:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(namespacedKey(key));
    } catch (error) {
      console.warn('[Supabase] Failed to delete secure item:', error);
    }
  },
};

let supabaseClient: SupabaseClient | null = null;

const devBypassToken = () => {
  if (__DEV__ && CONFIG.DEV_BYPASS_USER_ID) {
    return CONFIG.DEV_BYPASS_USER_ID;
  }
  return null;
};

const hasSupabaseConfig =
  !!CONFIG.SUPABASE_URL &&
  CONFIG.SUPABASE_URL !== 'https://your-project.supabase.co' &&
  !!CONFIG.SUPABASE_ANON_KEY &&
  CONFIG.SUPABASE_ANON_KEY !== 'your-anon-key';

if (hasSupabaseConfig) {
  try {
    supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.warn('[Supabase] Failed to initialize client:', error);
  }
} else {
  console.debug('[Supabase] Skipping client initialization – no credentials configured');
}

export const supabase = supabaseClient;

export const isSupabaseConfigured = () => !!supabaseClient;

export const getAccessToken = async (): Promise<string | null> => {
  if (!supabaseClient) {
    return devBypassToken();
  }

  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
  } catch (error) {
    console.warn('[Supabase] Failed to get session:', error);
  }
  return devBypassToken();
};
