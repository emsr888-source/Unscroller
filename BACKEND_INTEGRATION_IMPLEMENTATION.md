# 🔧 Backend Integration - Implementation Guide

**Complete step-by-step guide to connect all features to the database**

---

## 🚀 Quick Start (30 minutes)

### Step 1: Create Database Tables (5 minutes)

```bash
# Method 1: Via psql
psql postgresql://postgres.polfwrbkjbknivyuyrwf:98iN4V6QnxjeaHee@aws-1-us-east-1.pooler.supabase.com:6543/postgres < DATABASE_SCHEMA.sql

# Method 2: Via Supabase Dashboard
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to SQL Editor
# 4. Copy/paste contents of DATABASE_SCHEMA.sql
# 5. Click "Run"

# Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Step 2: Test Database Connection (5 minutes)

```typescript
// Test file: apps/mobile/test-supabase.ts
import { supabase } from './src/services/supabase';

async function testConnection() {
  try {
    // Test read
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count');
    
    if (error) throw error;
    console.log('✅ Supabase connected!', data);
    
    // Test auth
    const { data: session } = await supabase.auth.getSession();
    console.log('Session:', session);
    
  } catch (error) {
    console.error('❌ Supabase error:', error);
  }
}

testConnection();
```

### Step 3: Create Backend Server (15 minutes)

```typescript
// apps/backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client with service role key (full access)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count');
    
    if (error) throw error;
    res.json({ success: true, count: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
});
```

```bash
# Run server
cd apps/backend
npm install express cors @supabase/supabase-js
npm install -D @types/express @types/cors
npx ts-node src/server.ts
```

---

## 📝 Service Updates

### Update 1: Constellation Service (HIGH PRIORITY)

Create: `apps/mobile/src/services/constellationService.database.ts`

```typescript
/**
 * Constellation Service - Database Version
 * Connects to real Supabase backend
 */

import { supabase } from './supabase';
import type { Star, Constellation, SkyState, ConstellationType } from './constellationService';

class ConstellationServiceDB {
  /**
   * Initialize user's constellations in database
   */
  async initializeConstellations(userId: string, userGoals: string[]): Promise<void> {
    // Map goals to constellation types
    const types = this.mapGoalsToConstellations(userGoals);
    
    // Insert constellations
    const { error: consError } = await supabase
      .from('constellations')
      .insert(
        types.map(type => ({
          user_id: userId,
          type,
          stars_count: 0,
          progress: 0
        }))
      );
    
    if (consError) throw consError;
    
    // Initialize sky state
    const { error: skyError } = await supabase
      .from('sky_states')
      .insert({
        user_id: userId,
        cloud_cover: 0,
        has_aurora: false,
        has_shooting_stars: false,
        sky_theme: 'default'
      });
    
    if (skyError && skyError.code !== '23505') { // Ignore duplicate key error
      throw skyError;
    }
  }

  /**
   * Award a star and save to database
   */
  async awardStar(
    userId: string,
    action: {
      type: 'focus_session' | 'time_saved' | 'goal_completed' | 'milestone';
      constellation: ConstellationType;
      description: string;
      size?: 'small' | 'medium' | 'large';
    }
  ): Promise<Star> {
    // Get constellation
    const { data: constellation, error: consError } = await supabase
      .from('constellations')
      .select('*')
      .eq('user_id', userId)
      .eq('type', action.constellation)
      .single();
    
    if (consError) throw consError;
    
    // Generate star position
    const position = this.generateStarPosition(
      action.constellation,
      constellation.stars_count
    );
    
    const size = action.size || this.determineStarSize(action.type);
    const brightness = action.type === 'milestone' ? 1.0 : 0.7 + Math.random() * 0.3;
    
    // Insert star
    const { data: star, error: starError } = await supabase
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
    
    if (starError) throw starError;
    
    // Update user profile total_stars_earned
    await supabase.rpc('increment_user_stars', { user_id: userId });
    
    // Constellation progress updates automatically via database trigger
    
    return star as Star;
  }

