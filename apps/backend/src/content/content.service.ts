import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ContentService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  // ============ JOURNAL ============

  async getJournalEntries(userId: string, limit = 30) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async getJournalEntry(userId: string, date: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', date)
      .single();

    if (error) throw error;
    return data;
  }

  async createJournalEntry(userId: string, entryData: {
    entry_date: string;
    mood?: string;
    content: string;
  }) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        ...entryData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateJournalEntry(userId: string, date: string, updates: {
    mood?: string;
    content?: string;
  }) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('journal_entries')
      .update(updates)
      .eq('user_id', userId)
      .eq('entry_date', date)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============ TODOS ============

  async getTodos(userId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('completed', { ascending: true })
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createTodo(userId: string, todoData: {
    text: string;
    category?: string;
    priority?: number;
    due_date?: string;
  }) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('todos')
      .insert({
        user_id: userId,
        ...todoData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTodo(userId: string, todoId: string, updates: {
    text?: string;
    completed?: boolean;
    category?: string;
    priority?: number;
    due_date?: string;
  }) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const updateData: any = { ...updates };
    if (updates.completed !== undefined && updates.completed) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('todos')
      .update(updateData)
      .eq('id', todoId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTodo(userId: string, todoId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { error } = await this.supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // ============ RESOURCES ============

  async getResources(category?: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    let query = this.supabase
      .from('resources')
      .select('*')
      .eq('active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('featured', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getResource(resourceId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserResourceProgress(userId: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('user_resource_progress')
      .select(`
        *,
        resources (*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  async updateResourceProgress(userId: string, resourceId: string, progress: {
    completed?: boolean;
    progress_percentage?: number;
  }) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const updateData: any = { ...progress };
    if (progress.completed) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('user_resource_progress')
      .upsert({
        user_id: userId,
        resource_id: resourceId,
        ...updateData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============ MEDITATION ============

  async getMeditationSessions(userId: string, limit = 50) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async logMeditationSession(userId: string, sessionData: {
    exercise_type: string;
    duration_minutes: number;
  }) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('meditation_sessions')
      .insert({
        user_id: userId,
        ...sessionData,
        completed: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============ CALENDAR ============

  async getCalendarEvents(userId: string, startDate?: string, endDate?: string) {
    if (!this.supabase) throw new Error('Supabase not configured');

    let query = this.supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId);

    if (startDate && endDate) {
      query = query.gte('event_date', startDate).lte('event_date', endDate);
    }

    const { data, error } = await query.order('event_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createCalendarEvent(userId: string, eventData: {
    event_date: string;
    event_type: string;
    title: string;
    description?: string;
    icon?: string;
  }) {
    if (!this.supabase) throw new Error('Supabase not configured');

    const { data, error } = await this.supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        ...eventData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
