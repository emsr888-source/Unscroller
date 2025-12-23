import { Alert } from 'react-native';
import { CONFIG } from '@/config/environment';
import { getAccessToken, supabase } from './supabase';

const ACCOUNT_ENDPOINT = `${CONFIG.API_URL}/api/account`;

export class AccountService {
  static async deleteAccount(): Promise<boolean> {
    try {
      if (!CONFIG.API_URL) {
        throw new Error('API URL not configured');
      }

      const token = await getAccessToken();
      if (!token) {
        throw new Error('You must be signed in to delete your account.');
      }

      const response = await fetch(ACCOUNT_ENDPOINT, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to delete account.');
      }

      await supabase?.auth.signOut();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete account right now.';
      Alert.alert('Delete Account Failed', message);
      return false;
    }
  }
}
