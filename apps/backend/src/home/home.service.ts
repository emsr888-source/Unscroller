import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class HomeService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured for HomeService');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Get user's current streak
  async getUserStreak(userId: string) {
    const { data, error } = await this.supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching streak:', error);
      return { currentStreak: 0, longestStreak: 0, lastCheckIn: null };
    }

    return data;
  }

  // Get scroll-free time
  async getScrollFreeTime(userId: string) {
    const { data, error } = await this.supabase
      .from('scroll_free_time')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching scroll-free time:', error);
      return { totalHours: 0, lastUpdated: null };
    }

    return data;
  }

  // Get creation progress
  async getCreationProgress(userId: string) {
    const { data, error } = await this.supabase
      .from('creation_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching creation progress:', error);
      return { progressPercentage: 0, totalMinutes: 0 };
    }

    return data;
  }

  // Get week progress (last 7 days)
  async getWeekProgress(userId: string) {
    const { data, error } = await this.supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('check_in_date', { ascending: false })
      .limit(7);

    if (error) {
      console.error('Error fetching week progress:', error);
      return [];
    }

    return data || [];
  }

  // Daily check-in
  async performCheckIn(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existing } = await this.supabase
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .single();

    if (existing) {
      return { success: false, message: 'Already checked in today' };
    }

    // Create check-in
    const { error } = await this.supabase
      .from('daily_check_ins')
      .insert({
        user_id: userId,
        check_in_date: today,
        completed: true,
      });

    if (error) {
      console.error('Error creating check-in:', error);
      return { success: false, message: 'Failed to check in' };
    }

    // Update streak
    await this.updateStreak(userId);

    return { success: true, message: 'Check-in successful' };
  }

  // Update user streak
  private async updateStreak(userId: string) {
    const streak = await this.getUserStreak(userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let newStreak = 1;
    const lastCheckIn = streak.lastCheckIn?.split('T')[0];

    if (lastCheckIn === yesterday) {
      // Continuing streak
      newStreak = (streak.currentStreak || 0) + 1;
    } else if (lastCheckIn === today) {
      // Already checked in today
      newStreak = streak.currentStreak || 1;
    }

    const longestStreak = Math.max(newStreak, streak.longestStreak || 0);

    const { error } = await this.supabase
      .from('user_streaks')
      .upsert({
        user_id: userId,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_check_in: today,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating streak:', error);
    }
  }

  // Update scroll-free time
  async updateScrollFreeTime(userId: string, additionalHours: number) {
    const current = await this.getScrollFreeTime(userId);
    const newTotal = (current.totalHours || 0) + additionalHours;

    const { error } = await this.supabase
      .from('scroll_free_time')
      .upsert({
        user_id: userId,
        total_hours: newTotal,
        last_updated: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating scroll-free time:', error);
      return { success: false };
    }

    return { success: true, totalHours: newTotal };
  }

  // Update creation progress
  async updateCreationProgress(userId: string, minutes: number) {
    const current = await this.getCreationProgress(userId);
    const newTotalMinutes = (current.totalMinutes || 0) + minutes;
    
    // Calculate percentage (goal: 2 hours per day = 840 minutes per week)
    const weeklyGoal = 840;
    const progressPercentage = Math.min(100, Math.floor((newTotalMinutes / weeklyGoal) * 100));

    const { error } = await this.supabase
      .from('creation_progress')
      .upsert({
        user_id: userId,
        progress_percentage: progressPercentage,
        total_minutes: newTotalMinutes,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating creation progress:', error);
      return { success: false };
    }

    return { success: true, progressPercentage, totalMinutes: newTotalMinutes };
  }

  // Get home dashboard data (combined)
  async getHomeDashboard(userId: string) {
    const [streak, scrollFreeTime, creationProgress, weekProgress] = await Promise.all([
      this.getUserStreak(userId),
      this.getScrollFreeTime(userId),
      this.getCreationProgress(userId),
      this.getWeekProgress(userId),
    ]);

    return {
      streak: {
        current: streak.currentStreak || 0,
        longest: streak.longestStreak || 0,
        lastCheckIn: streak.lastCheckIn,
      },
      scrollFreeTime: {
        hours: scrollFreeTime.totalHours || 0,
        lastUpdated: scrollFreeTime.lastUpdated,
      },
      creationProgress: {
        percentage: creationProgress.progressPercentage || 0,
        minutes: creationProgress.totalMinutes || 0,
      },
      weekProgress: weekProgress.map(day => ({
        date: day.check_in_date,
        completed: day.completed,
      })),
    };
  }
}
