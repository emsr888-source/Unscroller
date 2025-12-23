import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ImageStyle,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingAssessment } from '@/store/onboardingAssessment';
import type {
  HardestPlatform,
  AutopilotFrequency,
  InterferenceLevel,
  ReadinessValue,
  BiggestStruggle,
  ReclaimTimeFocus,
  FeelingAfterScroll,
  SocialApproach,
} from '@/store/onboardingAssessment';
import { ProgressBar } from '@/features/onboarding/components/ProgressBar';
import { AnswerButton } from '@/features/onboarding/components/AnswerButton';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizQuestion'>;

type Option = {
  id: string;
  label: string;
};

type SingleChoiceQuestion = {
  id:
    | 'hardestPlatform'
    | 'autopilotFrequency'
    | 'interferenceLevel'
    | 'feelingAfterScroll'
    | 'biggestStruggle'
    | 'reclaimTimeFocus';
  type: 'single-choice';
  question: string;
  options: Option[];
};

type ScaleQuestion = {
  id: 'readinessToChange';
  type: 'scale';
  question: string;
  scaleMin: number;
  scaleMax: number;
  scaleMinLabel: string;
  scaleMaxLabel: string;
};

type ApproachReadinessQuestion = {
  id: 'approachReadiness';
  type: 'approach-readiness';
  question: string;
  approachQuestion: string;
  sliderLabel: string;
  sliderMinLabel: string;
  sliderMaxLabel: string;
  options: Option[];
};

type FactSlide = {
  id: 'addictionFacts' | 'tradeoffFact';
  type: 'fact';
  title: string;
  bullets: string[];
  subtitle: string;
  ctaLabel: string;
  painLine?: string;
};

type Question = SingleChoiceQuestion | ScaleQuestion | FactSlide | ApproachReadinessQuestion;

const PLATFORM_LOGOS: Partial<Record<HardestPlatform, ImageSourcePropType>> = {
  tiktok: require('../../assets/socialmedialogos/tiktok logo.png'),
  instagram: require('../../assets/socialmedialogos/instagram logo.jpeg'),
  youtube: require('../../assets/socialmedialogos/youtube logo.jpg'),
  twitter: require('../../assets/socialmedialogos/X logo.png'),
  facebook: require('../../assets/socialmedialogos/facebook logo.png'),
};

const renderLeadingIcon = (questionId: Question['id'], optionId: string) => {
  if (questionId !== 'hardestPlatform') {
    return null;
  }
  const source = PLATFORM_LOGOS[optionId as HardestPlatform];
  if (!source) {
    return null;
  }
  return (
    <Image
      source={source}
      style={[
        styles.socialIcon as ImageStyle,
        optionId === 'tiktok' ? (styles.socialIconTiktok as ImageStyle) : undefined,
        optionId === 'youtube' ? (styles.socialIconYoutube as ImageStyle) : undefined,
        optionId === 'facebook' ? (styles.socialIconFacebook as ImageStyle) : undefined,
      ]}
      resizeMode="contain"
      accessible={false}
    />
  );
};

