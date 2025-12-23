import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AchievementsService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Get all available achievements
   */
  async getAllAchievements() {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Get user's unlocked achievements
   */
  async getUserAchievements(userId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get all challenges
   */
  async getAllChallenges() {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('challenges')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get user's challenge progress
   */
  async getUserChallenges(userId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('user_challenges')
      .select(`
        *,
        challenges (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false});

    if (error) throw error;
    return data;
  }

  /**
   * Join a challenge
   */
  async joinChallenge(userId: string, challengeId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('user_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        progress: 0,
        completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(userId: string, challengeId: string, progress: number) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data: challenge } = await this.supabase
      .from('challenges')
      .select('requirement_value')
      .eq('id', challengeId)
      .single();

    const completed = progress >= (challenge?.requirement_value || 0);

    const { data, error } = await this.supabase
      .from('user_challenges')
      .update({
        progress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user goals
   */
  async getUserGoals(userId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create a goal
   */
  async createGoal(userId: string, goalData: {
    title: string;
    description?: string;
    goal_type: string;
    target_value: number;
    icon?: string;
  }) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        ...goalData,
        current_value: 0,
        active: true,
        completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(userId: string, goalId: string, currentValue: number) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data: goal } = await this.supabase
      .from('user_goals')
      .select('target_value')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    const completed = currentValue >= (goal?.target_value || 0);

    const { data, error } = await this.supabase
      .from('user_goals')
      .update({
        current_value: currentValue,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a goal
   */
  async deleteGoal(userId: string, goalId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { error } = await this.supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Get user XP and level
   */
  async getUserXP(userId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get leaderboard (top users by XP)
   */
  async getLeaderboard(limit = 100) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('user_xp')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
