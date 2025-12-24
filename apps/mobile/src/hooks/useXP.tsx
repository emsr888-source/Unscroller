import { useState, useCallback, useEffect } from 'react';
import { challengesServiceDB as challengesService } from '@/services/challengesService.database';
import { aiServiceDB as aiService } from '@/services/aiService.database';
import { supabase } from '@/services/supabase';
import { ACHIEVEMENTS } from '@/constants/achievements';
import { achievementsServiceDB } from '@/services/achievementsService.database';
import { constellationServiceDB } from '@/services/constellationService.database';
import { emitLevelUp } from '@/state/gamificationEvents';


export interface XPEvent {
  id: string;
  amount: number;
  timestamp: number;
}

/**
 * Hook to manage XP awards and level progression
 * Shows toast notifications when XP is earned
 * Triggers celebrations on level up
 */
export function useXP() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<{ level: number; title: string; xp: number; xpToNextLevel: number; unlockedFeatures: string[] }>({ 
    level: 1, 
    title: 'Scroll Breaker', 
    xp: 0, 
    xpToNextLevel: 100, 
    unlockedFeatures: [] 
  });
  const [xpEvents, setXPEvents] = useState<XPEvent[]>([]);
  const [achievementIds, setAchievementIds] = useState<string[]>([]);

  // Load user ID on mount
  useEffect(() => {
    async function loadUser() {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      // Load current level
      const level = await challengesService.getUserLevel(user.id);
      setUserLevel(level);

      // Load unlocked achievements
      const unlocked = await achievementsServiceDB.getUnlockedAchievements(user.id);
      setAchievementIds(unlocked);
    }
    loadUser();
  }, []);

  /**
   * Handle level up celebration
   */
  const handleLevelUp = useCallback(async (level: number, title: string) => {
    if (!userId) {
      return;
    }

    console.log(`🎉 LEVEL UP! Now Level ${level}: ${title}`);

    // Get AI celebration message
    const celebration = aiService.getCelebrationMessage({
      type: 'level',
      value: level
    });

    const newlyUnlocked = ACHIEVEMENTS.filter(achievement => achievement.unlockLevel <= level && !achievementIds.includes(achievement.id));

    if (newlyUnlocked.length > 0) {
      const updatedIds = new Set(achievementIds);

      for (const achievement of newlyUnlocked) {
        const unlocked = await achievementsServiceDB.unlockAchievement(userId, achievement.id);
        if (unlocked) {
          updatedIds.add(achievement.id);
          await constellationServiceDB.awardAchievementStar(userId, achievement);
        }
      }

      setAchievementIds(Array.from(updatedIds));
    }

    emitLevelUp({
      level,
      title,
      celebration,
      unlockedAchievements: newlyUnlocked,
    });
  }, [achievementIds, userId]);

  /**
   * Award XP for an action
   */
  const awardXP = useCallback(async (action: {
    type: 'focus_session' | 'daily_checkin' | 'challenge_complete' | 'streak_milestone' | 'community_post';
    value?: number;
  }) => {
    if (!userId) {
      console.warn('Cannot award XP: user not authenticated');
      return 0;
    }

    const previousLevel = userLevel.level;

    // Award XP to database
    const amount = await challengesService.awardXP(userId, action);

    // Reload user level from database
    const newLevel = await challengesService.getUserLevel(userId);
    setUserLevel(newLevel);

    // Show XP toast
    const event: XPEvent = {
      id: `xp-${Date.now()}`,
      amount,
      timestamp: Date.now(),
    };
    setXPEvents(prev => [...prev, event]);

    // Clear toast after animation
    setTimeout(() => {
      setXPEvents(prev => prev.filter(e => e.id !== event.id));
    }, 2000);

    // Check for level up
    if (newLevel.level > previousLevel) {
      await handleLevelUp(newLevel.level, newLevel.title);
    }

    return amount;
  }, [handleLevelUp, userId, userLevel.level]);

  /**
   * Award XP for focus session completion
   */
  const awardFocusSessionXP = useCallback(() => {
    return awardXP({ type: 'focus_session' });
  }, [awardXP]);

  /**
   * Award XP for daily check-in
   */
  const awardDailyCheckinXP = useCallback(() => {
    return awardXP({ type: 'daily_checkin' });
  }, [awardXP]);

  /**
   * Award XP for completing a challenge
   */
  const awardChallengeXP = useCallback(() => {
    return awardXP({ type: 'challenge_complete' });
  }, [awardXP]);

  /**
   * Award XP for streak milestone
   */
  const awardStreakMilestoneXP = useCallback(() => {
    return awardXP({ type: 'streak_milestone' });
  }, [awardXP]);

  /**
   * Award XP for community post
   */
  const awardCommunityPostXP = useCallback(() => {
    return awardXP({ type: 'community_post' });
  }, [awardXP]);

  return {
    totalXP: userLevel.xp,
    userLevel,
    xpEvents,
    awardXP,
    awardFocusSessionXP,
    awardDailyCheckinXP,
    awardChallengeXP,
    awardStreakMilestoneXP,
    awardCommunityPostXP,
  };
}
