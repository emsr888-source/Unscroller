import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import { SPACING } from '@/core/theme/spacing';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { challengesServiceDB } from '@/services/challengesService.database';
import type { ChallengeSharePayload, Challenge } from '@/services/challengesService.database';
import { useAppStore } from '@/store';
import { supabase } from '@/services/supabase';

const STEP_TITLES = ['Basics', 'Commitments', 'Success metrics', 'Preview & Share'];

const GOAL_OPTIONS: Array<{ label: string; value: Challenge['goal']['metric']; example: string }> = [
  { label: 'Streak Days', value: 'streak_days', example: 'Complete X days in a row' },
  { label: 'Focus Hours', value: 'focus_hours', example: 'Log focused sessions' },
  { label: 'Time Saved', value: 'time_saved', example: 'Reduce scroll minutes' },
  { label: 'Feed-Free Days', value: 'feed_free_days', example: 'Stay off feeds' },
];

const PRIVACY_OPTIONS: Array<{ label: string; value: 'public' | 'unlisted' | 'invite_only'; description: string }> = [
  { label: 'Public', value: 'public', description: 'Discoverable in the Challenges tab' },
  { label: 'Unlisted', value: 'unlisted', description: 'Shareable link only' },
  { label: 'Invite-only', value: 'invite_only', description: 'Members you invite' },
];

type FormState = {
  title: string;
  description: string;
  coverEmoji: string;
  startDate: string;
  durationDays: number;
  goalMetric: Challenge['goal']['metric'];
  goalTarget: number;
  dailyCommitments: string[];
  weeklyCommitments: string[];
  successMetrics: string[];
  privacy: 'public' | 'unlisted' | 'invite_only';
};