const QUESTIONS: Question[] = [
  {
    id: 'autopilotFrequency',
    type: 'single-choice',
    question: 'How often do you catch yourself “just checking” one app and losing track of time or opening apps on autopilot?',
    options: [
      { id: 'rarely', label: 'Rarely' },
      { id: 'few_times', label: 'A few times a day' },
      { id: 'five_to_ten', label: '5–10 times a day' },
      { id: 'ten_plus', label: 'More than 10 times a day' },
    ],
  },
  {
    id: 'hardestPlatform',
    type: 'single-choice',
    question: 'Which platform pulls you in the most?',
    options: [
      { id: 'tiktok', label: 'TikTok' },
      { id: 'instagram', label: 'Instagram' },
      { id: 'youtube', label: 'YouTube' },
      { id: 'twitter', label: 'X' },
      { id: 'facebook', label: 'Facebook' },
      { id: 'other', label: 'Another app' },
    ],
  },
  {
    id: 'addictionFacts',
    type: 'fact',
    title: 'You’re not weak. These apps are engineered to be addictive.',
    bullets: [
      '“Social apps are built to keep you scrolling, not to help you stop.”',
      '“The average person spends 2–4 hours a day on social media alone.”',
      '“That’s 30–60 full days a year gone to scrolling.”',
    ],
    subtitle: 'You already know it’s eating your time. Next we’ll look at how else it’s impacting you.',
    ctaLabel: 'Continue',
  },
  {
    id: 'feelingAfterScroll',
    type: 'single-choice',
    question: 'How do you usually feel after a scrolling session?',
    options: [
      { id: 'positive', label: 'Inspired and positive' },
      { id: 'neutral', label: 'No different than before' },
      { id: 'behind', label: 'Drained or behind on my goals' },
      { id: 'anxious', label: 'Anxious, guilty, or overwhelmed' },
    ],
  },
  {
    id: 'biggestStruggle',
    type: 'single-choice',
    question: 'What’s your biggest struggle with social media right now?',
    options: [
      { id: 'time', label: 'Losing too much time' },
      { id: 'drained', label: 'Feeling mentally drained' },
      { id: 'sleep_focus', label: 'Difficulty sleeping or focusing' },
      { id: 'comparison', label: 'Comparing myself to others' },
      { id: 'all', label: 'All of the above' },
    ],
  },
  {
    id: 'interferenceLevel',
    type: 'single-choice',
    question: 'In the past 7 days, how often did scrolling make you delay or skip something important?',
    options: [
      { id: 'never', label: 'Never' },
      { id: 'once', label: 'Once' },
      { id: 'few_times', label: 'A few times' },
      { id: 'most_days', label: 'Most days' },
      { id: 'every_day', label: 'Every day' },
    ],
  },
  {
    id: 'reclaimTimeFocus',
    type: 'single-choice',
    question: 'What would you rather be spending that time on?',
    options: [
      { id: 'side_hustle', label: 'Building a side hustle or business' },
      { id: 'content', label: 'Creating content' },
      { id: 'study', label: 'Studying or upskilling' },
      { id: 'mental_health', label: 'Improving my mental health' },
      { id: 'loved_ones', label: 'Being more present with loved ones' },
    ],
  },
  {
    id: 'tradeoffFact',
    type: 'fact',
    title: 'Your brain wasn’t built for this much input.',
    bullets: [
      'Endless feeds are designed to trigger dopamine spikes, training your brain to crave “just one more scroll” instead of deep focus.',
      'Heavy social media use is linked to higher anxiety, depression, and sleep problems, especially when used late at night.',
      'The more you scroll, the more your brain learns that distraction is the default, and real work feels harder and more uncomfortable.',
    ],
    painLine:
      'Every hour you spend feeding the scroll habit is training your brain to avoid the work that actually moves your life forward.',
    subtitle: 'To fix this, you don’t need more willpower. You need to change the environment: cut feeds, limit access, and retrain your brain to focus.',
    ctaLabel: 'Show me my pattern',
  },
  {
    id: 'approachReadiness',
    type: 'approach-readiness',
    question: 'How deep in are you, and how ready are you to change?',
    approachQuestion: 'What best describes your current approach to social media?',
    sliderLabel: 'How ready are you to change your scrolling habit right now?',
    sliderMinLabel: 'Not ready at all',
    sliderMaxLabel: 'All in and ready',
    options: [
      { id: 'addicted', label: 'I’m fully addicted, I need a hard reset' },
      { id: 'distracted', label: 'I’m functional but distracted, I need structure' },
      { id: 'work_mode', label: 'I mainly use it for work but get sucked into feeds' },
    ],
  },
];

const FEEDBACK_BY_QUESTION: Record<string, Record<string, string>> = {
  autopilotFrequency: {
    rarely: 'Opening apps rarely means your habits are intentional. Let’s keep it that way.',
    few_times: 'Opening a few times a day chips away at focus. Guardrails will help.',
    five_to_ten: '5–10 times a day is a lot. We’ll help you find better habits.',
    ten_plus: 'More than 10 times a day is a serious habit. We’ll help you break it.',
  },
};

const SLIDER_MAX_HOURS = 10;
const TOTAL_QUIZ_STEPS = QUESTIONS.length + 2;

