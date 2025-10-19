import { ipcMain } from 'electron';
import { createClient } from '@supabase/supabase-js';
import Store from 'electron-store';
import * as keytar from 'keytar';

const store = new Store();
const SERVICE_NAME = 'creator-mode';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export class AuthManager {
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  constructor() {
    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    ipcMain.handle('auth:signIn', async (_, email: string) => {
      try {
        const { error } = await this.supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('auth:getSession', async () => {
      try {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.access_token) {
          await keytar.setPassword(SERVICE_NAME, 'access_token', session.access_token);
        }
        return session;
      } catch (error) {
        return null;
      }
    });

    ipcMain.handle('auth:signOut', async () => {
      try {
        await this.supabase.auth.signOut();
        await keytar.deletePassword(SERVICE_NAME, 'access_token');
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await keytar.getPassword(SERVICE_NAME, 'access_token');
    } catch {
      return null;
    }
  }
}
