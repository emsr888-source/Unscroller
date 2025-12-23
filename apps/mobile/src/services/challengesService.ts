/**
 * Challenges Service - Gamification & Community Challenges
 * Manages weekly/monthly challenges, leaderboards, and rewards
 */

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'personal' | 'community';
  goal: {
    metric: 'streak_days' | 'focus_hours' | 'time_saved' | 'feed_free_days';
    target: number;
  };
  duration: {
    start: Date;
    end: Date;
  };
  participants: number;
  reward: {
    type: 'badge' | 'xp' | 'level';
    value: string | number;
  };
  progress?: number; // User's personal progress (0-100)
  completed?: boolean;
}

export interface Leaderboard {
  id: string;
  challengeId?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  metric: 'time_saved' | 'focus_hours' | 'streak_days';
  entries: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  isFriend?: boolean;
  isCurrentUser?: boolean;
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

class ChallengesService {
  /**
   * Get active challenges for the user
   */
  getActiveChallenges(): Challenge[] {
    return [
      {
        id: 'weekly-feed-free',
        title: '7 Days Feed-Free',
        description: 'Go one week without scrolling any social media feeds',
        type: 'personal',
        goal: {
          metric: 'feed_free_days',
          target: 7
        },
        duration: {
          start: this.getStartOfWeek(),
          end: this.getEndOfWeek()
        },
        participants: 1,
        reward: {
          type: 'badge',
          value: 'feed_free_warrior'
        },
        progress: 45, // Example: user at 45% (3.15 days)
        completed: false
      },
      {
        id: 'focus-10-sessions',
        title: 'Complete 10 Focus Sessions',
        description: 'Finish 10 focused work sessions this week',
        type: 'personal',
        goal: {
          metric: 'focus_hours',
          target: 10
        },
        duration: {
          start: this.getStartOfWeek(),
          end: this.getEndOfWeek()
        },
        participants: 1,
        reward: {
          type: 'xp',
          value: 200
        },
        progress: 60, // 6/10 sessions done
        completed: false
      },
      {
        id: 'community-100-hours',
        title: 'Community Goal: 100K Hours',
        description: 'Save 100,000 collective hours as a community this month',
        type: 'community',
        goal: {
          metric: 'time_saved',
          target: 100000
        },
        duration: {
          start: this.getStartOfMonth(),
          end: this.getEndOfMonth()
        },
        participants: 12847,
        reward: {
          type: 'badge',
          value: 'community_champion'
        },
        progress: 73, // Community at 73,000 hours
        completed: false
      },
      {
        id: 'screen-free-sunday',
        title: 'Screen-Free Sunday',
        description: 'Minimize all screen usage this Sunday',
        type: 'community',
        goal: {
          metric: 'feed_free_days',
          target: 1
        },
        duration: {
          start: this.getNextSunday(),
          end: this.getNextSundayEnd()
        },
        participants: 3421,
        reward: {
          type: 'xp',
          value: 100
        },
        progress: 0,
        completed: false
      }
    ];
  }

  /**
   * Get available challenges to join
   */
  getAvailableChallenges(): Challenge[] {
    return [
      {
        id: 'monthly-marathon',
        title: '30-Day Transformation',
        description: 'Build a 30-day streak and transform your digital habits',
        type: 'personal',
        goal: {
          metric: 'streak_days',
          target: 30
        },
        duration: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        participants: 8932,
        reward: {
          type: 'badge',
          value: '30_day_champion'
        }
      },
      {
        id: 'focus-master',
        title: 'Focus Master Challenge',
        description: 'Complete 50 focus sessions in 30 days',
        type: 'personal',
        goal: {
          metric: 'focus_hours',
          target: 50
        },
        duration: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        participants: 5234,
        reward: {
          type: 'level',
          value: 1
        }
      }
    ];
  }

  /**
   * Get leaderboard for a specific metric
   */
  getLeaderboard(
    metric: 'time_saved' | 'focus_hours' | 'streak_days',
    period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly'
  ): Leaderboard {
    // In production, this would fetch from backend
    const mockEntries: LeaderboardEntry[] = [
      { userId: '1', username: 'Sarah M.', score: 42, rank: 1, avatar: '👩‍🎨' },
      { userId: '2', username: 'Alex K.', score: 38, rank: 2, avatar: '👨‍💻' },
      { userId: 'current', username: 'You', score: 35, rank: 3, avatar: '⭐', isCurrentUser: true },
      { userId: '4', username: 'Mike T.', score: 32, rank: 4, avatar: '🏃', isFriend: true },
      { userId: '5', username: 'Emma L.', score: 28, rank: 5, avatar: '👩‍💼' },
    ];

    return {
      id: `${metric}-${period}`,
      period,
      metric,
      entries: mockEntries
    };
  }

  /**
   * Get user's current level and progress
   */
  getUserLevel(totalXP: number): UserLevel {
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

    const xpToNextLevel = nextLevel.xpRequired - totalXP;
    const unlockedFeatures = this.getUnlockedFeatures(currentLevel.level);

    return {
      level: currentLevel.level,
      title: currentLevel.title,
      xp: totalXP,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      unlockedFeatures
    };
  }

  /**
   * Award XP for completing actions
   */
  awardXP(action: {
    type: 'focus_session' | 'daily_checkin' | 'challenge_complete' | 'streak_milestone' | 'community_post';
    value?: number;
  }): number {
    const xpValues = {
      focus_session: 10,
      daily_checkin: 5,
      challenge_complete: 100,
      streak_milestone: 50,
      community_post: 15
    };

    return action.value || xpValues[action.type] || 0;
  }

  /**
   * Check if user completed a challenge
   */
  checkChallengeCompletion(challenge: Challenge, userProgress: number): boolean {
    return userProgress >= challenge.goal.target;
  }

  /**
   * Join a community challenge
   */
  async joinChallenge(challengeId: string): Promise<boolean> {
    console.log('Joining challenge:', challengeId);
    // In production: API call to join
    return true;
  }

  /**
   * Leave a challenge
   */
  async leaveChallenge(challengeId: string): Promise<boolean> {
    console.log('Leaving challenge:', challengeId);
    // In production: API call to leave
    return true;
  }

  /**
   * Get unlocked features for current level
   */
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

  private getStartOfWeek(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff));
  }

  private getEndOfWeek(): Date {
    const start = this.getStartOfWeek();
    return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  private getStartOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getEndOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  private getNextSunday(): Date {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSunday = (7 - day) % 7 || 7;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysUntilSunday);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  private getNextSundayEnd(): Date {
    const sunday = this.getNextSunday();
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  }
}

export const challengesService = new ChallengesService();
export default challengesService;
