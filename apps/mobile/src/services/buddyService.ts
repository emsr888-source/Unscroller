/**
 * Buddy Service - Accountability Partner System
 * 
 * Pairs users for mutual accountability and support
 * Helps users stay motivated through social connection
 */

export interface Buddy {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  currentStreak: number;
  level: number;
  lastActive: Date;
  status: 'active' | 'inactive';
  compatibilityScore: number; // 0-100
}

export interface BuddyRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: {
    username: string;
    avatar?: string;
    level: number;
    streak: number;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface BuddyMatch {
  buddy: Buddy;
  sharedGoals: string[];
  compatibilityReasons: string[];
  matchScore: number;
}

export interface BuddyActivity {
  id: string;
  buddyId: string;
  buddyName: string;
  type: 'streak_milestone' | 'challenge_complete' | 'level_up' | 'constellation_complete';
  message: string;
  timestamp: Date;
}

class BuddyService {
  private currentBuddy: Buddy | null = null;
  private pendingRequests: BuddyRequest[] = [];
  private sentRequests: BuddyRequest[] = [];

  /**
   * Find compatible buddy matches
   */
  async findMatches(_userProfile: {
    goals: string[];
    timezone: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredCommitment: 'light' | 'moderate' | 'intensive';
  }): Promise<BuddyMatch[]> {
    // In production, this would call backend API
    // For now, return mock matches
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    const mockMatches: BuddyMatch[] = [
      {
        buddy: {
          id: 'buddy-1',
          userId: 'user-123',
          username: 'Alex',
          avatar: '👨‍💻',
          currentStreak: 14,
          level: 5,
          lastActive: new Date(),
          status: 'active',
          compatibilityScore: 92,
        },
        sharedGoals: ['Work better', 'Be more focused'],
        compatibilityReasons: [
          'Similar timezone (EST)',
          'Same commitment level',
          'Both focus on productivity',
          '14-day streak shows consistency',
        ],
        matchScore: 92,
      },
      {
        buddy: {
          id: 'buddy-2',
          userId: 'user-456',
          username: 'Sarah',
          avatar: '👩‍🎨',
          currentStreak: 21,
          level: 6,
          lastActive: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'active',
          compatibilityScore: 87,
        },
        sharedGoals: ['Sleep better', 'Feel better about myself'],
        compatibilityReasons: [
          'Similar goals',
          'Active daily user',
          'Experienced (Level 6)',
          'Long streak',
        ],
        matchScore: 87,
      },
      {
        buddy: {
          id: 'buddy-3',
          userId: 'user-789',
          username: 'Marcus',
          avatar: '🏃',
          currentStreak: 7,
          level: 4,
          lastActive: new Date(Date.now() - 7200000), // 2 hours ago
          status: 'active',
          compatibilityScore: 81,
        },
        sharedGoals: ['Exercise more', 'Sleep better'],
        compatibilityReasons: [
          'Focus on wellness',
          'Similar experience level',
          'Recent streak start',
          'Regular check-ins',
        ],
        matchScore: 81,
      },
    ];

    return mockMatches;
  }

  /**
   * Send buddy request
   */
  async sendBuddyRequest(
    toBuddyId: string,
    message?: string
  ): Promise<boolean> {
    // In production, call backend API
    await new Promise(resolve => setTimeout(resolve, 300));

    const request: BuddyRequest = {
      id: `req-${Date.now()}`,
      fromUserId: 'current-user',
      toUserId: toBuddyId,
      fromUser: {
        username: 'You',
        level: 3,
        streak: 5,
      },
      message,
      status: 'pending',
      createdAt: new Date(),
    };

    this.sentRequests.push(request);
    console.log('✅ Buddy request sent to', toBuddyId);
    
    return true;
  }

  /**
   * Accept buddy request
   */
  async acceptBuddyRequest(requestId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const request = this.pendingRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'accepted';
      
      // Create buddy relationship
      this.currentBuddy = {
        id: request.id,
        userId: request.fromUserId,
        username: request.fromUser.username,
        avatar: request.fromUser.avatar,
        currentStreak: request.fromUser.streak,
        level: request.fromUser.level,
        lastActive: new Date(),
        status: 'active',
        compatibilityScore: 85,
      };

      console.log('✅ Buddy request accepted, paired with', request.fromUser.username);
      return true;
    }

    return false;
  }

  /**
   * Decline buddy request
   */
  async declineBuddyRequest(requestId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const request = this.pendingRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'declined';
      this.pendingRequests = this.pendingRequests.filter(r => r.id !== requestId);
      return true;
    }

