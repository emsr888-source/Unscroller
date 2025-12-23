import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Path, Circle, Rect, Ellipse, Text as SvgText } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  useOnboardingAssessment,
  SupportNeed,
  ReclaimTimeFocus,
  BiggestStruggle,
  InterferenceLevel,
  AutopilotFrequency,
} from '@/store/onboardingAssessment';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomPlan'>;

type Feature = {
  id: string;
  icon: string;
  label: string;
  description: string;
};

const FALLBACK_RECLAIM_GOAL = {
  emoji: '🧭',
  label: 'Reclaim Your Time',
  pitch: 'Build rituals that trade autopilot scrolling for real progress',
  outcomePromise: 'Wake up clearer, ship meaningful work, and feel proud nightly',
};

const AUTOPILOT_HOURS_ESTIMATE: Record<AutopilotFrequency, number> = {
  rarely: 0.5,
  few_times: 1.5,
  five_to_ten: 2.5,
  ten_plus: 4,
};

const AUTOPILOT_IMPACT_COPY: Record<AutopilotFrequency, string> = {
  rarely: 'Those quick “just checking” moments are starting to pile up.',
  few_times: 'A few surprise opens each day quietly eat hours you wanted back.',
  five_to_ten: '5–10 loops a day means feeds grab every break you get.',
  ten_plus: '10+ opens a day tells us scroll is calling the shots right now.',
};

const SUPPORT_FEATURES: Record<Exclude<SupportNeed, 'all'>, Feature> = {
  limit_time: {
    id: 'limit_time',
    icon: '⏳',
    label: 'Time Caps & Guardrails',
    description: 'Daily time locks and blockers that shut the infinite swipe off.',
  },
  block_content: {
    id: 'block_content',
    icon: '🚫',
    label: 'Content Filters',
    description: 'We mute the feeds, alerts, and bait that spark binges.',
  },
  find_motivation: {
    id: 'find_motivation',
    icon: '🔥',
    label: 'Accountability Engine',
    description: 'Friendly nudges, streaks, and wins so momentum feels fun.',
  },
  productivity_tools: {
    id: 'productivity_tools',
    icon: '📊',
    label: 'Focus Rituals',
    description: 'Simple timers, grids, and to-dos that keep you shipping.',
  },
  connect: {
    id: 'connect',
    icon: '👥',
    label: 'Community Support',
    description: 'Small groups and coaches who cheer you on and call you back.',
  },
};

const RECLAIM_GOAL_COPY: Record<ReclaimTimeFocus, { emoji: string; label: string; pitch: string; outcomePromise: string }> = {
  side_hustle: {
    emoji: '🚀',
    label: 'Build Your Side Hustle',
    pitch: 'Reclaim hours to ship the project that matters',
    outcomePromise: "Get the traction you've been putting off",
  },
  content: {
    emoji: '🎨',
    label: 'Create Meaningful Content',
    pitch: 'Turn scroll time into content that moves people',
    outcomePromise: 'Build an audience that actually engages',
  },
  study: {
    emoji: '📚',
    label: 'Upskill Faster',
    pitch: 'Trade feeds for focused learning and growth',
    outcomePromise: 'Land the role or master the skill you want',
  },
  mental_health: {
    emoji: '🧘',
    label: 'Feel Lighter & Clearer',
    pitch: 'Replace anxiety spirals with mental spaciousness',
    outcomePromise: 'Wake up without dread. Sleep without doom.',
  },
  loved_ones: {
    emoji: '❤️',
    label: 'Be Present with People Who Matter',
    pitch: 'Win back attention for the relationships that count',
    outcomePromise: 'Actually be there when it matters most',
  },
};

