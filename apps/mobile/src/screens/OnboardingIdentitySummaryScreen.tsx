import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { useOnboardingAssessment, PersonaRole, BuildFocus } from '@/store/onboardingAssessment';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import WatercolorCard from '@/components/watercolor/WatercolorCard';

const PERSONA_LABELS: Record<PersonaRole, string> = {
  builder: 'Builder / Entrepreneur',
  creator: 'Creator / Influencer',
  student: 'Student',
  professional: 'Professional / Knowledge worker',
  other: 'Multi-hyphenate',
};

const BUILD_FOCUS_LABELS: Record<Exclude<BuildFocus, 'custom'>, string> = {
  business: 'Launch a new business / product',
  brand: 'Grow your personal brand',
  audience: 'Build your audience',
  career: 'Level up your career skills',
  health: 'Dial in your health & fitness',
};

const BUILD_FOCUS_PHRASES: Record<Exclude<BuildFocus, 'custom'>, string> = {
  business: 'launch a new business',
  brand: 'grow your personal brand',
  audience: 'build an engaged audience',
  career: 'level up your career skills',
  health: 'dial in your health and fitness',
};

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingIdentitySummary'>;

export default function OnboardingIdentitySummaryScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const {
    personaRoles,
    ageRangeLabel,
    buildFocus,
    buildCustomFocus,
  } = useOnboardingAssessment();

  const progressValue = 1;
  const insets = useSafeAreaInsets();
  const topPadding = SPACING.space_1;

  const primaryPersona = personaRoles[0];
  const personaDescription = useMemo(() => {
    if (!personaRoles.length) {
      return 'an ambitious multi-hyphenate';
    }
    if (personaRoles.length === 1) {
      return `a ${PERSONA_LABELS[personaRoles[0]]}`;
    }
    return `${PERSONA_LABELS[personaRoles[0]]} + more`;
  }, [personaRoles]);

  const buildFocusLabel = useMemo(() => {
    if (!buildFocus) {
      return 'Dial in your focus area';
    }
    if (buildFocus === 'custom') {
      return buildCustomFocus || 'Dial in your focus area';
    }
    return BUILD_FOCUS_LABELS[buildFocus];
  }, [buildCustomFocus, buildFocus]);

  const summarySentence = useMemo(() => {
    const personaPart = personaDescription;
    const buildPart = buildFocus
      ? buildFocus === 'custom'
        ? `bring ${buildCustomFocus || 'your project'} to life`
        : BUILD_FOCUS_PHRASES[buildFocus]
      : 'build momentum';
    const focusPart = ageRangeLabel ? `as someone in the ${ageRangeLabel} lane` : 'in this season';
    return `You’re ${personaPart}, ${focusPart}, ready to ${buildPart} and take back control from the scroll.`;
  }, [ageRangeLabel, buildCustomFocus, buildFocus, personaDescription]);

  const personaList = personaRoles.length
    ? personaRoles.map(role => PERSONA_LABELS[role]).join(' • ')
    : 'Multi-hyphenate in progress';

  const handleContinue = () => {
    navigation.navigate('OnboardingQuiz');
  };

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.page, { paddingTop: topPadding }]}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressValue * 100}%` }]} />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.eyebrow}>Identity lock-in</Text>
            <Text style={styles.title}>
              We get you{primaryPersona ? `, ${PERSONA_LABELS[primaryPersona]}` : ''}
            </Text>
            <Text style={styles.subtitle}>{summarySentence}</Text>

            <View style={styles.cardGrid}>
              <WatercolorCard style={styles.card} backgroundColor="#fffef9" padding={SPACING.space_4}>
                <Text style={styles.cardLabel}>Persona</Text>
                <Text style={styles.cardValue}>{personaList}</Text>
              </WatercolorCard>
              <WatercolorCard style={styles.card} backgroundColor="#fffef9" padding={SPACING.space_4}>
                <Text style={styles.cardLabel}>Age range</Text>
                <Text style={styles.cardValue}>{ageRangeLabel || 'Not set'}</Text>
              </WatercolorCard>
              <WatercolorCard style={styles.card} backgroundColor="#fffef9" padding={SPACING.space_4}>
                <Text style={styles.cardLabel}>Focus</Text>
                <Text style={styles.cardValue}>{buildFocusLabel}</Text>
              </WatercolorCard>
            </View>
          </ScrollView>

          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.space_2) }]}>
            <WatercolorButton color="yellow" onPress={handleContinue}>
              <Text style={styles.buttonText}>Start my calibration</Text>
            </WatercolorButton>
          </View>
        </View>
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
  page: {
    flex: 1,
    paddingHorizontal: SPACING.space_4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
    marginBottom: SPACING.space_5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#1f2937',
  },
  backIcon: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1f2937',
  },
  scrollContent: {
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_4,
  },
  eyebrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 36,
    color: '#1f2937',
    lineHeight: 44,
  },
  subtitle: {
    ...TYPOGRAPHY.Body,
    fontSize: 18,
    lineHeight: 26,
    color: '#475569',
  },
  cardGrid: {
    gap: SPACING.space_3,
  },
  card: {
    gap: SPACING.space_1,
  },
  cardLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#6b7280',
  },
  cardValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    lineHeight: 28,
    color: '#1f2937',
  },
  bottomBar: {
    paddingTop: SPACING.space_4,
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
});
