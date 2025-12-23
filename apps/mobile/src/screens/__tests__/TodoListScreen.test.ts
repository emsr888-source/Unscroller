import type { HabitEventRecord, HabitWithEvents } from '@/services/habitService.database';
import {
  buildDateRange,
  buildHabitViewModels,
  calculateCompletionPercent,
  calculateStreak,
  removeHabitEvent,
  upsertHabitEvent,
} from '../habits/habitGridHelpers';

describe('TodoListScreen helpers', () => {
  it('calculates date ranges and completion stats correctly', () => {
    const dates = buildDateRange(7);
    expect(dates).toHaveLength(7);

    const completedDates = new Set([dates[6], dates[4]]);
    expect(calculateStreak(completedDates, dates)).toBe(1);
    expect(calculateCompletionPercent(completedDates.size, dates.length)).toBe(Math.round((2 / 7) * 100));
  });

  it('builds habit view models with streak and completion data', () => {
    const dates = buildDateRange(3);
    const habit: HabitWithEvents = {
      definition: {
        id: 'habit-1',
        userId: 'user-1',
        title: 'Hydrate',
        description: 'Drink water',
        scope: 'daily',
        icon: '💧',
        color: '#00AEEF',
        streakTarget: 21,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      events: [
        makeEvent('habit-1', 'user-1', dates[1], true),
        makeEvent('habit-1', 'user-1', dates[2], true),
      ],
    };

    const [viewModel] = buildHabitViewModels([habit], dates);
    expect(viewModel.id).toBe('habit-1');
    expect(viewModel.tiles).toHaveLength(3);
    expect(viewModel.stats.streak).toBe(2);
    expect(viewModel.stats.completionPercent).toBe(Math.round((2 / 3) * 100));
  });

  it('handles optimistic event upserts and removals', () => {
    const base: HabitWithEvents[] = [
      {
        definition: {
          id: 'habit-1',
          userId: 'user-1',
          title: 'Hydrate',
          description: null,
          scope: 'daily',
          icon: null,
          color: null,
          streakTarget: 21,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        events: [],
      },
    ];

    const event = makeEvent('habit-1', 'user-1', '2025-05-01', true);
    const withEvent = upsertHabitEvent(base, event);
    expect(withEvent[0].events).toHaveLength(1);

    const withoutEvent = removeHabitEvent(withEvent, 'habit-1', '2025-05-01');
    expect(withoutEvent[0].events).toHaveLength(0);
  });
});

function makeEvent(
  habitId: string,
  userId: string,
  occurredOn: string,
  wasCompleted: boolean
): HabitEventRecord {
  const timestamp = new Date().toISOString();
  return {
    id: `${habitId}-${occurredOn}`,
    habitId,
    userId,
    occurredOn,
    todoId: null,
    wasCompleted,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
