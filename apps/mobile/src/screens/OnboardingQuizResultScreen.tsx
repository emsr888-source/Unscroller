import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  useOnboardingAssessment,
  UseLevel,
  ImpactLevel,
  ReclaimTimeFocus,
  BiggestStruggle,
  FeelingAfterScroll,
  AutopilotFrequency,
  InterferenceLevel,
  SocialApproach,
  SupportNeed,
} from '@/store/onboardingAssessment';
import { analytics } from '@/services/analytics';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { RADII } from '@/core/theme/radii';
import { COLORS } from '@/core/theme/colors';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';

const DANGER_PRIMARY = '#B42318';
const DANGER_DARK = '#7A271A';

const formatHours = (value: number) => {
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return formatted.replace(/\.0$/, '');
};

const formatDaysFromHours = (hours: number) => {
  const days = hours / 24;
  const formatted = days < 1 ? days.toFixed(1) : Math.round(days);
  return typeof formatted === 'number' ? formatted.toString() : formatted;
};

const getUseLevel = (hours: number): UseLevel => {
  if (hours < 1) return 'Light';
  if (hours < 3) return 'Moderate';
  if (hours < 5) return 'Heavy';
  return 'Very Heavy';
};

const getImpactLabel = (symptomCount: number): ImpactLevel => {
  if (symptomCount === 0) return 'Early Warning';
  if (symptomCount <= 1) return 'Mild Impact';
  if (symptomCount <= 3) return 'Noticeable Impact';
  return 'High Impact';
};

const PROFILE_HEADLINES: Record<BiggestStruggle | 'fallback', string> = {
  time: 'Your hours slip away before you even notice.',
  drained: 'Each scroll leaves you tired and dull.',
  sleep_focus: 'Late feeds steal sleep and next-day focus.',
  comparison: 'Constant comparing is crushing your confidence.',
  all: 'Every scroll trap is firing at once right now.',
  fallback: 'Right now the scroll habit is running the show.',
};

const FEELING_LINES: Record<FeelingAfterScroll, string> = {
  positive: 'feel a tiny spark, but it fades fast.',
  neutral: 'finish feeling numb and stuck.',
  behind: 'end up behind or let down by yourself.',
  anxious: 'get hit with worry and guilt once the feed is quiet.',
};

const STRUGGLE_LINES: Record<BiggestStruggle, string> = {
  time: 'Feeds eat your time faster than you can guard it.',
  drained: 'Scrolling drains your energy so real work feels heavy.',
  sleep_focus: 'Night scrolling wrecks sleep and focus the next day.',
  comparison: 'Comparing yourself online steals your momentum.',
  all: 'It isn’t one thing—it’s the whole cluster at once.',
};

const RECLAIM_LINES: Record<ReclaimTimeFocus, string> = {
  side_hustle: 'building something of your own',
  content: 'making meaningful content',
  study: 'learning so more doors open',
  mental_health: 'feeling lighter and calmer',
  loved_ones: 'being present with people you love',
};

const READINESS_LINES = {
  low: 'You know it hurts and need some gentle walls.',
  mid: 'You want structure so showing up finally sticks.',
  high: 'You’re ready for a real reset, not another pep talk.',
};

const AUTOPILOT_LINES: Partial<Record<AutopilotFrequency, string>> = {
  rarely: 'You open on purpose, but nothing stops you yet.',
  few_times: '“Just checking” a few times a day quietly knocks you off course.',
  five_to_ten: '5–10 autopilot opens means your thumb is in charge.',
  ten_plus: '10+ autopilot hits a day means scroll is the default.',
};

const INTERFERENCE_LINES: Partial<Record<InterferenceLevel, string>> = {
  never: 'Life still works, but the window to fix it is closing.',
  once: 'Scroll already made you delay something important this week.',
  few_times: 'Feeds pushed real work aside more than once.',
  most_days: 'Most days scroll wins before your priorities do.',
  every_day: 'Every single day the feed grabs your focus first.',
};

