import { supabase } from './supabase';

export interface UserAchievement {
  achievement_id: string;
  unlocked_at?: string;
}

class AchievementsServiceDB {
  private checkSupabase() {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    return supabase;
  }

  async getUnlockedAchievements(userId: string): Promise<string[]> {
    try {
      const db = this.checkSupabase();
      const { data, error } = await db
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return data?.map(record => record.achievement_id) ?? [];
    } catch (error) {
      console.warn('[AchievementsService] Failed to fetch achievements', error);
      return [];
    }
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const db = this.checkSupabase();
      const { error } = await db
        .from('user_achievements')
        .upsert(
          {
            user_id: userId,
            achievement_id: achievementId,
          },
          { onConflict: 'user_id,achievement_id' }
        );

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.warn('[AchievementsService] Failed to unlock achievement', error);
      return false;
    }
  }
}

export const achievementsServiceDB = new AchievementsServiceDB();
export default achievementsServiceDB;
