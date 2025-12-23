/**
 * Challenges Service - Database Version
 * Connects to Supabase for persistent challenge data
 */

import { supabase } from './supabase';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'personal' | 'community' | 'event';
  goal: {
    metric: 'feed_free_days' | 'focus_hours' | 'time_saved' | 'streak_days';
    target: number;
  };
  duration: {
    start: Date;
    end: Date;
  };
  participants: number;
  reward: {
    type: 'xp' | 'badge' | 'level';
    value: string;
  };
  progress?: number;
  completed?: boolean;
  coverEmoji?: string;
  privacy?: 'public' | 'unlisted' | 'invite_only';
  dailyCommitments?: string[];
  weeklyCommitments?: string[];
  successMetrics?: string[];
  creatorId?: string;
  createdAt?: string;
}

export interface ChallengeCreationPayload {
  title: string;
  description: string;
  startDate: string;
  durationDays: number;
  goalMetric: Challenge['goal']['metric'];
  goalTarget: number;
  dailyCommitments: string[];
  weeklyCommitments: string[];
  successMetrics: string[];
  coverEmoji: string;
  privacy: 'public' | 'unlisted' | 'invite_only';
}

export interface ChallengeFeedPost {
  id: string;
  challengeId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  reactions: Record<string, number>;
  replyTo?: string | null;
}

export interface ChallengeSharePayload {
  shareUrl: string;
  caption: string;
  imageUrl?: string;
}

export interface ChallengeProgress {
  challenge: Challenge;
  currentProgress: number;
  percentComplete: number;
  completed: boolean;
  joinedAt?: Date | null;
  completedAt?: Date | null;
}

type ChallengeRowRecord = {
  id: string;
  title: string;
  description: string;
  type: Challenge['type'];
  metric: Challenge['goal']['metric'];
  target: number;
  start_date: string;
  end_date: string;
  reward_type: Challenge['reward']['type'];
  reward_value: string;
  total_participants: number;
};

type ChallengeRowExtended = ChallengeRowRecord & {
  cover_emoji?: string | null;
  privacy?: Challenge['privacy'] | null;
  daily_commitments?: string[] | null;
  weekly_commitments?: string[] | null;
  success_metrics?: string[] | null;
  creator_id?: string | null;
  created_at?: string | null;
  share_slug?: string | null;
  share_asset_url?: string | null;
  progress?: number | null;
  completed?: boolean | null;
};

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  avatar?: string;
  isCurrentUser?: boolean;
  isFriend?: boolean;
}

export interface Leaderboard {
  id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  metric: 'time_saved' | 'focus_hours' | 'streak_days';
  entries: LeaderboardEntry[];
}

export interface UserLevel {
  level: number;
  title: string;
  xp: number;
  xpToNextLevel: number;
  unlockedFeatures: string[];
}

const LEVEL_TITLES = [
  { level: 1, title: 'Scroll Breaker', xpRequired: 0 },
  { level: 2, title: 'Focus Apprentice', xpRequired: 100 },
  { level: 3, title: 'Time Reclaimer', xpRequired: 300 },
  { level: 4, title: 'Habit Builder', xpRequired: 600 },
  { level: 5, title: 'Digital Minimalist', xpRequired: 1000 },
  { level: 6, title: 'Productivity Master', xpRequired: 1500 },
  { level: 7, title: 'Focus Champion', xpRequired: 2100 },
  { level: 8, title: 'Zen Master', xpRequired: 2800 },
  { level: 9, title: 'Life Builder', xpRequired: 3600 },
  { level: 10, title: 'Unscroller Legend', xpRequired: 4500 },
];

class ChallengesServiceDB {
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
   * Invoke Edge Function to (re)generate share asset
   */
  async generateShareAsset(challengeId: string, tenantId: string): Promise<ChallengeSharePayload | null> {
    if (!supabase) {
      return null;
    }

    if (!tenantId) {
      console.warn('[ChallengesService] generateShareAsset missing tenantId');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('challenge-share', {
        body: { challengeId },
        headers: {
          'x-tenant-id': tenantId,
        },
      });

      if (error) {
        console.warn('[ChallengesService] generateShareAsset edge error', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        shareUrl: data.shareUrl,
        caption: data.caption,
        imageUrl: data.imageUrl,
      };
    } catch (error) {
      console.error('[ChallengesService] generateShareAsset exception', error);
      return null;
    }
  }

  private mapChallengeRow(row: ChallengeRowExtended): Challenge {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type ?? 'community',
      goal: {
        metric: row.metric,
        target: row.target,
      },
      duration: {
        start: new Date(row.start_date),
        end: new Date(row.end_date),
      },
      participants: row.total_participants ?? 0,
      reward: {
        type: row.reward_type ?? 'badge',
        value: row.reward_value ?? 'custom_creator',
      },
      progress: row.progress ?? 0,
      completed: row.completed ?? false,
      coverEmoji: row.cover_emoji ?? undefined,
      privacy: row.privacy ?? undefined,
      dailyCommitments: row.daily_commitments ?? [],
      weeklyCommitments: row.weekly_commitments ?? [],
      successMetrics: row.success_metrics ?? [],
      creatorId: row.creator_id ?? undefined,
      createdAt: row.created_at ?? undefined,
    };
  }