const INTERFERENCE_BADGE: Partial<Record<InterferenceLevel, string>> = {
  never: 'Rarely hijacks',
  once: 'Hits once',
  few_times: 'Some days',
  most_days: 'Most days',
  every_day: 'Daily crisis',
};

const APPROACH_LINES: Partial<Record<SocialApproach, string>> = {
  addicted: 'You said you need a hard reset—the habit feels compulsory.',
  distracted: 'You’re functional, but distraction taxes every task.',
  work_mode: 'You hop in for work and the feed hijacks the session.',
};

const SUPPORT_NEED_PITCH: Partial<Record<Exclude<SupportNeed, 'all'>, string>> = {
  limit_time: 'We cap daily scroll so hours stop leaking.',
  block_content: 'We block the triggers that make you binge.',
  find_motivation: 'We send friendly nudges so effort feels fun.',
  productivity_tools: 'We hand you simple focus tools so progress stays clear.',
  connect: 'We plug you into people so you don’t fight alone.',
};

const AUTOPILOT_BADGE: Partial<Record<AutopilotFrequency, string>> = {
  rarely: 'Mostly intentional',
  few_times: '3-4 autopilot hits/day',
  five_to_ten: '5-10 autopilot hits/day',
  ten_plus: '10+ autopilot hits/day',
};

const AUTOPILOT_SEVERITY: Partial<Record<AutopilotFrequency, number>> = {
  rarely: 0.25,
  few_times: 0.5,
  five_to_ten: 0.75,
  ten_plus: 1,
};

const INTERFERENCE_SEVERITY: Partial<Record<InterferenceLevel, number>> = {
  never: 0.1,
  once: 0.25,
  few_times: 0.45,
  most_days: 0.75,
  every_day: 1,
};

const SYMPTOM_LABELS: Record<string, string> = {
  unmotivated: 'feeling unmotivated',
  no_ambition: 'lacking ambition to pursue goals',
  concentration: 'difficulty concentrating',
  memory: "brain fog or poor memory",
  anxiety: 'general anxiety',
  fomo: 'fear of missing out',
  low_confidence: 'low self-confidence',
  comparison: 'constant comparison to others',
  time_waste: 'wasting hours scrolling',
  no_socialize: 'reduced desire to socialize',
  isolated: 'feeling isolated from others',
  sleep: 'poor sleep quality',
  eye_strain: 'eye strain or headaches',
  posture: 'poor posture',
};

const DIAGNOSTIC_BACKGROUNDS = ['#FFF6F3', '#F3F4FF', '#F9F5FF', '#F2FBFA'];

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingQuizResult'>;

