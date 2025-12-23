import { COLORS } from '@/core/theme/colors';
import type { HabitGridViewModel } from '@/components/HabitGridSection';
import type { HabitEventRecord, HabitWithEvents } from '@/services/habitService.database';

const getISODate = (date: Date) => date.toISOString().slice(0, 10);

type DateRangeOptions = {
  alignToWeekStart?: boolean;
  weekStartsOn?: number; // 0 (Sunday) - 6 (Saturday)
};

export const cloneHabitBundles = (bundles: HabitWithEvents[]): HabitWithEvents[] =>
  bundles.map(bundle => ({
    definition: { ...bundle.definition },
    events: bundle.events.map(event => ({ ...event })),
  }));

export const upsertHabitEvent = (bundles: HabitWithEvents[], event: HabitEventRecord): HabitWithEvents[] =>
  bundles.map(bundle => {
    if (bundle.definition.id !== event.habitId) {
      return bundle;
    }

    const remaining = bundle.events.filter(entry => entry.occurredOn !== event.occurredOn);
    const nextEvents = [...remaining, { ...event }].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));

    return {
      ...bundle,
      events: nextEvents,
    };
  });

export const removeHabitEvent = (bundles: HabitWithEvents[], habitId: string, occurredOn: string): HabitWithEvents[] =>
  bundles.map(bundle => {
    if (bundle.definition.id !== habitId) {
      return bundle;
    }

    const nextEvents = bundle.events.filter(entry => entry.occurredOn !== occurredOn);

    return {
      ...bundle,
      events: nextEvents,
    };
  });

export const buildDateRange = (days: number, options: DateRangeOptions = {}): string[] => {
  const { alignToWeekStart = false, weekStartsOn = 0 } = options;
  const today = new Date();
  const normalizedDays = alignToWeekStart ? Math.ceil(days / 7) * 7 : days;

  let rangeStart = new Date(today);
  let rangeEnd = new Date(today);

  if (alignToWeekStart) {
    const dayOffset = (today.getDay() - weekStartsOn + 7) % 7;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - dayOffset);

    rangeStart = new Date(currentWeekStart);
    rangeStart.setDate(currentWeekStart.getDate() - (normalizedDays - 7));

    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + normalizedDays - 1);
  } else {
    rangeStart.setDate(today.getDate() - (normalizedDays - 1));
    rangeEnd = new Date(today);
  }

  const dates: string[] = [];
  const cursor = new Date(rangeStart);

  while (cursor <= rangeEnd) {
    dates.push(getISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

export const calculateStreak = (completedDates: Set<string>, orderedDates: string[]): number => {
  let streak = 0;
  let hasSeenCompletion = false;

  for (let index = orderedDates.length - 1; index >= 0; index -= 1) {
    const date = orderedDates[index];

    if (completedDates.has(date)) {
      streak += 1;
      hasSeenCompletion = true;
    } else if (hasSeenCompletion) {
      break;
    }
  }

  return streak;
};

export const calculateCompletionPercent = (completedCount: number, totalCount: number): number => {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((completedCount / totalCount) * 100);
};

export const buildHabitViewModels = (bundles: HabitWithEvents[], referenceDates: string[]): HabitGridViewModel[] =>
  bundles.map(bundle => {
    const completedDates = new Set(bundle.events.filter(event => event.wasCompleted).map(event => event.occurredOn));
    const tiles = referenceDates.map(date => {
      const isCompleted = completedDates.has(date);
      const isToday = date === referenceDates[referenceDates.length - 1];

      return {
        date,
        completed: isCompleted,
        isToday,
        accentColor: bundle.definition.color ?? COLORS.ACCENT_GRADIENT_START,
      };
    });

    const totalCompletions = tiles.filter(tile => tile.completed).length;
    const streak = calculateStreak(completedDates, referenceDates);
    const completionPercent = calculateCompletionPercent(totalCompletions, referenceDates.length);

    return {
      id: bundle.definition.id,
      title: bundle.definition.title,
      description: bundle.definition.description,
      icon: bundle.definition.icon,
      tiles,
      stats: {
        streak,
        completionPercent,
      },
    };
  });

type TestingExports = {
  cloneHabitBundles: typeof cloneHabitBundles;
  upsertHabitEvent: typeof upsertHabitEvent;
  removeHabitEvent: typeof removeHabitEvent;
  buildDateRange: typeof buildDateRange;
  calculateStreak: typeof calculateStreak;
  calculateCompletionPercent: typeof calculateCompletionPercent;
  buildHabitViewModels: typeof buildHabitViewModels;
};

export const __TESTING__: TestingExports = {
  cloneHabitBundles,
  upsertHabitEvent,
  removeHabitEvent,
  buildDateRange,
  calculateStreak,
  calculateCompletionPercent,
  buildHabitViewModels,
};