const DEFAULT_FORM: FormState = {
  title: '14-Day Focus Reset',
  description: 'Trade doom-scroll loops for deep work bursts with accountability every day.',
  coverEmoji: '🔥',
  startDate: new Date().toISOString().slice(0, 10),
  durationDays: 14,
  goalMetric: 'streak_days',
  goalTarget: 14,
  dailyCommitments: ['Log one 25-min focus block', 'Post a win in the feed'],
  weeklyCommitments: ['Share a progress screenshot every Sunday'],
  successMetrics: ['Finish 14 focus blocks', 'Invite 3 friends'],
  privacy: 'public',
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeCreate'>;

export default function ChallengeCreateScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<ChallengeSharePayload | null>(null);
  const [createdChallenge, setCreatedChallenge] = useState<Challenge | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const tenantId = useAppStore(state => state.tenantId);

  useEffect(() => {
    async function bootstrapUser() {
      if (!supabase) {
        setUserId('dev_user_maya');
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setUserId(data.user.id);
      }
    }
    bootstrapUser();
  }, []);

  const canGoBack = step > 0;
  const isFinalStep = step === STEP_TITLES.length - 1;

  const shareCaptionPreview = useMemo(() => {
    const commitments = form.dailyCommitments.filter(Boolean).slice(0, 2).join(' • ');
    return `Join me in "${form.title}" on Unscroller! ${commitments || 'Tap in and keep me accountable.'}`;
  }, [form.dailyCommitments, form.title]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateListItem = (key: 'dailyCommitments' | 'weeklyCommitments' | 'successMetrics', index: number, value: string) => {
    setForm(prev => {
      const clone = [...prev[key]];
      clone[index] = value;
      return { ...prev, [key]: clone };
    });
  };

  const addListItem = (key: 'dailyCommitments' | 'weeklyCommitments' | 'successMetrics') => {
    setForm(prev => ({ ...prev, [key]: [...prev[key], ''] }));
  };

  const removeListItem = (key: 'dailyCommitments' | 'weeklyCommitments' | 'successMetrics', index: number) => {
    setForm(prev => {
      const clone = prev[key].filter((_, i) => i !== index);
      return { ...prev, [key]: clone.length ? clone : [''] };
    });
  };

  const handleNext = () => {
    if (isFinalStep) {
      void handleSubmit();
    } else {
      setStep(prev => Math.min(prev + 1, STEP_TITLES.length - 1));
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setStep(prev => Math.max(prev - 1, 0));
    } else {
      navigation.goBack();
    }
  };

  const handleShare = async () => {
    if (!sharePayload) return;
    try {
      await Share.share({
        message: `${sharePayload.caption} ${sharePayload.shareUrl}`,
        url: sharePayload.imageUrl,
      });
    } catch (shareError) {
      console.warn('[ChallengeCreate] share error', shareError);
    }
  };

  const ensureSharePayload = useCallback(
    async (challengeId: string, existing?: ChallengeSharePayload | null) => {
      if (existing?.imageUrl || !tenantId) {
        return existing ?? null;
      }
      return challengesServiceDB.generateShareAsset(challengeId, tenantId);
    },
    [tenantId],
  );

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      let activeUserId = userId;
      if (!activeUserId) {
        if (supabase) {
          const { data } = await supabase.auth.getUser();
          activeUserId = data?.user?.id ?? null;
        }
      }

      if (!activeUserId) {
        setError('Sign in to publish your challenge.');
        setSubmitting(false);
        return;
      }

      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
      };
      const result = await challengesServiceDB.createChallenge(activeUserId, payload);
      const refreshedShare = await ensureSharePayload(result.challenge.id, result.share);
      setSharePayload(refreshedShare ?? result.share);
      setCreatedChallenge(result.challenge);
      setStep(STEP_TITLES.length - 1);
    } catch (submitError) {
      console.error('[ChallengeCreate] submit error', submitError);
      setError('Unable to create challenge right now. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderListEditor = (
    key: 'dailyCommitments' | 'weeklyCommitments' | 'successMetrics',
    label: string,
    placeholder: string,
  ) => {
    return (
      <View style={styles.listEditor}>
        <View style={styles.listHeader}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity onPress={() => addListItem(key)} style={styles.addChip}>
            <Text style={styles.addChipText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {form[key].map((value, index) => (
          <View key={`${key}-${index}`} style={styles.listRow}>
            <Text style={styles.listIndex}>{index + 1}.</Text>
            <TextInput
              style={styles.textInput}
              value={value}
              onChangeText={text => updateListItem(key, index, text)}
              placeholder={placeholder}
              placeholderTextColor="#94a3b8"
              multiline
            />
            {form[key].length > 1 && (
              <TouchableOpacity onPress={() => removeListItem(key, index)} style={styles.removeChip}>
                <Text style={styles.removeChipText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <WatercolorCard style={styles.card}>
            <Text style={styles.label}>Challenge title</Text>
            <TextInput
              value={form.title}
              onChangeText={text => updateForm('title', text)}
              style={styles.textInput}
              placeholder="What should we call it?"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.label}>Elevator pitch</Text>
            <TextInput
              value={form.description}
              onChangeText={text => updateForm('description', text)}
              style={[styles.textInput, styles.textArea]}
              multiline
              placeholder="Describe the vibe and intent"
              placeholderTextColor="#94a3b8"
            />
            <View style={styles.inlineRow}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Cover emoji</Text>
                <TextInput
                  value={form.coverEmoji}
                  onChangeText={text => updateForm('coverEmoji', text.slice(0, 2))}
                  style={styles.textInput}
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Start date</Text>
                <TextInput
                  value={form.startDate}
                  onChangeText={text => updateForm('startDate', text)}
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
            <Text style={styles.label}>Duration (days)</Text>
            <View style={styles.durationRow}>
              <TouchableOpacity
                onPress={() => updateForm('durationDays', Math.max(3, form.durationDays - 1))}
                style={styles.durationButton}
              >
                <Text style={styles.durationButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.durationValue}>{form.durationDays}</Text>
              <TouchableOpacity onPress={() => updateForm('durationDays', form.durationDays + 1)} style={styles.durationButton}>
                <Text style={styles.durationButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Privacy</Text>
            <View style={styles.chipRow}>
              {PRIVACY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.chip, form.privacy === option.value && styles.chipSelected]}
                  onPress={() => updateForm('privacy', option.value)}
                >
                  <Text style={[styles.chipLabel, form.privacy === option.value && styles.chipLabelSelected]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.chipDescription}>
              {PRIVACY_OPTIONS.find(opt => opt.value === form.privacy)?.description}
            </Text>
          </WatercolorCard>
        );
      case 1:
        return (
          <WatercolorCard style={styles.card}>
            {renderListEditor('dailyCommitments', 'Daily commitments', 'e.g. Log one focus sprint')}
            {renderListEditor('weeklyCommitments', 'Weekly commitments', 'e.g. Share a recap with the squad')}
          </WatercolorCard>
        );
      case 2:
        return (
          <WatercolorCard style={styles.card}>
            <Text style={styles.label}>Primary goal metric</Text>
            <View style={styles.chipRow}>
              {GOAL_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.chip, form.goalMetric === option.value && styles.chipSelected]}
                  onPress={() => updateForm('goalMetric', option.value)}
                >
                  <Text style={[styles.chipLabel, form.goalMetric === option.value && styles.chipLabelSelected]}>{option.label}</Text>
                  <Text style={styles.chipTiny}>{option.example}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Target number</Text>
            <TextInput
              value={String(form.goalTarget)}
              onChangeText={text => updateForm('goalTarget', Number(text.replace(/[^0-9]/g, '')) || 0)}
              style={styles.textInput}
              keyboardType="number-pad"
            />
            {renderListEditor('successMetrics', 'Success signals', 'e.g. 10 friends joined, 14 check-ins logged')}
          </WatercolorCard>
        );
      case 3:
      default:
        return (
          <WatercolorCard style={styles.card}>
            <Text style={styles.label}>Share preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewEmoji}>{form.coverEmoji}</Text>
              <Text style={styles.previewTitle}>{form.title}</Text>
              <Text style={styles.previewSubtitle}>{form.description}</Text>
              <Text style={styles.previewMeta}>
                {form.durationDays} days • {form.dailyCommitments.length} daily habits
              </Text>
            </View>
            <Text style={styles.label}>Caption suggestion</Text>
            <WatercolorCard style={styles.captionCard}>
              <Text style={styles.captionText}>{sharePayload?.caption ?? shareCaptionPreview}</Text>
              <Text style={styles.captionLink}>{sharePayload?.shareUrl ?? 'Link will appear after publishing'}</Text>
            </WatercolorCard>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {sharePayload ? (
              <View style={styles.postPublishActions}>
                <WatercolorButton color="yellow" onPress={handleShare}>
                  <Text style={styles.buttonText}>Share it</Text>
                </WatercolorButton>
                {createdChallenge ? (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.replace('ChallengeDetail', { challengeId: createdChallenge.id })}
                  >
                    <Text style={styles.linkButtonText}>Open challenge</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <Text style={styles.helperText}>Finish the steps to generate your share card and invite link.</Text>
            )}
          </WatercolorCard>
        );
    }
  };

  const actionLabel = sharePayload ? 'Done' : isFinalStep ? 'Publish challenge' : 'Next';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerMeta}>
              <Text style={styles.headerTitle}>Create challenge</Text>
              <Text style={styles.headerSubtitle}>{STEP_TITLES[step]}</Text>
            </View>
            <Text style={styles.stepBadge}>{step + 1}/{STEP_TITLES.length}</Text>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderStepContent()}
            {sharePayload ? null : (
              <View style={styles.footerHint}>
                <Text style={styles.helperText}>You can edit all details later from the challenge overview.</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.footer}>
            {!sharePayload && canGoBack ? (
              <TouchableOpacity onPress={handleBack} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            ) : null}
            {!sharePayload ? (
              <WatercolorButton color="yellow" onPress={handleNext} disabled={submitting}>
                <Text style={styles.buttonText}>{submitting ? 'Publishing…' : actionLabel}</Text>
              </WatercolorButton>
            ) : null}
          </View>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_3,
    paddingBottom: SPACING.space_2,
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
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerMeta: {
    flex: 1,
    marginHorizontal: SPACING.space_3,
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 26,
    color: '#1f2937',
  },
  headerSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  stepBadge: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_4,
  },
  card: {
    gap: SPACING.space_3,
  },
  label: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  textInput: {
    borderWidth: 1.4,
    borderColor: '#1f2937',
    borderRadius: 16,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
  },
  inlineField: {
    flex: 1,
    gap: SPACING.space_1,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
  },
  durationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  durationButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  durationValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  chipRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    borderWidth: 1.2,
    borderColor: '#1f2937',
    borderRadius: 20,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#1f2937',
  },
  chipLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  chipLabelSelected: {
    color: '#fff',
  },
  chipTiny: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 12,
    color: '#475569',
  },
  chipDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  listEditor: {
    gap: SPACING.space_2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addChip: {
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    borderRadius: 12,
    backgroundColor: '#fef9c3',
  },
  addChipText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#854d0e',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  listIndex: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
  },
  removeChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeChipText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  previewCard: {
    borderWidth: 1.4,
    borderColor: '#1f2937',
    borderRadius: 24,
    padding: SPACING.space_4,
    gap: SPACING.space_2,
    backgroundColor: '#fff',
  },
  previewEmoji: {
    fontSize: 40,
  },
  previewTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  previewSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
  },
  previewMeta: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  captionCard: {
    backgroundColor: '#fffbe9',
    borderColor: '#fbbf24',
  },
  captionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#854d0e',
  },
  captionLink: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#a16207',
  },
  helperText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  footerHint: {
    paddingHorizontal: SPACING.space_1,
  },
  footer: {
    padding: SPACING.space_4,
    flexDirection: 'row',
    gap: SPACING.space_3,
    alignItems: 'center',
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
  },
  secondaryButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  postPublishActions: {
    gap: SPACING.space_3,
  },
  linkButton: {
    alignSelf: 'center',
  },
  linkButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    textDecorationLine: 'underline',
  },
  errorText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#dc2626',
  },
});