    return false;
  }

  /**
   * Remove current buddy
   */
  async removeBuddy(): Promise<boolean> {
    if (!this.currentBuddy) return false;

    await new Promise(resolve => setTimeout(resolve, 300));

    console.log('👋 Buddy removed:', this.currentBuddy.username);
    this.currentBuddy = null;
    return true;
  }

  /**
   * Get current buddy
   */
  getCurrentBuddy(): Buddy | null {
    return this.currentBuddy;
  }

  /**
   * Get pending buddy requests
   */
  getPendingRequests(): BuddyRequest[] {
    // Mock data for development
    if (this.pendingRequests.length === 0) {
      this.pendingRequests = [
        {
          id: 'req-1',
          fromUserId: 'user-999',
          toUserId: 'current-user',
          fromUser: {
            username: 'Jamie',
            avatar: '🎯',
            level: 4,
            streak: 12,
          },
          message: 'Hey! We have similar goals. Want to be accountability buddies?',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
      ];
    }
    return this.pendingRequests;
  }

  /**
   * Get sent buddy requests
   */
  getSentRequests(): BuddyRequest[] {
    return this.sentRequests;
  }

  /**
   * Get buddy activity feed
   */
  async getBuddyActivity(): Promise<BuddyActivity[]> {
    if (!this.currentBuddy) return [];

    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock activity
    return [
      {
        id: 'activity-1',
        buddyId: this.currentBuddy.id,
        buddyName: this.currentBuddy.username,
        type: 'streak_milestone',
        message: `${this.currentBuddy.username} hit a 14-day streak! 🔥`,
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: 'activity-2',
        buddyId: this.currentBuddy.id,
        buddyName: this.currentBuddy.username,
        type: 'challenge_complete',
        message: `${this.currentBuddy.username} completed "7 Days Feed-Free"! 🎉`,
        timestamp: new Date(Date.now() - 7200000),
      },
      {
        id: 'activity-3',
        buddyId: this.currentBuddy.id,
        buddyName: this.currentBuddy.username,
        type: 'level_up',
        message: `${this.currentBuddy.username} reached Level 5! ⭐`,
        timestamp: new Date(Date.now() - 86400000),
      },
    ];
  }

  /**
   * Send encouragement message to buddy
   */
  async sendEncouragement(message: string): Promise<boolean> {
    if (!this.currentBuddy) return false;

    await new Promise(resolve => setTimeout(resolve, 300));

    console.log(`💬 Sent to ${this.currentBuddy.username}:`, message);
    
    // In production, send via chat/notification
    return true;
  }

  /**
   * Compare progress with buddy
   */
  getBuddyComparison(userStats: {
    streak: number;
    level: number;
    starsEarned: number;
    challengesCompleted: number;
  }): {
    metric: string;
    userValue: number;
    buddyValue: number;
    winner: 'user' | 'buddy' | 'tie';
    message: string;
  }[] {
    if (!this.currentBuddy) return [];

    // Mock buddy stats
    const buddyStats = {
      streak: this.currentBuddy.currentStreak,
      level: this.currentBuddy.level,
      starsEarned: 45,
      challengesCompleted: 3,
    };

    return [
      {
        metric: 'Current Streak',
        userValue: userStats.streak,
        buddyValue: buddyStats.streak,
        winner: userStats.streak > buddyStats.streak ? 'user' : 
                userStats.streak < buddyStats.streak ? 'buddy' : 'tie',
        message: userStats.streak > buddyStats.streak 
          ? "You're ahead! Keep it up!" 
          : "They're ahead, but you're catching up!",
      },
      {
        metric: 'Level',
        userValue: userStats.level,
        buddyValue: buddyStats.level,
        winner: userStats.level > buddyStats.level ? 'user' : 
                userStats.level < buddyStats.level ? 'buddy' : 'tie',
        message: userStats.level === buddyStats.level 
          ? "Perfectly matched!" 
          : "Great competition!",
      },
      {
        metric: 'Stars Earned',
        userValue: userStats.starsEarned,
        buddyValue: buddyStats.starsEarned,
        winner: userStats.starsEarned > buddyStats.starsEarned ? 'user' : 
                userStats.starsEarned < buddyStats.starsEarned ? 'buddy' : 'tie',
        message: "Your constellations are growing!",
      },
      {
        metric: 'Challenges',
        userValue: userStats.challengesCompleted,
        buddyValue: buddyStats.challengesCompleted,
        winner: userStats.challengesCompleted > buddyStats.challengesCompleted ? 'user' : 
                userStats.challengesCompleted < buddyStats.challengesCompleted ? 'buddy' : 'tie',
        message: "Both crushing challenges!",
      },
    ];
  }

  /**
   * Get buddy encouragement suggestions
   */
  getEncouragementSuggestions(): string[] {
    if (!this.currentBuddy) return [];

    return [
      "Great streak! Keep going! 🔥",
      "You're crushing it today! 💪",
      "Let's both hit our goals this week! 🎯",
      "Proud of your progress! ⭐",
      "We got this! 🚀",
    ];
  }
}

export const buddyService = new BuddyService();
export default buddyService;
