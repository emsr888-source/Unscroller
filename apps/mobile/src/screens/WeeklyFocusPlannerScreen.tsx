import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { nanoid } from 'nanoid/non-secure';
import {
  DEFAULT_BLOCK_SET_ID,
  defaultBlockSet,
  selectBlockSets,
  selectSchedules,
  useBlockingStore,
} from '@/features/blocking/blockingStore';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import type { Schedule } from '@unscroller/block-service';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = NativeStackScreenProps<RootStackParamList, 'WeeklyFocusPlanner'>;

type EditorState = {
  visible: boolean;
  editingId: string | null;
  name: string;
  blockSetId: string;
  days: Set<0 | 1 | 2 | 3 | 4 | 5 | 6>;
  startLocalTime: string;
  endLocalTime: string;
  saving: boolean;
};

const DAY_LABELS: Array<{ label: string; value: 0 | 1 | 2 | 3 | 4 | 5 | 6 }> = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const DEFAULT_START = '08:00';
const DEFAULT_END = '10:00';

const createEditorState = (blockSetId: string, overrides: Partial<EditorState> = {}): EditorState => ({
  visible: false,
  editingId: null,
  name: '',
  blockSetId,
  days: new Set([1, 2, 3, 4, 5]),
  startLocalTime: DEFAULT_START,
  endLocalTime: DEFAULT_END,
  saving: false,
  ...overrides,
});

const normalizeTime = (input: string, fallback: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!match) {
    return fallback;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return fallback;
  }
  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');
  return `${paddedHours}:${paddedMinutes}`;
};

const durationFromTimes = (startLocalTime: string, endLocalTime: string) => {
  const parseMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return 0;
    }
    return hours * 60 + minutes;
  };

  const start = parseMinutes(startLocalTime);
  const end = parseMinutes(endLocalTime);
  const diff = end - start;
  if (diff <= 0) {
    return 25;
  }
  return diff;
};

const formatDays = (days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>) => {
  if (!days.length) {
    return 'No days';
  }
  if (days.length === 7) {
    return 'Every day';
  }
  const ordered = [...days].sort((a, b) => a - b);
  return ordered.map(day => DAY_LABELS.find(item => item.value === day)?.label ?? '').join(' · ');
};

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

