/**
 * Constellation Service - Database Version
 * Connects to Supabase for persistent constellation data
 */

import { supabase } from './supabase';

export type ConstellationType = 'deep_work' | 'better_sleep' | 'relationships' | 'self_confidence' | 'creativity' | 'physical_health';
export type StarType = 'focus_session' | 'time_saved' | 'goal_completed' | 'milestone';
export type StarSize = 'small' | 'medium' | 'large';

export interface Star {
  id: string;
  userId: string;
  constellationId: string;
  positionX: number;
  positionY: number;
  size: StarSize;
  type: StarType;
  brightness: number;
  action: string;
  timestamp: Date;
}

export interface Constellation {
  type: ConstellationType;
  name: string;
  description: string;
  icon: string;
  stars: Star[];
  progress: number;
  completed: boolean;
  completionDate?: Date;
  totalStarsNeeded: number;
}

export interface SkyState {
  totalStars: number;
  constellations: Constellation[];
  currentStreak: number;
  longestStreak: number;
  skyTheme: string;
  hasAurora: boolean;
  hasShootingStars: boolean;
  cloudCover: number;
  lastUpdated: Date;
}

const CONSTELLATION_NAMES: Record<ConstellationType, string> = {
  deep_work: 'Deep Work',
  better_sleep: 'Better Sleep',
  relationships: 'Relationships',
  self_confidence: 'Self-Confidence',
  creativity: 'Creativity',
  physical_health: 'Physical Health'
};

const CONSTELLATION_DESCRIPTIONS: Record<ConstellationType, string> = {
  deep_work: 'Focus sessions and productive hours',
  better_sleep: 'Evening routines and restful nights',
  relationships: 'Quality time with loved ones',
  self_confidence: 'Personal growth and achievements',
  creativity: 'Creative projects and self-expression',
  physical_health: 'Exercise and wellness activities'
};

const CONSTELLATION_ICONS: Record<ConstellationType, string> = {
  deep_work: '🎯',
  better_sleep: '🌙',
  relationships: '❤️',
  self_confidence: '✨',
  creativity: '🎨',
  physical_health: '💪'
};

class ConstellationServiceDB {
  /**
   * Check if Supabase is configured
   */
  private checkSupabase() {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    return supabase;
  }

  /**
   * Initialize user's constellations in database
   */
  async initializeConstellations(userId: string, userGoals: string[]): Promise<void> {
    try {
      const db = this.checkSupabase();
      // Map goals to constellation types
      const types = this.mapGoalsToConstellations(userGoals);
      
      // Check if already initialized
      const { data: existing } = await db
        .from('constellations')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (existing && existing.length > 0) {
        console.log('Constellations already initialized for user');
        return;
      }
      
      // Insert constellations
      const { error: consError } = await db
        .from('constellations')
        .insert(
          types.map(type => ({
            user_id: userId,
            type,
            stars_count: 0,
            progress: 0
          }))
        );
      
      if (consError) {
        console.error('Error creating constellations:', consError);
        throw consError;
      }
      
      // Initialize sky state
      const { error: skyError } = await db
        .from('sky_states')
        .insert({
          user_id: userId,
          cloud_cover: 0,
          has_aurora: false,
          has_shooting_stars: false,
          sky_theme: 'default'
        });
      
      if (skyError && skyError.code !== '23505') { // Ignore duplicate key error
        console.error('Error creating sky state:', skyError);
      }
      
      console.log('✅ Constellations initialized for user');
    } catch (error) {
      console.error('Error in initializeConstellations:', error);
      throw error;
    }
  }