  /**
   * Create a new challenge
   */
  async createChallenge(userId: string, payload: ChallengeCreationPayload): Promise<{
    challenge: Challenge;
    share: ChallengeSharePayload;
  }> {
    const fallback: Challenge = {
      id: `local-${Date.now()}`,
      title: payload.title,
      description: payload.description,
      type: 'community',
      goal: {
        metric: payload.goalMetric,
        target: payload.goalTarget,
      },
      duration: {
        start: new Date(payload.startDate),
        end: new Date(new Date(payload.startDate).getTime() + payload.durationDays * 24 * 60 * 60 * 1000),
      },
      participants: 1,
      reward: {
        type: 'badge',
        value: 'custom_creator',
      },
      progress: 0,
      completed: false,
      coverEmoji: payload.coverEmoji,
      privacy: payload.privacy,
    };

    const share: ChallengeSharePayload = {
      shareUrl: `https://unscroller.app/challenges/${fallback.id}`,
      caption: `Join me in “${payload.title}” on Unscroller! ${payload.dailyCommitments[0] ?? 'Let’s build better habits together.'}`,
    };

    if (!supabase) {
      return { challenge: fallback, share };
    }

    try {
      const db = this.checkSupabase();
      const { data, error } = await db
        .from('challenges')
        .insert({
          title: payload.title,
          description: payload.description,
          start_date: payload.startDate,
          end_date: new Date(new Date(payload.startDate).getTime() + payload.durationDays * 24 * 60 * 60 * 1000).toISOString(),
          metric: payload.goalMetric,
          target: payload.goalTarget,
          daily_commitments: payload.dailyCommitments,
          weekly_commitments: payload.weeklyCommitments,
          success_metrics: payload.successMetrics,
          cover_emoji: payload.coverEmoji,
          privacy: payload.privacy,
          creator_id: userId,
        })
        .select('*')
        .single();

      if (error || !data) {
        console.warn('[ChallengesService] createChallenge failed, falling back to local', error);
        return { challenge: fallback, share };
      }

      const created: Challenge = {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type ?? 'community',
        goal: {
          metric: data.metric,
          target: data.target,
        },
        duration: {
          start: new Date(data.start_date),
          end: new Date(data.end_date),
        },
        participants: data.total_participants ?? 1,
        reward: {
          type: data.reward_type ?? 'badge',
          value: data.reward_value ?? 'custom_creator',
        },
        progress: 0,
        completed: false,
        coverEmoji: data.cover_emoji ?? payload.coverEmoji,
        privacy: data.privacy ?? payload.privacy,
      };

      const sharePayload: ChallengeSharePayload = {
        shareUrl: data.share_slug ? `https://unscroller.app/c/${data.share_slug}` : share.shareUrl,
        caption: share.caption,
        imageUrl: data.share_asset_url ?? undefined,
      };

      return { challenge: created, share: sharePayload };
    } catch (error) {
      console.error('[ChallengesService] createChallenge error', error);
      return { challenge: fallback, share };
    }
  }

