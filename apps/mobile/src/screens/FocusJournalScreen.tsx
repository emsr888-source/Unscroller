import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import { SPACING } from '@/core/theme/spacing';
import { COLORS } from '@/core/theme/colors';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { formatDateKey, selectTasks, selectTasksForDate, usePlannerStore } from '@/features/planner/plannerStore';
import {
  DEFAULT_BLOCK_SET_ID,
  defaultBlockSet,
  selectBlockSets,
  useBlockingStore,
} from '@/features/blocking/blockingStore';
import focusJournalService, { FocusJournalEntryRecord } from '@/services/focusJournalService.database';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { TodoScope } from '@/services/todoService.database';
import habitServiceDB, { HabitDefinitionRecord, HabitWithEvents, createLocalHabitSeed } from '@/services/habitService.database';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = NativeStackScreenProps<RootStackParamList, 'FocusJournal'>;

const normalizeTime = (input: string, fallback: string) => {
  const trimmed = input.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) {
    return fallback;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return fallback;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return start;
};

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const DEFAULT_HABIT_COLOR = '#4DA1FF';

type HabitOption = Pick<HabitDefinitionRecord, 'id' | 'title' | 'color' | 'scope'>;

const timeStringToDate = (value: string, fallback: string): Date => {
  const normalized = normalizeTime(value, fallback);
  const [hours, minutes] = normalized.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

const dateToTimeString = (value: Date): string => {
  const hours = value.getHours().toString().padStart(2, '0');
  const minutes = value.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const toHabitOptions = (bundles: HabitWithEvents[]): HabitOption[] =>
  bundles.map(bundle => ({
    id: bundle.definition.id,
    title: bundle.definition.title,
    color: bundle.definition.color ?? DEFAULT_HABIT_COLOR,
    scope: bundle.definition.scope,
  }));

export default function FocusJournalScreen({ navigation, route }: Props) {
  const [weekAnchor, setWeekAnchor] = useState(() => getStartOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedDateKey = formatDateKey(selectedDate);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const blockSets = useBlockingStore(selectBlockSets);
  const blockSetOptions = useMemo(
    () => (blockSets.length ? blockSets : [defaultBlockSet]),
    [blockSets]
  );
  const defaultBlockSetId = blockSetOptions[0]?.id ?? DEFAULT_BLOCK_SET_ID;

  const tasksForDay = usePlannerStore(state => selectTasksForDate(state, selectedDateKey));
  const tasksIndex = usePlannerStore(selectTasks);
  const upsertTask = usePlannerStore(state => state.upsertTask);
  const toggleTask = usePlannerStore(state => state.toggleTask);
  const removeTask = usePlannerStore(state => state.removeTask);
  const setTasks = usePlannerStore(state => state.setTasks);

  const [draft, setDraft] = useState({
    title: '',
    startTime: '08:00',
    endTime: '10:00',
    notes: '',
    blockSetId: defaultBlockSetId,
    habitId: null as string | null,
    recurrenceDays: [] as number[],
  });
  const prefillHandledRef = useRef(false);
  const [iosPickerField, setIosPickerField] = useState<'start' | 'end' | null>(null);
  const [habitOptions, setHabitOptions] = useState<HabitOption[]>([]);
  const [habitLoading, setHabitLoading] = useState(false);
  const [habitError, setHabitError] = useState<string | null>(null);

  const toPlannerTask = useCallback(
    (entry: FocusJournalEntryRecord) => ({
      id: entry.id,
      title: entry.title,
      date: entry.entryDate,
      startTime: entry.startTime ?? undefined,
      endTime: entry.endTime ?? undefined,
      blockSetId: entry.blockSetId ?? undefined,
      notes: entry.notes ?? undefined,
      completed: entry.completed,
      todoId: entry.todoId ?? null,
      habitId: entry.habitId ?? null,
      habitOccurredOn: entry.habitOccurredOn ?? null,
      isHabit: entry.isHabit ?? Boolean(entry.habitId),
    }),
    []
  );

  const hydrateEntries = useCallback(
    (entries: FocusJournalEntryRecord[]) => {
      setTasks(entries.map(toPlannerTask));
    },
    [setTasks, toPlannerTask]
  );

  useEffect(() => {
    let cancelled = false;
    const loadEntries = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        setLoading(false);
        return;
      }
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user?.id) {
          setLoading(false);
          return;
        }
        if (cancelled) {
          return;
        }
        setUserId(user.id);
        const entries = await focusJournalService.fetchEntries(user.id);
        if (!cancelled) {
          hydrateEntries(entries);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('[FocusJournal] Failed to sync entries', error);
          setRemoteError('Unable to sync with Supabase. Showing local entries.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void loadEntries();
    return () => {
      cancelled = true;
    };
  }, [hydrateEntries]);

  const loadHabits = useCallback(async () => {
    setHabitLoading(true);
    setHabitError(null);
    if (!isSupabaseConfigured() || !supabase) {
      setHabitOptions(toHabitOptions(createLocalHabitSeed()));
      setHabitLoading(false);
      return;
    }
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user?.id) {
        setHabitOptions(toHabitOptions(createLocalHabitSeed()));
        return;
      }
      const bundles = await habitServiceDB.fetchHabitsWithEvents(user.id, { includeArchived: false });
      setHabitOptions(toHabitOptions(bundles));
    } catch (error) {
      console.warn('[FocusJournal] Failed to load habits', error);
      setHabitError('Unable to load repetitive habits. Showing local examples.');
      setHabitOptions(toHabitOptions(createLocalHabitSeed()));
    } finally {
      setHabitLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  useEffect(() => {
    if (prefillHandledRef.current) {
      return;
    }
    const prefillTask = route.params?.prefillTask;
    if (prefillTask) {
      prefillHandledRef.current = true;
      setDraft(prev => ({
        ...prev,
        title: prefillTask.title ?? '',
        blockSetId:
          prefillTask.blockSetId && blockSetOptions.some(set => set.id === prefillTask.blockSetId)
            ? prefillTask.blockSetId
            : prev.blockSetId,
      }));
    }
  }, [blockSetOptions, route.params?.prefillTask]);

  useEffect(() => {
    setDraft(prev => ({
      ...prev,
      blockSetId: blockSetOptions.some(set => set.id === prev.blockSetId)
        ? prev.blockSetId
        : defaultBlockSetId,
    }));
  }, [blockSetOptions, defaultBlockSetId]);

  const handleToggleRecurrenceDay = useCallback((dayIndex: number) => {
    setDraft(prev => {
      const exists = prev.recurrenceDays.includes(dayIndex);
      const nextDays = exists ? prev.recurrenceDays.filter(day => day !== dayIndex) : [...prev.recurrenceDays, dayIndex];
      return {
        ...prev,
        recurrenceDays: nextDays.sort(),
      };
    });
  }, []);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekAnchor);
      date.setDate(weekAnchor.getDate() + index);
      return date;
    });
  }, [weekAnchor]);

  const weekLabel = useMemo(() => {
    const end = new Date(weekAnchor);
    end.setDate(weekAnchor.getDate() + 6);
    const startLabel = weekAnchor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${startLabel} – ${endLabel}`;
  }, [weekAnchor]);

  const handleShiftWeek = (direction: -1 | 1) => {
    const next = new Date(weekAnchor);
    next.setDate(weekAnchor.getDate() + direction * 7);
    setWeekAnchor(next);
    setSelectedDate(next);
  };

  const applyTimeSelection = (field: 'start' | 'end', date?: Date) => {
    if (!date) {
      return;
    }
    const formatted = dateToTimeString(date);
    setDraft(prev => ({
      ...prev,
      startTime: field === 'start' ? formatted : prev.startTime,
      endTime: field === 'end' ? formatted : prev.endTime,
    }));
    if (Platform.OS === 'ios') {
      setIosPickerField(null);
    }
  };

  const handleTimePress = (field: 'start' | 'end') => {
    const currentValue = field === 'start' ? draft.startTime : draft.endTime;
    const fallback = field === 'start' ? '08:00' : '10:00';
    const pickerDate = timeStringToDate(currentValue, fallback);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerDate,
        mode: 'time',
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, date) => {
          if (event.type === 'set' && date) {
            applyTimeSelection(field, date);
          }
        },
      });
      return;
    }

    setIosPickerField(prev => (prev === field ? null : field));
  };

  const handleAddEntry = async () => {
    if (syncing) {
      return;
    }
    const trimmed = draft.title.trim();
    if (!trimmed) {
      Alert.alert('Title required', 'Describe what you plan to do.');
      return;
    }
    const start = normalizeTime(draft.startTime, '08:00');
    const end = normalizeTime(draft.endTime, '10:00');
    const recurrenceRule = draft.recurrenceDays.length
      ? {
          frequency: 'weekly' as const,
          daysOfWeek: [...draft.recurrenceDays].sort(),
        }
      : null;

    const weekStart = getStartOfWeek(selectedDate);
    const primaryDay = selectedDate.getDay();
    const recurrenceDays = recurrenceRule?.daysOfWeek ?? [];
    const targetDays = recurrenceDays.length ? recurrenceDays : [primaryDay];
    const plannedDates = Array.from(
      new Set(
        targetDays.map(day => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + day);
          return formatDateKey(date);
        })
      )
    );
    if (!plannedDates.includes(selectedDateKey)) {
      plannedDates.push(selectedDateKey);
    }

    const optimisticIds = plannedDates.map(dateKey =>
      upsertTask({
        id: `temp-${dateKey}-${Date.now()}`,
        title: trimmed,
        date: dateKey,
        startTime: start,
        endTime: end,
        blockSetId: draft.blockSetId,
        emoji: '',
        notes: draft.notes,
        completed: false,
        habitId: draft.habitId,
        habitOccurredOn: draft.habitId ? dateKey : null,
        isHabit: Boolean(draft.habitId),
        recurrenceRule,
      })
    );

    setDraft(prev => ({
      ...prev,
      title: '',
      notes: '',
      recurrenceDays: prev.recurrenceDays,
    }));

    if (!userId) {
      return;
    }

    setSyncing(true);
    try {
      const blockSet = blockSetOptions.find(set => set.id === draft.blockSetId) ?? defaultBlockSet;
      for (let index = 0; index < plannedDates.length; index += 1) {
        const dateKey = plannedDates[index];
        const optimisticId = optimisticIds[index];
        const entry = await focusJournalService.createEntry(userId, {
          entryDate: dateKey,
          title: trimmed,
          startTime: start,
          endTime: end,
          notes: draft.notes || null,
          blockSetId: draft.blockSetId,
          blockSetSnapshot: {
            id: blockSet.id,
            name: blockSet.name,
            emoji: blockSet.blockedEmoji,
            message: blockSet.blockedMessage,
            backgroundColor: blockSet.blockedBackgroundColor,
          },
          scope: 'weekly' as TodoScope,
          habitId: draft.habitId,
          habitOccurredOn: draft.habitId ? dateKey : null,
          isHabit: Boolean(draft.habitId),
        });
        removeTask(optimisticId);
        upsertTask(toPlannerTask(entry));
      }
    } catch (error) {
      console.warn('[FocusJournal] Unable to add entry', error);
      setRemoteError('Unable to sync with Supabase. These blocks are saved locally and will sync once you are back online.');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    toggleTask(taskId, completed);
    if (!userId) {
      return;
    }
    const target = tasksIndex[taskId];
    try {
      await focusJournalService.setEntryCompletion({
        entryId: taskId,
        completed,
        userId,
        todoId: target?.todoId ?? null,
      });
    } catch (error) {
      console.warn('[FocusJournal] Failed to update entry completion', error);
      toggleTask(taskId, !completed);
      Alert.alert('Unable to update entry', 'Please try again.');
    }
  };

  const handleRemoveTask = (taskId: string) => {
    Alert.alert('Remove entry?', 'This removes the scheduled session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!userId) {
            removeTask(taskId);
            return;
          }
          setSyncing(true);
          try {
            await focusJournalService.deleteEntry({ entryId: taskId, userId });
            removeTask(taskId);
          } catch (error) {
            console.warn('[FocusJournal] Failed to delete entry', error);
            Alert.alert('Unable to remove entry', 'Try again in a moment.');
          } finally {
            setSyncing(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Loading your focus calendar…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BlockerHub')} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <WatercolorCard style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <TouchableOpacity onPress={() => handleShiftWeek(-1)} hitSlop={10}>
              <Text style={styles.weekArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.weekLabel}>{weekLabel}</Text>
            <TouchableOpacity onPress={() => handleShiftWeek(1)} hitSlop={10}>
              <Text style={styles.weekArrow}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekDays}>
            {weekDates.map(date => {
              const key = formatDateKey(date);
              const isSelected = key === selectedDateKey;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.dayChip, isSelected && styles.dayChipActive]}
                  onPress={() => setSelectedDate(new Date(date))}
                >
                  <Text style={[styles.dayChipLabel, isSelected && styles.dayChipLabelActive]}>
                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dayChipNumber, isSelected && styles.dayChipLabelActive]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </WatercolorCard>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <WatercolorCard style={styles.taskCard}>
            <Text style={styles.sectionTitle}>{formatDayLabel(selectedDate)}</Text>
            {remoteError ? <Text style={styles.errorBanner}>{remoteError}</Text> : null}
            {tasksForDay.length === 0 ? (
              <Text style={styles.emptyText}>No sessions scheduled. Add one below.</Text>
            ) : (
              tasksForDay.map(task => {
                const blockSet = blockSetOptions.find(set => set.id === task.blockSetId) ?? defaultBlockSet;
                return (
                  <View key={task.id} style={styles.taskRow}>
                    <TouchableOpacity
                      style={[styles.taskCheckbox, task.completed && styles.taskCheckboxDone]}
                      onPress={() => void handleToggleTask(task.id, !task.completed)}
                      activeOpacity={0.9}
                    >
                      {task.completed ? <Text style={styles.checkmark}>✓</Text> : null}
                    </TouchableOpacity>
                    <View style={styles.taskDetails}>
                      <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
                      <Text style={styles.taskMeta}>
                        {task.startTime} – {task.endTime} · {blockSet.blockedEmoji ?? '🛡️'} {blockSet.name}
                      </Text>
                      {task.notes ? <Text style={styles.taskNotes}>{task.notes}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveTask(task.id)} style={styles.removeButton}>
                      <Text style={styles.removeText}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </WatercolorCard>

          <WatercolorCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Plan your time</Text>
            <Text style={styles.inputLabel}>Focus title</Text>
            <TextInput
              style={styles.input}
              placeholder="Write landing page copy"
              placeholderTextColor="#94a3b8"
              value={draft.title}
              onChangeText={text => setDraft(prev => ({ ...prev, title: text }))}
            />

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.inputLabel}>Start</Text>
                <TouchableOpacity style={[styles.input, styles.timePickerButton]} activeOpacity={0.85} onPress={() => handleTimePress('start')}>
                  <Text style={styles.timePickerText}>{draft.startTime}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeField}>
                <Text style={styles.inputLabel}>End</Text>
                <TouchableOpacity style={[styles.input, styles.timePickerButton]} activeOpacity={0.85} onPress={() => handleTimePress('end')}>
                  <Text style={styles.timePickerText}>{draft.endTime}</Text>
                </TouchableOpacity>
              </View>
            </View>
            {Platform.OS === 'ios' && iosPickerField ? (
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  mode="time"
                  display="spinner"
                  value={timeStringToDate(iosPickerField === 'start' ? draft.startTime : draft.endTime, iosPickerField === 'start' ? '08:00' : '10:00')}
                  onChange={(_event, date) => applyTimeSelection(iosPickerField, date)}
                  style={styles.iosPicker}
                />
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Focus mode</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.blockSetChips}>
              {blockSetOptions.map(option => {
                const isActive = option.id === draft.blockSetId;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.blockSetChip, isActive && styles.blockSetChipActive]}
                    onPress={() => setDraft(prev => ({ ...prev, blockSetId: option.id }))}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.blockSetEmoji}>{option.blockedEmoji ?? '🛡️'}</Text>
                    <Text style={[styles.blockSetName, isActive && styles.blockSetNameActive]}>{option.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>Link to a repetitive habit</Text>
            {habitError ? <Text style={styles.helperError}>{habitError}</Text> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.habitChipRow}>
              <TouchableOpacity
                style={[styles.habitChip, !draft.habitId && styles.habitChipActive]}
                onPress={() =>
                  setDraft(prev => ({
                    ...prev,
                    habitId: null,
                  }))
                }
                activeOpacity={0.85}
              >
                <Text style={[styles.habitChipLabel, !draft.habitId && styles.habitChipLabelActive]}>No habit link</Text>
              </TouchableOpacity>
              {habitOptions.map(option => {
                const selected = draft.habitId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.habitChip,
                      selected && {
                        borderColor: option.color ?? DEFAULT_HABIT_COLOR,
                        backgroundColor: `${(option.color ?? DEFAULT_HABIT_COLOR)}15`,
                      },
                    ]}
                    onPress={() =>
                      setDraft(prev => ({
                        ...prev,
                        habitId: option.id,
                      }))
                    }
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.habitChipLabel,
                        selected && { color: option.color ?? DEFAULT_HABIT_COLOR, fontWeight: '700' },
                      ]}
                    >
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {habitLoading ? <ActivityIndicator size="small" color="#0f172a" style={styles.habitLoader} /> : null}

            <Text style={styles.inputLabel}>Repeat on</Text>
            <View style={styles.recurrenceRow}>
              {WEEKDAY_LABELS.map((label, index) => {
                const initial = label[0];
                const selected = draft.recurrenceDays.includes(index);
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.recurrenceChip, selected && styles.recurrenceChipActive]}
                    onPress={() => handleToggleRecurrenceDay(index)}
                    activeOpacity={0.85}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text style={[styles.recurrenceChipLabel, selected && styles.recurrenceChipLabelActive]}>{initial}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.helperText}>Leave blank for a one-off block, or choose days to auto-repeat every week.</Text>

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Prep research, shut Slack, etc."
              placeholderTextColor="#94a3b8"
              value={draft.notes}
              onChangeText={text => setDraft(prev => ({ ...prev, notes: text }))}
              multiline
            />

            <WatercolorButton
              color="yellow"
              onPress={() => {
                void handleAddEntry();
              }}
            >
              <Text style={styles.buttonText}>{syncing ? 'Saving…' : 'Add to calendar'}</Text>
            </WatercolorButton>
          </WatercolorCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  weekCard: {
    marginHorizontal: SPACING.space_4,
    marginBottom: SPACING.space_3,
    padding: SPACING.space_3,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_3,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  weekArrow: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    paddingVertical: SPACING.space_1,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  dayChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  dayChipLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  dayChipLabelActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  dayChipNumber: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.space_2,
  },
  errorBanner: {
    fontSize: 13,
    color: '#b91c1c',
    marginBottom: SPACING.space_2,
  },
  taskCard: {
    padding: SPACING.space_4,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.space_2,
    marginBottom: SPACING.space_3,
  },
  taskCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  taskCheckboxDone: {
    backgroundColor: '#bbf7d0',
    borderColor: '#22c55e',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14532d',
  },
  taskDetails: {
    flex: 1,
    gap: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.TEXT_SECONDARY,
  },
  taskMeta: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  taskNotes: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  removeButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeText: {
    fontSize: 20,
    color: '#b91c1c',
  },
  formCard: {
    padding: SPACING.space_4,
    gap: SPACING.space_3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: 14,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    marginBottom: SPACING.space_3,
  },
  timeField: {
    flex: 1,
  },
  timePickerButton: {
    justifyContent: 'center',
  },
  timePickerText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  iosPicker: {
    marginTop: SPACING.space_2,
  },
  iosPickerContainer: {
    marginTop: SPACING.space_2,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    overflow: 'hidden',
  },
  blockSetChips: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    paddingVertical: SPACING.space_1,
  },
  blockSetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_1,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: 999,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
  },
  blockSetChipActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
  },
  blockSetEmoji: {
    fontSize: 16,
  },
  blockSetName: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  blockSetNameActive: {
    fontWeight: '600',
  },
  helperError: {
    fontSize: 12,
    color: '#b91c1c',
    marginBottom: 6,
  },
  habitChipRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    alignItems: 'center',
  },
  habitChip: {
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: 999,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  habitChipActive: {
    borderColor: '#0f172a',
    backgroundColor: '#e0f2fe',
  },
  habitChipLabel: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  habitChipLabelActive: {
    fontWeight: '600',
    color: '#0f172a',
  },
  habitLoader: {
    marginTop: 8,
  },
  recurrenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  recurrenceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  recurrenceChipActive: {
    borderColor: '#0f172a',
    backgroundColor: '#bfdbfe',
  },
  recurrenceChipLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  recurrenceChipLabelActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1917',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  loadingText: {
    marginTop: SPACING.space_2,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
});
