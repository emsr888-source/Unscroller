import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TextInput, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import todoServiceDB, { TodoRecord, TodoScope } from '@/services/todoService.database';
import habitServiceDB from '@/services/habitService.database';
import widgetSnapshotService from '@/services/widgetSnapshotService';
import type { BlockSet } from '@unscroller/block-service';
import {
  useBlockingStore,
  selectActiveTask,
  selectBlockSets,
  selectBlockingCapability,
  defaultBlockSet,
  DEFAULT_BLOCK_SET_ID,
  DEFAULT_BLOCK_BACKGROUND,
  presetBlockSetTemplates,
} from '@/features/blocking/blockingStore';
import { formatDateKey as normalizeDateKey } from '@/features/planner/plannerStore';
import { useFocusEffect } from '@react-navigation/native';
import { createSafeStorage } from '../lib/safeStorage';
import { SPACING } from '@/core/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import ColorSpherePicker from '@/components/ColorSpherePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'TodoList'>;

type FocusPresetMeta = {
  blockSetId?: string | null;
  name?: string;
  emoji?: string;
  color?: string;
};

type FocusWindowMeta = {
  entryDate: string;
  startTime?: string | null;
  endTime?: string | null;
};

export type FocusAwareTodo = TodoRecord & {
  focusPreset?: FocusPresetMeta;
  focusWindow?: FocusWindowMeta;
};

type ScopedTodos = Record<TodoScope, FocusAwareTodo[]>;

const EMPTY_SCOPE: ScopedTodos = {
  daily: [],
  weekly: [],
};

const DEFAULT_BLOCK_MESSAGE = 'Apps in this set will be blocked during focus sessions.';

type BlockSetManagerState = {
  visible: boolean;
  editingId: string | null;
  name: string;
  emoji: string;
  message: string;
  backgroundColor: string;
  saving: boolean;
  mode: 'list' | 'edit';
};

const createBlockSetManagerState = (overrides: Partial<BlockSetManagerState> = {}): BlockSetManagerState => ({
  visible: false,
  editingId: null,
  name: '',
  emoji: '🛡️',
  message: DEFAULT_BLOCK_MESSAGE,
  backgroundColor: DEFAULT_BLOCK_BACKGROUND,
  saving: false,
  mode: 'list',
  ...overrides,
});

const PRESET_TEMPLATE_ENTRIES = Object.entries(presetBlockSetTemplates);

const parseDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const shiftDateKey = (key: string, deltaDays: number) => {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + deltaDays);
  return normalizeDateKey(date);
};

const describeDateKey = (key: string) => {
  const todayKey = normalizeDateKey(new Date());
  if (key === todayKey) {
    return 'Today';
  }
  if (key === shiftDateKey(todayKey, -1)) {
    return 'Yesterday';
  }
  if (key === shiftDateKey(todayKey, 1)) {
    return 'Tomorrow';
  }
  const date = parseDateKey(key);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

const formatLongDateLabel = (key: string) => {
  const date = parseDateKey(key);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });
};

const deriveTodoDateKey = (todo: TodoRecord) =>
  normalizeDateKey(todo.plannedFor ?? todo.dueDate ?? todo.createdAt);

const generateLocalTodoId = (scope: TodoScope) => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `local-${scope}-${globalThis.crypto.randomUUID()}`;
  }
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `local-${scope}-${Date.now().toString(36)}-${randomSuffix}`;
};

const createLocalTodoRecord = (input: {
  id?: string;
  scope: TodoScope;
  text: string;
  completed?: boolean;
  plannedFor?: string | null;
  createdAt?: string;
  completedAt?: string | null;
}): FocusAwareTodo => {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const id = input.id ?? generateLocalTodoId(input.scope);
  return {
    id,
    userId: 'local',
    scope: input.scope,
    text: input.text,
    completed: input.completed ?? false,
    createdAt,
    completedAt: input.completedAt ?? null,
    isHabit: false,
    habitId: null,
    habitOccurredOn: null,
    category: null,
    priority: null,
    dueDate: null,
    plannedFor: input.plannedFor ?? null,
    plannedStart: null,
    plannedEnd: null,
    focusEntryId: null,
    recurrenceRule: null,
  };
};

const createLocalSeed = (): ScopedTodos => {
  const todayKey = normalizeDateKey(new Date());
  const timestamp = new Date().toISOString();
  return {
    daily: [
      {
        ...createLocalTodoRecord({ scope: 'daily', text: 'Ship one tiny win', plannedFor: todayKey, createdAt: timestamp }),
      },
      {
        ...createLocalTodoRecord({ scope: 'daily', text: 'Lock a 25-min focus block', plannedFor: todayKey, createdAt: timestamp }),
      },
    ],
    weekly: [
      {
        ...createLocalTodoRecord({ scope: 'weekly', text: 'Review streak + goals', completed: true, createdAt: timestamp, completedAt: timestamp }),
      },
      {
        ...createLocalTodoRecord({ scope: 'weekly', text: 'Plan a creator hour', createdAt: timestamp }),
      },
    ],
  };
};

const focusDefaultsStorage = createSafeStorage('todo-focus-defaults');
const FOCUS_DEFAULTS_KEY = 'defaults';

