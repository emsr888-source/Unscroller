/**
 * Constellation Service - "Constellation of Wins" Reward System
 * 
 * Users earn stars for positive actions, which form constellations
 * based on their goals. The night sky visualization fills up as they
 * reclaim time from social media.
 */

export interface Star {
  id: string;
  x: number; // 0-1 normalized position
  y: number; // 0-1 normalized position
  size: 'small' | 'medium' | 'large';
  type: 'focus_session' | 'time_saved' | 'goal_completed' | 'milestone';
  constellation: ConstellationType;
  timestamp: Date;
  action: string; // Description of what earned this star
  brightness: number; // 0.3-1.0
}

export interface Constellation {
  type: ConstellationType;
  name: string;
  description: string;
  icon: string;
  stars: Star[];
  progress: number; // 0-100
  completed: boolean;
  completionDate?: Date;
  totalStarsNeeded: 30;
}

export type ConstellationType = 
  | 'deep_work'
  | 'better_sleep'
  | 'relationships'
  | 'self_confidence'
  | 'creativity'
  | 'physical_health';

export interface SkyState {
  totalStars: number;
  constellations: Constellation[];
  currentStreak: number;
  longestStreak: number;
  skyTheme: SkyTheme;
  hasAurora: boolean;
  hasShootingStars: boolean;
  cloudCover: number; // 0-1, increases when streak breaks
  lastUpdated: Date;
}

export type SkyTheme = 'default' | 'northern' | 'tropical' | 'cosmic';

// Constellation definitions
const CONSTELLATION_DEFINITIONS: Record<ConstellationType, {
  name: string;
  description: string;
  icon: string;
  relatedGoals: string[];
}> = {
  deep_work: {
    name: 'Deep Work',
    description: 'Focus sessions and productive hours',
    icon: '🎯',
    relatedGoals: ['Work better', 'Be more focused', 'Build something'],
  },
  better_sleep: {
    name: 'Better Sleep',
    description: 'Evening routines and restful nights',
    icon: '🌙',
    relatedGoals: ['Sleep better', 'Feel energized'],
  },
  relationships: {
    name: 'Relationships',
    description: 'Quality time with loved ones',
    icon: '❤️',
    relatedGoals: ['Connect with others', 'Strengthen relationships'],
  },
  self_confidence: {
    name: 'Self-Confidence',
    description: 'Personal growth and achievements',
    icon: '✨',
    relatedGoals: ['Feel better about myself', 'Build confidence'],
  },
  creativity: {
    name: 'Creativity',
    description: 'Creative projects and self-expression',
    icon: '🎨',
    relatedGoals: ['Be more creative', 'Express myself'],
  },
  physical_health: {
    name: 'Physical Health',
    description: 'Exercise and wellness activities',
    icon: '💪',
    relatedGoals: ['Exercise more', 'Be healthier'],
  },
};

class ConstellationService {
  private skyState: SkyState = {
    totalStars: 0,
    constellations: [],
    currentStreak: 0,
    longestStreak: 0,
    skyTheme: 'default',
    hasAurora: false,
    hasShootingStars: false,
    cloudCover: 0,
    lastUpdated: new Date(),
  };

  /**
   * Initialize constellations based on user's selected goals
   */
  initializeConstellations(userGoals: string[]): void {
    this.skyState.constellations = Object.entries(CONSTELLATION_DEFINITIONS)
      .filter(([_, def]) => 
        def.relatedGoals.some(goal => 
          userGoals.some(userGoal => 
            userGoal.toLowerCase().includes(goal.toLowerCase())
          )
        )
      )
      .map(([type, def]) => ({
        type: type as ConstellationType,
        name: def.name,
        description: def.description,
        icon: def.icon,
        stars: [],
        progress: 0,
        completed: false,
        totalStarsNeeded: 30,
      }));

    // Always include at least Deep Work constellation
    if (!this.skyState.constellations.some(c => c.type === 'deep_work')) {
      const def = CONSTELLATION_DEFINITIONS.deep_work;
      this.skyState.constellations.push({
        type: 'deep_work',
        name: def.name,
        description: def.description,
        icon: def.icon,
        stars: [],
        progress: 0,
        completed: false,
        totalStarsNeeded: 30,
      });
    }
  }

  /**
   * Award a star for an action
   */
  awardStar(action: {
    type: 'focus_session' | 'time_saved' | 'goal_completed' | 'milestone';
    constellation: ConstellationType;
    description: string;
    size?: 'small' | 'medium' | 'large';
  }): Star {
    const constellation = this.skyState.constellations.find(
      c => c.type === action.constellation
    );

    if (!constellation) {
      throw new Error(`Constellation ${action.constellation} not initialized`);
    }

    // Generate star position
    // Position stars to form constellation patterns
    const starCount = constellation.stars.length;
    const position = this.generateStarPosition(constellation.type, starCount);

    const star: Star = {
      id: `star-${Date.now()}-${Math.random()}`,
      x: position.x,
      y: position.y,
      size: action.size || this.determineStarSize(action.type),
      type: action.type,
      constellation: action.constellation,
      timestamp: new Date(),
      action: action.description,
      brightness: action.type === 'milestone' ? 1.0 : 0.7 + Math.random() * 0.3,
    };

    constellation.stars.push(star);
    constellation.progress = Math.min(
      100,
      (constellation.stars.length / constellation.totalStarsNeeded) * 100
    );

    if (constellation.stars.length >= constellation.totalStarsNeeded && !constellation.completed) {
      constellation.completed = true;
      constellation.completionDate = new Date();
      this.handleConstellationComplete(constellation);
    }

    this.skyState.totalStars++;
    this.skyState.lastUpdated = new Date();

    // Update sky features based on milestones
    this.updateSkyFeatures();

    return star;
  }