  /**
   * Award star for focus session (convenience method)
   */
  async awardFocusSessionStar(userId: string, sessionMinutes: number): Promise<Star> {
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
   * Get user's sky state from database
   */
  async getSkyState(userId: string): Promise<SkyState> {
    // Load constellations with their stars
    const { data: constellations, error: consError } = await supabase
      .from('constellations')
      .select(`
        *,
        stars (*)
      `)
      .eq('user_id', userId);
    
    if (consError) throw consError;
    
    // Load sky state
    const { data: skyState, error: skyError } = await supabase
      .from('sky_states')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (skyError) throw skyError;
    
    // Get user profile for streak info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_streak, longest_streak, total_stars_earned')
      .eq('id', userId)
      .single();
    
    return {
      totalStars: profile?.total_stars_earned || 0,
      constellations: constellations.map(c => ({
        type: c.type,
        name: CONSTELLATION_NAMES[c.type],
        description: CONSTELLATION_DESCRIPTIONS[c.type],
        icon: CONSTELLATION_ICONS[c.type],
        stars: c.stars,
        progress: c.progress,
        completed: c.completed,
        completionDate: c.completed_at ? new Date(c.completed_at) : undefined,
        totalStarsNeeded: 30
      })),
      currentStreak: profile?.current_streak || 0,
      longestStreak: profile?.longest_streak || 0,
      skyTheme: skyState.sky_theme,
      hasAurora: skyState.has_aurora,
      hasShootingStars: skyState.has_shooting_stars,
      cloudCover: skyState.cloud_cover,
      lastUpdated: new Date(skyState.updated_at)
    };
  }

  /**
   * Update streak (affects cloud cover)
   */
  async updateStreak(userId: string, streakDays: number): Promise<void> {
    // Update user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .update({
        current_streak: streakDays,
        longest_streak: supabase.raw('GREATEST(longest_streak, ?)', [streakDays])
      })
      .eq('id', userId)
      .select('current_streak')
      .single();
    
    // Update cloud cover
    let cloudCover = 0;
    if (streakDays === 0) {
      cloudCover = 0.3; // Streak broken
    } else if (streakDays >= 7) {
      cloudCover = 0; // Clear sky
    }
    
    await supabase
      .from('sky_states')
      .update({ cloud_cover: cloudCover })
      .eq('user_id', userId);
  }

  /**
   * Get today's stats
   */
  async getTodayStats(userId: string): Promise<{
    starsEarned: number;
    constellationProgress: string;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Count stars earned today
    const { count } = await supabase
      .from('stars')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today);
    
    // Get most progressed incomplete constellation
    const { data: constellation } = await supabase
      .from('constellations')
      .select('type, progress')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('progress', { ascending: false })
      .limit(1)
      .single();
    
    let progressText = 'All constellations complete! 🌟';
    if (constellation) {
      const name = CONSTELLATION_NAMES[constellation.type];
      progressText = `Your '${name}' constellation is ${Math.round(constellation.progress)}% complete`;
    }
    
    return {
      starsEarned: count || 0,
      constellationProgress: progressText
    };
  }

  // ... helper methods (generateStarPosition, etc.)
  private mapGoalsToConstellations(goals: string[]): ConstellationType[] {
    const mapping: Record<string, ConstellationType> = {
      'work': 'deep_work',
      'focus': 'deep_work',
      'sleep': 'better_sleep',
      'rest': 'better_sleep',
      'connect': 'relationships',
      'relationships': 'relationships',
      'confidence': 'self_confidence',
      'creative': 'creativity',
      'exercise': 'physical_health',
      'health': 'physical_health'
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
    
    return Array.from(types);
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
    const angle = (starIndex * 137.5) * (Math.PI / 180);
    const distance = Math.sqrt(starIndex / 30) * region.radius;
    
    return {
      x: Math.max(0.05, Math.min(0.95, region.centerX + distance * Math.cos(angle))),
      y: Math.max(0.05, Math.min(0.95, region.centerY + distance * Math.sin(angle)))
    };
  }

  private determineStarSize(type: string): 'small' | 'medium' | 'large' {
    return type === 'milestone' ? 'large' : type === 'goal_completed' ? 'medium' : 'small';
  }
}

