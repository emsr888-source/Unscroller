import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import habitServiceDB, {
  HabitEventRecord,
  HabitWithEvents,
  createLocalHabitSeed,
} from '@/services/habitService.database';
import { TodoScope, todoServiceDB } from '@/services/todoService.database';
import widgetSnapshotService from '@/services/widgetSnapshotService';
import { HabitGridSection } from '@/components/HabitGridSection';
import {
  buildDateRange,
  buildHabitViewModels,
  cloneHabitBundles,
  removeHabitEvent,
  upsertHabitEvent,
} from './habits/habitGridHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import ColorSpherePicker, { COLOR_SWATCHES, IS_EXPO_GO } from '@/components/ColorSpherePicker';

const GRID_DAYS = 42; // 6 weeks
type Props = NativeStackScreenProps<RootStackParamList, 'HabitGrid'>;

type LoadOptions = {
  withSpinner?: boolean;
};

export default function HabitGridScreen({ navigation }: Props) {
  const [habits, setHabits] = useState<HabitWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitScope, setNewHabitScope] = useState<TodoScope>('daily');
  const [newHabitColor, setNewHabitColor] = useState<string>('#4DA1FF');
  const [creatingHabit, setCreatingHabit] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const referenceDates = useMemo(
    () => buildDateRange(GRID_DAYS, { alignToWeekStart: true, weekStartsOn: 0 }),
    []
  );
  const habitViewModels = useMemo(
    () => buildHabitViewModels(habits, referenceDates),
    [habits, referenceDates]
  );

  const loadHabits = useCallback(
    async (options: LoadOptions = {}) => {
      const rangeStartISO = referenceDates[0];
      const rangeEndISO = referenceDates[referenceDates.length - 1];

      if (!rangeStartISO || !rangeEndISO) {
        return;
      }
      if (options.withSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!isSupabaseConfigured() || !supabase) {
        setIsLocalMode(true);
        setUserId(null);
        setHabits(createLocalHabitSeed());
        setError('Using local-only habits. Sign in to sync your grid.');
        void widgetSnapshotService.syncToNative(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setError(null);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user?.id) {
          setIsLocalMode(true);
          setUserId(null);
          setHabits(createLocalHabitSeed());
          setError('Using local-only habits. Sign in to sync your grid.');
          void widgetSnapshotService.syncToNative(null);
          return;
        }

        setIsLocalMode(false);
        setUserId(user.id);

        const habitBundles = await habitServiceDB.fetchHabitsWithEvents(user.id, {
          fromDate: rangeStartISO,
          toDate: rangeEndISO,
        });

        setHabits(habitBundles);
        void widgetSnapshotService.refreshFromSupabase(user.id);
      } catch (loadError) {
        console.warn('[HabitGrid] Failed to load habits', loadError);
        setIsLocalMode(true);
        setUserId(null);
        setHabits(createLocalHabitSeed());
        setError(loadError instanceof Error ? loadError.message : 'Unable to load habits. Showing local data.');
        void widgetSnapshotService.syncToNative(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleHabitDayToggle = useCallback(
    async (habitId: string, date: string, nextCompleted: boolean) => {
      const previous = cloneHabitBundles(habits);
      const timestamp = new Date().toISOString();

      const optimisticEvent: HabitEventRecord = {
        id: `optimistic-${habitId}-${date}`,
        habitId,
        userId: userId ?? 'local',
        occurredOn: date,
        todoId: null,
        wasCompleted: nextCompleted,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const optimistic = nextCompleted
        ? upsertHabitEvent(previous, optimisticEvent)
        : removeHabitEvent(previous, habitId, date);

      setHabits(optimistic);

      if (!userId || isLocalMode) {
        return;
      }

      try {
        const linkedTodo = await todoServiceDB.findTodoByHabitOccurrence(userId, habitId, date);
        const linkedTodoId = linkedTodo?.id ?? null;

        await habitServiceDB.setHabitCompletion({
          userId,
          habitId,
          occurredOn: date,
          completed: nextCompleted,
          todoId: linkedTodoId,
        });

        if (linkedTodoId) {
          await todoServiceDB.updateTodoCompletion(userId, linkedTodoId, nextCompleted, {
            habitOccurredOn: date,
            recurrenceRule: linkedTodo?.recurrenceRule ?? undefined,
          });
        }
        await widgetSnapshotService.refreshFromSupabase(userId);
      } catch (error) {
        console.warn('[HabitGrid] Failed to toggle habit day', error);
        setError(error instanceof Error ? error.message : 'Unable to update that day.');
        setHabits(previous);
      }
    },
    [habits, isLocalMode, userId]
  );

  const handleCreateHabit = useCallback(async () => {
    const trimmed = newHabitTitle.trim();

    if (!trimmed) {
      return;
    }

    if (!userId || isLocalMode) {
      setError('Sign in to add new repetitive habits.');
      return;
    }

    setCreatingHabit(true);

    try {
      await habitServiceDB.createHabitDefinition(userId, {
        title: trimmed,
        scope: newHabitScope,
        color: newHabitColor,
      });
      setNewHabitTitle('');
      setNewHabitColor('#4DA1FF');
      await loadHabits({ withSpinner: true });
    } catch (createError) {
      console.warn('[HabitGrid] Failed to create habit', createError);
      setError(createError instanceof Error ? createError.message : 'Unable to create that habit.');
    } finally {
      setCreatingHabit(false);
    }
  }, [isLocalMode, loadHabits, newHabitScope, newHabitTitle, userId]);

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHabits({ withSpinner: true })} tintColor="#94a3b8" />}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Habit Grid</Text>
            <View style={styles.headerSpacer} />
          </View>

          {showLoader ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.ACCENT_GRADIENT_START} size="large" />
              <Text style={styles.loadingText}>Loading your habits…</Text>
            </View>
          ) : null}

          {error && !showLoader ? (
            <WatercolorCard style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </WatercolorCard>
          ) : null}

          <WatercolorCard>
            <Text style={styles.createTitle}>Add a repetitive habit</Text>
            <Text style={styles.createSubtitle}>New habits update your grid and widgets automatically.</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Publish one post"
              placeholderTextColor="#94a3b8"
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              editable={!creatingHabit}
            />
            <View style={styles.scopeRow}>
              {(['daily', 'weekly'] as TodoScope[]).map(scope => {
                const isSelected = newHabitScope === scope;
                return (
                  <TouchableOpacity
                    key={scope}
                    style={[styles.scopeChip, isSelected && styles.scopeChipSelected]}
                    onPress={() => setNewHabitScope(scope)}
                    disabled={creatingHabit}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.scopeChipText, isSelected && styles.scopeChipTextSelected]}>
                      {scope === 'daily' ? 'Daily' : 'Weekly'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.colorPicker}>
              <Text style={styles.colorPickerLabel}>Pick your grid color</Text>
              <View style={styles.swatchGrid}>
                {COLOR_SWATCHES.map(color => {
                  const isSelected = newHabitColor.toLowerCase() === color.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        isSelected && styles.colorSwatchSelected,
                      ]}
                      onPress={() => setNewHabitColor(color)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${color}`}
                    />
                  );
                })}
                {!IS_EXPO_GO ? (
                  <TouchableOpacity style={styles.openPickerButton} onPress={() => setColorPickerVisible(true)} activeOpacity={0.9}>
                    <Text style={styles.openPickerLabel}>More</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.colorValueRow}>
                <View style={[styles.colorPreviewDot, { backgroundColor: newHabitColor }]} />
                <Text style={styles.colorHexLabel}>{newHabitColor.toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.createButton, (creatingHabit || !newHabitTitle.trim()) && styles.createButtonDisabled]}
              onPress={handleCreateHabit}
              disabled={creatingHabit || !newHabitTitle.trim()}
              activeOpacity={0.9}
            >
              <Text style={styles.createButtonText}>{creatingHabit ? 'Creating…' : 'Add Habit'}</Text>
            </TouchableOpacity>
            {isLocalMode ? (
              <Text style={styles.localModeHint}>Sign in to sync new habits to your account.</Text>
            ) : null}
          </WatercolorCard>

          <WatercolorCard style={styles.gridCard}>
            <HabitGridSection habits={habitViewModels} onToggleDay={handleHabitDayToggle} disabled={showLoader || creatingHabit} />
          </WatercolorCard>

          <View style={styles.bottomSpacing} />
        </ScrollView>
        {!IS_EXPO_GO ? (
          <Modal animationType="slide" transparent visible={colorPickerVisible} onRequestClose={() => setColorPickerVisible(false)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Pick any color</Text>
                <ColorSpherePicker value={newHabitColor} onChange={setNewHabitColor} style={styles.modalPicker} />
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setColorPickerVisible(false)}>
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  headerSpacer: {
    width: 44,
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
    borderRadius: 22,
    borderWidth: 1.6,
    borderColor: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: SPACING.space_4,
  },
  errorText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#b91c1c',
  },
  createTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
    marginBottom: SPACING.space_1,
  },
  createSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    marginBottom: SPACING.space_4,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_3,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
    backgroundColor: '#fff',
    marginBottom: SPACING.space_3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    marginBottom: SPACING.space_3,
  },
  scopeChip: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    paddingVertical: SPACING.space_2,
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  scopeChipSelected: {
    backgroundColor: '#fde68a',
  },
  scopeChipText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  scopeChipTextSelected: {
    color: '#1f2937',
  },
  createButton: {
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#93c5fd',
    paddingVertical: SPACING.space_3,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  localModeHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
    marginTop: SPACING.space_2,
  },
  colorPicker: {
    marginBottom: SPACING.space_3,
  },
  colorPickerLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  habitColorPicker: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  colorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    marginTop: SPACING.space_2,
  },
  colorPreviewDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  colorHexLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_4,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: '#fff',
    padding: SPACING.space_4,
    gap: SPACING.space_3,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  modalTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#0f172a',
    textAlign: 'center',
  },
  modalPicker: {
    width: '100%',
    aspectRatio: 1,
    alignSelf: 'center',
  },
  modalCloseButton: {
    borderRadius: 16,
    backgroundColor: '#0f172a',
    paddingVertical: SPACING.space_2,
  },
  modalCloseText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  gridCard: {
    padding: SPACING.space_4,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