export default function OnboardingQuizResultScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const { height } = useWindowDimensions();
  const isCompact = height < 700;
  const insets = useSafeAreaInsets();
  const {
    hoursPerDay,
    phoneHoursPerDay,
    symptomsSelected,
    firstName,
    biggestStruggle,
    reclaimTimeFocus,
    feelingAfterScroll,
    readinessToChange,
    autopilotFrequency,
    interferenceLevel,
    socialApproach,
    supportNeed,
  } = useOnboardingAssessment();

  const symptomCount = symptomsSelected.length;
  const useLevel = hoursPerDay !== null ? getUseLevel(hoursPerDay) : null;
  const impactLabel = getImpactLabel(symptomCount);
  const weeklyHours = hoursPerDay !== null ? hoursPerDay * 7 : null;
  const monthlyHours = hoursPerDay !== null ? hoursPerDay * 30 : null;
  const analyticsPayload = useMemo(
    () => ({
      hoursPerDay,
      symptomCount,
      useLevel,
      impactLabel,
      weeklyHours,
      monthlyHours,
    }),
    [hoursPerDay, symptomCount, useLevel, impactLabel, weeklyHours, monthlyHours],
  );

  useEffect(() => {
    analytics.track('OnboardingQuizResultViewed', analyticsPayload);
  }, [analyticsPayload]);

  const profileHeadline = useMemo(() => {
    if (!biggestStruggle) {
      return PROFILE_HEADLINES.fallback;
    }
    return PROFILE_HEADLINES[biggestStruggle];
  }, [biggestStruggle]);

  const feelingLine = useMemo(() => {
    if (!feelingAfterScroll) {
      return 'You skipped how scrolling makes you feel. We’ll ask again soon.';
    }
    return `After scrolling you usually ${FEELING_LINES[feelingAfterScroll]}`;
  }, [feelingAfterScroll]);

  const struggleLine = useMemo(() => {
    if (!biggestStruggle) {
      return 'Tell us your biggest struggle so we can target it.';
    }
    return `Your biggest struggle: ${STRUGGLE_LINES[biggestStruggle]}`;
  }, [biggestStruggle]);

  const reclaimLine = useMemo(() => {
    if (!reclaimTimeFocus) {
      return 'You haven’t picked where you want your time back yet.';
    }
    return `You’d rather spend that time on ${RECLAIM_LINES[reclaimTimeFocus]}.`;
  }, [reclaimTimeFocus]);

  const readinessPhrase = useMemo(() => {
    if (!readinessToChange) {
      return 'Tell us how urgent this feels so we can aim the plan.';
    }
    if (readinessToChange <= 2) {
      return READINESS_LINES.low;
    }
    if (readinessToChange <= 4) {
      return READINESS_LINES.mid;
    }
    return READINESS_LINES.high;
  }, [readinessToChange]);

  const bluntTrade = useMemo(() => {
    const reclaimTarget = reclaimTimeFocus ? RECLAIM_LINES[reclaimTimeFocus] : 'your best work';
    return `If nothing changes, you’ll keep trading ${reclaimTarget} for endless scrolling.`;
  }, [reclaimTimeFocus]);

  const autopilotLine = useMemo(() => {
    if (!autopilotFrequency) {
      return 'Tell us how often autopilot hits so we can gauge the pull.';
    }
    return AUTOPILOT_LINES[autopilotFrequency] ?? 'Autopilot sessions are steering too much of your day.';
  }, [autopilotFrequency]);

  const interferenceLine = useMemo(() => {
    if (!interferenceLevel) {
      return 'Tell us how often scroll interrupts real life so we can measure impact.';
    }
    return INTERFERENCE_LINES[interferenceLevel] ?? 'Scroll keeps jumping ahead of your priorities.';
  }, [interferenceLevel]);

  const approachLine = useMemo(() => {
    if (!socialApproach) {
      return 'Share how feeds feel so we can set the right guardrails.';
    }
    return APPROACH_LINES[socialApproach] ?? 'The tone you marked is shaping how we reset habits.';
  }, [socialApproach]);

  const supportNeedLine = useMemo(() => {
    if (!supportNeed || supportNeed === 'all') {
      return 'You asked for the whole toolkit, so we blend blockers, structure, and people who get it.';
    }
    return SUPPORT_NEED_PITCH[supportNeed] ?? 'We’ll build the guardrails you asked for.';
  }, [supportNeed]);

  const conclusionSummary = useMemo(() => {
    const statements: string[] = [];
    if (hoursPerDay !== null) {
      statements.push(`About ${Math.round(hoursPerDay * 7)} hours every week vanish into scrolling.`);
    }
    if (symptomCount) {
      const highlights = symptomsSelected
        .slice(0, 2)
        .map(id => SYMPTOM_LABELS[id] ?? 'a symptom you flagged')
        .join(' + ');
      statements.push(`Your body already waved the flags: ${highlights}.`);
    }
    if (readinessToChange) {
      statements.push(readinessPhrase);
    }
    const reclaimTarget = reclaimTimeFocus ? RECLAIM_LINES[reclaimTimeFocus] : 'your best work';
    statements.push(`If nothing changes you’ll keep swapping ${reclaimTarget} for feeds.`);
    statements.push(supportNeedLine);
    return statements.join(' ');
  }, [hoursPerDay, symptomCount, symptomsSelected, readinessPhrase, reclaimTimeFocus, supportNeedLine]);

  const phoneHoursLine =
    phoneHoursPerDay !== null
      ? `You spend about ${formatHours(phoneHoursPerDay)} hours every day on your phone.`
      : 'You skipped the phone hours slider.';

  const socialHoursLine =
    hoursPerDay !== null
      ? `Social media alone eats ${formatHours(hoursPerDay)} hours each day.`
      : 'You skipped the social media hours slider.';

  const timeTranslationLine =
    hoursPerDay !== null
      ? `That equals about ${Math.round(hoursPerDay * 7)} hours a week and ${formatDaysFromHours(hoursPerDay * 30)} full days every month gone.`
      : 'Share those hours so we can translate the weekly and monthly cost.';

  const symptomSummaryLine = useMemo(() => {
    if (!symptomCount) {
      return 'You skipped the symptom check-in, so we’ll ask again soon.';
    }
    const labels = symptomsSelected.slice(0, 3).map(id => SYMPTOM_LABELS[id] ?? 'a symptom you flagged');
    const formattedList =
      labels.length === 1
        ? labels[0]
        : labels.length === 2
        ? `${labels[0]} and ${labels[1]}`
        : `${labels[0]}, ${labels[1]}, and ${labels[2]}`;
    return `You told us you feel ${formattedList}.`;
  }, [symptomCount, symptomsSelected]);

  const symptomFollowUpLine = useMemo(() => {
    if (!symptomCount) {
      return 'Once you share more, we’ll match tools to your stress, focus, and recovery.';
    }
    if (symptomCount === 1) {
      return 'We’ll zero in on that pain first so you feel relief fast.';
    }
    if (symptomCount <= 3) {
      return 'We’ll target the exact pains you flagged before anything else.';
    }
    return 'We’ll tackle the heaviest pains first so you’re not juggling everything.';
  }, [symptomCount]);

  const handleContinue = () => {
    navigation.navigate('ExpertQuotes');
  };

  const namePrefix = firstName?.trim();
  const profileTitle = namePrefix ? `${namePrefix}, here’s what your quiz revealed` : 'Here’s what your quiz revealed';
  const autopilotTag = autopilotFrequency ? AUTOPILOT_BADGE[autopilotFrequency] ?? null : null;
  const isSevereUsage = hoursPerDay !== null && hoursPerDay >= 3;
  const isSevereSymptoms = symptomCount >= 3;
  const isSevereInterference = !!interferenceLevel && ['most_days', 'every_day'].includes(interferenceLevel);
  const isSevereAutopilot = autopilotFrequency === 'ten_plus';
  const riskLabel = isSevereUsage || isSevereSymptoms || isSevereInterference || isSevereAutopilot ? 'High risk state' : 'Warning signs';
  const redFlagSummary = useMemo(() => {
    const statements: string[] = [];
    if (isSevereUsage && weeklyHours !== null) {
      statements.push(`${Math.round(weeklyHours)}h/week lost to feeds`);
    }
    if (isSevereSymptoms) {
      statements.push(`${symptomCount}+ symptoms flagged`);
    }
    if (isSevereInterference) {
      statements.push('scroll hijacks priorities most days');
    }
    if (isSevereAutopilot) {
      statements.push('10+ autopilot opens daily');
    }
    if (!statements.length) {
      return 'Early warning signs already showed up—address them before they spread.';
    }
    return statements.join(' · ');
  }, [isSevereUsage, weeklyHours, isSevereSymptoms, symptomCount, isSevereInterference, isSevereAutopilot]);

  const usageSeverity = hoursPerDay !== null ? Math.min(hoursPerDay / 5, 1) : 0;
  const autopilotSeverity = autopilotFrequency ? AUTOPILOT_SEVERITY[autopilotFrequency] ?? 0 : 0;
  const interferenceSeverity = interferenceLevel ? INTERFERENCE_SEVERITY[interferenceLevel] ?? 0 : 0;
  const interferenceBadge = interferenceLevel ? INTERFERENCE_BADGE[interferenceLevel] ?? 'Impact unknown' : 'Impact unknown';
  const reclaimFocusShort = reclaimTimeFocus ? RECLAIM_LINES[reclaimTimeFocus] : 'your best work';

  const heroStats = useMemo(() => {
    const monthlyDays = monthlyHours !== null ? formatDaysFromHours(monthlyHours) : null;
    return [
      {
        id: 'time',
        icon: '⏱️',
        label: 'Weekly loss',
        value: weeklyHours !== null ? `${Math.round(weeklyHours)}h` : 'Unknown',
        caption: monthlyDays ? `≈${monthlyDays} days/month` : 'Need hour data',
      },
      {
        id: 'symptoms',
        icon: '🧠',
        label: 'Symptoms',
        value: symptomCount ? `${symptomCount}` : '0',
        caption: symptomCount ? 'Your body is waving flags.' : 'Share what’s hurting.',
      },
      {
        id: 'interference',
        icon: '⚠️',
        label: 'Interference',
        value: interferenceBadge,
        caption: interferenceLine,
      },
    ];
  }, [weeklyHours, monthlyHours, symptomCount, interferenceBadge, interferenceLine]);

  const heroMeters = useMemo(
    () => [
      {
        id: 'usage',
        label: 'Usage load',
        value: useLevel ? `${useLevel} usage` : 'Usage unknown',
        severity: usageSeverity,
      },
      {
        id: 'autopilot',
        label: 'Autopilot pull',
        value: autopilotTag ?? 'Need data',
        severity: autopilotSeverity,
      },
      {
        id: 'interference',
        label: 'Life interference',
        value: interferenceBadge,
        severity: interferenceSeverity,
      },
    ],
    [useLevel, usageSeverity, autopilotTag, autopilotSeverity, interferenceBadge, interferenceSeverity],
  );

  const diagnosticSections = useMemo(
    () => [
      {
        id: 'time',
        label: 'Time tax',
        icon: '⏱️',
        items: [phoneHoursLine, socialHoursLine, timeTranslationLine],
      },
      {
        id: 'body',
        label: 'Signals from your body',
        icon: '🫀',
        items: [feelingLine, struggleLine, symptomSummaryLine, symptomFollowUpLine],
      },
      {
        id: 'autopilot',
        label: 'Autopilot loops',
        icon: '🤖',
        items: [autopilotLine, interferenceLine, approachLine],
      },
      {
        id: 'future',
        label: 'Where you want the time back',
        icon: '🎯',
        items: [reclaimLine, readinessPhrase, bluntTrade],
      },
    ],
    [
      phoneHoursLine,
      socialHoursLine,
      timeTranslationLine,
      feelingLine,
      struggleLine,
      symptomSummaryLine,
      symptomFollowUpLine,
      autopilotLine,
      interferenceLine,
      approachLine,
      reclaimLine,
      readinessPhrase,
      bluntTrade,
    ],
  );

  const futureHighlights = useMemo(() => {
    const highlights: string[] = [];
    if (weeklyHours !== null) {
      highlights.push(`Regain ~${Math.round(weeklyHours)} focused hours each week once we clamp autopilot loops.`);
    }
    highlights.push(`You want that time back for ${reclaimFocusShort}.`);
    highlights.push(readinessPhrase);
    highlights.push(supportNeedLine);
    highlights.push(bluntTrade);
    return highlights;
  }, [weeklyHours, readinessPhrase, supportNeedLine, bluntTrade, reclaimFocusShort]);

  return (
    <View style={styles.root}>
      <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.page}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollContentCompact]}
            showsVerticalScrollIndicator={false}
          >
          <Animated.View entering={FadeInUp.duration(320)} style={styles.heroPanel}>
            <View style={styles.heroArt}>
              <View style={styles.heroPulseRing} />
              <View style={[styles.heroPulseRing, styles.heroPulseRingSecondary]} />
              <View style={styles.heroPhone}>
                <View style={styles.heroPhoneHeader}>
                  <Text style={styles.heroPhoneTime}>
                    {weeklyHours !== null ? `${Math.round(weeklyHours)}h/wk` : 'Unknown'}
                  </Text>
                  <Text style={styles.heroPhoneStatus}>lost to feeds</Text>
                </View>
                <View style={styles.heroFeedBlock}>
                  <View style={[styles.heroFeedLine, styles.heroFeedLineDanger]} />
                  <View style={[styles.heroFeedLine, styles.heroFeedLineMuted]} />
                  <View style={[styles.heroFeedLine, styles.heroFeedLineMutedShort]} />
                </View>
                <View style={[styles.heroFeedBlock, styles.heroFeedBlockSecondary]}>
                  <View style={[styles.heroFeedLine, styles.heroFeedLineWarning]} />
                  <View style={[styles.heroFeedLine, styles.heroFeedLineMuted]} />
                </View>
              </View>
              <View style={styles.heroWarningCard}>
                <Text style={styles.heroWarningLabel}>Autopilot loops</Text>
                <Text style={styles.heroWarningValue}>
                  {autopilotTag ?? 'Tell us how often they hit'}
                </Text>
                <Text style={styles.heroWarningCopy}>{redFlagSummary}</Text>
              </View>
            </View>
            <View style={styles.heroRiskRow}>
              <View style={styles.heroRiskPill}>
                <Text style={styles.heroRiskText}>{riskLabel}</Text>
              </View>
              <Text style={styles.heroRiskCopy}>Your inputs say you’re in a bad spot.</Text>
            </View>
            <Text style={styles.heroLabel}>Scroll diagnosis</Text>
          <Text style={styles.heroTitle}>{profileTitle}</Text>
          <Text style={styles.heroHeadline}>{profileHeadline}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaPill}>
              <Text style={styles.heroMetaText}>{useLevel ? `${useLevel} usage` : 'Usage unknown'}</Text>
            </View>
            <View style={styles.heroMetaPill}>
              <Text style={styles.heroMetaText}>{impactLabel}</Text>
            </View>
          </View>
          <View style={styles.heroStatGrid}>
            {heroStats.map(stat => (
              <View key={stat.id} style={styles.heroStatCard}>
                <Text style={styles.heroStatIcon}>{stat.icon}</Text>
                <Text style={styles.heroStatLabel}>{stat.label}</Text>
                <Text style={styles.heroStatValue}>{stat.value}</Text>
                <Text style={styles.heroStatCaption}>{stat.caption}</Text>
              </View>
            ))}
          </View>
          <View style={styles.heroMeterList}>
            {heroMeters.map(meter => (
              <View key={meter.id} style={styles.heroMeterRow}>
                <View style={styles.heroMeterLabelBlock}>
                  <Text style={styles.heroMeterLabel}>{meter.label}</Text>
                  <Text style={styles.heroMeterValue}>{meter.value}</Text>
                </View>
                <View style={styles.heroMeterTrack}>
                  <View style={[styles.heroMeterFill, { width: `${Math.min(Math.max(meter.severity, 0), 1) * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80)} style={styles.futureCard}>
          <Text style={styles.futureEyebrow}>If nothing changes…</Text>
          <Text style={styles.futureBody}>{conclusionSummary}</Text>
          <View style={styles.futureHighlightList}>
            {futureHighlights.map(highlight => (
              <View key={highlight} style={styles.futureHighlightRow}>
                <View style={styles.futureBullet} />
                <Text style={styles.futureHighlightCopy}>{highlight}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140)} style={styles.diagnosticGrid}>
          {diagnosticSections.map((section, index) => {
            const tone = DIAGNOSTIC_BACKGROUNDS[index % DIAGNOSTIC_BACKGROUNDS.length];
            return (
              <View key={section.id} style={[styles.diagnosticCard, { backgroundColor: tone }]}>
                <View style={styles.diagnosticHeader}>
                  <Text style={styles.diagnosticIcon}>{section.icon}</Text>
                  <Text style={styles.diagnosticEyebrow}>{section.label}</Text>
                </View>
                <View style={styles.diagnosticList}>
                  {section.items.map(item => (
                    <View key={item} style={styles.diagnosticRow}>
                      <View style={styles.diagnosticDot} />
                      <Text style={styles.diagnosticCopy}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </Animated.View>

            <Animated.View entering={FadeInUp.delay(200)} style={styles.quoteCard}>
              <Text style={styles.quoteEyebrow}>Next steps</Text>
              <Text style={styles.quoteText}>
                "We turn those red flags into rituals that give you your life back. It starts with plugging into the system
                built for exactly where you are."
              </Text>
              <Text style={styles.quoteAttribution}>— Unscroller coach</Text>
            </Animated.View>
          </ScrollView>

          <View
            style={[
              styles.bottomContainer,
              isCompact && styles.bottomContainerCompact,
              { paddingBottom: Math.max(insets.bottom, SPACING.space_1) },
            ]}
          >
            <WatercolorButton color="yellow" onPress={handleContinue}>
              <Text style={styles.buttonText}>See how Unscroller fixes this</Text>
            </WatercolorButton>
            <Text style={[styles.nextHint, isCompact && styles.nextHintCompact]}>
              Next, we'll show you how the plan works and how other builders are using it to cut their scroll habit.
            </Text>
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
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: SPACING.space_5,
  },
  scrollContent: {
    paddingTop: SPACING.space_6,
    paddingBottom: SPACING.space_2,
    gap: SPACING.space_4,
    width: '100%',
  },
  scrollContentCompact: {
    paddingTop: SPACING.space_5,
    paddingBottom: SPACING.space_1,
    gap: SPACING.space_3,
  },
  heroPanel: {
    borderRadius: 20,
    padding: SPACING.space_5,
    backgroundColor: '#EEF3FF',
    borderWidth: 1,
    borderColor: '#D6E0FF',
    gap: SPACING.space_3,
    overflow: 'hidden',
  },
  heroArt: {
    height: 170,
    borderRadius: 32,
    backgroundColor: '#08142A',
    padding: SPACING.space_4,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    marginBottom: SPACING.space_2,
  },
  heroPulseRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -40,
    left: -30,
  },
  heroPulseRingSecondary: {
    width: 320,
    height: 320,
    top: -90,
    left: 40,
    opacity: 0.4,
  },
  heroPhone: {
    backgroundColor: '#0F223B',
    borderRadius: 24,
    paddingVertical: SPACING.space_3,
    paddingHorizontal: SPACING.space_4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroPhoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.space_2,
  },
  heroPhoneTime: {
    ...TYPOGRAPHY.H2,
    color: '#FFFFFF',
  },
  heroPhoneStatus: {
    ...TYPOGRAPHY.Subtext,
    color: 'rgba(255,255,255,0.7)',
  },
  heroFeedBlock: {
    borderRadius: 20,
    padding: SPACING.space_2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: SPACING.space_1 / 2,
  },
  heroFeedBlockSecondary: {
    marginTop: SPACING.space_2,
  },
  heroFeedLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroFeedLineDanger: {
    backgroundColor: '#FF6B6B',
  },
  heroFeedLineWarning: {
    backgroundColor: '#F4B942',
  },
  heroFeedLineMuted: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroFeedLineMutedShort: {
    width: '50%',
  },
  heroWarningCard: {
    marginTop: SPACING.space_3,
    padding: SPACING.space_3,
    borderRadius: RADII.radius_card,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: SPACING.space_1 / 2,
  },
  heroWarningLabel: {
    ...TYPOGRAPHY.Subtext,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroWarningValue: {
    ...TYPOGRAPHY.H3,
    color: '#FFFFFF',
  },
  heroWarningCopy: {
    ...TYPOGRAPHY.Subtext,
    color: 'rgba(255,255,255,0.85)',
  },
  heroRiskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  heroRiskPill: {
    paddingHorizontal: SPACING.space_2,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: DANGER_PRIMARY,
  },
  heroRiskText: {
    ...TYPOGRAPHY.Subtext,
    color: DANGER_DARK,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroRiskCopy: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  heroLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroTitle: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
  },
  heroHeadline: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    flexWrap: 'wrap',
  },
  heroMetaPill: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: RADII.radius_button,
    backgroundColor: '#14213D',
  },
  heroMetaText: {
    ...TYPOGRAPHY.Subtext,
    color: '#FFFFFF',
  },
  heroStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
  },
  heroStatCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 140,
    borderRadius: RADII.radius_card,
    padding: SPACING.space_3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: SPACING.space_1 / 2,
  },
  heroStatIcon: {
    fontSize: 20,
  },
  heroStatLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroStatValue: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  heroStatCaption: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
  },
  heroMeterList: {
    gap: SPACING.space_2,
  },
  heroMeterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  heroMeterLabelBlock: {
    flex: 1,
  },
  heroMeterLabel: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroMeterValue: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
  },
  heroMeterTrack: {
    flexBasis: '45%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(20,33,61,0.12)',
    overflow: 'hidden',
  },
  heroMeterFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  futureCard: {
    borderRadius: 20,
    padding: SPACING.space_4,
    backgroundColor: '#FFF9EB',
    borderWidth: 1,
    borderColor: '#FFE3B0',
    gap: SPACING.space_3,
  },
  futureEyebrow: {
    ...TYPOGRAPHY.Subtext,
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  futureBody: {
    ...TYPOGRAPHY.Body,
    color: '#7C2D12',
    lineHeight: 24,
  },
  futureHighlightList: {
    gap: SPACING.space_2,
  },
  futureHighlightRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    alignItems: 'flex-start',
  },
  futureBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    marginTop: SPACING.space_1 / 2,
  },
  futureHighlightCopy: {
    ...TYPOGRAPHY.Body,
    color: '#7C2D12',
    flex: 1,
    lineHeight: 22,
  },
  diagnosticGrid: {
    gap: SPACING.space_3,
  },
  diagnosticCard: {
    borderRadius: 20,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: COLORS.BACKGROUND_ELEVATED,
    gap: SPACING.space_2,
  },
  diagnosticEyebrow: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  diagnosticIcon: {
    fontSize: 24,
  },
  diagnosticList: {
    gap: SPACING.space_2,
  },
  diagnosticRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    alignItems: 'flex-start',
  },
  diagnosticDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.space_1 / 2,
  },
  diagnosticCopy: {
    ...TYPOGRAPHY.Body,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 24,
  },
  systemCard: {
    borderRadius: 20,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    backgroundColor: '#06121F',
    gap: SPACING.space_3,
  },
  systemEyebrow: {
    ...TYPOGRAPHY.Subtext,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pillarRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
  },
  pillarIcon: {
    fontSize: 22,
  },
  pillarCopyBlock: {
    flex: 1,
    gap: SPACING.space_1 / 2,
  },
  pillarTitle: {
    ...TYPOGRAPHY.Body,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  pillarCopy: {
    ...TYPOGRAPHY.Subtext,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  quoteCard: {
    borderRadius: 20,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF7F5',
    gap: SPACING.space_2,
  },
  quoteEyebrow: {
    ...TYPOGRAPHY.Subtext,
    color: '#9B1C1C',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quoteText: {
    ...TYPOGRAPHY.H3,
    color: '#7A271A',
    lineHeight: 26,
  },
  quoteAttribution: {
    ...TYPOGRAPHY.Subtext,
    color: '#9B1C1C',
  },
  bottomContainer: {
    paddingTop: 0,
    gap: SPACING.space_1,
    width: '100%',
  },
  bottomContainerCompact: {
    paddingTop: SPACING.space_2,
    gap: SPACING.space_1,
  },
  nextHint: {
    ...TYPOGRAPHY.Subtext,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 0,
    paddingBottom: 0,
  },
  nextHintCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryTight: {
    height: 52,
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
});

// Thresholds summary:
// - Update getUseLevel and getImpactLabel logic above if future experiments change severity bands.