// Constants
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

export const constellationServiceDB = new ConstellationServiceDB();
```

**Usage in App**:
```typescript
// Replace import
import { constellationServiceDB as constellationService } from '@/services/constellationService.database';

// Use same API
const star = await constellationService.awardFocusSessionStar(userId, 25);
const skyState = await constellationService.getSkyState(userId);
```

---

### Update 2: Challenges Service

Create: `apps/mobile/src/services/challengesService.database.ts`

```typescript
import { supabase } from './supabase';

class ChallengesServiceDB {
  /**
   * Get user's active challenges from database
   */
  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenge:challenges (
          id,
          title,
          description,
          type,
          metric,
          target,
          start_date,
          end_date,
          reward_type,
          reward_value,
          total_participants
        )
      `)
      .eq('user_id', userId)
      .eq('completed', false);
    
    if (error) throw error;
    
    return data.map(uc => ({
      ...uc.challenge,
      progress: (uc.current_progress / uc.challenge.target) * 100,
      completed: uc.completed,
      participants: uc.challenge.total_participants
    }));
  }

  /**
   * Get available challenges to join
   */
  async getAvailableChallenges(userId: string): Promise<Challenge[]> {
    // Get challenges user hasn't joined yet
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .not('id', 'in', supabase
        .from('user_challenges')
        .select('challenge_id')
        .eq('user_id', userId)
      );
    
    if (error) throw error;
    return data;
  }

  /**
   * Join a challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        current_progress: 0
      });
    
    if (error) {
      console.error('Failed to join challenge:', error);
      return false;
    }
    
    // Increment participant count
    await supabase.rpc('increment_challenge_participants', {
      challenge_id: challengeId
    });
    
    return true;
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(
    userId: string,
    challengeId: string,
    progress: number
  ): Promise<void> {
    const { data: challenge } = await supabase
      .from('challenges')
      .select('target')
      .eq('id', challengeId)
      .single();
    
    const completed = progress >= challenge.target;
    
    await supabase
      .from('user_challenges')
      .update({
        current_progress: progress,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId);
  }

  /**
   * Get leaderboard from database
   */
  async getLeaderboard(
    metric: 'time_saved' | 'focus_hours' | 'streak_days',
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly'
  ): Promise<Leaderboard> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        user:user_profiles (username, avatar)
      `)
      .eq('metric', metric)
      .eq('period', period)
      .order('rank', { ascending: true })
      .limit(100);
    
    if (error) throw error;
    
    return {
      id: `${metric}-${period}`,
      period,
      metric,
      entries: data.map(entry => ({
        userId: entry.user_id,
        username: entry.user.username,
        avatar: entry.user.avatar,
        score: entry.score,
        rank: entry.rank,
        isCurrentUser: false, // Will be set by UI
        isFriend: false // Will be set by UI based on buddy relationship
      }))
    };
  }

  /**
   * Award XP and update database
   */
  async awardXP(userId: string, action: {
    type: 'focus_session' | 'daily_checkin' | 'challenge_complete' | 'streak_milestone' | 'community_post';
    value?: number;
  }): Promise<number> {
    const xp = this.calculateXP(action);
    
    // Update user profile
    await supabase
      .from('user_profiles')
      .update({
        total_xp: supabase.raw('total_xp + ?', [xp])
      })
      .eq('id', userId);
    
    // Log to daily stats
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('user_daily_stats')
      .upsert({
        user_id: userId,
        date: today,
        xp_earned: supabase.raw('COALESCE(xp_earned, 0) + ?', [xp])
      });
    
    return xp;
  }

  /**
   * Get user level from database
   */
  async getUserLevel(userId: string): Promise<UserLevel> {
    const { data } = await supabase
      .from('user_profiles')
      .select('total_xp, current_level')
      .eq('id', userId)
      .single();
    
    return this.calculateLevelFromXP(data.total_xp);
  }

  private calculateXP(action: any): number {
    const xpValues = {
      focus_session: 10,
      daily_checkin: 5,
      challenge_complete: 100,
      streak_milestone: 50,
      community_post: 15
    };
    return action.value || xpValues[action.type] || 0;
  }

  private calculateLevelFromXP(totalXP: number): UserLevel {
    // Same logic as before
    const LEVEL_TITLES = [
      { level: 1, title: 'Scroll Breaker', xpRequired: 0 },
      // ... rest
    ];
    
    let currentLevel = LEVEL_TITLES[0];
    let nextLevel = LEVEL_TITLES[1];
    
    for (let i = 0; i < LEVEL_TITLES.length; i++) {
      if (totalXP >= LEVEL_TITLES[i].xpRequired) {
        currentLevel = LEVEL_TITLES[i];
        nextLevel = LEVEL_TITLES[i + 1] || LEVEL_TITLES[i];
      } else {
        break;
      }
    }
    
    return {
      level: currentLevel.level,
      title: currentLevel.title,
      xp: totalXP,
      xpToNextLevel: Math.max(0, nextLevel.xpRequired - totalXP),
      unlockedFeatures: []
    };
  }
}

