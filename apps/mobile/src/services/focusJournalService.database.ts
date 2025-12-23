import { PostgrestError } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from './supabase';
import todoServiceDB, { TodoScope } from './todoService.database';

export type BlockSetSnapshot = {
  id?: string;
  name?: string;
  emoji?: string;
  message?: string;
  backgroundColor?: string;
};

type FocusEntryTodoRelation = {
  id: string;
  habit_id: string | null;
  habit_occurred_on: string | null;
  is_habit: boolean | null;
};

export type FocusJournalEntryRecord = {
  id: string;
  userId: string;
  entryDate: string;
  startTime: string | null;
  endTime: string | null;
  title: string;
  notes: string | null;
  blockSetId: string | null;
  blockSetSnapshot: BlockSetSnapshot | null;
  completed: boolean;
  todoId: string | null;
  habitId: string | null;
  habitOccurredOn: string | null;
  isHabit: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateFocusEntryInput = {
  entryDate: string;
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  blockSetId?: string | null;
  blockSetSnapshot?: BlockSetSnapshot | null;
  scope?: TodoScope;
  habitId?: string | null;
  habitOccurredOn?: string | null;
  isHabit?: boolean;
};

const ensureSupabase = () => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase not configured');
  }
  return supabase;
};

const mapRowToEntry = (row: Record<string, unknown>): FocusJournalEntryRecord => {
  const todoRelation = (row.todos as FocusEntryTodoRelation | null | undefined) ?? null;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    entryDate: row.entry_date as string,
    startTime: (row.start_time as string | null) ?? null,
    endTime: (row.end_time as string | null) ?? null,
    title: (row.title as string) ?? '',
    notes: (row.notes as string | null) ?? null,
    blockSetId: (row.block_set_id as string | null) ?? null,
    blockSetSnapshot: (row.block_set_snapshot as BlockSetSnapshot | null) ?? null,
    completed: Boolean(row.completed),
    todoId: (row.todo_id as string | null) ?? null,
    habitId: todoRelation?.habit_id ?? null,
    habitOccurredOn: todoRelation?.habit_occurred_on ?? null,
    isHabit: Boolean(todoRelation?.is_habit),
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
};

const handleError = (error: PostgrestError | null, fallback: string) => {
  if (!error) {
    return;
  }
  throw new Error(error.message || fallback);
};

const focusJournalService = {
  async fetchEntries(userId: string): Promise<FocusJournalEntryRecord[]> {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('focus_journal_entries')
      .select('*, todos:todo_id(id, habit_id, habit_occurred_on, is_habit)')
      .eq('user_id', userId)
      .order('entry_date', { ascending: true })
      .order('start_time', { ascending: true })
      .order('created_at', { ascending: true });

    handleError(error, 'Failed to load focus journal entries');
    return (data || []).map(item => mapRowToEntry(item as Record<string, unknown>));
  },

  async createEntry(userId: string, input: CreateFocusEntryInput): Promise<FocusJournalEntryRecord> {
    const client = ensureSupabase();

    const todo = await todoServiceDB.createTodo(userId, input.scope ?? 'weekly', input.title, {
      plannedFor: input.entryDate,
      plannedStart: input.startTime ?? null,
      plannedEnd: input.endTime ?? null,
      isHabit: input.isHabit ?? Boolean(input.habitId),
      habitId: input.habitId ?? null,
      habitOccurredOn: input.habitOccurredOn ?? null,
    });

    try {
      const payload = {
        user_id: userId,
        entry_date: input.entryDate,
        start_time: input.startTime ?? null,
        end_time: input.endTime ?? null,
        title: input.title,
        notes: input.notes ?? null,
        block_set_id: input.blockSetId ?? null,
        block_set_snapshot: input.blockSetSnapshot ?? null,
        todo_id: todo.id,
        completed: false,
      };

      const { data, error } = await client
        .from('focus_journal_entries')
        .insert(payload)
        .select('*, todos:todo_id(id, habit_id, habit_occurred_on, is_habit)')
        .single();
      handleError(error, 'Failed to create focus journal entry');

      if (!data) {
        throw new Error('Missing focus journal entry data');
      }

      await todoServiceDB.linkFocusEntry(todo.id, data.id as string);
      return mapRowToEntry(data as Record<string, unknown>);
    } catch (error) {
      // cleanup orphaned todo if entry creation failed
      await todoServiceDB.deleteTodo(userId, todo.id).catch(() => undefined);
      throw error;
    }
  },

  async deleteEntry(params: { entryId: string; userId: string }): Promise<void> {
    const { entryId, userId } = params;
    const client = ensureSupabase();

    const { data, error } = await client
      .from('focus_journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId)
      .select('todo_id')
      .single();

    handleError(error, 'Failed to remove focus journal entry');

    const todoId = data?.todo_id as string | null | undefined;
    if (todoId) {
      await todoServiceDB.deleteTodo(userId, todoId).catch(err => {
        console.warn('[focusJournalService] Failed to delete linked todo', err);
      });
    }
  },

  async setEntryCompletion(params: { entryId: string; completed: boolean; userId: string; todoId?: string | null }): Promise<void> {
    const { entryId, completed, userId, todoId } = params;
    const client = ensureSupabase();

    const { error } = await client
      .from('focus_journal_entries')
      .update({ completed })
      .eq('id', entryId)
      .eq('user_id', userId);

    handleError(error, 'Failed to update focus entry');

    if (todoId) {
      await todoServiceDB.updateTodoCompletion(userId, todoId, completed);
    }
  },
};

export default focusJournalService;