  /**
   * Award star for focus session
   */
  awardFocusSessionStar(sessionMinutes: number): Star {
    return this.awardStar({
      type: 'focus_session',
      constellation: 'deep_work',
      description: `${sessionMinutes}-min Focus Session`,
    });
  }

  /**
   * Award star for time saved
   */
  awardTimeSavedStar(minutes: number): Star | null {
    // Award 1 star per 30 minutes saved
    if (minutes < 30) return null;

    return this.awardStar({
      type: 'time_saved',
      constellation: 'deep_work',
      description: `${minutes} minutes saved`,
    });
  }

  /**
   * Award star for completing daily goal
   */
  awardGoalStar(goalName: string, constellation: ConstellationType): Star {
    return this.awardStar({
      type: 'goal_completed',
      constellation,
      description: `Completed: ${goalName}`,
    });
  }

  /**
   * Award milestone star
   */
  awardMilestoneStar(milestone: string, constellation: ConstellationType): Star {
    return this.awardStar({
      type: 'milestone',
      constellation,
      description: milestone,
      size: 'large',
    });
  }

  /**
   * Get current sky state
   */
  getSkyState(): SkyState {
    return this.skyState;
  }

  /**
   * Get all stars
   */
  getAllStars(): Star[] {
    return this.skyState.constellations.flatMap(c => c.stars);
  }

  /**
   * Get constellation by type
   */
  getConstellation(type: ConstellationType): Constellation | undefined {
    return this.skyState.constellations.find(c => c.type === type);
  }

  /**
   * Update streak (affects cloud cover)
   */
  updateStreak(streakDays: number): void {
    const previousStreak = this.skyState.currentStreak;
    this.skyState.currentStreak = streakDays;
    
    if (streakDays > this.skyState.longestStreak) {
      this.skyState.longestStreak = streakDays;
    }

    // Streak broken
    if (previousStreak > 0 && streakDays === 0) {
      this.skyState.cloudCover = 0.3;
    }
    
    // Streak restored
    if (previousStreak === 0 && streakDays > 0) {
      this.skyState.cloudCover = Math.max(0, this.skyState.cloudCover - 0.1);
    }

    // Long streaks clear the sky
    if (streakDays >= 7) {
      this.skyState.cloudCover = 0;
    }

    this.updateSkyFeatures();
  }

  /**
   * Get stats for today
   */
  getTodayStats(): {
    starsEarned: number;
    constellationProgress: string;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStars = this.getAllStars().filter(star => {
      const starDate = new Date(star.timestamp);
      starDate.setHours(0, 0, 0, 0);
      return starDate.getTime() === today.getTime();
    });

    // Find most progressed incomplete constellation
    const nextConstellation = this.skyState.constellations
      .filter(c => !c.completed)
      .sort((a, b) => b.progress - a.progress)[0];

    let progressText = 'All constellations complete! 🌟';
    if (nextConstellation) {
      progressText = `Your '${nextConstellation.name}' constellation is ${Math.round(nextConstellation.progress)}% complete`;
    }

    return {
      starsEarned: todayStars.length,
      constellationProgress: progressText,
    };
  }

  /**
   * Private: Generate star position within constellation area
   */
  private generateStarPosition(
    constellation: ConstellationType,
    starIndex: number
  ): { x: number; y: number } {
    // Different constellations occupy different regions of the sky
    const regions: Record<ConstellationType, { centerX: number; centerY: number; radius: number }> = {
      deep_work: { centerX: 0.3, centerY: 0.3, radius: 0.25 },
      better_sleep: { centerX: 0.7, centerY: 0.3, radius: 0.25 },
      relationships: { centerX: 0.5, centerY: 0.6, radius: 0.25 },
      self_confidence: { centerX: 0.2, centerY: 0.7, radius: 0.25 },
      creativity: { centerX: 0.8, centerY: 0.7, radius: 0.25 },
      physical_health: { centerX: 0.5, centerY: 0.4, radius: 0.25 },
    };

    const region = regions[constellation];
    
    // Use polar coordinates to distribute stars evenly
    const angle = (starIndex * 137.5) * (Math.PI / 180); // Golden angle
    const distance = Math.sqrt(starIndex / 30) * region.radius;
    
    const x = region.centerX + distance * Math.cos(angle);
    const y = region.centerY + distance * Math.sin(angle);

    // Clamp to 0-1
    return {
      x: Math.max(0.05, Math.min(0.95, x)),
      y: Math.max(0.05, Math.min(0.95, y)),
    };
  }

  /**
   * Private: Determine star size based on action type
   */
  private determineStarSize(
    type: 'focus_session' | 'time_saved' | 'goal_completed' | 'milestone'
  ): 'small' | 'medium' | 'large' {
    switch (type) {
      case 'milestone':
        return 'large';
      case 'goal_completed':
        return 'medium';
      default:
        return 'small';
    }
  }

  /**
   * Private: Handle constellation completion
   */
  private handleConstellationComplete(constellation: Constellation): void {
    console.log(`🎉 Constellation "${constellation.name}" complete!`);
    
    // Trigger celebration
    // In production: Show full-screen animation, sound, notification
  }

  /**
   * Private: Update sky features based on progress
   */
  private updateSkyFeatures(): void {
    const { totalStars, currentStreak } = this.skyState;

    // Aurora unlocks at 30-day streak
    this.skyState.hasAurora = currentStreak >= 30;

    // Shooting stars unlock at 100 total stars
    this.skyState.hasShootingStars = totalStars >= 100;

    // Reduce cloud cover over time
    if (currentStreak > 0) {
      this.skyState.cloudCover = Math.max(0, this.skyState.cloudCover - 0.01);
    }
  }
}

export const constellationService = new ConstellationService();
export default constellationService;