export const challengesServiceDB = new ChallengesServiceDB();
```

---

### Update 3: Add Database Functions

```sql
-- Helper function to increment user stars
CREATE OR REPLACE FUNCTION increment_user_stars(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET total_stars_earned = total_stars_earned + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment challenge participants
CREATE OR REPLACE FUNCTION increment_challenge_participants(challenge_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE challenges
  SET total_participants = total_participants + 1
  WHERE id = challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh leaderboards (call via cron every hour)
CREATE OR REPLACE FUNCTION refresh_leaderboards()
RETURNS VOID AS $$
BEGIN
  -- Delete old entries
  DELETE FROM leaderboard_entries;
  
  -- Weekly time saved
  INSERT INTO leaderboard_entries (user_id, metric, period, score, rank)
  SELECT 
    user_id,
    'time_saved'::TEXT,
    'weekly'::TEXT,
    SUM(time_saved_minutes) as score,
    ROW_NUMBER() OVER (ORDER BY SUM(time_saved_minutes) DESC) as rank
  FROM user_daily_stats
  WHERE date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY user_id
  ORDER BY score DESC
  LIMIT 100;
  
  -- Add more leaderboard calculations...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔄 Migration Strategy

### Phase 1: Parallel Running (Week 1)
- Keep mock services
- Add database services alongside
- Feature flag to switch between them
- Test with small user group

### Phase 2: Gradual Migration (Week 2)
- Switch 25% of users to database
- Monitor errors and performance
- Fix issues as they arise
- Switch 50% of users

### Phase 3: Full Migration (Week 3)
- Switch 100% of users to database
- Remove mock services
- Clean up code
- Monitor stability

---

## ✅ Testing Checklist

Before enabling database services:

- [ ] All tables created successfully
- [ ] RLS policies tested
- [ ] CRUD operations work
- [ ] Triggers fire correctly
- [ ] Functions execute
- [ ] Indexes improve query speed
- [ ] No SQL injection vulnerabilities
- [ ] Error handling works
- [ ] Offline mode handles gracefully
- [ ] Data syncs correctly

---

## 🚨 Rollback Plan

If integration fails:

```typescript
// Feature flag in config
export const USE_DATABASE = process.env.USE_DATABASE === 'true';

// In service files
import { constellationService } from './constellationService'; // Mock
import { constellationServiceDB } from './constellationService.database'; // Real

export const activeConstellationService = USE_DATABASE 
  ? constellationServiceDB 
  : constellationService;
```

Set `USE_DATABASE=false` to revert to mock data.

---

## 📊 Monitoring

After integration, monitor:

- Database query performance
- API response times
- Error rates
- User engagement metrics
- Data consistency
- Sync failures

---

**Status**: Ready to implement  
**Timeline**: 2-3 weeks  
**Priority**: CRITICAL before production launch
