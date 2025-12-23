import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import { SPACING } from '@/core/theme/spacing';
import { COLORS } from '@/core/theme/colors';
import type { BlockSet } from '@unscroller/block-service';
import {
  DEFAULT_BLOCK_SET_ID,
  selectBlockSets,
  selectLimits,
  selectBlockingCapability,
  useBlockingStore,
} from '@/features/blocking/blockingStore';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { explainNativeLimitation, isNativeBlockServiceAvailable } from '@/lib/platformCapabilities';
type Props = NativeStackScreenProps<RootStackParamList, 'BlockerHub'>;

type BlockSetEditorState = {
  visible: boolean;
  editingId: string | null;
  name: string;
  emoji: string;
  message: string;
  backgroundColor: string;
  saving: boolean;
};

const DEFAULT_BLOCK_MESSAGE = 'Apps in this set will be blocked during focus sessions.';

const BLOCK_COLOR_SWATCHES = ['#101726', '#111827', '#1F2937', '#0F172A', '#3F0E40', '#7C2D12', '#1B4332', '#2C1810'];

const createEditorState = (overrides: Partial<BlockSetEditorState> = {}): BlockSetEditorState => ({
  visible: false,
  editingId: null,
  name: '',
  emoji: '🛡️',
  message: DEFAULT_BLOCK_MESSAGE,
  backgroundColor: BLOCK_COLOR_SWATCHES[0],
  saving: false,
  ...overrides,
});

