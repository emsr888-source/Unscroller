type Listener<T> = (payload: T) => void;

import type { AchievementDefinition } from '@/constants/achievements';

export type LevelUpPayload = {
  level: number;
  title: string;
  celebration?: string;
  unlockedAchievements?: AchievementDefinition[];
};

const levelUpListeners = new Set<Listener<LevelUpPayload>>();

export function emitLevelUp(payload: LevelUpPayload) {
  levelUpListeners.forEach(listener => {
    try {
      listener(payload);
    } catch (error) {
      console.warn('[GamificationEvents] Level up listener error', error);
    }
  });
}

export function onLevelUp(listener: Listener<LevelUpPayload>) {
  levelUpListeners.add(listener);
  return () => levelUpListeners.delete(listener);
}