const STRUGGLE_INSIGHT: Record<BiggestStruggle, { problem: string; solution: string }> = {
  time: {
    problem: 'Hours keep slipping into feeds while your real work waits.',
    solution: 'Hard limits and blockers stop the leak and hand time back.',
  },
  drained: {
    problem: 'Every scroll session leaves you tired, wired, and foggy.',
    solution: 'We strip triggers and replace them with calm routines.',
  },
  sleep_focus: {
    problem: 'Late-night scrolling wrecks your sleep and next-day focus.',
    solution: 'Bedtime blockers and focus shields guard your best hours.',
  },
  comparison: {
    problem: 'Comparing yourself online knocks your confidence flat.',
    solution: 'We mute the noise and give you wins you can feel offline.',
  },
  all: {
    problem: 'Every scroll trap seems to be firing at once.',
    solution: 'You get the full toolbox so we can tackle each loop in order.',
  },
};

const INTERFERENCE_SEVERITY: Record<InterferenceLevel, { label: string; urgency: string }> = {
  never: {
    label: 'Good window to fix it',
    urgency: 'Let’s put walls up now so habits stay small.',
  },
  once: {
    label: 'Slight interference',
    urgency: 'One delay already happened—stop the slide here.',
  },
  few_times: {
    label: 'Scroll wins some days',
    urgency: 'Guardrails now will keep real life on schedule.',
  },
  most_days: {
    label: 'Scroll wins most days',
    urgency: 'We need strong guardrails before bigger stuff slips.',
  },
  every_day: {
    label: 'Scroll wins every day',
    urgency: 'Every day the hole gets deeper. We act now.',
  },
};

const FUTURE_STATE_BADGES = [
  { icon: '⚡️', label: 'More energy' },
  { icon: '🎯', label: 'Locked focus' },
  { icon: '🤝', label: 'People in your corner' },
  { icon: '📈', label: 'Momentum growing' },
];

const DAILY_HABIT_STEPS = [
  { icon: '🛡️', title: 'Hide traps', copy: 'We tuck away the feeds and alerts that pull you in.' },
  { icon: '⚙️', title: 'Guided work', copy: 'Timers and checklists keep you moving without guesswork.' },
  { icon: '🤗', title: 'Builder circle', copy: 'Coaches and peers nudge you when willpower dips.' },
];

type GoalArtTheme = {
  key: string;
  gradient: [string, string];
  orbit: string;
  accent: string;
  detail: string;
  glyph: 'rocket' | 'camera' | 'books' | 'calm' | 'hearts';
};

const GOAL_ART_THEME: Record<ReclaimTimeFocus | 'default', GoalArtTheme> = {
  side_hustle: {
    key: 'hustle',
    gradient: ['#0B1D3A', '#122C59'],
    orbit: '#1F3A66',
    accent: '#FF9F1C',
    detail: '#FDC500',
    glyph: 'rocket',
  },
  content: {
    key: 'content',
    gradient: ['#1A0F2E', '#2B1742'],
    orbit: '#3A1D5A',
    accent: '#FF5D8F',
    detail: '#FFB5D0',
    glyph: 'camera',
  },
  study: {
    key: 'study',
    gradient: ['#0F2D1E', '#184730'],
    orbit: '#1F5C3F',
    accent: '#6BEAB5',
    detail: '#38C98E',
    glyph: 'books',
  },
  mental_health: {
    key: 'calm',
    gradient: ['#020202', '#0B0B0B'],
    orbit: '#090909',
    accent: '#121212',
    detail: '#1F1F1F',
    glyph: 'calm',
  },
  loved_ones: {
    key: 'loved',
    gradient: ['#2A0D1A', '#3F1526'],
    orbit: '#5A1F35',
    accent: '#FF85A1',
    detail: '#FFC0CB',
    glyph: 'hearts',
  },
  default: {
    key: 'default',
    gradient: ['#0F1C2E', '#1B2F4A'],
    orbit: '#274062',
    accent: '#F4B942',
    detail: '#FCE181',
    glyph: 'rocket',
  },
};

function GoalArtwork({ focus }: { focus: ReclaimTimeFocus | 'default' }) {
  const theme = GOAL_ART_THEME[focus] ?? GOAL_ART_THEME.default;
  const gradientId = `goal-grad-${theme.key}`;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 160">
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={theme.gradient[0]} />
          <Stop offset="100%" stopColor={theme.gradient[1]} />
        </SvgLinearGradient>
      </Defs>
      <Rect width="360" height="160" rx="28" fill={`url(#${gradientId})`} />
      <Circle cx="60" cy="50" r="70" fill={theme.orbit} opacity="0.35" />
      <Ellipse cx="280" cy="120" rx="120" ry="60" fill={theme.orbit} opacity="0.25" />
      {renderGoalGlyph(theme)}
    </Svg>
  );
}