  /**
   * Award a star and save to database
   */
  async awardStar(
    userId: string,
    action: {
      type: StarType;
      constellation: ConstellationType;
      description: string;
      size?: StarSize;
    }
  ): Promise<Star | null> {
    try {
      const db = this.checkSupabase();
      
      // Get constellation
      const { data: constellation, error: consError } = await db
        .from('constellations')
        .select('*')
        .eq('user_id', userId)
        .eq('type', action.constellation)
        .single();
      
      if (consError || !constellation) {
        console.error('Constellation not found:', consError);
        return null;
      }
      
      // Generate star position using golden angle
      const position = this.generateStarPosition(
        action.constellation,
        constellation.stars_count
      );
      
      const size = action.size || this.determineStarSize(action.type);
      const brightness = action.type === 'milestone' ? 1.0 : 0.7 + Math.random() * 0.3;
      
      // Insert star
      const { data: star, error: starError } = await db
        .from('stars')
        .insert({
          user_id: userId,
          constellation_id: constellation.id,
          position_x: position.x,
          position_y: position.y,
          size,
          type: action.type,
          brightness,
          action_description: action.description
        })
        .select()
        .single();
      
      if (starError) {
        console.error('Error creating star:', starError);
        return null;
      }
      
      // Update user profile total_stars_earned
      await db.rpc('increment_user_stars', { p_user_id: userId });
      
      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      await db
        .from('user_daily_stats')
        .upsert({
          user_id: userId,
          date: today,
          stars_earned: 1
        }, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        });
      
      console.log('✅ Star awarded:', star);
      
      return {
        id: star.id,
        userId: star.user_id,
        constellationId: star.constellation_id,
        positionX: star.position_x,
        positionY: star.position_y,
        size: star.size,
        type: star.type,
        brightness: star.brightness,
        action: star.action_description,
        timestamp: new Date(star.created_at)
      };
    } catch (error) {
      console.error('Error in awardStar:', error);
      return null;
    }
  }

  /**
   * Award star for focus session (convenience method)
   */
  async awardFocusSessionStar(userId: string, sessionMinutes: number): Promise<Star | null> {
    return this.awardStar(userId, {
      type: 'focus_session',
      constellation: 'deep_work',
      description: `${sessionMinutes}-min Focus Session`
    });
  }

  /**
   * Award star for time saved
   */
  async awardTimeSavedStar(userId: string, minutes: number): Promise<Star | null> {
    if (minutes < 30) return null;
    
    return this.awardStar(userId, {
      type: 'time_saved',
      constellation: 'deep_work',
      description: `${minutes} minutes saved`
    });
  }

  /**
   * Award star for goal completion
   */
  async awardGoalStar(userId: string, goalDescription: string, constellation: ConstellationType): Promise<Star | null> {
    return this.awardStar(userId, {
      type: 'goal_completed',
      constellation,
      description: goalDescription,
      size: 'medium'
    });
  }

  /**
   * Award star for milestone
   */
  async awardMilestoneStar(userId: string, milestoneDescription: string, constellation: ConstellationType): Promise<Star | null> {
    return this.awardStar(userId, {
      type: 'milestone',
      constellation,
      description: milestoneDescription,
      size: 'large'
    });
  }

  /**
   * Get user's sky state from database
   */
  async getSkyState(userId: string): Promise<SkyState> {
    try {
      const db = this.checkSupabase();
      
      // Load constellations with their stars
      const { data: constellations, error: consError } = await db
        .from('constellations')
        .select(`
          *,
          stars (*)
        `)
        .eq('user_id', userId);
      
      if (consError) {
        console.error('Error loading constellations:', consError);
        throw consError;
      }
      
      // Load sky state
      const { data: skyState, error: skyError } = await db
        .from('sky_states')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (skyError && skyError.code !== 'PGRST116') { // Not found is ok
        console.error('Error loading sky state:', skyError);
      }
      
      // Get user profile for streak info
      const { data: profile } = await db
        .from('user_profiles')
        .select('current_streak, longest_streak, total_stars_earned')
        .eq('id', userId)
        .single();
      
      const mappedConstellations: Constellation[] = (constellations || []).map(c => ({
        type: c.type as ConstellationType,
        name: CONSTELLATION_NAMES[c.type as ConstellationType],
        description: CONSTELLATION_DESCRIPTIONS[c.type as ConstellationType],
        icon: CONSTELLATION_ICONS[c.type as ConstellationType],
        stars: (c.stars || []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          userId: s.user_id as string,
          constellationId: s.constellation_id as string,
          positionX: s.position_x as number,
          positionY: s.position_y as number,
          size: s.size as StarSize,
          type: s.type as StarType,
          brightness: s.brightness as number,
          action: s.action_description as string,
          timestamp: new Date(s.created_at as string)
        })),
        progress: c.progress || 0,
        completed: c.completed || false,
        completionDate: c.completed_at ? new Date(c.completed_at) : undefined,
        totalStarsNeeded: 30
      }));
      
      return {
        totalStars: profile?.total_stars_earned || 0,
        constellations: mappedConstellations,
        currentStreak: profile?.current_streak || 0,
        longestStreak: profile?.longest_streak || 0,
        skyTheme: skyState?.sky_theme || 'default',
        hasAurora: skyState?.has_aurora || false,
        hasShootingStars: skyState?.has_shooting_stars || false,
        cloudCover: skyState?.cloud_cover || 0,
        lastUpdated: skyState ? new Date(skyState.updated_at) : new Date()
      };
    } catch (error) {
      console.error('Error in getSkyState:', error);
      // Return empty state on error
      return {
        totalStars: 0,
        constellations: [],
        currentStreak: 0,
        longestStreak: 0,
        skyTheme: 'default',
        hasAurora: false,
        hasShootingStars: false,
        cloudCover: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Update streak (affects cloud cover)
   */
  async updateStreak(userId: string, streakDays: number): Promise<void> {
    try {
      const db = this.checkSupabase();
      
      // Update user profile
      await db
        .from('user_profiles')
        .update({
          current_streak: streakDays
        })
        .eq('id', userId);
      
      // Update cloud cover
      let cloudCover = 0;
      if (streakDays === 0) {
        cloudCover = 0.3; // Streak broken
      } else if (streakDays >= 7) {
        cloudCover = 0; // Clear sky
      }
      
      await db
        .from('sky_states')
        .update({ 
          cloud_cover: cloudCover,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      console.log('✅ Streak updated:', streakDays);
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }

  /**
   * Get today's stats
   */
  async getTodayStats(userId: string): Promise<{
    starsEarned: number;
    constellationProgress: string;
  }> {
    try {
      const db = this.checkSupabase();
      const today = new Date().toISOString().split('T')[0];
      
      // Count stars earned today
      const { count } = await db
        .from('stars')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today);
      
      // Get most progressed incomplete constellation
      const { data: constellation } = await db
        .from('constellations')
        .select('type, progress')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('progress', { ascending: false })
        .limit(1)
        .single();
      
      let progressText = 'All constellations complete! 🌟';
      if (constellation) {
        const name = CONSTELLATION_NAMES[constellation.type as ConstellationType];
        progressText = `Your '${name}' constellation is ${Math.round(constellation.progress)}% complete`;
      }
      
      return {
        starsEarned: count || 0,
        constellationProgress: progressText
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
      return {
        starsEarned: 0,
        constellationProgress: 'Loading...'
      };
    }
  }

  // Helper methods
  private mapGoalsToConstellations(goals: string[]): ConstellationType[] {
    const mapping: Record<string, ConstellationType> = {
      'work': 'deep_work',
      'focus': 'deep_work',
      'productive': 'deep_work',
      'sleep': 'better_sleep',
      'rest': 'better_sleep',
      'tired': 'better_sleep',
      'connect': 'relationships',
      'relationships': 'relationships',
      'social': 'relationships',
      'confidence': 'self_confidence',
      'myself': 'self_confidence',
      'creative': 'creativity',
      'art': 'creativity',
      'exercise': 'physical_health',
      'health': 'physical_health',
      'fitness': 'physical_health'
    };
    
    const types = new Set<ConstellationType>();
    types.add('deep_work'); // Always include
    
    goals.forEach(goal => {
      const lowerGoal = goal.toLowerCase();
      Object.entries(mapping).forEach(([key, type]) => {
        if (lowerGoal.includes(key)) {
          types.add(type);
        }
      });
    });
    
    return Array.from(types).slice(0, 6); // Max 6 constellations
  }

  private generateStarPosition(type: ConstellationType, starIndex: number): { x: number; y: number } {
    // Golden angle spiral distribution
    const regions: Record<ConstellationType, { centerX: number; centerY: number; radius: number }> = {
      deep_work: { centerX: 0.3, centerY: 0.3, radius: 0.25 },
      better_sleep: { centerX: 0.7, centerY: 0.3, radius: 0.25 },
      relationships: { centerX: 0.5, centerY: 0.6, radius: 0.25 },
      self_confidence: { centerX: 0.2, centerY: 0.7, radius: 0.25 },
      creativity: { centerX: 0.8, centerY: 0.7, radius: 0.25 },
      physical_health: { centerX: 0.5, centerY: 0.4, radius: 0.25 },
    };
    
    const region = regions[type];
    const angle = (starIndex * 137.5) * (Math.PI / 180); // Golden angle
    const distance = Math.sqrt(starIndex / 30) * region.radius;
    
    return {
      x: Math.max(0.05, Math.min(0.95, region.centerX + distance * Math.cos(angle))),
      y: Math.max(0.05, Math.min(0.95, region.centerY + distance * Math.sin(angle)))
    };
  }

  private determineStarSize(type: StarType): StarSize {
    return type === 'milestone' ? 'large' : type === 'goal_completed' ? 'medium' : 'small';
  }
}

export const constellationServiceDB = new ConstellationServiceDB();
export default constellationServiceDB;
