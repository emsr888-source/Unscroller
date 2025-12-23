import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SPACING } from '@/core/theme/spacing';
import { BREATH_PRESETS } from '@/features/reset/breathPresets';
import { useResetStore } from '@/features/reset/resetStore';
import { RootStackParamList } from '@/navigation/AppNavigator';
import type { BreathPreset } from '@/features/reset/types';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

const FEATURED_ORDER = ['box', 'coherent', '478', 'physiological'];
const MIN_MANIFEST_CHARS = 12;

type Props = NativeStackScreenProps<RootStackParamList, 'Reset'>;

const sumPhaseSeconds = (preset: BreathPreset) =>
  Math.round(preset.phases.reduce((total, phase) => total + phase.durationMs, 0) / 1000);

export default function ResetScreen({ navigation }: Props) {
  const hydrate = useResetStore(state => state.hydrate);
  const manifestPrefs = useResetStore(state => state.manifest);
  const setManifestPreferences = useResetStore(state => state.setManifestPreferences);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const [manifestText, setManifestText] = useState(manifestPrefs.lastCustomPromptText ?? '');

  useEffect(() => {
    setManifestPreferences({ lastCustomPromptText: manifestText });
  }, [manifestText, setManifestPreferences]);

  const orderedPresets = useMemo(() => {
    const presetMap = new Map<string, BreathPreset>(
      BREATH_PRESETS.filter(preset => preset.id !== 'custom').map(item => [item.id, item])
    );
    const prioritized: BreathPreset[] = FEATURED_ORDER.map(id => presetMap.get(id)).filter(
      (item): item is BreathPreset => Boolean(item)
    );
    const remaining = BREATH_PRESETS.filter(
      preset => preset.id !== 'custom' && !FEATURED_ORDER.includes(preset.id)
    );
    return [...prioritized, ...remaining];
  }, []);

  const isManifestReady = manifestText.trim().length >= MIN_MANIFEST_CHARS;

  const handleSelectTechnique = (presetId: string) => {
    navigation.navigate('BreathSession', { presetId });
  };

  const handleStartManifest = () => {
    const trimmed = manifestText.trim();
    if (!trimmed) {
      return;
    }
    setManifestPreferences({ lastPromptId: 'custom_prompt', lastCustomPromptText: trimmed });
    navigation.navigate('ManifestProgress', { prompt: trimmed });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.iconButton}
                hitSlop={10}
                activeOpacity={0.9}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Reset</Text>
              <View style={styles.headerSpacer} />
            </View>

            <WatercolorCard style={styles.heroCard} backgroundColor="#fffef5">
              <Text style={styles.heroHeading}>Ditch the doom-scroll.</Text>
              <Text style={styles.heroSubheading}>
                Choose a breath, set an intention, and let your nervous system settle.
              </Text>
            </WatercolorCard>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Breathing techniques</Text>
              <Text style={styles.sectionSubtitle}>Tap a cadence to open a guided session.</Text>
            </View>
            <View style={styles.techniqueList}>
              {orderedPresets.map(preset => (
                <TechniqueCard key={preset.id} preset={preset} onPress={() => handleSelectTechnique(preset.id)} />
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Manifestation ritual</Text>
              <Text style={styles.sectionSubtitle}>
                Describe what you want to call in. We’ll craft a soothing visualization while you breathe.
              </Text>
            </View>
            <WatercolorCard style={styles.manifestCard}>
              <TextInput
                style={styles.manifestInput}
                multiline
                placeholder="I want to speak calmly and confidently during tomorrow’s presentation..."
                placeholderTextColor="rgba(71,85,105,0.6)"
                value={manifestText}
                onChangeText={setManifestText}
                textAlignVertical="top"
              />
              <WatercolorButton
                color="blue"
                onPress={isManifestReady ? handleStartManifest : undefined}
                style={[styles.manifestButton, !isManifestReady && styles.disabledButton]}
              >
                <Text style={styles.manifestButtonText}>Begin manifestation</Text>
              </WatercolorButton>
              <Text style={styles.disclaimer}>Not a medical treatment. Pair with your care team’s plan.</Text>
            </WatercolorCard>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

type TechniqueCardProps = {
  preset: BreathPreset;
  onPress: () => void;
};

function TechniqueCard({ preset, onPress }: TechniqueCardProps) {
  const cycleSeconds = sumPhaseSeconds(preset);
  const cadenceLabel = preset.hasHold ? 'Includes holds' : 'Flow breath';

  return (
    <TouchableOpacity style={styles.techniqueTouchable} onPress={onPress} activeOpacity={0.92}>
      <WatercolorCard style={styles.techniqueCard} padding={SPACING.space_3} backgroundColor="#fff">
        <View style={styles.techniqueHeader}>
          <View>
            <Text style={styles.techniqueName}>{preset.name}</Text>
            <Text style={styles.techniqueCycle}>{cycleSeconds}s cycle</Text>
          </View>
          <View style={styles.techniqueBadge}>
            <Text style={styles.techniqueBadgeText}>{cadenceLabel}</Text>
          </View>
        </View>
        <Text style={styles.techniqueDescription}>{preset.description}</Text>
        <View style={styles.techniqueFooter}>
          <Text style={styles.techniqueAction}>Open session</Text>
          <Text style={styles.techniqueArrow}>→</Text>
        </View>
      </WatercolorCard>
    </TouchableOpacity>
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
  keyboardContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  backIcon: {
    fontSize: 26,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
  },
  heroCard: {
    gap: SPACING.space_2,
  },
  heroHeading: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  heroSubheading: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#64748b',
  },
  techniqueList: {
    gap: SPACING.space_3,
  },
  techniqueTouchable: {
    borderRadius: 28,
  },
  techniqueCard: {
    gap: SPACING.space_2,
  },
  techniqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techniqueName: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  techniqueCycle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 15,
    color: '#475569',
  },
  techniqueBadge: {
    paddingHorizontal: SPACING.space_2,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    backgroundColor: '#e0e7ff',
  },
  techniqueBadgeText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  techniqueDescription: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
  techniqueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techniqueAction: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  techniqueArrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#1f2937',
  },
  manifestCard: {
    gap: SPACING.space_3,
  },
  manifestInput: {
    minHeight: 140,
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    backgroundColor: '#fff',
    padding: SPACING.space_3,
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  manifestButton: {},
  disabledButton: {
    opacity: 0.5,
  },
  manifestButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  disclaimer: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#94a3b8',
  },
  bottomSpacing: {
    height: SPACING.space_6,
  },
});