export default function QuizQuestionScreen({ navigation }: Props) {
  useStatusBarStyle('dark-content');
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const contentMaxWidth = Math.min(windowWidth - SPACING.space_4 * 2, 520);
  const factContentMaxWidth = contentMaxWidth;
  const factPaddingHorizontal = Math.max(
    SPACING.space_4,
    (windowWidth - factContentMaxWidth) / 2,
  );
  const isCompactHeight = windowHeight < 720;
  const approachBottomPadding = SPACING.space_2;
  const approachCtaPadding = Math.max(insets.bottom, SPACING.space_4);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [feedback, setFeedback] = useState<string>('');
  const [selectedMap, setSelectedMap] = useState<Record<string, string>>({});
  const flatListRef = useRef<FlatList<Question>>(null);
  const {
    firstName,
    setPhoneHoursPerDay,
    setHoursPerDay,
    setHardestPlatform,
    setAutopilotFrequency,
    setFeelingAfterScroll,
    setBiggestStruggle,
    setReclaimTimeFocus,
    setInterferenceLevel,
    setReadinessToChange,
    setSocialApproach,
  } = useOnboardingAssessment();
  const [phoneHoursValue, setPhoneHoursValue] = useState(2);
  const [socialHoursValue, setSocialHoursValue] = useState(1);
  const [hasSubmittedPhoneHours, setHasSubmittedPhoneHours] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const factGlowProgress = useSharedValue(0);
  const [approachSliderValue, setApproachSliderValue] = useState<number>(0);
  const [hasApproachFollowUpVisible, setHasApproachFollowUpVisible] = useState(false);

  const displayName = useMemo(() => {
    if (!firstName) {
      return null;
    }
    const trimmed = firstName.trim();
    if (!trimmed) {
      return null;
    }
    const [primary] = trimmed.split(' ');
    return primary;
  }, [firstName]);

  const formatFactTitle = useCallback(
    (fact: FactSlide) => {
      if (fact.id === 'addictionFacts' && displayName) {
        const [firstChar, ...rest] = fact.title;
        const lowered = firstChar ? firstChar.toLowerCase() : '';
        return `${displayName}, ${lowered}${rest.join('')}`;
      }
      return fact.title;
    },
    [displayName],
  );

  useEffect(() => {
    setSocialHoursValue(prev => Math.min(prev, phoneHoursValue));
  }, [phoneHoursValue]);

  useEffect(() => {
    factGlowProgress.value = withRepeat(
      withTiming(1, {
        duration: 4000,
      }),
      -1,
      true,
    );
  }, [factGlowProgress]);

  useEffect(() => {
    if (QUESTIONS[currentQuestion]?.id === 'approachReadiness') {
      setHasApproachFollowUpVisible(false);
    }
  }, [currentQuestion]);

  const heroPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + factGlowProgress.value * 0.25,
    transform: [{ scale: 1.05 + factGlowProgress.value * 0.2 }] as const,
  }));

  const phoneFloatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: Math.sin(factGlowProgress.value * Math.PI * 2) * 6 },
      { rotate: `${-2 + factGlowProgress.value * 4}deg` },
    ] as const,
  }));

  const chainSwingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-2 + factGlowProgress.value * 4}deg` }] as const,
  }));

  const bubbleLeftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: Math.sin(factGlowProgress.value * Math.PI * 2) * 3 },
      { translateX: Math.cos(factGlowProgress.value * Math.PI * 2) * 1 },
    ] as const,
  }));

  const bubbleRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.sin(factGlowProgress.value * Math.PI * 2 + Math.PI / 2) * 6 }] as const,
  }));

  const neuralPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.95 + factGlowProgress.value * 0.15 }] as const,
    opacity: 0.4 + factGlowProgress.value * 0.25,
  }));

  const orbitClockwiseStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${factGlowProgress.value * 360}deg` }] as const,
  }));

  const orbitCounterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-factGlowProgress.value * 360}deg` }] as const,
  }));

  const signalSweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.sin(factGlowProgress.value * Math.PI * 2) * 18 }] as const,
    opacity: 0.45 + factGlowProgress.value * 0.25,
  }));

  const question = QUESTIONS[currentQuestion];

  const introProgress = introComplete ? 2 : hasSubmittedPhoneHours ? 1 : 0;
  const progress = useMemo(() => {
    if (!introComplete) {
      return introProgress / TOTAL_QUIZ_STEPS;
    }
    return (introProgress + (currentQuestion + 1)) / TOTAL_QUIZ_STEPS;
  }, [currentQuestion, introComplete, introProgress]);

  const handleScrollToQuestion = useCallback(
    (index: number) => {
      flatListRef.current?.scrollToOffset({ offset: windowWidth * index, animated: true });
    },
    [windowWidth],
  );

  const goToNextQuestion = useCallback(
    (delayMs = 250) => {
      const advance = () => {
        if (currentQuestion < QUESTIONS.length - 1) {
          const nextQuestionIndex = currentQuestion + 1;
          handleScrollToQuestion(nextQuestionIndex);
          setCurrentQuestion(nextQuestionIndex);
          setFeedback('');
        } else {
          navigation.navigate('QuizSymptoms');
        }
      };

      if (delayMs > 0) {
        setTimeout(advance, delayMs);
      } else {
        advance();
      }
    },
    [currentQuestion, handleScrollToQuestion, navigation, setFeedback],
  );

  const handleSelectAnswer = useCallback(
    (value: string) => {
      const nextSelected = { ...selectedMap, [question.id]: value };
      setSelectedMap(nextSelected);

      if (question.type === 'single-choice') {
        const questionFeedback = FEEDBACK_BY_QUESTION[question.id]?.[value] ?? '';
        setFeedback(questionFeedback);
      } else {
        setFeedback('');
      }

      let shouldAdvance = true;
      switch (question.id) {
        case 'hardestPlatform':
          setHardestPlatform(value as HardestPlatform);
          break;
        case 'autopilotFrequency':
          setAutopilotFrequency(value as AutopilotFrequency);
          break;
        case 'feelingAfterScroll':
          setFeelingAfterScroll(value as FeelingAfterScroll);
          break;
        case 'biggestStruggle':
          setBiggestStruggle(value as BiggestStruggle);
          break;
        case 'reclaimTimeFocus':
          setReclaimTimeFocus(value as ReclaimTimeFocus);
          break;
        case 'interferenceLevel':
          setInterferenceLevel(value as InterferenceLevel);
          break;
        case 'approachReadiness':
          setSocialApproach(value as SocialApproach);
          setHasApproachFollowUpVisible(true);
          setApproachSliderValue(0);
          shouldAdvance = false;
          break;
        default:
          break;
      }

      if (shouldAdvance) {
        goToNextQuestion();
      }
    },
    [
      goToNextQuestion,
      question,
      selectedMap,
      setAutopilotFrequency,
      setHardestPlatform,
      setFeelingAfterScroll,
      setInterferenceLevel,
      setReclaimTimeFocus,
      setBiggestStruggle,
      setSocialApproach,
    ],
  );

  const handleApproachConfirm = useCallback(() => {
    if (!selectedMap.approachReadiness || approachSliderValue <= 0) {
      return;
    }
    const value = Math.min(6, Math.max(1, Math.round(approachSliderValue))) as ReadinessValue;
    setReadinessToChange(value);
    goToNextQuestion(0);
  }, [approachSliderValue, goToNextQuestion, selectedMap, setReadinessToChange]);

  const handleBackPress = useCallback(() => {
    if (!introComplete) {
      if (hasSubmittedPhoneHours) {
        setHasSubmittedPhoneHours(false);
        return;
      }
      navigation.goBack();
      return;
    }
    if (currentQuestion === 0) {
      setIntroComplete(false);
      return;
    }
    const previousIndex = currentQuestion - 1;
    handleScrollToQuestion(previousIndex);
    setCurrentQuestion(previousIndex);
    setFeedback('');
  }, [currentQuestion, handleScrollToQuestion, navigation]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      const index = Math.round(contentOffset.x / windowWidth);
      if (index !== currentQuestion) {
        setCurrentQuestion(index);
      }
    },
    [currentQuestion, windowWidth],
  );

  const formatHourLabel = (value: number) => {
    if (value >= SLIDER_MAX_HOURS) {
      return '10+';
    }
    if (Number.isInteger(value)) {
      return value.toFixed(0);
    }
    return value.toFixed(1);
  };

  const handleConfirmPhoneHours = () => {
    const normalized = Math.min(phoneHoursValue, SLIDER_MAX_HOURS);
    setPhoneHoursPerDay(normalized);
    setHasSubmittedPhoneHours(true);
  };

  const handleConfirmSocialHours = () => {
    const normalizedPhone = Math.min(phoneHoursValue, SLIDER_MAX_HOURS);
    const normalizedSocial = Math.min(socialHoursValue, normalizedPhone);
    setHoursPerDay(normalizedSocial);
    setIntroComplete(true);
  };

  return (
    <>
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <StatusBar animated={true} barStyle="dark-content" backgroundColor="#fdfbf7" hidden={false} />
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <View style={[styles.progressRow, isCompactHeight && styles.progressRowCompact]}>
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={handleBackPress}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.progressWrapper}>
              <ProgressBar progress={progress} trackHeight={6} />
            </View>
          </View>
        </View>

      {!introComplete ? (
        <ScrollView contentContainerStyle={styles.sliderContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sliderCard}>
            <Text style={styles.sliderEyebrow}>Step 1 of 2</Text>
            <Text style={styles.questionText}>How many hours do you spend on your phone per day?</Text>
            <Text style={styles.sliderValue}>{`${formatHourLabel(phoneHoursValue)} hrs`}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={SLIDER_MAX_HOURS}
              step={0.25}
              minimumTrackTintColor="#000"
              maximumTrackTintColor="rgba(0,0,0,0.1)"
              thumbTintColor="#000"
              value={phoneHoursValue}
              onValueChange={setPhoneHoursValue}
              disabled={hasSubmittedPhoneHours}
            />
            {!hasSubmittedPhoneHours && (
              <WatercolorButton color="yellow" onPress={handleConfirmPhoneHours}>
                <Text style={styles.buttonText}>Continue</Text>
              </WatercolorButton>
            )}
          </View>

          {hasSubmittedPhoneHours && (
            <View style={styles.sliderCard}>
              <Text style={styles.sliderEyebrow}>Step 2 of 2</Text>
              <Text style={styles.questionText}>How many of those hours do you spend on social media?</Text>
              <Text style={styles.sliderValue}>{`${formatHourLabel(socialHoursValue)} hrs`}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={Math.max(phoneHoursValue, 0.25)}
                step={0.25}
                minimumTrackTintColor="#000"
                maximumTrackTintColor="rgba(0,0,0,0.1)"
                thumbTintColor="#000"
                value={socialHoursValue}
                onValueChange={setSocialHoursValue}
              />
              <WatercolorButton color="yellow" onPress={handleConfirmSocialHours}>
                <Text style={styles.buttonText}>Continue</Text>
              </WatercolorButton>
            </View>
          )}
        </ScrollView>
      ) : (
        <Animated.FlatList
          style={styles.questionList}
          ref={flatListRef}
          data={QUESTIONS}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }: { item: Question; index: number }) => {
            const factTitle = item.type === 'fact' ? formatFactTitle(item) : undefined;
            return (
              <View style={[styles.slide, { width: windowWidth }, item.type === 'fact' && styles.factSlideWrapper]}>
              {item.type !== 'fact' && item.type !== 'approach-readiness' && (
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.questionBlock}>
                  <Text style={styles.questionText}>{item.question}</Text>
                </Animated.View>
              )}

              {item.type === 'single-choice' ? (
                <View style={[styles.optionsContainer, { maxWidth: contentMaxWidth }]}>
                  {item.options.map((option: Option, optionIndex: number) => (
                    <AnswerButton
                      key={option.id}
                      label={option.label}
                      index={optionIndex}
                      selected={selectedMap[item.id] === option.id}
                      onPress={() => handleSelectAnswer(option.id)}
                      leadingIcon={renderLeadingIcon(item.id, option.id)}
                    />
                  ))}
                </View>
                  ) : item.type === 'scale' ? (
                    <View style={[styles.scaleContainer, { maxWidth: contentMaxWidth }]}>
                      <View style={styles.scaleButtons}>
                        {Array.from({ length: item.scaleMax - item.scaleMin + 1 }, (_, idx) => {
                          const value = (item.scaleMin + idx).toString();
                          const isSelected = selectedMap[item.id] === value;
                          return (
                            <Pressable
                              key={value}
                              onPress={() => handleSelectAnswer(value)}
                              accessibilityRole="button"
                              accessibilityState={{ selected: isSelected }}
                              accessibilityLabel={`Readiness level ${value}`}
                            >
                              <View style={[styles.scaleButton, isSelected && styles.scaleButtonSelected]}>
                                <Text style={[styles.scaleButtonText, isSelected && styles.scaleButtonTextSelected]}>
                                  {value}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                      <View style={styles.scaleLabelRow}>
                        <Text style={styles.scaleLabel}>{item.scaleMinLabel}</Text>
                        <Text style={styles.scaleLabel}>{item.scaleMaxLabel}</Text>
                      </View>
                    </View>
                  ) : item.type === 'fact' ? (
                    <ScrollView
                      style={styles.factScroll}
                      contentContainerStyle={[
                        styles.factContent,
                        { paddingHorizontal: factPaddingHorizontal },
                      ]}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                      nestedScrollEnabled
                    >
                      {item.id === 'addictionFacts' ? (
                        <View
                          style={[styles.factHero, { width: factContentMaxWidth }]}
                          pointerEvents="none"
                        >
                          <LinearGradient
                            colors={['rgba(247, 234, 217, 0.95)', 'rgba(233, 219, 255, 0.9)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroBackdrop}
                          />
                          <Animated.View style={[styles.heroPulse, heroPulseStyle]} />
                          <Animated.View style={[styles.heroBubble, styles.heroBubbleLeft, bubbleLeftStyle]}>
                            <Text style={styles.heroBubbleLabel}>"Just five minutes..."</Text>
                          </Animated.View>
                          <Animated.View style={[styles.heroBubble, styles.heroBubbleRight, bubbleRightStyle]}>
                            <Text style={styles.heroBubbleLabel}>New alert</Text>
                          </Animated.View>
                          <Animated.View style={[styles.heroChain, chainSwingStyle]}>
                            {[0, 1, 2, 3, 4, 5].map(link => (
                              <View
                                key={`chain-${link}`}
                                style={[styles.heroChainLink, link % 2 === 0 && styles.heroChainLinkFilled]}
                              />
                            ))}
                          </Animated.View>
                          <Animated.View style={[styles.heroPhone, phoneFloatStyle]}>
                            <View style={styles.heroPhoneNotch} />
                            <View style={styles.heroPhoneScreen}>
                              <View style={styles.heroPhoneStatusRow}>
                                <View style={styles.heroStatusDot} />
                                <View style={styles.heroStatusDot} />
                                <View style={styles.heroStatusDot} />
                              </View>
                              {[0, 1, 2].map(row => (
                                <View key={`feed-row-${row}`} style={styles.heroFeedRow}>
                                  <View style={styles.heroFeedAvatar} />
                                  <View style={styles.heroFeedTextBlock}>
                                    <View style={styles.heroFeedLine} />
                                    <View style={[styles.heroFeedLine, styles.heroFeedLineShort]} />
                                  </View>
                                  <View style={styles.heroFeedTimerPill}>
                                    <Text style={styles.heroFeedTimerText}>{row === 0 ? '∞' : `${row + 1}m`}</Text>
                                  </View>
                                </View>
                              ))}
                              <View style={styles.heroCTAButton}>
                                <Text style={styles.heroCTAButtonText}>Keep scrolling</Text>
                              </View>
                            </View>
                          </Animated.View>
                          <Animated.View style={[styles.factHeroBadge, heroPulseStyle]}>
                            <Text style={styles.factHeroBadgeTitle}>Reality check</Text>
                            <Text style={styles.factHeroBadgeSubtitle}>Apps are designed to win your attention.</Text>
                          </Animated.View>
                        </View>
                      ) : (
                        <View
                          style={[styles.tradeoffHero, { width: factContentMaxWidth }]}
                          pointerEvents="none"
                        >
                          <LinearGradient
                            colors={['rgba(224, 238, 255, 0.95)', 'rgba(220, 224, 255, 0.85)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.tradeoffBackdrop}
                          />
                          <Animated.View style={[styles.tradeoffPulseRing, neuralPulseStyle]} />
                          <View style={styles.tradeoffBrainShell}>
                            <View style={styles.tradeoffBrainAura} />
                            <View style={styles.tradeoffBrainCore}>
                              <View style={[styles.tradeoffBrainFold, styles.tradeoffBrainFoldOne]} />
                              <View style={[styles.tradeoffBrainFold, styles.tradeoffBrainFoldTwo]} />
                              <Animated.View style={[styles.tradeoffSignal, signalSweepStyle]}>
                                <View style={styles.tradeoffSignalDot} />
                              </Animated.View>
                            </View>
                          </View>
                          <Animated.View style={[styles.tradeoffOrbit, orbitClockwiseStyle]}>
                            <View style={styles.tradeoffOrbitTrack} />
                            <View style={styles.tradeoffOrbitDot} />
                          </Animated.View>
                          <Animated.View style={[styles.tradeoffOrbit, styles.tradeoffOrbitReverse, orbitCounterStyle]}>
                            <View style={styles.tradeoffOrbitTrack} />
                            <View style={[styles.tradeoffOrbitDot, styles.tradeoffOrbitDotSecondary]} />
                          </Animated.View>
                          <View style={styles.tradeoffSparkRow}>
                            {[0, 1, 2, 3].map(spark => (
                              <View
                                key={`spark-${spark}`}
                                style={[styles.tradeoffSpark, spark % 2 === 0 && styles.tradeoffSparkShort]}
                              />
                            ))}
                          </View>
                        </View>
                      )}
                      <View style={[styles.factCard, { width: contentMaxWidth }]}> 
                        <Text style={styles.factTitle}>{factTitle ?? item.title}</Text>
                        <View style={styles.factBullets}>
                          {item.bullets.slice(0, 3).map(bullet => (
                            <View key={bullet} style={styles.factBulletRow}>
                              <View style={styles.factBulletDot} />
                              <Text style={styles.factBulletText}>{bullet}</Text>
                            </View>
                          ))}
                        </View>
                        {item.painLine ? <Text style={styles.factPainLine}>{item.painLine}</Text> : null}
                        <Text style={styles.factSubtitle}>{item.subtitle}</Text>
                        <WatercolorButton color="yellow" onPress={() => goToNextQuestion(0)}>
                          <Text style={styles.buttonText}>Continue</Text>
                        </WatercolorButton>
                      </View>
                    </ScrollView>
                  ) : item.type === 'approach-readiness' ? (
                    <View style={[styles.approachCard, { maxWidth: contentMaxWidth, paddingBottom: approachBottomPadding }]}>
                      <View style={styles.approachTopSection}>
                        <Text style={styles.approachPrompt}>{item.approachQuestion}</Text>
                        <View style={styles.optionsContainer}>
                          {item.options.map((option: Option, optionIndex: number) => (
                            <AnswerButton
                              key={option.id}
                              label={option.label}
                              index={optionIndex}
                              selected={selectedMap[item.id] === option.id}
                              onPress={() => handleSelectAnswer(option.id)}
                            />
                          ))}
                        </View>
                      </View>
                      {hasApproachFollowUpVisible ? (
                        <>
                          <Text style={styles.approachFollowUpQuestion}>{item.sliderLabel}</Text>
                          <View style={styles.approachLowerSection}>
                            <View style={styles.approachSliderSection}>
                              <Text style={styles.approachSliderValue}>{approachSliderValue}</Text>
                              <Slider
                                style={styles.approachSlider}
                                minimumValue={1}
                                maximumValue={6}
                                step={1}
                                minimumTrackTintColor="#000"
                                maximumTrackTintColor="rgba(0,0,0,0.1)"
                                thumbTintColor="#000"
                                value={approachSliderValue}
                                onValueChange={value => setApproachSliderValue(value as ReadinessValue)}
                              />
                              <View style={styles.approachScaleRow}>
                                <Text style={styles.approachScaleLabel}>{item.sliderMinLabel}</Text>
                                <Text style={styles.approachScaleLabel}>{item.sliderMaxLabel}</Text>
                              </View>
                            </View>
                            <View style={[styles.approachNextWrapper, { paddingBottom: approachCtaPadding }]}>
                              <WatercolorButton color="yellow" onPress={handleApproachConfirm}>
                                <Text style={styles.buttonText}>Continue</Text>
                              </WatercolorButton>
                            </View>
                          </View>
                        </>
                      ) : null}
                    </View>
                  ) : null}
                  {!!feedback && index === currentQuestion && (
                    <Text style={styles.feedbackText}>{feedback}</Text>
                  )}
                </View>
              );
            }}
            onMomentumScrollEnd={handleMomentumEnd}
            getItemLayout={(_, index) => ({ length: windowWidth, offset: windowWidth * index, index })}
          />
      )}
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContent: {
    paddingTop: 0,
  },
  topBar: {
    paddingBottom: SPACING.space_2,
    paddingHorizontal: SPACING.space_2,
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_3,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  progressRowCompact: {
    maxWidth: 480,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  socialIconTiktok: {
    width: 34,
    height: 34,
  },
  socialIconYoutube: {
    width: 46,
    height: 46,
  },
  socialIconFacebook: {
    width: 30,
    height: 30,
  },
  backIcon: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
    transform: [{ translateY: -1 }],
  },
  progressWrapper: {
    flex: 1,
    paddingRight: SPACING.space_1,
  },
  listContent: {
    paddingTop: SPACING.space_2,
    paddingHorizontal: 0,
  },
  socialIcon: {
    width: 40,
    height: 40,
  },
  slide: {
    flex: 1,
    width: '100%',
    paddingHorizontal: SPACING.space_4,
    alignItems: 'center',
  },
  factSlideWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  questionBlock: {
    paddingVertical: SPACING.space_3,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
    width: '100%',
    maxWidth: 500,
    marginBottom: SPACING.space_4,
  },
  questionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
    textAlign: 'left',
  },
  optionsContainer: {
    gap: SPACING.space_4,
    alignSelf: 'flex-start',
    width: '100%',
  },
  feedbackText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  scaleContainer: {
    alignItems: 'flex-start',
    gap: SPACING.space_4,
    width: '100%',
    alignSelf: 'flex-start',
  },
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.space_2,
    width: '100%',
  },
  scaleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(20, 20, 20, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fffef9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scaleButtonSelected: {
    borderColor: '#0B0B0B',
    backgroundColor: '#0B0B0B',
    shadowOpacity: 0.12,
  },
  scaleButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 24,
    color: '#1f2937',
  },
  scaleButtonTextSelected: {
    color: '#FFFFFF',
  },
  scaleLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  scaleLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  heroBubbleLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 16,
  },
  sliderContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_2,
    paddingBottom: SPACING.space_7,
    gap: SPACING.space_5,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  sliderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: '#1f2937',
    padding: SPACING.space_5,
    gap: SPACING.space_4,
    width: '100%',
  },
  factContent: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    gap: SPACING.space_1,
  },
  factHero: {
    flexGrow: 1,
    minHeight: 220,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_4,
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    opacity: 0.9,
  },
  heroPulse: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(243, 123, 131, 0.6)',
  },
  heroBubble: {
    position: 'absolute',
    paddingVertical: SPACING.space_2,
    paddingHorizontal: SPACING.space_3,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    maxWidth: '70%',
  },
  heroBubbleLeft: {
    left: SPACING.space_4,
    top: 40,
  },
  heroBubbleRight: {
    right: SPACING.space_4,
    bottom: 36,
  },
  heroChain: {
    position: 'absolute',
    top: 0,
    height: 60,
    flexDirection: 'row',
    gap: 4,
  },
  heroChainLink: {
    width: 12,
    height: 50,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.4)',
    backgroundColor: 'transparent',
  },
  heroChainLinkFilled: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heroPhone: {
    width: 150,
    borderRadius: 28,
    backgroundColor: '#0B0B0B',
    padding: SPACING.space_2,
    shadowColor: '#0B0B0B',
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  heroPhoneNotch: {
    alignSelf: 'center',
    width: 70,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#141414',
    marginBottom: SPACING.space_2,
  },
  heroPhoneScreen: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: SPACING.space_2,
    gap: SPACING.space_2,
  },
  heroPhoneStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0B0B0B',
  },
  heroFeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  heroFeedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F37B83',
  },
  heroFeedTextBlock: {
    flex: 1,
    gap: 4,
  },
  heroFeedLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  heroFeedLineShort: {
    width: '60%',
  },
  heroFeedTimerPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0B0B0B',
  },
  heroFeedTimerText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 12,
    color: '#FFFFFF',
  },
  heroCTAButton: {
    marginTop: SPACING.space_2,
    backgroundColor: '#0B0B0B',
    borderRadius: 16,
    paddingVertical: SPACING.space_2,
    alignItems: 'center',
  },
  heroCTAButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  factHalo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  factBlobLarge: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(243, 123, 131, 0.7)',
    shadowColor: '#F37B83',
    shadowOpacity: 0.55,
    shadowRadius: 50,
    transform: [{ translateY: -30 }],
  },
  factRibbon: {
    position: 'absolute',
    width: '130%',
    height: 130,
    borderRadius: 80,
    overflow: 'hidden',
  },
  factRibbonSecondary: {
    position: 'absolute',
    width: '95%',
    height: 100,
    borderRadius: 80,
    overflow: 'hidden',
  },
  factRibbonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  factHeroBeam: {
    position: 'absolute',
    width: '140%',
    height: 110,
    borderRadius: 80,
    overflow: 'hidden',
  },
  factSparkRow: {
    position: 'absolute',
    top: 30,
    width: '70%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  factSpark: {
    width: 6,
    height: 28,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  factSparkTall: {
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  factSparkShort: {
    height: 18,
    opacity: 0.7,
  },
  factHeroBadge: {
    paddingVertical: SPACING.space_3,
    paddingHorizontal: SPACING.space_4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.78)',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  factHeroBadgeTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  factHeroBadgeSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 4,
  },
  questionList: {
    flex: 1,
  },
  factScroll: {
    alignSelf: 'stretch',
    flex: 1,
    width: '100%',
  },
  approachCard: {
    width: '100%',
    gap: SPACING.space_2,
    marginTop: SPACING.space_2,
    flex: 1,
    justifyContent: 'flex-start',
  },
  approachTopSection: {
    gap: SPACING.space_2,
  },
  approachLowerSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  },
  approachPrompt: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  approachFollowUpQuestion: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
    marginTop: SPACING.space_3,
    marginBottom: SPACING.space_1,
  },
  approachSliderSection: {
    gap: SPACING.space_3,
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_4,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  approachSliderLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  approachSliderValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    alignSelf: 'center',
    color: '#1f2937',
  },
  approachSlider: {
    width: '100%',
  },
  approachScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_1,
  },
  approachScaleLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  approachNextWrapper: {
    width: '100%',
    paddingHorizontal: SPACING.space_4,
    paddingTop: SPACING.space_2,
    alignSelf: 'center',
  },
  approachHint: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  tradeoffHero: {
    minHeight: 180,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 36,
    overflow: 'hidden',
    padding: SPACING.space_4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeoffBackdrop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
  },
  tradeoffPulseRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(131, 151, 255, 0.35)',
  },
  tradeoffBrainShell: {
    width: 190,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  tradeoffBrainAura: {
    position: 'absolute',
    width: 230,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(131, 151, 255, 0.15)',
  },
  tradeoffBrainCore: {
    width: '85%',
    height: '70%',
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tradeoffBrainFold: {
    position: 'absolute',
    width: '80%',
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(99, 115, 255, 0.2)',
  },
  tradeoffBrainFoldOne: {
    top: '30%',
  },
  tradeoffBrainFoldTwo: {
    bottom: '25%',
    width: '70%',
  },
  tradeoffSignal: {
    position: 'absolute',
    top: '45%',
    left: '10%',
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(99, 115, 255, 0.3)',
    justifyContent: 'center',
  },
  tradeoffSignalDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF7474',
    shadowColor: '#FF7474',
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  tradeoffOrbit: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeoffOrbitReverse: {
    width: 180,
    height: 180,
  },
  tradeoffOrbitTrack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(11, 11, 11, 0.08)',
    borderStyle: 'dashed',
  },
  tradeoffOrbitDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0B0B0B',
  },
  tradeoffOrbitDotSecondary: {
    backgroundColor: '#FF7474',
  },
  tradeoffSparkRow: {
    position: 'absolute',
    bottom: SPACING.space_2,
    flexDirection: 'row',
    gap: SPACING.space_1,
  },
  tradeoffSpark: {
    width: 6,
    height: 28,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  tradeoffSparkShort: {
    height: 18,
    opacity: 0.6,
  },
  factCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_4,
    gap: SPACING.space_3,
    width: '100%',
    alignSelf: 'center',
    marginTop: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  factTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 34,
    color: '#1f2937',
    lineHeight: 40,
  },
  factBullets: {
    gap: SPACING.space_2,
  },
  factBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.space_3,
  },
  factBulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0B0B0B',
    marginTop: SPACING.space_1,
  },
  factBulletText: {
    ...TYPOGRAPHY.Body,
    color: '#1f2937',
    flex: 1,
  },
  factPainLine: {
    ...TYPOGRAPHY.Body,
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#6B0504',
    marginTop: SPACING.space_3,
    marginBottom: SPACING.space_2,
  },
  factSubtitle: {
    ...TYPOGRAPHY.Body,
    fontSize: 17,
    color: '#475569',
  },
  sliderEyebrow: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sliderValue: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 32,
    color: '#1f2937',
  },
  slider: {
    width: '100%',
  },
  buttonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
});
