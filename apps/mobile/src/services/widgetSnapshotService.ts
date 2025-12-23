import { NativeModules } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabase';
import { HabitWithEvents } from './habitService.database';

export interface HabitWidgetTile {
  date: string;
  completed: boolean;
  isToday: boolean;
  todoId: string | null;
  todoText: string | null;
  todoScope: string | null;
}

export interface HabitWidgetStats {
  completedCount: number;
  streak: number;
  completionPercent: number;
}

export interface HabitWidgetSnapshotHabit {
  habitId: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string;
  tiles: HabitWidgetTile[];
  stats: HabitWidgetStats;
}

export interface HabitWidgetSnapshot {
  tenantId: string;
  userId: string;
  generatedAt: string;
  habits: HabitWidgetSnapshotHabit[];
}

interface WidgetSyncBridge {
  setWidgetSnapshot(payload: string): Promise<void> | void;
  clearWidgetSnapshot(): Promise<void> | void;
}

const { WidgetSyncBridge } = NativeModules as { WidgetSyncBridge?: WidgetSyncBridge };

export const widgetSnapshotService = {
  async fetchSnapshot(userId: string): Promise<HabitWidgetSnapshot | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('habit_widget_snapshots')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[widgetSnapshotService] Failed to fetch snapshot', error);
      return null;
    }

    return data as unknown as HabitWidgetSnapshot;
  },

  async syncToNative(snapshot: HabitWidgetSnapshot | null): Promise<void> {
    if (!WidgetSyncBridge) {
      return;
    }

    try {
      if (!snapshot) {
        await Promise.resolve(WidgetSyncBridge.clearWidgetSnapshot?.());
        return;
      }

      const payload = JSON.stringify(snapshot);
      await Promise.resolve(WidgetSyncBridge.setWidgetSnapshot(payload));
    } catch (error) {
      console.warn('[widgetSnapshotService] Failed to sync widget payload', error);
    }
  },

  async upsertFromHabits(userId: string, _habits: HabitWithEvents[]): Promise<void> {
    await this.refreshFromSupabase(userId);
  },

  async refreshFromSupabase(userId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    try {
      const { error } = await supabase.rpc('refresh_habit_widget_snapshot', {
        p_user_id: userId,
      });

      if (error) {
        throw error;
      }

      const snapshot = await this.fetchSnapshot(userId);
      await this.syncToNative(snapshot);
    } catch (err) {
      console.warn('[widgetSnapshotService] Failed to refresh snapshot', err);
    }
  },
};

export default widgetSnapshotService;