const readStoredFocusDefaults = (): Record<string, { durationMin: number; blockSetId: string }> => {
  try {
    const raw = focusDefaultsStorage.getString(FOCUS_DEFAULTS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, { durationMin: number; blockSetId: string }>;
    return parsed ?? {};
  } catch (error) {
    console.warn('[TodoList] Failed to read focus defaults', error);
    return {};
  }
};

const persistFocusDefaults = (defaults: Record<string, { durationMin: number; blockSetId: string }>) => {
  try {
    focusDefaultsStorage.set(FOCUS_DEFAULTS_KEY, JSON.stringify(defaults));
  } catch (error) {
    console.warn('[TodoList] Failed to persist focus defaults', error);
  }
};

const calcProgress = (items: TodoRecord[]) => {
  const total = items.length;
  const completed = items.filter(item => item.completed).length;
  const percent = total === 0 ? 0 : (completed / total) * 100;
  return { total, completed, percent };
};

const cloneScopedTodos = (state: ScopedTodos): ScopedTodos => ({
  daily: state.daily.map(todo => ({ ...todo })),
  weekly: state.weekly.map(todo => ({ ...todo })),
});
export default function TodoListScreen({ navigation }: Props) {
  const [todos, setTodos] = useState<ScopedTodos>(EMPTY_SCOPE);
  const [dailyDraft, setDailyDraft] = useState('');
  const [weeklyDraft, setWeeklyDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [focusDefaults, setFocusDefaults] = useState<Record<string, { durationMin: number; blockSetId: string }>>(() => readStoredFocusDefaults());
  const [currentDailyDateKey, setCurrentDailyDateKey] = useState(() => normalizeDateKey(new Date()));
  const blockSets = useBlockingStore(selectBlockSets);
  const activeTask = useBlockingStore(selectActiveTask);
  const stopTask = useBlockingStore(state => state.stopTask);
  const createBlockSetFromTemplate = useBlockingStore(state => state.createBlockSetFromTemplate);
  const createCustomBlockSet = useBlockingStore(state => state.createCustomBlockSet);
  const updateBlockSetMeta = useBlockingStore(state => state.updateBlockSetMeta);
  const pickAppsForBlockSet = useBlockingStore(state => state.pickAppsForBlockSet);
  const removeBlockSet = useBlockingStore(state => state.removeBlockSet);
  const [focusPlanner, setFocusPlanner] = useState<{
    visible: boolean;
    todo: TodoRecord | null;
    durationMin: number;
    blockSetId: string;
  }>({
    visible: false,
    todo: null,
    durationMin: 25,
    blockSetId: DEFAULT_BLOCK_SET_ID,
  });
  const [blockSetManager, setBlockSetManager] = useState<BlockSetManagerState>(() => createBlockSetManagerState());

  const blockSetOptions = useMemo(() => (blockSets.length ? blockSets : [defaultBlockSet]), [blockSets]);
  const capability = useBlockingStore(selectBlockingCapability);
  const durationOptions = useMemo(() => [15, 25, 45], []);
  const activeTaskBlockSet = useMemo(
    () => blockSetOptions.find(set => set.id === (activeTask?.task.blockSetId ?? DEFAULT_BLOCK_SET_ID)),
    [activeTask?.task.blockSetId, blockSetOptions]
  );
  const customBlockSets = useMemo(
    () => blockSetOptions.filter(set => (set.kind ?? 'custom') === 'custom'),
    [blockSetOptions]
  );
  const visibleDailyTodos = useMemo(
    () => todos.daily.filter(todo => deriveTodoDateKey(todo) === currentDailyDateKey),
    [todos.daily, currentDailyDateKey]
  );
  const dayDescriptor = describeDateKey(currentDailyDateKey);
  const dailySectionTitle = `${dayDescriptor}'s To-Do List`;
  const dailySubtitle = formatLongDateLabel(currentDailyDateKey);
  const dayNavLabel = dayDescriptor;

  const handleShiftDailyDate = useCallback((delta: number) => {
    setCurrentDailyDateKey(prev => shiftDateKey(prev, delta));
  }, []);

  useEffect(() => {
    const allTodoIds = new Set([...todos.daily, ...todos.weekly].map(todo => todo.id));
    setFocusDefaults(prev => {
      const nextEntries = Object.entries(prev).filter(([todoId]) => allTodoIds.has(todoId));
      if (nextEntries.length === Object.keys(prev).length) {
        return prev;
      }
      const next = Object.fromEntries(nextEntries);
      persistFocusDefaults(next);
      return next;
    });
  }, [todos.daily, todos.weekly]);

  useEffect(() => {
    const availableIds = new Set(blockSets.map(set => set.id));
    setFocusDefaults(prev => {
      const nextEntries = Object.entries(prev).filter(([, value]) => availableIds.has(value.blockSetId));
      if (nextEntries.length === Object.keys(prev).length) {
        return prev;
      }
      const next = Object.fromEntries(nextEntries);
      persistFocusDefaults(next);
      return next;
    });
  }, [blockSets]);

  useEffect(() => {
    if (blockSetOptions.some(option => option.id === focusPlanner.blockSetId)) {
      return;
    }
    const fallbackId = blockSetOptions[0]?.id ?? DEFAULT_BLOCK_SET_ID;
    setFocusPlanner(prev => ({ ...prev, blockSetId: fallbackId }));
  }, [blockSetOptions, focusPlanner.blockSetId]);

  const openBlockSetManager = useCallback(() => {
    setBlockSetManager(createBlockSetManagerState({ visible: true, mode: 'list' }));
  }, []);

  const closeBlockSetManager = useCallback(() => {
    setBlockSetManager(createBlockSetManagerState());
  }, []);

  const beginBlockSetEdit = useCallback((blockSet?: BlockSet | null) => {
    const target = blockSet ?? null;
    setBlockSetManager(
      createBlockSetManagerState({
        visible: true,
        mode: 'edit',
        editingId: target?.id ?? null,
        name: target?.name ?? '',
        emoji: target?.blockedEmoji ?? '🛡️',
        message: target?.blockedMessage ?? DEFAULT_BLOCK_MESSAGE,
        backgroundColor: target?.blockedBackgroundColor ?? DEFAULT_BLOCK_BACKGROUND,
      })
    );
  }, []);

  const handleUsePreset = useCallback(
    (templateId: string) => {
      const template = presetBlockSetTemplates[templateId];
      if (!template) {
        console.warn('[TodoList] Missing block set template', templateId);
        return;
      }
      const created = createBlockSetFromTemplate(templateId, { name: template.name });
      if (!created) {
        Alert.alert('Unable to use preset', 'Something went wrong while duplicating this preset.');
        return;
      }
      setFocusPlanner(prev => ({ ...prev, blockSetId: created.id }));
      setBlockSetManager(createBlockSetManagerState({ visible: true, mode: 'list' }));
    },
    [createBlockSetFromTemplate]
  );

  const handleRemoveBlockSetRequest = useCallback(
    (blockSet: BlockSet) => {
      if (blockSet.id === DEFAULT_BLOCK_SET_ID) {
        return;
      }

      Alert.alert(
        'Remove block set?',
        `“${blockSet.name}” will be removed from your focus presets. You can re-create it at any time.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              removeBlockSet(blockSet.id);
            },
          },
        ]
      );
    },
    [removeBlockSet]
  );

  const handleSaveBlockSet = useCallback(async () => {
    if (!blockSetManager.visible || blockSetManager.mode !== 'edit') {
      return;
    }

    const trimmedName = blockSetManager.name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Give your block set a name so you can find it later.');
      return;
    }

    setBlockSetManager(prev => ({ ...prev, saving: true }));

    try {
      let savedBlockSet: BlockSet | null = null;

      if (blockSetManager.editingId) {
        await updateBlockSetMeta(blockSetManager.editingId, {
          name: trimmedName,
          blockedEmoji: blockSetManager.emoji || '🛡️',
          blockedMessage: blockSetManager.message || DEFAULT_BLOCK_MESSAGE,
          blockedBackgroundColor: blockSetManager.backgroundColor || DEFAULT_BLOCK_BACKGROUND,
        });
        savedBlockSet = useBlockingStore.getState().blockSets[blockSetManager.editingId] ?? null;
      } else {
        savedBlockSet = createCustomBlockSet({
          name: trimmedName,
          blockedEmoji: blockSetManager.emoji || '🛡️',
          blockedMessage: blockSetManager.message || DEFAULT_BLOCK_MESSAGE,
          blockedBackgroundColor: blockSetManager.backgroundColor || DEFAULT_BLOCK_BACKGROUND,
        });
      }

      if (savedBlockSet) {
        setFocusPlanner(prev => ({ ...prev, blockSetId: savedBlockSet!.id }));
      }

      setBlockSetManager(createBlockSetManagerState({ visible: true, mode: 'list' }));
    } catch (error) {
      console.warn('[TodoList] Failed to save block set', error);
      Alert.alert('Unable to save block set', 'Please try again.');
      setBlockSetManager(prev => ({ ...prev, saving: false }));
    }
  }, [blockSetManager, createCustomBlockSet, updateBlockSetMeta]);

  const handlePickApps = useCallback(
    async (blockSetId: string) => {
      const result = await pickAppsForBlockSet(blockSetId);
      if (result) {
        setFocusPlanner(prev => ({ ...prev, blockSetId: result.id }));
      } else {
        Alert.alert('App selection cancelled', 'No changes were made to this block set.');
      }
    },
    [pickAppsForBlockSet]
  );

  const updateBlockSetManager = useCallback((updates: Partial<BlockSetManagerState>) => {
    setBlockSetManager(prev => ({ ...prev, ...updates }));
  }, []);

  const openFocusPlanner = useCallback(
    (todo: TodoRecord) => {
      const fallbackBlockSetId = blockSetOptions[0]?.id ?? DEFAULT_BLOCK_SET_ID;
      const defaults = focusDefaults[todo.id];
      const preferredBlockSetId = defaults?.blockSetId;
      const resolvedBlockSetId = preferredBlockSetId && blockSetOptions.some(set => set.id === preferredBlockSetId)
        ? preferredBlockSetId
        : fallbackBlockSetId;
      const resolvedDuration = defaults?.durationMin ?? 25;
      setFocusPlanner(prev => ({
        visible: true,
        todo,
        durationMin:
          prev.visible && prev.todo?.id === todo.id
            ? prev.durationMin
            : resolvedDuration,
        blockSetId:
          prev.visible && prev.todo?.id === todo.id && blockSetOptions.some(set => set.id === prev.blockSetId)
            ? prev.blockSetId
            : resolvedBlockSetId,
      }));
    },
    [blockSetOptions, focusDefaults]
  );

  const closeFocusPlanner = useCallback(() => {
    setFocusPlanner(prev => ({ ...prev, visible: false, todo: null }));
  }, []);

  const handleSelectDuration = useCallback((duration: number) => {
    setFocusPlanner(prev => ({ ...prev, durationMin: duration }));
  }, []);

  const handleSelectBlockSet = useCallback((blockSetId: string) => {
    setFocusPlanner(prev => ({ ...prev, blockSetId }));
  }, []);

  const handleLaunchFocus = useCallback(() => {
    if (!focusPlanner.todo) {
      return;
    }
    if (!capability.authorized || !capability.shieldsAvailable) {
      Alert.alert('Enable blocking', 'Screen-time permissions are needed to start focus blocks.');
      return;
    }

    const { todo, durationMin, blockSetId } = focusPlanner;
    setFocusDefaults(prev => {
      const next = {
        ...prev,
        [todo.id]: { durationMin, blockSetId },
      };
      persistFocusDefaults(next);
      return next;
    });
    closeFocusPlanner();
    navigation.navigate('TaskTimer', {
      taskId: todo.id,
      title: todo.text,
      durationMin,
      blockSetId,
    });
  }, [closeFocusPlanner, focusPlanner, navigation]);

  const handleQuickStart = useCallback(
    (todo: TodoRecord) => {
      const defaults = focusDefaults[todo.id];
      if (!defaults) {
        openFocusPlanner(todo);
        return;
      }

      navigation.navigate('TaskTimer', {
        taskId: todo.id,
        title: todo.text,
        durationMin: defaults.durationMin,
        blockSetId: defaults.blockSetId,
      });
    },
    [focusDefaults, navigation, openFocusPlanner]
  );

  const handlePlanTodo = useCallback(
    (todo: TodoRecord) => {
      const defaults = focusDefaults[todo.id];
      navigation.navigate('FocusJournal', {
        prefillTask: { id: todo.id, title: todo.text, blockSetId: defaults?.blockSetId },
      });
    },
    [focusDefaults, navigation]
  );

  const handleOpenPlanner = useCallback(() => {
    navigation.navigate('FocusJournal', undefined);
  }, [navigation]);

  const handleStopActiveFocus = useCallback(() => {
    if (!activeTask?.task.id) {
      return;
    }

    stopTask(activeTask.task.id).catch(error => {
      console.warn('[TodoList] Failed to stop active focus task', error);
    });
  }, [activeTask?.task.id, stopTask]);

  const loadTodos = useCallback(
    async (opts: { withSpinner?: boolean } = {}) => {
      if (opts.withSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!isSupabaseConfigured() || !supabase) {
        setIsLocalMode(true);
        setUserId(null);
        setTodos(createLocalSeed());
        setError('Using local-only to-do list. Sign in to sync tasks.');
        void widgetSnapshotService.syncToNative(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user?.id) {
          setUserId(null);
          setTodos(createLocalSeed());
          setIsLocalMode(true);
          setError('Using local-only to-do list. Sign in to sync tasks.');
          void widgetSnapshotService.syncToNative(null);
          return;
        }

        setIsLocalMode(false);
        setUserId(user.id);
        const records = await todoServiceDB.fetchTodos(user.id);

        const next: ScopedTodos = {
          daily: records.filter(item => item.scope === 'daily'),
          weekly: records.filter(item => item.scope === 'weekly'),
        };

        setTodos(next);
        void widgetSnapshotService.refreshFromSupabase(user.id);
      } catch (loadError) {
        console.warn('[TodoList] Failed to load todos', loadError);
        setIsLocalMode(true);
        setUserId(null);
        setTodos(createLocalSeed());
        setError(loadError instanceof Error ? loadError.message : 'Failed to load your to-do list. Showing local tasks.');
        void widgetSnapshotService.syncToNative(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadTodos();
    }, [loadTodos])
  );

  const dailyProgress = useMemo(() => calcProgress(visibleDailyTodos), [visibleDailyTodos]);
  const weeklyProgress = useMemo(() => calcProgress(todos.weekly), [todos.weekly]);

  const handleCreate = async (scope: TodoScope) => {
    const draft = scope === 'daily' ? dailyDraft : weeklyDraft;
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    const clearDraft = scope === 'daily' ? setDailyDraft : setWeeklyDraft;
    clearDraft('');

    if (!userId || isLocalMode) {
      const newItem = createLocalTodoRecord({
        scope,
        text: trimmed,
        plannedFor: scope === 'daily' ? currentDailyDateKey : null,
      });
      setTodos(prev => ({
        ...prev,
        [scope]: [newItem, ...prev[scope]],
      }));
      return;
    }

    try {
      const created = await todoServiceDB.createTodo(userId, scope, trimmed, {
        plannedFor: scope === 'daily' ? currentDailyDateKey : null,
      });
      setTodos(prev => ({
        ...prev,
        [scope]: [created, ...prev[scope]],
      }));
    } catch (createError) {
      console.warn('[TodoList] Failed to create todo', createError);
      setError(createError instanceof Error ? createError.message : 'Unable to add that task right now.');
    }
  };

  const handleToggle = async (scope: TodoScope, id: string, completed: boolean) => {
    const targetTodo = todos[scope].find(item => item.id === id);

    if (!targetTodo) {
      return;
    }

    const previousTodos = cloneScopedTodos(todos);
    const hasHabitLink = Boolean(targetTodo.isHabit && targetTodo.habitId && targetTodo.habitOccurredOn);
    const timestamp = new Date().toISOString();
    const completionTimestamp = completed ? timestamp : null;

    setTodos(prev => {
      const nextState = cloneScopedTodos(prev);
      nextState[scope] = nextState[scope].map(item =>
        item.id === id
          ? {
              ...item,
              completed,
              completedAt: completionTimestamp,
            }
          : item
      );
      return nextState;
    });

    if (completed) {
      setFocusDefaults(prev => {
        if (!prev[id]) {
          return prev;
        }
        const { [id]: removed, ...rest } = prev;
        void removed;
        persistFocusDefaults(rest);
        return rest;
      });
    }

    if (!userId || isLocalMode) {
      return;
    }

    try {
      const updated = await todoServiceDB.updateTodoCompletion(
        userId,
        id,
        completed,
        hasHabitLink ? { habitOccurredOn: targetTodo.habitOccurredOn } : {}
      );

      setTodos(prev => {
        const nextState = cloneScopedTodos(prev);
        nextState[scope] = nextState[scope].map(item => (item.id === id ? updated : item));
        return nextState;
      });

      if (hasHabitLink) {
        await habitServiceDB.setHabitCompletion({
          userId,
          habitId: targetTodo.habitId as string,
          occurredOn: targetTodo.habitOccurredOn as string,
          completed,
          todoId: targetTodo.id,
        });
        await widgetSnapshotService.refreshFromSupabase(userId);
      }
    } catch (updateError) {
      console.warn('[TodoList] Failed to update todo', updateError);
      setError(updateError instanceof Error ? updateError.message : 'Unable to update that task.');
      setTodos(previousTodos);
    }
  };

  const renderTodos = (items: TodoRecord[], scope: TodoScope) => (
    items.length === 0 ? (
      <Text style={styles.emptyState}>Add your first task to get started.</Text>
    ) : (
      items.map(item => {
        const defaults = focusDefaults[item.id];
        const focusLabel = defaults ? 'Quick focus' : 'Focus';
        const focusHint = defaults ? `${defaults.durationMin} min` : 'Set timer';
        return (
        <View key={item.id} style={[styles.todoItem, item.completed && styles.todoItemDone]}>
          <TouchableOpacity
            style={[styles.todoContent, item.completed && styles.todoContentDone]}
            onPress={() => handleToggle(scope, item.id, !item.completed)}
            activeOpacity={0.9}
          >
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.todoText, item.completed && styles.todoTextDone]}>{item.text}</Text>
          </TouchableOpacity>
          {!item.completed && (
            <View style={styles.todoActions}>
              <TouchableOpacity
                style={styles.focusButton}
                activeOpacity={0.85}
                onPress={() => handleQuickStart(item)}
              >
                <Text style={styles.focusButtonText}>{focusLabel}</Text>
                <Text style={styles.focusButtonSubtext}>{focusHint}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.planButton}
                activeOpacity={0.85}
                onPress={() => handlePlanTodo(item)}
              >
                <Text style={styles.planButtonText}>Plan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
      })
    )
  );

  const showLoader = loading && !refreshing;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadTodos({ withSpinner: true })} tintColor="#94a3b8" />
          }
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10} activeOpacity={0.9}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>To-Do Lists</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('HabitGrid')}
              style={styles.habitShortcut}
              activeOpacity={0.85}
            >
              <Text style={styles.habitShortcutText}>Habits</Text>
            </TouchableOpacity>
          </View>

          {!capability.authorized || !capability.shieldsAvailable ? (
            <WatercolorCard style={styles.permissionCard}>
              <Text style={styles.permissionText}>
                Blocking requires screen-time permissions. Open the weekly planner to grant access.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={() => navigation.navigate('BlockingPermissions')}
                activeOpacity={0.85}
              >
                <Text style={styles.permissionButtonText}>Open permissions</Text>
              </TouchableOpacity>
            </WatercolorCard>
          ) : null}

          {activeTask ? (
            <WatercolorCard style={styles.activeTaskCard}>
              <View>
                <Text style={styles.activeTaskLabel}>Focus timer running</Text>
                <Text style={styles.activeTaskTitle}>{activeTask.task.title}</Text>
                <Text style={styles.activeTaskMeta}>
                  Block set: {activeTaskBlockSet?.name ?? 'Default'} • Started {new Date(activeTask.startedAt).toLocaleTimeString()}
                </Text>
              </View>
              <TouchableOpacity style={styles.stopButton} onPress={handleStopActiveFocus} activeOpacity={0.85}>
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </WatercolorCard>
          ) : null}

          <View style={styles.progressRow}>
            <ProgressCard
              title="Daily Focus"
              metrics={`${dailyProgress.completed}/${dailyProgress.total}`}
              percent={dailyProgress.percent}
              hint={dailyProgress.percent === 100 ? 'Daily streak secured.' : 'Ship one more win.'}
              variant="left"
            />
            <ProgressCard
              title="Weekly Momentum"
              metrics={`${weeklyProgress.completed}/${weeklyProgress.total}`}
              percent={weeklyProgress.percent}
              hint={weeklyProgress.percent === 100 ? 'Week locked in.' : 'Keep stacking progress.'}
            />
          </View>

          <WatercolorCard style={styles.plannerCard}>
            <View style={styles.plannerCopy}>
              <Text style={styles.plannerCardTitle}>Weekly focus planner</Text>
              <Text style={styles.plannerCardSubtitle}>Create recurring focus windows tied to your block sets.</Text>
            </View>
            <TouchableOpacity style={styles.plannerOpenButton} onPress={handleOpenPlanner} activeOpacity={0.9}>
              <Text style={styles.plannerOpenText}>Open</Text>
            </TouchableOpacity>
          </WatercolorCard>

          {showLoader ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#0ea5e9" size="large" />
              <Text style={styles.loadingText}>Loading your tasks...</Text>
            </View>
          ) : null}

          {error && !showLoader ? (
            <WatercolorCard style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </WatercolorCard>
          ) : null}

          <TodoSection
            title={dailySectionTitle}
            subtitle={dailySubtitle}
            headerActions={
              <View style={styles.dayNav}>
                <TouchableOpacity
                  onPress={() => handleShiftDailyDate(-1)}
                  style={styles.dayNavButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dayNavIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.dayNavLabel}>{dayNavLabel}</Text>
                <TouchableOpacity
                  onPress={() => handleShiftDailyDate(1)}
                  style={styles.dayNavButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dayNavIcon}>→</Text>
                </TouchableOpacity>
              </View>
            }
            inputValue={dailyDraft}
            onChangeText={setDailyDraft}
            onAdd={() => handleCreate('daily')}
            disabled={false}
          >
            {renderTodos(visibleDailyTodos, 'daily')}
          </TodoSection>

          <TodoSection
            title="Weekly Targets"
            subtitle="Momentum you’ll build this week"
            inputValue={weeklyDraft}
            onChangeText={setWeeklyDraft}
            onAdd={() => handleCreate('weekly')}
            disabled={false}
          >
            {renderTodos(todos.weekly, 'weekly')}
          </TodoSection>

          <WatercolorCard style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipTitle}>Momentum tip</Text>
            <Text style={styles.tipText}>
              Block time for the scariest task first. Once it’s shipped, the rest of the list feels light.
            </Text>
          </WatercolorCard>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      <Modal visible={focusPlanner.visible} animationType="fade" transparent onRequestClose={closeFocusPlanner}>
        <View style={styles.plannerOverlay}>
          <WatercolorCard style={styles.plannerContainer}>
            <View style={styles.plannerHeader}>
              <View>
                <Text style={styles.plannerTitle}>Start focus timer</Text>
                <Text style={styles.plannerSubtitle}>
                  {focusPlanner.todo
                    ? `Lock a ${focusPlanner.durationMin}-min block for “${focusPlanner.todo.text}”`
                    : 'Pick a task to lock a focused sprint.'}
                </Text>
              </View>
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>{focusPlanner.todo ? 'Task selected' : 'No task yet'}</Text>
              </View>
            </View>

            <View style={styles.plannerGroup}>
              <Text style={styles.plannerGroupTitle}>Duration</Text>
              <View style={styles.plannerOptionRow}>
                {durationOptions.map(option => {
                  const isActive = option === focusPlanner.durationMin;
                  return (
                    <WatercolorButton
                      key={option}
                      color={isActive ? 'yellow' : 'neutral'}
                      onPress={() => handleSelectDuration(option)}
                      style={[styles.durationButton, isActive && styles.durationButtonActive]}
                    >
                      <Text style={[styles.durationButtonText, isActive && styles.durationButtonTextActive]}>{option} min</Text>
                    </WatercolorButton>
                  );
                })}
              </View>
            </View>

            <View style={styles.plannerGroup}>
              <View style={styles.plannerGroupHeader}>
                <Text style={styles.plannerGroupTitle}>Block set</Text>
                <TouchableOpacity onPress={openBlockSetManager} activeOpacity={0.85}>
                  <Text style={styles.plannerManageLink}>Manage</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.blockSetList}>
                {blockSetOptions.map(set => {
                  const isActive = set.id === focusPlanner.blockSetId;
                  return (
                    <WatercolorCard
                      key={set.id}
                      style={[styles.blockSetCard, isActive && styles.blockSetCardActive]}
                      backgroundColor={isActive ? '#fff9db' : '#fff'}
                      padding={SPACING.space_3}
                    >
                      <TouchableOpacity onPress={() => handleSelectBlockSet(set.id)} activeOpacity={0.9}>
                        <View style={styles.blockSetRow}>
                          <View style={[styles.blockSetEmojiWrap, isActive && styles.blockSetEmojiWrapActive]}>
                            <Text style={styles.blockSetEmoji}>{set.blockedEmoji}</Text>
                          </View>
                          <View style={styles.blockSetDetails}>
                            <Text style={styles.blockSetName}>{set.name}</Text>
                            <Text style={styles.blockSetMessage} numberOfLines={2}>
                              {set.blockedMessage}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </WatercolorCard>
                  );
                })}
              </View>
            </View>

            <View style={styles.plannerActions}>
              <WatercolorButton color="neutral" onPress={closeFocusPlanner} style={styles.plannerCancel}>
                <Text style={styles.plannerCancelText}>Cancel</Text>
              </WatercolorButton>
              <WatercolorButton color="yellow" onPress={handleLaunchFocus} style={styles.plannerPrimary}>
                <Text style={styles.plannerPrimaryText}>Start timer</Text>
              </WatercolorButton>
            </View>
          </WatercolorCard>
        </View>
      </Modal>

      <Modal
        visible={blockSetManager.visible}
        animationType="fade"
        transparent
        onRequestClose={closeBlockSetManager}
      >
        <View style={styles.managerOverlay}>
          <View style={styles.managerContainer}>
            {blockSetManager.mode === 'list' ? (
              <>
                <Text style={styles.managerTitle}>Manage block sets</Text>
                <ScrollView style={styles.managerScroll} contentContainerStyle={styles.managerScrollContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.managerSection}>
                    <View style={styles.managerSectionHeader}>
                      <Text style={styles.managerSectionTitle}>Your sets</Text>
                      <TouchableOpacity
                        style={styles.managerSecondaryButton}
                        onPress={() => beginBlockSetEdit(null)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.managerSecondaryText}>Create new</Text>
                      </TouchableOpacity>
                    </View>
                    {customBlockSets.length ? (
                      customBlockSets.map(set => (
                        <View key={set.id} style={styles.managerItem}>
                          <View style={styles.managerItemLeft}>
                            <Text style={styles.managerItemEmoji}>{set.blockedEmoji ?? '🛡️'}</Text>
                            <View style={styles.managerItemMeta}>
                              <Text style={styles.managerItemName}>{set.name}</Text>
                              <Text style={styles.managerItemMessage} numberOfLines={2}>
                                {set.blockedMessage || DEFAULT_BLOCK_MESSAGE}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.managerItemActions}>
                            <TouchableOpacity
                              style={styles.managerActionButton}
                              onPress={() => {
                                setFocusPlanner(prev => ({ ...prev, blockSetId: set.id }));
                                closeBlockSetManager();
                              }}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.managerActionText}>Use</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.managerActionButton}
                              onPress={() => beginBlockSetEdit(set)}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.managerActionText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.managerActionButton}
                              onPress={() => handlePickApps(set.id)}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.managerActionText}>Apps</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.managerActionButton, styles.managerActionDestructive]}
                              onPress={() => handleRemoveBlockSetRequest(set)}
                              activeOpacity={0.85}
                            >
                              <Text style={[styles.managerActionText, styles.managerActionDestructiveText]}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.managerEmptyText}>Create a custom set to reuse your favorite block list.</Text>
                    )}
                  </View>

                  <View style={styles.managerSection}>
                    <Text style={styles.managerSectionTitle}>Quick add presets</Text>
                    <Text style={styles.managerSectionHint}>Duplicate a preset and tweak it to your liking.</Text>
                    {PRESET_TEMPLATE_ENTRIES.map(([templateId, template]) => (
                      <TouchableOpacity
                        key={templateId}
                        style={styles.managerPresetCard}
                        onPress={() => handleUsePreset(templateId)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.managerItemLeft}>
                          <Text style={styles.managerItemEmoji}>{template.blockedEmoji ?? '🛡️'}</Text>
                          <View style={styles.managerItemMeta}>
                            <Text style={styles.managerItemName}>{template.name}</Text>
                            <Text style={styles.managerItemMessage} numberOfLines={2}>
                              {template.blockedMessage || DEFAULT_BLOCK_MESSAGE}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.managerPresetAdd}>Add</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <TouchableOpacity style={styles.managerCloseButton} onPress={closeBlockSetManager} activeOpacity={0.85}>
                  <Text style={styles.managerCloseText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.managerTitle}>{blockSetManager.editingId ? 'Edit block set' : 'Create block set'}</Text>
                <ScrollView style={styles.managerScroll} contentContainerStyle={styles.managerScrollContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.managerLabel}>Name</Text>
                  <TextInput
                    style={styles.managerInput}
                    placeholder="Deep Work Sprint"
                    placeholderTextColor="#94a3b8"
                    value={blockSetManager.name}
                    onChangeText={text => updateBlockSetManager({ name: text })}
                  />

                  <Text style={styles.managerLabel}>Emoji</Text>
                  <TextInput
                    style={styles.managerEmojiInput}
                    placeholder="🛡️"
                    placeholderTextColor="#94a3b8"
                    value={blockSetManager.emoji}
                    onChangeText={text => updateBlockSetManager({ emoji: text.trim().slice(0, 2) })}
                    maxLength={2}
                  />

                  <Text style={styles.managerLabel}>Shield message</Text>
                  <TextInput
                    style={styles.managerMessageInput}
                    placeholder={DEFAULT_BLOCK_MESSAGE}
                    placeholderTextColor="#94a3b8"
                    value={blockSetManager.message}
                    multiline
                    onChangeText={text => updateBlockSetManager({ message: text })}
                  />

                  <Text style={styles.managerLabel}>Block screen preview</Text>
                  <View style={[styles.previewCard, { backgroundColor: blockSetManager.backgroundColor || DEFAULT_BLOCK_BACKGROUND }]}>
                    <Text style={styles.previewEmoji}>{blockSetManager.emoji || '🛡️'}</Text>
                    <Text style={styles.previewMessage}>{blockSetManager.message || DEFAULT_BLOCK_MESSAGE}</Text>
                  </View>

                  <Text style={styles.managerHint}>Background color</Text>
                  <ColorSpherePicker
                    value={blockSetManager.backgroundColor || DEFAULT_BLOCK_BACKGROUND}
                    onChange={color => updateBlockSetManager({ backgroundColor: color })}
                    style={styles.managerColorPicker}
                  />
                  <View style={styles.managerColorMeta}>
                    <View
                      style={[
                        styles.managerColorPreview,
                        { backgroundColor: blockSetManager.backgroundColor || DEFAULT_BLOCK_BACKGROUND },
                      ]}
                    />
                    <Text style={styles.managerColorValue}>
                      {(blockSetManager.backgroundColor || DEFAULT_BLOCK_BACKGROUND).toUpperCase()}
                    </Text>
                  </View>

                  {blockSetManager.editingId ? (
                    <TouchableOpacity
                      style={styles.managerSecondaryButton}
                      onPress={() => handlePickApps(blockSetManager.editingId!)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.managerSecondaryText}>Choose blocked apps</Text>
                    </TouchableOpacity>
                  ) : null}
                </ScrollView>

                <View style={styles.managerFooterRow}>
                  <TouchableOpacity
                    style={styles.managerTertiaryButton}
                    onPress={() => setBlockSetManager(createBlockSetManagerState({ visible: true, mode: 'list' }))}
                    activeOpacity={0.85}
                    disabled={blockSetManager.saving}
                  >
                    <Text style={styles.managerTertiaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.managerPrimaryButton, blockSetManager.saving && styles.managerPrimaryButtonDisabled]}
                    onPress={handleSaveBlockSet}
                    activeOpacity={0.9}
                    disabled={blockSetManager.saving}
                  >
                    <Text style={styles.managerPrimaryText}>{blockSetManager.saving ? 'Saving…' : 'Save block set'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProgressCard({ title, metrics, percent, hint, variant }: { title: string; metrics: string; percent: number; hint: string; variant?: 'left' | 'right' }) {
  return (
    <View style={[styles.progressCard, variant === 'left' && styles.progressCardLeft]}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>{title}</Text>
        <Text style={styles.progressMetrics}>{metrics}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.progressHint}>{hint}</Text>
    </View>
  );
}

function TodoSection({
  title,
  subtitle,
  headerActions,
  inputValue,
  onChangeText,
  onAdd,
  children,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  headerActions?: React.ReactNode;
  inputValue: string;
  onChangeText: (text: string) => void;
  onAdd: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        {headerActions}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          placeholder="Add an item"
          placeholderTextColor="#94a3b8"
          value={inputValue}
          onChangeText={onChangeText}
          onSubmitEditing={onAdd}
          returnKeyType="done"
          editable={!disabled}
        />
        <TouchableOpacity
          style={[styles.addButton, disabled && styles.addButtonDisabled]}
          onPress={onAdd}
          activeOpacity={0.9}
          disabled={disabled}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.todoList}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_3,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 30,
    color: '#1f2937',
  },
  habitShortcut: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  habitShortcutText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  permissionCard: {
    borderRadius: 24,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    padding: SPACING.space_4,
    backgroundColor: '#fff8e1',
    gap: SPACING.space_2,
  },
  permissionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  permissionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fde68a',
  },
  permissionButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  progressRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
  },
  progressCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  progressCardLeft: {
    marginRight: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
  },
  progressMetrics: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#93c5fd',
  },
  progressHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#94a3b8',
    marginTop: SPACING.space_1,
  },
  plannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.space_3,
  },
  plannerCopy: {
    flex: 1,
    gap: 4,
  },
  plannerCardTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  plannerCardSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  plannerOpenButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fef9c3',
  },
  plannerOpenText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  loadingText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
  },
  errorBanner: {
    borderRadius: 24,
    borderWidth: 1.6,
    borderColor: '#b91c1c',
    padding: SPACING.space_4,
    backgroundColor: '#fee2e2',
  },
  errorText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#b91c1c',
  },
  section: {
    borderRadius: 28,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    padding: SPACING.space_4,
    backgroundColor: '#fff',
    marginBottom: SPACING.space_4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_3,
  },
  sectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  sectionSubtitle: {
    color: '#475569',
    fontSize: 16,
    marginTop: SPACING.space_1,
  },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  dayNavIcon: {
    fontSize: 18,
    color: '#1f2937',
  },
  dayNavLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: SPACING.space_3,
  },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_3,
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    color: '#1f2937',
    fontSize: 16,
    marginRight: SPACING.space_3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    },
  inputDisabled: {
    opacity: 0.4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fde68a',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addIcon: {
    fontSize: 22,
    color: '#1f2937',
    fontWeight: '700',
  },
  todoList: {},
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.space_4,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    marginBottom: SPACING.space_3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todoContentDone: {
    opacity: 0.5,
  },
  todoItemDone: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  checkmark: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  todoText: {
    flex: 1,
    color: '#1f2937',
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'PatrickHand-Regular',
  },
  todoTextDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  todoActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  focusButton: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fde68a',
  },
  focusButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  focusButtonSubtext: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  planButton: {
    paddingHorizontal: SPACING.space_2,
    paddingVertical: 4,
  },
  planButtonText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 16,
  },
  emptyState: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: SPACING.space_3,
    fontFamily: 'PatrickHand-Regular',
  },
  tipCard: {
    borderRadius: 24,
    borderWidth: 1.6,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_4,
  },
  tipIcon: {
    fontSize: 28,
    marginBottom: SPACING.space_2,
  },
  tipTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
    marginBottom: SPACING.space_1,
  },
  tipText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'left',
    lineHeight: 20,
    fontFamily: 'PatrickHand-Regular',
  },
  activeTaskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  activeTaskLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#94a3b8',
  },
  activeTaskTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
    marginTop: SPACING.space_1,
  },
  activeTaskMeta: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    marginTop: SPACING.space_1,
  },
  stopButton: {
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  stopButtonText: {
    color: '#b91c1c',
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
  plannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 14, 23, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_4,
  },
  plannerContainer: {
    width: '100%',
    borderRadius: 32,
    padding: SPACING.space_3,
    gap: SPACING.space_4,
  },
  plannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plannerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 26,
    color: '#111827',
  },
  plannerSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    marginTop: 4,
  },
  taskBadge: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#eef2ff',
  },
  taskBadgeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  plannerGroup: {
    gap: SPACING.space_2,
  },
  plannerGroupTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  plannerGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  plannerManageLink: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  plannerOptionRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  durationButton: {
    flex: 1,
  },
  durationButtonActive: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  durationButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  durationButtonTextActive: {
    color: '#1f2937',
  },
  blockSetList: {
    gap: SPACING.space_2,
  },
  blockSetCard: {
    borderRadius: 20,
    borderWidth: 1.4,
    borderColor: '#1f2937',
  },
  blockSetCardActive: {
    borderColor: '#f59e0b',
  },
  blockSetRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    alignItems: 'center',
  },
  blockSetEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  blockSetEmojiWrapActive: {
    backgroundColor: '#fee2e2',
  },
  blockSetEmoji: {
    fontSize: 24,
  },
  blockSetDetails: {
    flex: 1,
    gap: SPACING.space_1,
  },
  blockSetName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  blockSetNameActive: {
    color: '#1f2937',
  },
  blockSetMessage: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
  },
  plannerActions: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  plannerCancel: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: SPACING.space_3,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  plannerCancelText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  plannerPrimary: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: SPACING.space_3,
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#93c5fd',
  },
  plannerPrimaryText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  managerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 15, 30, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_5,
  },
  managerContainer: {
    borderRadius: 24,
    padding: SPACING.space_4,
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    maxHeight: '85%',
    gap: SPACING.space_3,
  },
  managerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
    textAlign: 'center',
  },
  managerScroll: {
    maxHeight: 480,
  },
  managerScrollContent: {
    paddingBottom: SPACING.space_4,
    gap: SPACING.space_4,
  },
  managerSection: {
    gap: SPACING.space_3,
  },
  managerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  managerSectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  managerSectionHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  managerLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
    marginBottom: SPACING.space_1,
  },
  managerInput: {
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
    marginBottom: SPACING.space_3,
    backgroundColor: '#fff',
  },
  managerEmojiInput: {
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_2,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: SPACING.space_3,
    backgroundColor: '#fff',
  },
  managerMessageInput: {
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
    minHeight: 96,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    marginBottom: SPACING.space_3,
  },
  previewCard: {
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    padding: SPACING.space_3,
    marginBottom: SPACING.space_3,
    gap: SPACING.space_2,
  },
  previewEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  previewMessage: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  managerHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    marginBottom: SPACING.space_2,
  },
  managerColorPicker: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    marginBottom: SPACING.space_2,
  },
  managerColorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    marginBottom: SPACING.space_3,
  },
  managerColorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  managerColorValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  managerSecondaryButton: {
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    backgroundColor: '#fff',
  },
  managerSecondaryText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#1f2937',
  },
  managerItem: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_3,
    gap: SPACING.space_3,
  },
  managerItemLeft: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    alignItems: 'center',
  },
  managerItemEmoji: {
    fontSize: 32,
  },
  managerItemMeta: {
    flex: 1,
    gap: 4,
  },
  managerItemName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  managerItemMessage: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  managerItemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  managerActionButton: {
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    backgroundColor: '#fff',
  },
  managerActionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  managerActionDestructive: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  managerActionDestructiveText: {
    color: '#F43F5E',
  },
  managerEmptyText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  managerPresetCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  managerPresetAdd: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#0ea5e9',
  },
  managerCloseButton: {
    marginTop: SPACING.space_4,
    alignSelf: 'center',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  managerCloseText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#1f2937',
  },
  managerFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.space_3,
    marginTop: SPACING.space_4,
  },
  managerTertiaryButton: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
  },
  managerTertiaryText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#64748b',
  },
  managerPrimaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: SPACING.space_3,
    backgroundColor: '#93c5fd',
    alignItems: 'center',
  },
  managerPrimaryButtonDisabled: {
    opacity: 0.5,
  },
  managerPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