function renderGoalGlyph(theme: GoalArtTheme) {
  switch (theme.glyph) {
    case 'rocket':
      return (
        <>
          <Path
            d="M180 110 C 180 60 210 30 230 30 C 250 30 280 60 280 110 L 280 126 C 280 132 276 138 270 140 L 190 140 C 184 138 180 132 180 126 Z"
            fill={theme.accent}
          />
          <Path d="M200 140 L 210 160 L 230 140 Z" fill={theme.detail} />
          <Circle cx="230" cy="82" r="18" fill={theme.detail} opacity={0.8} />
        </>
      );
    case 'camera':
      return (
        <>
          <Rect x="140" y="60" width="160" height="80" rx="18" fill={theme.accent} />
          <Circle cx="220" cy="100" r="28" fill={theme.gradient[0]} />
          <Circle cx="220" cy="100" r="16" fill={theme.detail} />
          <Rect x="170" y="42" width="50" height="24" rx="12" fill={theme.detail} />
        </>
      );
    case 'books':
      return (
        <>
          <Rect x="120" y="60" width="40" height="80" rx="8" fill={theme.accent} />
          <Rect x="170" y="70" width="50" height="90" rx="8" fill={theme.detail} />
          <Rect x="230" y="55" width="70" height="85" rx="10" fill={theme.accent} opacity={0.8} />
          <Path d="M170 95 H220" stroke={theme.gradient[0]} strokeWidth="6" strokeLinecap="round" />
          <Path d="M230 85 H290" stroke={theme.gradient[0]} strokeWidth="6" strokeLinecap="round" />
        </>
      );
    case 'calm':
      return (
        <>
          <Circle cx="180" cy="80" r="120" fill={theme.orbit} opacity={0.45} />
          <Circle cx="180" cy="80" r="72" fill={theme.accent} opacity={0.9} />
          <Circle cx="180" cy="80" r="48" fill={theme.detail} opacity={0.95} />
          <SvgText
            x="180"
            y="86"
            fontSize="60"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            🏆
          </SvgText>
        </>
      );
    case 'hearts':
      return (
        <>
          <Path
            d="M220 70 C220 55 232 45 245 45 C258 45 270 56 270 72 C270 96 240 118 220 130 C200 118 170 96 170 72 C170 56 182 45 195 45 C208 45 220 55 220 70 Z"
            fill={theme.accent}
          />
          <Path
            d="M240 60 C240 52 246 46 253 46 C260 46 266 52 266 60 C266 74 250 86 240 94 C230 86 214 74 214 60 C214 52 220 46 227 46 C234 46 240 52 240 60 Z"
            fill={theme.detail}
            opacity={0.9}
          />
        </>
      );
    default:
      return null;
  }
}

