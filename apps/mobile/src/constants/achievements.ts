import type { ConstellationType, StarSize } from '@/services/constellationService.database';

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  unlockLevel: number;
  icon: string;
  constellation: ConstellationType;
  starSize?: StarSize;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'orbit_breaker',
    title: 'Orbit Breaker',
    description: 'Reach Level 2 and complete your first series of focused work.',
    unlockLevel: 2,
    icon: '🚀',
    constellation: 'deep_work',
    starSize: 'medium',
  },
  {
    id: 'signal_jammer',
    title: 'Signal Jammer',
    description: 'Reach Level 4 while keeping distractions off your radar.',
    unlockLevel: 4,
    icon: '📡',
    constellation: 'relationships',
    starSize: 'small',
  },
  {
    id: 'streak_keeper',
    title: 'Streak Keeper',
    description: 'Hit Level 7 with an active streak and daily check-ins.',
    unlockLevel: 7,
    icon: '🔥',
    constellation: 'self_confidence',
  },
  {
    id: 'nebula_architect',
    title: 'Nebula Architect',
    description: 'Reach Level 10 and unlock advanced crafting rituals.',
    unlockLevel: 10,
    icon: '🛠️',
    constellation: 'creativity',
    starSize: 'large',
  },
  {
    id: 'aurora_keeper',
    title: 'Aurora Keeper',
    description: 'Reach Level 15 while maintaining a clear, calm sky.',
    unlockLevel: 15,
    icon: '🌌',
    constellation: 'better_sleep',
    starSize: 'large',
  },
  {
    id: 'cosmic_founder',
    title: 'Cosmic Founder',
    description: 'Reach Level 20 and keep building every single week.',
    unlockLevel: 20,
    icon: '✨',
    constellation: 'physical_health',
  },
];

const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> = ACHIEVEMENTS.reduce((acc, achievement) => {
  acc[achievement.id] = achievement;
  return acc;
}, {} as Record<string, AchievementDefinition>);

export function getAchievementById(id?: string | null) {
  if (!id) return undefined;
  return ACHIEVEMENT_MAP[id];
}
