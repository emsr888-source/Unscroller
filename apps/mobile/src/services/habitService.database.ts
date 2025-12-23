import { PostgrestError } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';
import { TodoScope } from './todoService.database';

export interface HabitDefinitionRecord {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  scope: TodoScope;
  icon: string | null;
  color: string | null;
  streakTarget: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitEventRecord {
  id: string;
  habitId: string;
  userId: string;
  occurredOn: string; // YYYY-MM-DD
  todoId: string | null;
  wasCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitWithEvents {
  definition: HabitDefinitionRecord;
  events: HabitEventRecord[];
}

export interface HabitFetchOptions {
  includeArchived?: boolean;
  habitIds?: string[];
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

export interface HabitCompletionPayload {
  userId: string;
  habitId: string;
  occurredOn: string; // YYYY-MM-DD
  completed: boolean;
  todoId?: string | null;
}

const ensureSupabase = () => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase not configured');
  }

  return supabase;
};

const mapHabitRow = (row: Record<string, unknown>): HabitDefinitionRecord => ({
  id: row.id as string,
  userId: row.user_id as string,
  title: row.title as string,
  description: (row.description as string | null) ?? null,
  scope: row.scope as TodoScope,
  icon: (row.icon as string | null) ?? null,
  color: (row.color as string | null) ?? null,
  streakTarget: (row.streak_target as number | null) ?? 21,
  isArchived: Boolean(row.is_archived),
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const mapEventRow = (row: Record<string, unknown>): HabitEventRecord => ({
  id: row.id as string,
  habitId: row.habit_id as string,
  userId: row.user_id as string,
  occurredOn: row.occurred_on as string,
  todoId: (row.todo_id as string | null) ?? null,
  wasCompleted: Boolean(row.was_completed),
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const handleError = (error: PostgrestError | null, fallbackMessage: string) => {
  if (!error) {
    return;
  }

  throw new Error(error.message || fallbackMessage);
};

const habitServiceDB = {
  async fetchHabitsWithEvents(userId: string, options: HabitFetchOptions = {}): Promise<HabitWithEvents[]> {
    const client = ensureSupabase();

    const definitionQuery = client
      .from('habit_definitions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!options.includeArchived) {
      definitionQuery.eq('is_archived', false);
    }

    if (options.habitIds?.length) {
      definitionQuery.in('id', options.habitIds);
    }

    const { data: habitRows, error: habitError } = await definitionQuery; // typed at runtime
    handleError(habitError, 'Failed to load habit definitions');

    const habits = (habitRows || []).map(mapHabitRow);
    if (habits.length === 0) {
      return [];
    }

    const eventQuery = client
      .from('habit_events')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })
      .in('habit_id', habits.map(habit => habit.id));

    if (options.fromDate) {
      eventQuery.gte('occurred_on', options.fromDate);
    }

    if (options.toDate) {
      eventQuery.lte('occurred_on', options.toDate);
    }

    const { data: eventRows, error: eventError } = await eventQuery;
    handleError(eventError, 'Failed to load habit events');

    const eventsByHabit = new Map<string, HabitEventRecord[]>();
    (eventRows || []).forEach(row => {
      const mapped = mapEventRow(row as Record<string, unknown>);
      const current = eventsByHabit.get(mapped.habitId) ?? [];
      current.push(mapped);
      eventsByHabit.set(mapped.habitId, current);
    });

    return habits.map(definition => ({
      definition,
      events: eventsByHabit.get(definition.id) ?? [],
    }));
  },

  async setHabitCompletion(payload: HabitCompletionPayload): Promise<HabitEventRecord | null> {
    const client = ensureSupabase();

    if (payload.completed) {
      const upsertPayload = {
        user_id: payload.userId,
        habit_id: payload.habitId,
        occurred_on: payload.occurredOn,
        todo_id: payload.todoId ?? null,
        was_completed: true,
      };

      const { data, error } = await client
        .from('habit_events')
        .upsert(upsertPayload, { onConflict: 'habit_id,occurred_on' })
        .select()
        .single();

      handleError(error, 'Failed to log habit completion');

      if (!data) {
        throw new Error('Missing habit event data');
      }

      return mapEventRow(data as Record<string, unknown>);
    }

    const { data, error } = await client
      .from('habit_events')
      .delete()
      .eq('user_id', payload.userId)
      .eq('habit_id', payload.habitId)
      .eq('occurred_on', payload.occurredOn)
      .select()
      .maybeSingle();

    handleError(error, 'Failed to clear habit completion');
    return data ? mapEventRow(data as Record<string, unknown>) : null;
  },

  async linkTodoToHabitEvent(params: { userId: string; habitId: string; occurredOn: string; todoId: string | null }): Promise<void> {
    const client = ensureSupabase();

    const { error } = await client
      .from('habit_events')
      .update({ todo_id: params.todoId })
      .eq('user_id', params.userId)
      .eq('habit_id', params.habitId)
      .eq('occurred_on', params.occurredOn);

    handleError(error, 'Failed to link habit event to to-do item');
  },

  async createHabitDefinition(
    userId: string,
    payload: {
      title: string;
      description?: string | null;
      scope: TodoScope;
      icon?: string | null;
      color?: string | null;
      streakTarget?: number;
    }
  ): Promise<HabitDefinitionRecord> {
    const client = ensureSupabase();

    const insertPayload = {
      user_id: userId,
      title: payload.title,
      description: payload.description ?? null,
      scope: payload.scope,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
      streak_target: payload.streakTarget ?? 21,
      is_archived: false,
    };

    const { data, error } = await client
      .from('habit_definitions')
      .insert(insertPayload)
      .select()
      .single();

    handleError(error, 'Failed to create habit definition');

    if (!data) {
      throw new Error('Missing habit definition data');
    }

    return mapHabitRow(data as Record<string, unknown>);
  },
};

export const createLocalHabitSeed = (): HabitWithEvents[] => {
  const today = new Date();
  const formatDate = (offset: number) => {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    return date.toISOString().slice(0, 10);
  };

  const makeEvents = (habitId: string, pattern: number[]): HabitEventRecord[] =>
    pattern.map(offset => ({
      id: `local-event-${habitId}-${offset}`,
      habitId,
      userId: 'local',
      occurredOn: formatDate(offset),
      todoId: null,
      wasCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  const habits: HabitDefinitionRecord[] = [
    {
      id: 'local-habit-1',
      userId: 'local',
      title: 'Ship one tiny win',
      description: 'Log a single momentum task every day',
      scope: 'daily',
      icon: '🚀',
      color: '#4DA1FF',
      streakTarget: 21,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'local-habit-2',
      userId: 'local',
      title: 'Nightly reflection',
      description: 'Write three gratitude notes',
      scope: 'daily',
      icon: '📝',
      color: '#7AE1C3',
      streakTarget: 14,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return [
    {
      definition: habits[0],
      events: makeEvents('local-habit-1', [0, 1, 3, 4, 6, 7, 8, 10, 11, 13, 14, 15]),
    },
    {
      definition: habits[1],
      events: makeEvents('local-habit-2', [0, 2, 4, 6, 8, 10, 12, 14]),
    },
  ];
};

export default habitServiceDB;