export default function CustomPlanScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    firstName,
    hoursPerDay,
    supportNeed,
    reclaimTimeFocus,
    biggestStruggle,
    interferenceLevel,
    autopilotFrequency,
  } = useOnboardingAssessment();

  const userHeadline = useMemo(() => {
    const name = firstName?.trim();
    if (name && reclaimTimeFocus) {
      return `${name}, your plan is ready`;
    }
    if (name) {
      return `${name}, here's your custom reset`;
    }
    return 'Your personalized plan is ready';
  }, [firstName, reclaimTimeFocus]);

  const computedHoursPerDay = useMemo(() => {
    if (hoursPerDay !== null) {
      return hoursPerDay;
    }
    if (autopilotFrequency) {
      return AUTOPILOT_HOURS_ESTIMATE[autopilotFrequency];
    }
    return null;
  }, [hoursPerDay, autopilotFrequency]);

  const reclaimGoal = reclaimTimeFocus ? RECLAIM_GOAL_COPY[reclaimTimeFocus] : FALLBACK_RECLAIM_GOAL;

  const weeklyRecovery = computedHoursPerDay !== null ? Math.round(computedHoursPerDay * 7) : null;

  const selectedFeature = supportNeed && supportNeed !== 'all' ? SUPPORT_FEATURES[supportNeed] : null;

  const coreFeatures: Feature[] = useMemo(() => {
    const features: Feature[] = [];
    if (selectedFeature) {
      features.push(selectedFeature);
    }
    Object.values(SUPPORT_FEATURES).forEach(feature => {
      if (feature.id !== selectedFeature?.id && features.length < 3) {
        features.push(feature);
      }
    });
    return features;
  }, [selectedFeature]);

  const struggleInsight = useMemo(() => {
    if (biggestStruggle && biggestStruggle !== 'all') {
      return STRUGGLE_INSIGHT[biggestStruggle];
    }
    if (autopilotFrequency) {
      return {
        problem: AUTOPILOT_IMPACT_COPY[autopilotFrequency],
        solution: 'Guardrails, rituals, and community to break the loop for good',
      };
    }
    return {
      problem: 'We detected patterns that are draining your focus.',
      solution: 'We’ll layer blockers, rituals, and coaching to rebuild momentum.',
    };
  }, [biggestStruggle, autopilotFrequency]);

  const severityLevel = interferenceLevel
    ? INTERFERENCE_SEVERITY[interferenceLevel]
    : {
        label: 'Momentum window',
        urgency: 'Lock in routines while motivation is fresh',
      };

  const targetDateLabel = useMemo(() => {
    const target = new Date();
    target.setDate(target.getDate() + 30);
    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const impactStats = useMemo(() => {
    const stats: string[] = [];
    if (computedHoursPerDay !== null && computedHoursPerDay >= 2) {
      stats.push(`${Math.round(computedHoursPerDay * 365)} hours/year slipping away`);
    }
    if (autopilotFrequency) {
      stats.push(AUTOPILOT_IMPACT_COPY[autopilotFrequency]);
    }
    if (interferenceLevel === 'every_day' || interferenceLevel === 'most_days') {
      stats.push('Hijacking your priorities daily');
    }
    if (stats.length === 0) {
      stats.push('Patterns are emerging—perfect moment for an intervention.');
    }
    return stats;
  }, [computedHoursPerDay, autopilotFrequency, interferenceLevel]);

  const urgencyMessage = useMemo(() => {
    if (interferenceLevel === 'every_day') {
      return 'This is urgent. Every day you wait, patterns deepen.';
    }
    if (interferenceLevel === 'most_days') {
      return 'The window to change is narrowing. Act now.';
    }
    if (computedHoursPerDay !== null && computedHoursPerDay >= 4) {
      return 'At this level, intervention is critical.';
    }
    return 'Let’s lock this in before the scroll spiral accelerates.';
  }, [interferenceLevel, computedHoursPerDay]);

  const handleContinue = () => {
    navigation.navigate('ReferralCode');
  };

  const goalCard = reclaimGoal && (
    <Animated.View entering={FadeInUp.delay(100).duration(250)} style={styles.goalCard}>
      <View style={styles.goalArtWrapper}>
        {/* Lock artwork to the trophy theme so visuals stay consistent */}
        <GoalArtwork focus="mental_health" />
      </View>
      <View style={styles.goalTextBlock}>
        <Text style={styles.goalLabel}>{reclaimGoal.label}</Text>
        <Text style={styles.goalPitch}>{reclaimGoal.pitch}</Text>
        <View style={styles.outcomePromiseContainer}>
          <Text style={styles.outcomePromise}>{reclaimGoal.outcomePromise}</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(250)} style={styles.heroSection}>
          <Text style={styles.headline}>{userHeadline}</Text>
          <Text style={styles.subheadline}>
            Built around what you told us. We’ll help you beat the scroll and take back your day.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(40).duration(250)} style={styles.futureSelfCard}>
          <Text style={styles.futureEyebrow}>In 30 days</Text>
          <Text style={styles.futurePromise}>
            {weeklyRecovery !== null
              ? `You’ll win back about ${weeklyRecovery} focused hours each week so you can use them on real life.`
              : `You’ll feel calmer, clearer, and back in charge again.`}
          </Text>
          <Text style={styles.futureDate}>
            By <Text style={styles.futureDateHighlight}>{targetDateLabel}</Text> you can wake up proud instead of panicked.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(250)} style={styles.futureBadges}>
          {FUTURE_STATE_BADGES.map(badge => (
            <View key={badge.label} style={styles.futureBadge}>
              <Text style={styles.futureBadgeIcon}>{badge.icon}</Text>
              <Text style={styles.futureBadgeLabel}>{badge.label}</Text>
            </View>
          ))}
        </Animated.View>

        {goalCard}

        {struggleInsight && (
          <Animated.View entering={FadeInUp.delay(150).duration(250)} style={styles.struggleCard}>
            <Text style={styles.struggleEyebrow}>What you told us</Text>
            <Text style={styles.struggleProblem}>{struggleInsight.problem}</Text>
            <View style={styles.struggleDivider} />
            <Text style={styles.struggleSolutionLabel}>How we'll fix it</Text>
            <Text style={styles.struggleSolution}>{struggleInsight.solution}</Text>
          </Animated.View>
        )}

        {impactStats.length > 0 && (
          <Animated.View entering={FadeInUp.delay(175).duration(250)} style={styles.impactCard}>
            <Text style={styles.impactTitle}>Why this matters</Text>
            {impactStats.map((stat, index) => (
              <View key={index} style={styles.impactStatRow}>
                <Text style={styles.impactBullet}>•</Text>
                <Text style={styles.impactStat}>{stat}</Text>
              </View>
            ))}
            {urgencyMessage && (
              <Text style={styles.urgencyMessage}>{urgencyMessage}</Text>
            )}
          </Animated.View>
        )}

        {weeklyRecovery !== null && (
          <Animated.View entering={FadeInUp.delay(200).duration(250)} style={styles.recoveryCard}>
            <Text style={styles.recoveryStat}>{weeklyRecovery}h/week</Text>
            <Text style={styles.recoveryLabel}>Time You'll Reclaim</Text>
            <Text style={styles.recoveryNote}>
              That’s real time you can pour into people, projects, and rest.
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(300).duration(250)} style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Your Custom Toolbox</Text>
          {selectedFeature && (
            <View style={styles.featureHighlight}>
              <Text style={styles.featureHighlightBadge}>YOU CHOSE THIS</Text>
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>{selectedFeature.icon}</Text>
                <Text style={styles.featureLabel}>{selectedFeature.label}</Text>
                <Text style={styles.featureDescription}>{selectedFeature.description}</Text>
              </View>
            </View>
          )}

          {coreFeatures.length > 1 && (
            <>
              <Text style={styles.alsoIncludedLabel}>Also included:</Text>
              {coreFeatures.slice(1).map(feature => (
                <View key={feature.id} style={styles.featureCard}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(250)} style={styles.foundationCard}>
          <Text style={styles.foundationEyebrow}>Core guardrails in every plan</Text>
          <View style={styles.foundationBulletRow}>
            <View style={styles.foundationBulletDot} />
            <Text style={styles.foundationBulletCopy}>We hide endless feeds, alerts, and traps across your socials.</Text>
          </View>
          <View style={styles.foundationBulletRow}>
            <View style={styles.foundationBulletDot} />
            <Text style={styles.foundationBulletCopy}>You plug into a community obsessed with getting better together.</Text>
          </View>
          <View style={styles.foundationBulletRow}>
            <View style={styles.foundationBulletDot} />
            <Text style={styles.foundationBulletCopy}>
              Timers, rituals, and trackers guide every day so you always know the next step.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(325).duration(250)} style={styles.dailySystemCard}>
          <Text style={styles.dailySystemTitle}>Your daily system</Text>
          {DAILY_HABIT_STEPS.map(step => (
            <View key={step.title} style={styles.dailyRow}>
              <Text style={styles.dailyIcon}>{step.icon}</Text>
              <View style={styles.dailyCopyBlock}>
                <Text style={styles.dailyRowTitle}>{step.title}</Text>
                <Text style={styles.dailyRowCopy}>{step.copy}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {severityLevel && (
          <Animated.View entering={FadeInUp.delay(375).duration(250)} style={styles.severityBadgeContainer}>
            <View style={styles.severityBadge}>
              <Text style={styles.severityLabel}>{severityLevel.label}</Text>
              <Text style={styles.severityUrgency}>{severityLevel.urgency}</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(390).duration(250)} style={styles.socialProofCard}>
          <Text style={styles.socialProofTitle}>What members feel after week 3</Text>
          <Text style={styles.socialProofQuote}>
            “My feeds are quiet, my brain is calm, and I shipped more this week than the last two months combined.”
          </Text>
          <Text style={styles.socialProofAttribution}>— Builder in our reset cohort</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(250)} style={styles.closingCard}>
          <Text style={styles.closingText}>
            This isn’t another tip list. It’s the app that hides traps, guides your day, and keeps you building.
          </Text>
          {reclaimGoal && (
            <Text style={styles.closingCta}>
              Ready to {reclaimGoal.label.toLowerCase()}? Start now.
            </Text>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, SPACING.space_4) }]}>
        <WatercolorButton color="yellow" onPress={handleContinue}>
          <Text style={styles.buttonText}>Become UNSCROLLED</Text>
        </WatercolorButton>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_4,
    paddingBottom: SPACING.space_6,
    gap: SPACING.space_4,
  },
  heroSection: {
    alignItems: 'center',
    gap: SPACING.space_1,
  },
  futureSelfCard: {
    padding: SPACING.space_4,
    borderRadius: 20,
    backgroundColor: '#fffef9',
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: SPACING.space_2,
  },
  futureEyebrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  futurePromise: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    lineHeight: 30,
    color: '#1f2937',
  },
  futureDate: {
    ...TYPOGRAPHY.Body,
    color: '#475569',
    lineHeight: 22,
  },
  futureDateHighlight: {
    color: '#1f2937',
    fontFamily: 'Inter-SemiBold',
  },
  futureBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
    justifyContent: 'center',
  },
  futureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    backgroundColor: '#F5F7FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: SPACING.space_1,
  },
  futureBadgeIcon: {
    fontSize: 14,
  },
  futureBadgeLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  visionScene: {
    display: 'none',
  },
  foundationCard: {
    padding: SPACING.space_4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#fffef9',
    gap: SPACING.space_2,
  },
  foundationEyebrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  foundationBulletRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    alignItems: 'flex-start',
  },
  foundationBulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
    marginTop: SPACING.space_1 / 2,
  },
  foundationBulletCopy: {
    ...TYPOGRAPHY.Body,
    color: '#1f2937',
    flex: 1,
    lineHeight: 22,
  },
  dailySystemCard: {
    padding: SPACING.space_4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: '#010101',
    gap: SPACING.space_3,
  },
  dailySystemTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#FFFFFF',
  },
  dailyRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
  },
  dailyIcon: {
    fontSize: 22,
  },
  dailyCopyBlock: {
    flex: 1,
    gap: SPACING.space_1 / 2,
  },
  dailyRowTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  dailyRowCopy: {
    ...TYPOGRAPHY.Subtext,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  socialProofCard: {
    padding: SPACING.space_4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#FDF6EC',
    gap: SPACING.space_2,
  },
  socialProofTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#9A4A0D',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialProofQuote: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    lineHeight: 30,
    color: '#7A271A',
  },
  socialProofAttribution: {
    ...TYPOGRAPHY.Subtext,
    color: '#A15A1F',
  },
  headline: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 40,
  },
  subheadline: {
    ...TYPOGRAPHY.Body,
    color: '#475569',
    textAlign: 'center',
  },
  goalCard: {
    padding: SPACING.space_4,
    borderRadius: 20,
    backgroundColor: '#fffef9',
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: SPACING.space_3,
  },
  goalArtWrapper: {
    width: '100%',
    aspectRatio: 360 / 160,
    borderRadius: 20,
    overflow: 'hidden',
  },
  goalTextBlock: {
    gap: SPACING.space_2,
    alignItems: 'center',
  },
  goalLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
    textAlign: 'center',
  },
  goalPitch: {
    ...TYPOGRAPHY.Body,
    color: '#475569',
    textAlign: 'center',
  },
  outcomePromiseContainer: {
    marginTop: SPACING.space_2,
    paddingTop: SPACING.space_3,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    width: '100%',
  },
  outcomePromise: {
    ...TYPOGRAPHY.Body,
    color: '#1f2937',
    textAlign: 'center',
  },
  struggleCard: {
    padding: SPACING.space_4,
    borderRadius: 20,
    backgroundColor: '#fffef9',
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: SPACING.space_2,
  },
  struggleEyebrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.space_1,
  },
  struggleProblem: {
    ...TYPOGRAPHY.Body,
    color: '#1f2937',
    lineHeight: 24,
  },
  struggleDivider: {
    height: 1,
    backgroundColor: '#1f2937',
    marginVertical: SPACING.space_2,
  },
  struggleSolutionLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.space_1,
  },
  struggleSolution: {
    ...TYPOGRAPHY.Body,
    color: '#1f2937',
    lineHeight: 24,
  },
  impactCard: {
    padding: SPACING.space_4,
    borderRadius: 20,
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#B42318',
    gap: SPACING.space_2,
  },
  impactTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#7A271A',
    marginBottom: SPACING.space_1,
  },
  impactStatRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    alignItems: 'flex-start',
  },
  impactBullet: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#B42318',
  },
  impactStat: {
    ...TYPOGRAPHY.Body,
    color: '#7A271A',
    flex: 1,
  },
  urgencyMessage: {
    ...TYPOGRAPHY.Body,
    color: '#B42318',
    marginTop: SPACING.space_2,
    paddingTop: SPACING.space_2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(180, 35, 24, 0.3)',
  },
  recoveryCard: {
    padding: SPACING.space_4,
    borderRadius: 20,
    backgroundColor: '#fffef9',
    borderWidth: 2,
    borderColor: '#fbbf24',
    alignItems: 'center',
    gap: SPACING.space_1,
  },
  recoveryStat: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 48,
    color: '#1f2937',
    lineHeight: 56,
  },
  recoveryLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  recoveryNote: {
    ...TYPOGRAPHY.Subtext,
    color: '#475569',
    textAlign: 'center',
    marginTop: SPACING.space_1,
  },
  featuresSection: {
    gap: SPACING.space_2,
  },
  featuresSectionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  featureHighlight: {
    gap: SPACING.space_1,
  },
  featureHighlightBadge: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#fbbf24',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featureCard: {
    padding: SPACING.space_3,
    borderRadius: 20,
    backgroundColor: '#fffef9',
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: SPACING.space_1,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  featureDescription: {
    ...TYPOGRAPHY.Subtext,
    color: '#475569',
  },
  alsoIncludedLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    marginTop: SPACING.space_1,
  },
  severityBadgeContainer: {
    alignItems: 'center',
  },
  severityBadge: {
    padding: SPACING.space_3,
    borderRadius: 20,
    backgroundColor: '#fffef9',
    borderWidth: 1,
    borderColor: '#fbbf24',
    alignItems: 'center',
    gap: SPACING.space_1,
  },
  severityLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  severityUrgency: {
    ...TYPOGRAPHY.Body,
    color: '#475569',
    textAlign: 'center',
  },
  closingCard: {
    padding: SPACING.space_4,
    borderRadius: 20,
    backgroundColor: '#fffef9',
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: SPACING.space_2,
  },
  closingText: {
    ...TYPOGRAPHY.Body,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 24,
  },
  closingCta: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#fbbf24',
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_3,
    gap: SPACING.space_2,
  },
  disclaimer: {
    ...TYPOGRAPHY.Subtext,
    color: '#475569',
    textAlign: 'center',
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
