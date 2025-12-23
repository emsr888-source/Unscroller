import { PostgrestError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

export type TodoScope = 'daily' | 'weekly';

export type TodoRecurrenceRule = {
  frequency: 'weekly';
  daysOfWeek: number[];
};

export interface TodoRecord {
  id: string;
  userId: string;
  scope: TodoScope;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
  isHabit: boolean;
  habitId: string | null;
  habitOccurredOn: string | null;
  category: string | null;
  priority: number | null;
  dueDate: string | null;
  plannedFor: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  focusEntryId: string | null;
  recurrenceRule: TodoRecurrenceRule | null;
}

export type CreateTodoOptions = {
  plannedFor?: string | null;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  dueDate?: string | null;
  category?: string | null;
  priority?: number | null;
  isHabit?: boolean;
  habitId?: string | null;
  habitOccurredOn?: string | null;
  focusEntryId?: string | null;
  recurrenceRule?: TodoRecurrenceRule | null;
};

const ensureSupabase = () => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase not configured');
  }

  return supabase;
};

const mapRowToTodo = (row: Record<string, unknown>): TodoRecord => {
  const recurrenceRaw = row.recurrence_rule as Record<string, unknown> | null | undefined;
  const recurrenceRule: TodoRecurrenceRule | null =
    recurrenceRaw && typeof recurrenceRaw === 'object'
      ? {
          frequency: 'weekly',
          daysOfWeek: Array.isArray(recurrenceRaw.daysOfWeek) ? (recurrenceRaw.daysOfWeek as number[]) : [],
        }
      : null;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    scope: row.scope as TodoScope,
    text: row.text as string,
    completed: Boolean(row.completed),
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
    isHabit: Boolean(row.is_habit),
    habitId: (row.habit_id as string | null) ?? null,
    habitOccurredOn: (row.habit_occurred_on as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    priority: (row.priority as number | null) ?? null,
    dueDate: (row.due_date as string | null) ?? null,
    plannedFor: (row.planned_for as string | null) ?? null,
    plannedStart: (row.planned_start as string | null) ?? null,
    plannedEnd: (row.planned_end as string | null) ?? null,
    focusEntryId: (row.focus_entry_id as string | null) ?? null,
    recurrenceRule,
  };
};

const handleError = (error: PostgrestError | null, fallbackMessage: string) => {
  if (!error) {
    return;
  }

  throw new Error(error.message || fallbackMessage);
};

export const todoServiceDB = {
  async fetchTodos(userId: string): Promise<TodoRecord[]> {
    const client = ensureSupabase();

    const { data, error } = await client
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    handleError(error, 'Failed to load to-do items');

    return (data || []).map(mapRowToTodo);
  },

  async createTodo(userId: string, scope: TodoScope, text: string, options: CreateTodoOptions = {}): Promise<TodoRecord> {
    const client = ensureSupabase();

    const payload: Record<string, unknown> = {
      user_id: userId,
      scope,
      text,
      planned_for: options.plannedFor ?? null,
      planned_start: options.plannedStart ?? null,
      planned_end: options.plannedEnd ?? null,
      due_date: options.dueDate ?? null,
      category: options.category ?? null,
      priority: options.priority ?? null,
      is_habit: options.isHabit ?? false,
      habit_id: options.habitId ?? null,
      habit_occurred_on: options.habitOccurredOn ?? null,
      focus_entry_id: options.focusEntryId ?? null,
      recurrence_rule: options.recurrenceRule ?? null,
    };

    const { data, error } = await client.from('todos').insert(payload).select().single();

    handleError(error, 'Failed to create to-do item');

    if (!data) {
      throw new Error('Missing data for created to-do item');
    }

    return mapRowToTodo(data as Record<string, unknown>);
  },

  async findTodoByHabitOccurrence(userId: string, habitId: string, occurredOn: string): Promise<TodoRecord | null> {
    const client = ensureSupabase();

    const { data, error } = await client
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('habit_occurred_on', occurredOn)
      .limit(1)
      .maybeSingle();

    handleError(error, 'Failed to find linked to-do item');

    return data ? mapRowToTodo(data as Record<string, unknown>) : null;
  },

  async updateTodoCompletion(
    userId: string,
    id: string,
    completed: boolean,
    options: { habitOccurredOn?: string | null; recurrenceRule?: TodoRecurrenceRule | null } = {}
  ): Promise<TodoRecord> {
    const client = ensureSupabase();

    const updates: Record<string, unknown> = {
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    };

    if (Object.prototype.hasOwnProperty.call(options, 'habitOccurredOn')) {
      updates.habit_occurred_on = options.habitOccurredOn;
    }
    if (Object.prototype.hasOwnProperty.call(options, 'recurrenceRule')) {
      updates.recurrence_rule = options.recurrenceRule ?? null;
    }

    const { data, error } = await client
      .from('todos')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', id)
      .select()
      .single();

    handleError(error, 'Failed to update to-do item');

    if (!data) {
      throw new Error('Missing data for updated to-do item');
    }

    return mapRowToTodo(data as Record<string, unknown>);
  },

  async deleteTodo(userId: string, id: string): Promise<void> {
    const client = ensureSupabase();

    const { error } = await client.from('todos').delete().eq('user_id', userId).eq('id', id);

    handleError(error, 'Failed to delete to-do item');
  },

  async linkFocusEntry(todoId: string, focusEntryId: string | null): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client
      .from('todos')
      .update({ focus_entry_id: focusEntryId })
      .eq('id', todoId);
    handleError(error, 'Failed to link focus entry');
  },
};

export default todoServiceDB;