  /**
   * Fetch a single challenge definition
   */
  async getChallengeById(challengeId: string): Promise<Challenge | null> {
    if (!supabase) {
      console.warn('[ChallengesService] getChallengeById requires Supabase');
      return null;
    }

    try {
      const db = this.checkSupabase();
      const { data, error } = await db
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error || !data) {
        console.warn('[ChallengesService] getChallengeById error', error);
        return null;
      }

      return this.mapChallengeRow(data);
    } catch (error) {
      console.error('[ChallengesService] getChallengeById exception', error);
      return null;
    }
  }

  /**
   * Get user's active challenges from database
   */
  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    try {
      const db = this.checkSupabase();
      
      const { data, error } = await db
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
      
      if (error) {
        console.error('Error loading challenges:', error);
        return [];
      }
      
      return (data || []).map((uc: {
        current_progress: number;
        completed: boolean;
        challenge: ChallengeRowRecord;
      }) => ({
        id: uc.challenge.id,
        title: uc.challenge.title,
        description: uc.challenge.description,
        type: uc.challenge.type,
        goal: {
          metric: uc.challenge.metric,
          target: uc.challenge.target
        },
        duration: {
          start: new Date(uc.challenge.start_date),
          end: new Date(uc.challenge.end_date)
        },
        participants: uc.challenge.total_participants || 0,
        reward: {
          type: uc.challenge.reward_type,
          value: uc.challenge.reward_value
        },
        progress: (uc.current_progress / uc.challenge.target) * 100,
        completed: uc.completed
      }));
    } catch (error) {
      console.error('Error in getActiveChallenges:', error);
      return [];
    }
  }

  /**
   * Fetch posts for challenge feed
   */
  async getChallengeFeed(challengeId: string): Promise<ChallengeFeedPost[]> {
    if (!supabase) {
      return [
        {
          id: 'local-post-1',
          challengeId,
          authorId: 'dev_user_maya',
          authorName: 'Maya Chen',
          body: 'Day 3 done ✅ – replaced my scroll break with a 10-min brainstorm.',
          createdAt: new Date().toISOString(),
          reactions: { push: 4, fire: 2 },
        },
        {
          id: 'local-post-2',
          challengeId,
          authorId: 'dev_user_lee',
          authorName: 'Lee Nakamura',
          body: 'Shared my progress on socials – two friends joined!',
          createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
          reactions: { clap: 5 },
        },
      ];
    }

    try {
      const db = this.checkSupabase();
      const { data, error } = await db
        .from('challenge_posts')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('[ChallengesService] getChallengeFeed error', error);
        return [];
      }

      return (data || []).map(post => ({
        id: post.id,
        challengeId: post.challenge_id,
        authorId: post.author_id,
        authorName: post.author_name ?? 'Participant',
        body: post.body,
        createdAt: post.created_at,
        reactions: post.reactions ?? {},
        replyTo: post.reply_to,
      }));
    } catch (error) {
      console.error('[ChallengesService] getChallengeFeed exception', error);
      return [];
    }
  }

  /**
   * Post into challenge feed
   */
  async postToChallengeFeed(challengeId: string, authorId: string, body: string): Promise<ChallengeFeedPost | null> {
    if (!body.trim()) {
      return null;
    }

    if (!supabase) {
      return {
        id: `local-post-${Date.now()}`,
        challengeId,
        authorId,
        authorName: 'You',
        body,
        createdAt: new Date().toISOString(),
        reactions: {},
      };
    }

    try {
      const db = this.checkSupabase();
      const { data, error } = await db
        .from('challenge_posts')
        .insert({
          challenge_id: challengeId,
          author_id: authorId,
          body,
        })
        .select('*')
        .single();

      if (error || !data) {
        console.warn('[ChallengesService] postToChallengeFeed error', error);
        return null;
      }

      return {
        id: data.id,
        challengeId,
        authorId: data.author_id,
        authorName: data.author_name ?? 'You',
        body: data.body,
        createdAt: data.created_at,
        reactions: data.reactions ?? {},
        replyTo: data.reply_to,
      };
    } catch (error) {
      console.error('[ChallengesService] postToChallengeFeed exception', error);
      return null;
    }
  }

  /**
   * Generate share payload for challenge
   */
  async getSharePayload(challengeId: string): Promise<ChallengeSharePayload | null> {
    if (!supabase) {
      return {
        shareUrl: `https://unscroller.app/challenges/${challengeId}`,
        caption: 'Join me on this challenge inside Unscroller!',
      };
    }

    try {
      const db = this.checkSupabase();
      const { data, error } = await db
        .from('challenges')
        .select('share_slug, share_asset_url, title')
        .eq('id', challengeId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        shareUrl: data.share_slug ? `https://unscroller.app/c/${data.share_slug}` : `https://unscroller.app/challenges/${challengeId}`,
        caption: `Join me in ${data.title ?? 'this challenge'} on Unscroller!`,
        imageUrl: data.share_asset_url ?? undefined,
      };
    } catch (error) {
      console.error('[ChallengesService] getSharePayload exception', error);
      return null;
    }
  }

  /**
   * Get available challenges to join
   */
  async getAvailableChallenges(userId: string): Promise<Challenge[]> {
    try {
      const db = this.checkSupabase();
      
      // Get all active challenges
      const { data: allChallenges, error: challengesError } = await db
        .from('challenges')
        .select('*')
        .eq('is_active', true);
      
      if (challengesError) {
        console.error('Error loading available challenges:', challengesError);
        return [];
      }
      
      // Get user's joined challenges
      const { data: userChallenges } = await db
        .from('user_challenges')
        .select('challenge_id')
        .eq('user_id', userId);
      
      const joinedIds = new Set((userChallenges || []).map(uc => uc.challenge_id));
      
      // Filter out joined challenges
      return (allChallenges || [])
        .filter(c => !joinedIds.has(c.id))
        .map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type,
          goal: {
            metric: c.metric,
            target: c.target
          },
          duration: {
            start: new Date(c.start_date),
            end: new Date(c.end_date)
          },
          participants: c.total_participants || 0,
          reward: {
            type: c.reward_type,
            value: c.reward_value
          }
        }));
    } catch (error) {
      console.error('Error in getAvailableChallenges:', error);
      return [];
    }
  }

  /**
   * Join a challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<boolean> {
    try {
      const db = this.checkSupabase();
      
      const { error } = await db
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
      await db.rpc('increment_challenge_participants', {
        p_challenge_id: challengeId
      });
      
      console.log('✅ Joined challenge:', challengeId);
      return true;
    } catch (error) {
      console.error('Error in joinChallenge:', error);
      return false;
    }
  }

  async getChallengeProgress(userId: string, challengeId: string): Promise<ChallengeProgress | null> {
    try {
      const db = this.checkSupabase();

      const { data, error } = await db
        .from('user_challenges')
        .select(`
          user_id,
          challenge_id,
          current_progress,
          completed,
          joined_at,
          completed_at,
          challenge:challenges(
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
        .eq('challenge_id', challengeId)
        .single();

      if (error || !data) {
        if (error?.code !== 'PGRST116') {
          console.error('Failed to load challenge progress:', error);
        }
        return null;
      }

      const challengeRelation = data.challenge as ChallengeRowRecord | ChallengeRowRecord[] | null;
      if (!challengeRelation) {
        return null;
      }

      const challengeRow = Array.isArray(challengeRelation)
        ? challengeRelation[0]
        : challengeRelation;
      if (!challengeRow) {
        return null;
      }

      const target = Number(challengeRow.target) || 1;
      const currentProgress = Number(data.current_progress) || 0;

      const challenge: Challenge = {
        id: challengeRow.id,
        title: challengeRow.title,
        description: challengeRow.description,
        type: challengeRow.type,
        goal: {
          metric: challengeRow.metric,
          target,
        },
        duration: {
          start: new Date(challengeRow.start_date),
          end: new Date(challengeRow.end_date),
        },
        participants: challengeRow.total_participants || 0,
        reward: {
          type: challengeRow.reward_type,
          value: challengeRow.reward_value,
        },
        progress: (currentProgress / target) * 100,
        completed: data.completed,
      };

      const percentComplete = Math.min(100, Math.max(0, (currentProgress / target) * 100));

      return {
        challenge,
        currentProgress,
        percentComplete,
        completed: Boolean(data.completed),
        joinedAt: data.joined_at ? new Date(data.joined_at) : null,
        completedAt: data.completed_at ? new Date(data.completed_at) : null,
      };
    } catch (error) {
      console.error('Error in getChallengeProgress:', error);
      return null;
    }
  }

  /**
   * Leave a challenge
   */
  async leaveChallenge(userId: string, challengeId: string): Promise<boolean> {
    try {
      const db = this.checkSupabase();
      
      const { error } = await db
        .from('user_challenges')
        .delete()
        .eq('user_id', userId)
        .eq('challenge_id', challengeId);
      
      if (error) {
        console.error('Failed to leave challenge:', error);
        return false;
      }
      
      console.log('✅ Left challenge:', challengeId);
      return true;
    } catch (error) {
      console.error('Error in leaveChallenge:', error);
      return false;
    }
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(
    userId: string,
    challengeId: string,
    progress: number
  ): Promise<void> {
    try {
      const db = this.checkSupabase();
      
      const { data: challenge } = await db
        .from('challenges')
        .select('target')
        .eq('id', challengeId)
        .single();
      
      if (!challenge) return;
      
      const completed = progress >= challenge.target;
      
      await db
        .from('user_challenges')
        .update({
          current_progress: progress,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('user_id', userId)
        .eq('challenge_id', challengeId);
      
      console.log('✅ Challenge progress updated:', challengeId, progress);
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  }

  /**
   * Get leaderboard from database
   */
  async getLeaderboard(
    metric: 'time_saved' | 'focus_hours' | 'streak_days',
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly'
  ): Promise<Leaderboard> {
    try {
      const db = this.checkSupabase();
      
      const { data, error } = await db
        .from('leaderboard_entries')
        .select(`
          *,
          user:user_profiles (username, avatar)
        `)
        .eq('metric', metric)
        .eq('period', period)
        .order('rank', { ascending: true })
        .limit(100);
      
      if (error) {
        console.error('Error loading leaderboard:', error);
        return {
          id: `${metric}-${period}`,
          period,
          metric,
          entries: []
        };
      }
      
      return {
        id: `${metric}-${period}`,
        period,
        metric,
        entries: (data || []).map((entry: {
          user_id: string;
          score: number;
          rank: number;
          user?: { username?: string; avatar?: string } | null;
        }) => ({
          userId: entry.user_id,
          username: entry.user?.username || 'User',
          avatar: entry.user?.avatar,
          score: entry.score,
          rank: entry.rank,
          isCurrentUser: false, // Set by UI
          isFriend: false // Set by UI based on buddy relationship
        }))
      };
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      return {
        id: `${metric}-${period}`,
        period,
        metric,
        entries: []
      };
    }
  }

  /**
   * Award XP and update database
   */
  async awardXP(userId: string, action: {
    type: 'focus_session' | 'daily_checkin' | 'challenge_complete' | 'streak_milestone' | 'community_post';
    value?: number;
  }): Promise<number> {
    try {
      const db = this.checkSupabase();
      
      const xp = this.calculateXP(action);
      
      // Update user profile
      const { data } = await db
        .from('user_profiles')
        .select('total_xp, current_level')
        .eq('id', userId)
        .single();
      
      const newTotalXP = (data?.total_xp || 0) + xp;
      const newLevel = this.calculateLevelFromXP(newTotalXP);
      
      await db
        .from('user_profiles')
        .update({
          total_xp: newTotalXP,
          current_level: newLevel.level
        })
        .eq('id', userId);
      
      // Log to daily stats
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyStats } = await db
        .from('user_daily_stats')
        .select('xp_earned')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      const currentXP = dailyStats?.xp_earned || 0;
      
      await db
        .from('user_daily_stats')
        .upsert({
          user_id: userId,
          date: today,
          xp_earned: currentXP + xp
        }, {
          onConflict: 'user_id,date'
        });
      
      console.log('✅ XP awarded:', xp, 'Total:', newTotalXP);
      return xp;
    } catch (error) {
      console.error('Error awarding XP:', error);
      return 0;
    }
  }

  /**
   * Get user level from database
   */
  async getUserLevel(userId: string): Promise<UserLevel> {
    try {
      const db = this.checkSupabase();
      
      const { data } = await db
        .from('user_profiles')
        .select('total_xp, current_level')
        .eq('id', userId)
        .single();
      
      return this.calculateLevelFromXP(data?.total_xp || 0);
    } catch (error) {
      console.error('Error getting user level:', error);
      return this.calculateLevelFromXP(0);
    }
  }

  /**
   * Check if user completed a challenge
   */
  checkChallengeCompletion(challenge: Challenge, userProgress: number): boolean {
    return userProgress >= challenge.goal.target;
  }

  // Private helper methods
  private calculateXP(action: {
    type: string;
    value?: number;
  }): number {
    const xpValues: Record<string, number> = {
      focus_session: 10,
      daily_checkin: 5,
      challenge_complete: 100,
      streak_milestone: 50,
      community_post: 15
    };
    return action.value || xpValues[action.type] || 0;
  }

  private calculateLevelFromXP(totalXP: number): UserLevel {
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
      unlockedFeatures: this.getUnlockedFeatures(currentLevel.level)
    };
  }

  private getUnlockedFeatures(level: number): string[] {
    const features: string[] = [];
    
    if (level >= 1) features.push('Basic tracking');
    if (level >= 2) features.push('Focus sessions');
    if (level >= 3) features.push('Custom goals');
    if (level >= 4) features.push('Community access');
    if (level >= 5) features.push('Advanced analytics');
    if (level >= 6) features.push('Priority support');
    if (level >= 7) features.push('Custom themes');
    if (level >= 8) features.push('Export data');
    if (level >= 9) features.push('API access');
    if (level >= 10) features.push('Lifetime premium');
    
    return features;
  }
}

export const challengesServiceDB = new ChallengesServiceDB();
export default challengesServiceDB;