export default function WeeklyFocusPlannerScreen({ navigation, route }: Props) {
  const blockSets = useBlockingStore(selectBlockSets);
  const schedules = useBlockingStore(selectSchedules);
  const upsertSchedule = useBlockingStore(state => state.upsertSchedule);
  const removeSchedule = useBlockingStore(state => state.removeSchedule);
  const [nativeError, setNativeError] = useState<string | null>(null);

  const blockSetOptions = useMemo(() => (blockSets.length ? blockSets : [defaultBlockSet]), [blockSets]);
  const initialBlockSetId = blockSetOptions[0]?.id ?? DEFAULT_BLOCK_SET_ID;
  const prefillTask = route.params?.prefillTask;
  const prefillHandledRef = useRef(false);

  const [editor, setEditor] = useState<EditorState>(() => createEditorState(initialBlockSetId));
  const [iosPickerField, setIosPickerField] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    setEditor(prev => {
      if (prev.visible) {
        return prev;
      }
      return createEditorState(initialBlockSetId);
    });
  }, [initialBlockSetId]);

  useEffect(() => {
    if (prefillHandledRef.current || !prefillTask) {
      return;
    }
    prefillHandledRef.current = true;
    setEditor(
      createEditorState(prefillTask.blockSetId ?? initialBlockSetId, {
        visible: true,
        name: prefillTask.title,
      })
    );
  }, [initialBlockSetId, prefillTask]);

  const sortedSchedules = useMemo(() => {
    const list = [...schedules];
    return list.sort((a, b) => {
      const firstDay = a.days[0] ?? 0;
      const secondDay = b.days[0] ?? 0;
      if (firstDay !== secondDay) {
        return firstDay - secondDay;
      }
      return a.startLocalTime.localeCompare(b.startLocalTime);
    });
  }, [schedules]);

  const openEditor = (schedule?: Schedule) => {
    if (!schedule) {
      setEditor(createEditorState(initialBlockSetId, { visible: true }));
      return;
    }

    setEditor(
      createEditorState(schedule.blockSetId, {
        visible: true,
        editingId: schedule.id,
        name: schedule.name,
        days: new Set(schedule.days),
        startLocalTime: schedule.startLocalTime,
        endLocalTime: schedule.endLocalTime,
      })
    );
  };

  const handleSave = async () => {
    if (editor.days.size === 0) {
      Alert.alert('Choose days', 'Select at least one day for the schedule.');
      return;
    }

    const normalizedStart = normalizeTime(editor.startLocalTime, DEFAULT_START);
    const normalizedEnd = normalizeTime(editor.endLocalTime, DEFAULT_END);
    const payload: Schedule = {
      id: editor.editingId ?? nanoid(),
      name: editor.name.trim() || 'Focus block',
      blockSetId: editor.blockSetId,
      days: Array.from(editor.days).sort((a, b) => a - b) as Array<0 | 1 | 2 | 3 | 4 | 5 | 6>,
      startLocalTime: normalizedStart,
      endLocalTime: normalizedEnd,
    };

    setEditor(prev => ({ ...prev, saving: true }));

    try {
      await upsertSchedule(payload);
      setEditor(createEditorState(editor.blockSetId));
      setNativeError(null);
    } catch (error) {
      console.warn('[WeeklyPlanner] Failed to save schedule', error);
      const message = error instanceof Error ? error.message : 'Native scheduling unavailable; stored locally.';
      Alert.alert('Saved locally', message);
      setNativeError(message);
      setEditor(createEditorState(editor.blockSetId));
    }
  };

  const confirmRemove = (schedule: Schedule) => {
    Alert.alert('Remove schedule', `Remove ${schedule.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeSchedule(schedule.id).catch(error => {
            console.warn('[WeeklyPlanner] Failed to remove schedule', error);
            Alert.alert('Removed locally', 'Native schedule removal failed; it has been cleared from the planner.');
          });
        },
      },
    ]);
  };

  const toggleDay = (day: 0 | 1 | 2 | 3 | 4 | 5 | 6) => {
    setEditor(prev => {
      const nextDays = new Set(prev.days);
      if (nextDays.has(day)) {
        nextDays.delete(day);
      } else {
        nextDays.add(day);
      }
      return { ...prev, days: nextDays };
    });
  };

  const applyTimeSelection = (field: 'start' | 'end', date: Date | undefined) => {
    if (!date) {
      return;
    }
    const formatted = dateToTimeString(date);
    setEditor(prev => ({
      ...prev,
      startLocalTime: field === 'start' ? formatted : prev.startLocalTime,
      endLocalTime: field === 'end' ? formatted : prev.endLocalTime,
    }));
  };

  const handleTimePress = (field: 'start' | 'end') => {
    const currentValue = field === 'start' ? editor.startLocalTime : editor.endLocalTime;
    const pickerDate = timeStringToDate(currentValue, field === 'start' ? DEFAULT_START : DEFAULT_END);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerDate,
        mode: 'time',
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) {
            applyTimeSelection(field, date);
          }
        },
      });
      return;
    }

    setIosPickerField(prev => (prev === field ? null : field));
  };

  const handleStartFromSchedule = (schedule: Schedule) => {
    const durationMin = durationFromTimes(schedule.startLocalTime, schedule.endLocalTime);
    navigation.navigate('TaskTimer', {
      taskId: `${schedule.id}-${Date.now()}`,
      title: schedule.name,
      durationMin,
      blockSetId: schedule.blockSetId,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10} activeOpacity={0.85}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Weekly Focus Planner</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openEditor()} activeOpacity={0.9}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Schedule recurring focus blocks mapped to your block sets. Launch timers from any entry to jump straight into a session.
          </Text>

          {nativeError ? (
            <WatercolorCard style={styles.errorCard}>
              <Text style={styles.errorText}>{nativeError}</Text>
            </WatercolorCard>
          ) : null}

          {sortedSchedules.length === 0 ? (
            <WatercolorCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No weekly blocks yet</Text>
              <Text style={styles.emptySubtitle}>Add a block to keep your focus sessions consistent across the week.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => openEditor()} activeOpacity={0.9}>
                <Text style={styles.primaryButtonText}>Create block</Text>
              </TouchableOpacity>
            </WatercolorCard>
          ) : (
            sortedSchedules.map(schedule => {
              const blockSet = blockSetOptions.find(set => set.id === schedule.blockSetId) ?? defaultBlockSet;
              return (
                <WatercolorCard key={schedule.id} style={styles.scheduleCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardEmoji}>{blockSet.blockedEmoji ?? '🛡️'}</Text>
                      <View>
                        <Text style={styles.cardTitle}>{schedule.name}</Text>
                        <Text style={styles.cardMeta}>
                          {formatDays(schedule.days)} • {schedule.startLocalTime} - {schedule.endLocalTime}
                        </Text>
                        <Text style={styles.cardBlockSet}>Block set: {blockSet.name}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleStartFromSchedule(schedule)} style={styles.launchButton} activeOpacity={0.9}>
                      <Text style={styles.launchButtonText}>Start</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openEditor(schedule)} style={styles.actionButton} activeOpacity={0.85}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmRemove(schedule)} style={[styles.actionButton, styles.destructiveButton]} activeOpacity={0.85}>
                      <Text style={[styles.actionText, styles.destructiveText]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </WatercolorCard>
              );
            })
          )}
        </ScrollView>

        {editor.visible ? (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>{editor.editingId ? 'Edit schedule' : 'Add schedule'}</Text>

              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Morning deep work"
                placeholderTextColor="#94a3b8"
                value={editor.name}
                onChangeText={text => setEditor(prev => ({ ...prev, name: text }))}
              />

              <Text style={styles.modalLabel}>Block set</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.blockSetRow}>
                {blockSetOptions.map(option => {
                  const isActive = option.id === editor.blockSetId;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.blockSetChip, isActive && styles.blockSetChipActive]}
                      onPress={() => setEditor(prev => ({ ...prev, blockSetId: option.id }))}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.blockSetEmoji}>{option.blockedEmoji ?? '🛡️'}</Text>
                      <Text style={[styles.blockSetName, isActive && styles.blockSetNameActive]}>{option.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.modalLabel}>Days</Text>
              <View style={styles.dayRow}>
                {DAY_LABELS.map(day => {
                  const active = editor.days.has(day.value);
                  return (
                    <TouchableOpacity
                      key={day.value}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                      onPress={() => toggleDay(day.value)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.dayText, active && styles.dayTextActive]}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.modalLabel}>Start</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.timePickerButton]}
                    activeOpacity={0.85}
                    onPress={() => handleTimePress('start')}
                  >
                    <Text style={styles.timePickerText}>{editor.startLocalTime}</Text>
                  </TouchableOpacity>
                  {Platform.OS === 'ios' && iosPickerField === 'start' ? (
                    <DateTimePicker
                      mode="time"
                      display="spinner"
                      value={timeStringToDate(editor.startLocalTime, DEFAULT_START)}
                      onChange={(_event, date) => applyTimeSelection('start', date)}
                      style={styles.iosPicker}
                    />
                  ) : null}
                </View>
                <View style={styles.timeField}>
                  <Text style={styles.modalLabel}>End</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.timePickerButton]}
                    activeOpacity={0.85}
                    onPress={() => handleTimePress('end')}
                  >
                    <Text style={styles.timePickerText}>{editor.endLocalTime}</Text>
                  </TouchableOpacity>
                  {Platform.OS === 'ios' && iosPickerField === 'end' ? (
                    <DateTimePicker
                      mode="time"
                      display="spinner"
                      value={timeStringToDate(editor.endLocalTime, DEFAULT_END)}
                      onChange={(_event, date) => applyTimeSelection('end', date)}
                      style={styles.iosPicker}
                    />
                  ) : null}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setEditor(createEditorState(editor.blockSetId))}
                  disabled={editor.saving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, editor.saving && styles.primaryButtonDisabled]}
                  onPress={handleSave}
                  activeOpacity={0.9}
                  disabled={editor.saving}
                >
                  <Text style={styles.primaryButtonText}>{editor.saving ? 'Saving…' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
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
  addButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fde68a',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  subtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  errorCard: {
    borderRadius: 20,
    borderWidth: 1.6,
    borderColor: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: SPACING.space_4,
  },
  errorText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#b91c1c',
  },
  scheduleCard: {
    padding: SPACING.space_4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.space_3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  cardMeta: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
  },
  cardBlockSet: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  launchButton: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#e0f2fe',
  },
  launchButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.space_2,
    marginTop: SPACING.space_3,
  },
  actionButton: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  actionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#1f2937',
  },
  destructiveButton: {
    borderColor: '#f43f5e',
  },
  destructiveText: {
    color: '#f43f5e',
  },
  emptyCard: {
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  emptyTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  emptySubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: SPACING.space_2,
  },
  primaryButton: {
    borderRadius: 18,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_3,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#93c5fd',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_4,
  },
  modal: {
    width: '100%',
    borderRadius: 24,
    padding: SPACING.space_4,
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#1f2937',
    gap: SPACING.space_3,
  },
  modalTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  modalLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    color: '#1f2937',
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  blockSetRow: {
    gap: SPACING.space_2,
  },
  blockSetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  blockSetChipActive: {
    borderColor: '#1f2937',
    backgroundColor: '#fde68a',
  },
  blockSetEmoji: {
    fontSize: 24,
  },
  blockSetName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  blockSetNameActive: {
    color: '#1f2937',
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  dayChip: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 18,
    borderWidth: 1.3,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  dayChipActive: {
    backgroundColor: '#93c5fd',
  },
  dayText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  dayTextActive: {
    color: '#1f2937',
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    flexWrap: 'wrap',
  },
  timeField: {
    flex: 1,
  },
  timePickerButton: {
    justifyContent: 'center',
  },
  timePickerText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  iosPicker: {
    marginTop: SPACING.space_2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.space_3,
  },
  secondaryButton: {
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
});
