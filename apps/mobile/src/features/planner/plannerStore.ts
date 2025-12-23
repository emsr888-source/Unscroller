import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid/non-secure';

import { createSafeStorage } from '@/lib/safeStorage';

export type PlannerRecurrenceRule = {
  frequency: 'weekly';
  /**
   * Days of week using JS Date.getDay convention (0 = Sunday, 6 = Saturday)
   */
  daysOfWeek: number[];
};

export type PlannerTask = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string;
  blockSetId?: string;
  emoji?: string;
  notes?: string;
  completed?: boolean;
  todoId?: string | null;
  habitId?: string | null;
  habitOccurredOn?: string | null;
  isHabit?: boolean;
  recurrenceRule?: PlannerRecurrenceRule | null;
};

type PlannerState = {
  tasks: Record<string, PlannerTask>;
  upsertTask: (task: Omit<PlannerTask, 'id'> & { id?: string }) => string;
  removeTask: (taskId: string) => void;
  toggleTask: (taskId: string, completed: boolean) => void;
  setTasks: (taskList: PlannerTask[]) => void;
};

const safeStorage = createSafeStorage('weekly-planner-state');

const storage = createJSONStorage<PlannerState>(() => ({
  getItem: key => safeStorage.getString(key) ?? null,
  setItem: (key, value) => safeStorage.set(key, value),
  removeItem: key => safeStorage.delete(key),
}));

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const formatDateKey = (input: Date | number | string) => {
  if (typeof input === 'string' && ISO_DATE_REGEX.test(input.trim())) {
    return input;
  }
  const date = input instanceof Date ? input : new Date(input);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      tasks: {},
      upsertTask: task => {
        const id = task.id ?? nanoid();
        const normalized: PlannerTask = {
          id,
          title: task.title?.trim() || 'Untitled',
          date: formatDateKey(task.date),
          startTime: task.startTime,
          endTime: task.endTime,
          blockSetId: task.blockSetId,
          emoji: task.emoji,
          notes: task.notes,
          completed: task.completed ?? false,
          todoId: task.todoId ?? null,
          habitId: task.habitId ?? null,
          habitOccurredOn: task.habitOccurredOn ?? null,
          isHabit: task.isHabit ?? Boolean(task.habitId),
          recurrenceRule: task.recurrenceRule ?? null,
        };
        set(prev => ({
          tasks: {
            ...prev.tasks,
            [id]: normalized,
          },
        }));
        return id;
      },
      removeTask: taskId => {
        set(prev => {
          const next = { ...prev.tasks };
          delete next[taskId];
          return { tasks: next };
        });
      },
      toggleTask: (taskId, completed) => {
        const existing = get().tasks[taskId];
        if (!existing) {
          return;
        }
        set(prev => ({
          tasks: {
            ...prev.tasks,
            [taskId]: { ...existing, completed },
          },
        }));
      },
      setTasks: taskList => {
        const mapped = taskList.reduce<Record<string, PlannerTask>>((acc, task) => {
          const id = task.id || nanoid();
          acc[id] = {
            ...task,
            id,
            title: task.title?.trim() || 'Untitled',
            date: formatDateKey(task.date),
            completed: task.completed ?? false,
            todoId: task.todoId ?? null,
            habitId: task.habitId ?? null,
            habitOccurredOn: task.habitOccurredOn ?? null,
            isHabit: task.isHabit ?? Boolean(task.habitId),
            recurrenceRule: task.recurrenceRule ?? null,
          };
          return acc;
        }, {});
        set({ tasks: mapped });
      },
    }),
    {
      name: 'weekly-planner-state',
      storage,
      partialize: state => ({
        tasks: state.tasks,
      }),
    }
  )
);

export const selectTasks = (state: PlannerState) => state.tasks;

export const selectTasksForDate = (state: PlannerState, dateKey: string) =>
  Object.values(state.tasks).filter(task => task.date === dateKey);

export const selectTasksInRange = (state: PlannerState, startKey: string, endKey: string) => {
  const start = new Date(startKey).getTime();
  const end = new Date(endKey).getTime();

  return Object.values(state.tasks).filter(task => {
    const ts = new Date(task.date).getTime();
    return ts >= start && ts <= end;
  });
};