export default function BlockerHubScreen({ navigation }: Props) {
  const blockSets = useBlockingStore(selectBlockSets);
  const limits = useBlockingStore(selectLimits);
  const pickAppsForBlockSet = useBlockingStore(state => state.pickAppsForBlockSet);
  const createCustomBlockSet = useBlockingStore(state => state.createCustomBlockSet);
  const updateBlockSetMeta = useBlockingStore(state => state.updateBlockSetMeta);
  const removeBlockSet = useBlockingStore(state => state.removeBlockSet);
  const setOrUpdateLimit = useBlockingStore(state => state.setOrUpdateLimit);
  const setSessionLimit = useBlockingStore(state => state.setSessionLimit);

  const initialBlockSetId = useMemo(
    () => blockSets[0]?.id ?? DEFAULT_BLOCK_SET_ID,
    [blockSets]
  );

  const [editor, setEditor] = useState<BlockSetEditorState>(() =>
    createEditorState({ backgroundColor: blockSets[0]?.blockedBackgroundColor ?? BLOCK_COLOR_SWATCHES[0] })
  );
  const [dailyLimitForm, setDailyLimitForm] = useState<{ appId: string; minutes: string }>({ appId: '', minutes: '15' });
  const [sessionLimitForm, setSessionLimitForm] = useState<{ appId: string; minutes: string; blockSetId: string }>(() => ({
    appId: '',
    minutes: '5',
    blockSetId: initialBlockSetId,
  }));
  const capability = useBlockingStore(selectBlockingCapability);
  const blockingPauseUntil = useBlockingStore(state => state.blockingPauseUntil);
  const pauseBlocking = useBlockingStore(state => state.pauseBlocking);
  const resumeBlocking = useBlockingStore(state => state.resumeBlocking);
  const [now, setNow] = useState(() => Date.now());

  const refreshDefaultsFromSets = () => {
    const fallback = blockSets[0]?.id ?? DEFAULT_BLOCK_SET_ID;
    setSessionLimitForm(prev => ({
      ...prev,
      blockSetId: blockSets.some(set => set.id === prev.blockSetId) ? prev.blockSetId : fallback,
    }));
  };

  React.useEffect(() => {
    refreshDefaultsFromSets();
  }, [blockSets]);

  React.useEffect(() => {
    if (!blockingPauseUntil) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [blockingPauseUntil]);

  const blockingActive = capability.authorized && capability.shieldsAvailable;
  const pauseRemainingMs = blockingPauseUntil ? Math.max(blockingPauseUntil - now, 0) : 0;
  const pauseRemainingLabel =
    pauseRemainingMs > 0
      ? `${Math.floor(pauseRemainingMs / 60000)}m ${Math.floor((pauseRemainingMs % 60000) / 1000)
          .toString()
          .padStart(2, '0')}s`
      : null;

  const extractSelectedAppId = (result: BlockSet | null): string | null => {
    if (!result) {
      return null;
    }
    const tokens = result.iosTokens?.length ? result.iosTokens : result.androidPackages ?? [];
    return tokens[tokens.length - 1] ?? null;
  };

  const handlePickDailyLimitApp = async () => {
    const targetId = blockSets[0]?.id ?? DEFAULT_BLOCK_SET_ID;
    const result = await pickAppsForBlockSet(targetId);
    const appId = extractSelectedAppId(result);
    if (appId) {
      setDailyLimitForm(prev => ({ ...prev, appId }));
    } else {
      Alert.alert('No app selected', 'Choose at least one app to apply a limit.');
    }
  };

  const handlePickSessionLimitApp = async () => {
    const targetId = sessionLimitForm.blockSetId || blockSets[0]?.id || DEFAULT_BLOCK_SET_ID;
    const result = await pickAppsForBlockSet(targetId);
    const appId = extractSelectedAppId(result);
    if (appId) {
      setSessionLimitForm(prev => ({ ...prev, appId }));
    } else {
      Alert.alert('No app selected', 'Choose at least one app to apply a limit.');
    }
  };

  const openEditor = (target?: BlockSet | null) => {
    if (!target) {
      setEditor(
        createEditorState({
          visible: true,
          backgroundColor: '#101726',
        })
      );
      return;
    }
    setEditor(
      createEditorState({
        visible: true,
        editingId: target.id,
        name: target.name,
        emoji: target.blockedEmoji ?? '🛡️',
        message: target.blockedMessage ?? DEFAULT_BLOCK_MESSAGE,
        backgroundColor: target.blockedBackgroundColor ?? '#101726',
      })
    );
  };

  const closeEditor = () => setEditor(createEditorState());

  const handleSaveFocusMode = async () => {
    if (!editor.visible) {
      return;
    }
    const trimmedName = editor.name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Give your focus mode a memorable name.');
      return;
    }
    setEditor(prev => ({ ...prev, saving: true }));
    try {
      if (editor.editingId) {
        await updateBlockSetMeta(editor.editingId, {
          name: trimmedName,
          blockedEmoji: editor.emoji || '🛡️',
          blockedMessage: editor.message || DEFAULT_BLOCK_MESSAGE,
          blockedBackgroundColor: editor.backgroundColor || '#101726',
        });
      } else {
        createCustomBlockSet({
          name: trimmedName,
          blockedEmoji: editor.emoji || '🛡️',
          blockedMessage: editor.message || DEFAULT_BLOCK_MESSAGE,
          blockedBackgroundColor: editor.backgroundColor || BLOCK_COLOR_SWATCHES[0],
        });
      }
      closeEditor();
    } catch (error) {
      console.warn('[BlockerHub] Failed to save focus mode', error);
      Alert.alert('Unable to save', 'Try again in a moment.');
      setEditor(prev => ({ ...prev, saving: false }));
    }
  };

  const handlePickApps = async (blockSetId: string) => {
    const result = await pickAppsForBlockSet(blockSetId);
    if (!result && !isNativeBlockServiceAvailable) {
      Alert.alert('Requires native build', explainNativeLimitation('App selection'));
    }
    return result;
  };

  const handleApplyDailyLimit = async () => {
    const appId = dailyLimitForm.appId.trim();
    const minutes = Number(dailyLimitForm.minutes);
    if (!appId || Number.isNaN(minutes) || minutes <= 0) {
      Alert.alert('Check entries', 'Enter an app identifier and daily minutes greater than zero.');
      return;
    }
    try {
      await setOrUpdateLimit(appId, minutes);
      setDailyLimitForm({ appId: '', minutes: '15' });
      Alert.alert('Saved', `Daily limit updated for ${appId}.`);
    } catch (error) {
      console.warn('[BlockerHub] Failed to set daily limit', error);
      Alert.alert('Unable to save', 'Try again shortly.');
    }
  };

  const handleApplySessionLimit = () => {
    const appId = sessionLimitForm.appId.trim();
    const minutes = Number(sessionLimitForm.minutes);
    if (!appId || Number.isNaN(minutes) || minutes <= 0) {
      Alert.alert('Check entries', 'Enter an app identifier and minutes greater than zero.');
      return;
    }
    setSessionLimit(sessionLimitForm.blockSetId, appId, minutes);
    setSessionLimitForm(prev => ({ ...prev, appId: '', minutes: '5' }));
    Alert.alert('Saved', `Session limit queued for ${appId}.`);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Blocker</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {blockingActive ? (
            <View style={styles.pauseBanner}>
              <View style={styles.pauseBannerTextGroup}>
                <Text style={styles.pauseBannerTitle}>
                  {pauseRemainingLabel ? 'Blocking paused' : 'Need to use an app briefly?'}
                </Text>
                <Text style={styles.pauseBannerSubtitle}>
                  {pauseRemainingLabel
                    ? `Blocking resumes automatically in ${pauseRemainingLabel}.`
                    : 'Pause all blocks for 15 minutes to finish an urgent task.'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.pauseBannerButton, pauseRemainingLabel ? styles.resumeButton : styles.pauseButton]}
                onPress={() => {
                  if (pauseRemainingLabel) {
                    resumeBlocking();
                  } else {
                    pauseBlocking(15);
                  }
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.pauseBannerButtonText}>{pauseRemainingLabel ? 'Resume now' : 'Pause 15 min'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <WatercolorCard style={styles.heroCard}>
            <Text style={styles.heroTitle}>Dial in your focus modes</Text>
            <Text style={styles.heroSubtitle}>
              Choose what gets blocked, craft the shield screen, and run manual blocks even inside Expo Go.
            </Text>
            <WatercolorButton color="yellow" onPress={() => openEditor()}>
              <Text style={styles.heroButtonText}>New focus mode</Text>
            </WatercolorButton>
          </WatercolorCard>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Focus presets</Text>
            <Text style={styles.sectionSubtitle}>Tap a card to tweak its emoji, message, or blocked apps.</Text>
          </View>
          {blockSets.map(set => (
            <WatercolorCard key={set.id} style={styles.focusCard}>
              <View style={styles.focusRow}>
                <View style={[styles.emojiBubble, { backgroundColor: (set.blockedBackgroundColor ?? '#111827') + '20' }]}>
                  <Text style={styles.focusEmoji}>{set.blockedEmoji ?? '🛡️'}</Text>
                </View>
                <View style={styles.focusDetails}>
                  <Text style={styles.focusName}>{set.name}</Text>
                  <Text style={styles.focusMessage} numberOfLines={2}>
                    {set.blockedMessage || DEFAULT_BLOCK_MESSAGE}
                  </Text>
                </View>
              </View>
              <View style={styles.focusActions}>
                <TouchableOpacity style={styles.focusActionButton} onPress={() => openEditor(set)} activeOpacity={0.85}>
                  <Text style={styles.focusActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.focusActionButton}
                  onPress={() => handlePickApps(set.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.focusActionText}>Choose apps</Text>
                </TouchableOpacity>
                {set.id !== DEFAULT_BLOCK_SET_ID ? (
                  <TouchableOpacity
                    style={[styles.focusActionButton, styles.destructiveButton]}
                    onPress={() =>
                      Alert.alert('Remove focus mode?', `“${set.name}” will be removed.`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeBlockSet(set.id) },
                      ])
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.focusActionText, styles.destructiveText]}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </WatercolorCard>
          ))}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>App usage limits</Text>
            <Text style={styles.sectionSubtitle}>Cap distracting apps per day or per focus session.</Text>
          </View>
          <WatercolorCard style={styles.controlCard}>
            <Text style={styles.inputLabel}>Daily limit (outside focus modes)</Text>
            <TextInput
              style={styles.input}
              placeholder="com.instagram.ios"
              placeholderTextColor="#94a3b8"
              value={dailyLimitForm.appId}
              onChangeText={text => setDailyLimitForm(prev => ({ ...prev, appId: text }))}
            />
            <TouchableOpacity style={styles.appPickerButton} onPress={handlePickDailyLimitApp} activeOpacity={0.85}>
              <Text style={styles.appPickerButtonText}>Pick from installed apps</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="15 (minutes / day)"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              value={dailyLimitForm.minutes}
              onChangeText={text => setDailyLimitForm(prev => ({ ...prev, minutes: text }))}
            />
            <WatercolorButton color="neutral" onPress={handleApplyDailyLimit}>
              <Text style={styles.primaryButtonText}>Save daily limit</Text>
            </WatercolorButton>

            <Text style={[styles.inputLabel, styles.sessionLimitLabel]}>Limit during focus sessions</Text>
            <TextInput
              style={styles.input}
              placeholder="com.youtube.ios"
              placeholderTextColor="#94a3b8"
              value={sessionLimitForm.appId}
              onChangeText={text => setSessionLimitForm(prev => ({ ...prev, appId: text }))}
            />
            <TouchableOpacity style={styles.appPickerButton} onPress={handlePickSessionLimitApp} activeOpacity={0.85}>
              <Text style={styles.appPickerButtonText}>Pick from installed apps</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="5 (minutes per session)"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              value={sessionLimitForm.minutes}
              onChangeText={text => setSessionLimitForm(prev => ({ ...prev, minutes: text }))}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.blockSetChips}>
              {blockSets.map(set => {
                const isActive = set.id === sessionLimitForm.blockSetId;
                return (
                  <TouchableOpacity
                    key={set.id}
                    style={[styles.blockSetChip, isActive && styles.blockSetChipActive]}
                    onPress={() => setSessionLimitForm(prev => ({ ...prev, blockSetId: set.id }))}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.blockSetChipEmoji}>{set.blockedEmoji ?? '🛡️'}</Text>
                    <Text style={[styles.blockSetChipText, isActive && styles.blockSetChipTextActive]}>{set.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <WatercolorButton color="neutral" onPress={handleApplySessionLimit}>
              <Text style={styles.primaryButtonText}>Save session limit</Text>
            </WatercolorButton>

            {limits.length ? (
              <View style={styles.limitList}>
                <Text style={styles.limitListTitle}>Current daily limits</Text>
                {limits.map(limit => (
                  <View key={limit.appId} style={styles.limitRow}>
                    <Text style={styles.limitApp}>{limit.appId}</Text>
                    <Text style={styles.limitMinutes}>{limit.minutesPerDay} min / day</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {!isNativeBlockServiceAvailable ? (
              <Text style={styles.permissionHint}>{explainNativeLimitation('App usage timers')}</Text>
            ) : null}
          </WatercolorCard>
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      {editor.visible ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editor.editingId ? 'Edit focus mode' : 'Create focus mode'}</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Deep Focus"
              placeholderTextColor="#94a3b8"
              value={editor.name}
              onChangeText={text => setEditor(prev => ({ ...prev, name: text }))}
            />
            <Text style={styles.inputLabel}>Emoji</Text>
            <TextInput
              style={styles.input}
              placeholder="🛡️"
              placeholderTextColor="#94a3b8"
              value={editor.emoji}
              onChangeText={text => setEditor(prev => ({ ...prev, emoji: text.trim().slice(0, 2) }))}
              maxLength={2}
            />
            <Text style={styles.inputLabel}>Shield message</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder={DEFAULT_BLOCK_MESSAGE}
              placeholderTextColor="#94a3b8"
              value={editor.message}
              onChangeText={text => setEditor(prev => ({ ...prev, message: text }))}
              multiline
            />
            <Text style={styles.inputLabel}>Background color</Text>
            <View style={styles.colorRow}>
              {BLOCK_COLOR_SWATCHES.map(color => {
                const isActive = editor.backgroundColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorSwatch, { backgroundColor: color }, isActive && styles.colorSwatchActive]}
                    onPress={() => setEditor(prev => ({ ...prev, backgroundColor: color }))}
                    activeOpacity={0.85}
                  />
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <WatercolorButton color="neutral" onPress={closeEditor} style={styles.modalButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </WatercolorButton>
              <WatercolorButton
                color="yellow"
                onPress={() => {
                  if (editor.saving) {
                    return;
                  }
                  handleSaveFocusMode();
                }}
                style={styles.modalButton}
              >
                <Text style={styles.primaryButtonText}>{editor.saving ? 'Saving…' : 'Save'}</Text>
              </WatercolorButton>
            </View>
            {editor.editingId ? (
              <TouchableOpacity style={styles.modalAppsButton} onPress={() => handlePickApps(editor.editingId!)} activeOpacity={0.85}>
                <Text style={styles.modalAppsText}>Choose blocked apps</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.TEXT_PRIMARY,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 40,
  },
  heroCard: {
    padding: SPACING.space_4,
    gap: SPACING.space_3,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1917',
  },
  sectionHeader: {
    paddingHorizontal: SPACING.space_1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  focusCard: {
    padding: SPACING.space_4,
    gap: SPACING.space_3,
  },
  focusRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
  },
  emojiBubble: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusEmoji: {
    fontSize: 30,
  },
  focusDetails: {
    flex: 1,
    gap: 4,
  },
  focusName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  focusMessage: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  focusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  focusActionButton: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  focusActionText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  destructiveButton: {
    borderColor: '#fb7185',
  },
  destructiveText: {
    color: '#b91c1c',
  },
  controlCard: {
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
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  durationRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  durationChip: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  durationChipActive: {
    backgroundColor: '#fde68a',
    borderColor: '#fbbf24',
  },
  durationChipText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  durationChipTextActive: {
    fontWeight: '700',
  },
  blockSetChips: {
    paddingVertical: SPACING.space_2,
    gap: SPACING.space_2,
  },
  blockSetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: 999,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
  },
  blockSetChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  blockSetChipEmoji: {
    fontSize: 16,
  },
  blockSetChipText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  blockSetChipTextActive: {
    fontWeight: '600',
    color: '#0f172a',
  },
  appPickerButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  appPickerButtonText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1917',
  },
  permissionHint: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  infoBody: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  limitList: {
    marginTop: SPACING.space_3,
    gap: SPACING.space_2,
  },
  limitListTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  limitApp: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  limitMinutes: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  sessionLimitLabel: {
    marginTop: SPACING.space_3,
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_4,
  },
  modal: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    padding: SPACING.space_4,
    gap: SPACING.space_3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#fde68a',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  modalButton: {
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  modalAppsButton: {
    alignSelf: 'flex-start',
  },
  modalAppsText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    textDecorationLine: 'underline',
  },
});
