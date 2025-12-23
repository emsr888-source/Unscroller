import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  useWindowDimensions,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import paperTexture from '../../assets/images/paper-texture.jpg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { PROVIDERS } from '@/constants/providers';
import type { ProviderId } from '@/types';
import { useAppStore } from '@/store';
import { challengesService } from '@/services/challengesService';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import todoServiceDB from '@/services/todoService.database';
import {
  useBlockingStore,
  selectBlockSets,
  selectBlockingCapability,
  DEFAULT_BLOCK_SET_ID,
} from '@/features/blocking/blockingStore';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
import BlockingPermissionPrompt from '@/components/BlockingPermissionPrompt';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Pattern,
  Line,
  Path,
} from 'react-native-svg';
import {
  Settings,
  Flame,
  Target,
  Bot,
  ClipboardList,
  Book,
  Cloud,
  Handshake,
  BarChart2,
  Mail,
  MessageCircle,
  User as UserIcon,
  Siren,
  Check,
  Minus,
} from 'lucide-react-native';
import { MeditationIcon } from '@/components/icons/MeditationIcon';
import FocusAwareStatusBar from '@/components/FocusAwareStatusBar';
import { isExpoGo } from '@/utils/isExpoGo';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SAMPLE_TODO_SUMMARY = {
  daily: { total: 2, completed: 1 },
  weekly: { total: 5, completed: 2 },
} as const;
const STREAK_RADIUS = 78;
const STREAK_SIZE = 196;
const STREAK_CENTER = STREAK_SIZE / 2;
const STREAK_CIRCUMFERENCE = 2 * Math.PI * STREAK_RADIUS;
const STITCH_PAPER_URL =
  'https://img.freepik.com/free-photo/white-paper-texture_1194-5998.jpg?t=st=1730000000~exp=1730003600~hmac=abcdef';

type StitchLogoProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const InstagramLogo = ({ size = 26, color = '#1f2937', strokeWidth = 1.8 }: StitchLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={2} y={2} width={20} height={20} rx={5} ry={5} stroke={color} strokeWidth={strokeWidth} fill="none" />
    <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke={color} strokeWidth={strokeWidth} fill="none" />
    <Line
      x1={17.5}
      y1={6.5}
      x2={17.51}
      y2={6.5}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

const XLogo = ({ size = 26, color = '#1f2937' }: StitchLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill={color}
    />
  </Svg>
);

const YouTubeLogo = ({ size = 26, color = '#1f2937', strokeWidth = 1.8 }: StitchLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="m10 15 5-3-5-3z" fill={color} />
  </Svg>
);

const TikTokLogo = ({ size = 26, color = '#1f2937' }: StitchLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      fill={color}
    />
  </Svg>
);

const FacebookLogo = ({ size = 26, color = '#1f2937', strokeWidth = 1.8 }: StitchLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);


const PanicButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.panicButtonWrapper}>
    <LinearGradient
      colors={['#fecaca', '#f87171']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.panicGradient}
    >
      <View style={styles.panicOutline} />
      <View style={styles.panicContent}>
        <View style={styles.panicLabelGroup}>
          <View style={styles.panicIconCircle}>
            <Siren size={24} color="#b91c1c" strokeWidth={1.4} />
          </View>
          <Text style={styles.panicLabel}>Panic Button</Text>
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const BlockerIcon = ({ size = 26, color = '#1f2937', strokeWidth = 1.8 }: StitchLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle
      cx={12}
      cy={12}
      r={9}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M7.5 7.5c1.95 2.1 6.3 6.42 9 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

type WeekBadgeProps = {
  label: string;
  completed: boolean;
};

const WeekBadge = ({ label, completed }: WeekBadgeProps) => (
  <View style={styles.weekBadge}>
    <View style={styles.weekBadgeRing}>
      {completed ? <View style={styles.weekBadgeBlob} /> : null}
      <View style={styles.weekBadgeIconWrap}>
        {completed ? (
          <Check size={16} color="#1f2937" strokeWidth={2.5} />
        ) : (
          <Minus size={16} color="#475569" strokeWidth={2.5} />
        )}
      </View>
    </View>
    <Text style={styles.weekBadgeLabel}>{label}</Text>
  </View>
);

type ProgressCapsuleProps = {
  label: string;
  current: number;
  total: number;
  color?: 'blue' | 'green';
};

const ProgressCapsule = ({ label, current, total, color = 'blue' }: ProgressCapsuleProps) => {
  const percent = total === 0 ? 0 : Math.min((current / total) * 100, 100);
  return (
    <View style={styles.progressCapsule}>
      <Text style={styles.progressCapsuleLabel}>{label}</Text>
      <View style={styles.progressCapsuleTrack}>
        <View
          style={[
            styles.progressCapsuleFill,
            color === 'green' && styles.progressCapsuleFillGreen,
            { width: `${percent}%` },
          ]}
        />
      </View>
    </View>
  );
};

const StreakDialGraphic = ({ days }: { days: number }) => {
  const normalized = Math.min(Math.max(days / 7, 0.08), 1);
  const strokeDashoffset = STREAK_CIRCUMFERENCE * (1 - normalized);

  return (
    <View style={styles.streakDial}>
      <Svg width={STREAK_SIZE} height={STREAK_SIZE}>
        <Defs>
          <SvgLinearGradient id="streakGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#6EE7B7" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#34D399" stopOpacity="0.9" />
          </SvgLinearGradient>
        </Defs>

        <Circle cx={STREAK_CENTER} cy={STREAK_CENTER} r={STREAK_RADIUS} fill="none" stroke="#e5e7eb" strokeWidth={5} />
        <Circle
          cx={STREAK_CENTER}
          cy={STREAK_CENTER}
          r={STREAK_RADIUS}
          fill="none"
          stroke="url(#streakGradient)"
          strokeWidth={12}
          strokeDasharray={`${STREAK_CIRCUMFERENCE * 0.92} ${STREAK_CIRCUMFERENCE}`}
          strokeDashoffset={`${strokeDashoffset}`}
          strokeLinecap="round"
          transform={`rotate(-5 ${STREAK_CENTER} ${STREAK_CENTER})`}
        />
      </Svg>
      <View style={styles.streakDialCore}>
        <Text style={styles.streakDialLabel}>Scroll-free streak</Text>
        <Text style={styles.streakDialValue}>{days} Days</Text>
        <Text style={styles.streakDialSubtext}>Keep it up! 🔥</Text>
      </View>
    </View>
  );
};

const GridOverlay = () => (
  <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Defs>
      <Pattern id="gridPattern" width="24" height="24" patternUnits="userSpaceOnUse">
        <Rect x="0" y="0" width="24" height="24" fill="transparent" />
        <Line x1="0" y1="0" x2="24" y2="0" stroke="#9ca3af" strokeWidth={0.4} />
        <Line x1="0" y1="0" x2="0" y2="24" stroke="#9ca3af" strokeWidth={0.4} />
      </Pattern>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#gridPattern)" opacity={0.12} />
  </Svg>
);

const DAILY_QUOTES: string[] = [
  'Dream big. Start small. Act now.',
  'Discipline beats motivation.',
  'Prove them wrong.',
  'Stay hungry, stay foolish.',
  'Hustle until it happens.',
  'No excuses. Just results.',
  'Focus on progress, not perfection.',
  'Winners never quit.',
  'You are your only limit.',
  'Do it scared.',
  'Start before you\'re ready.',
  'Grind in silence.',
  'Doubt kills dreams.',
  'Create your own luck.',
  'Work hard. Stay humble.',
  'Make it happen.',
  'Failure fuels success.',
  'Keep moving forward.',
  'Consistency creates confidence.',
  'Trust the process.',
  'Get up. Show up.',
  'Earn your spot.',
  'Be stronger than your excuses.',
  'Stay consistent.',
  'Good things take grind.',
  'Fall seven, rise eight.',
  'Keep going.',
  'Results, not reasons.',
  'Never settle.',
  'Outwork everyone.',
  'Mindset is everything.',
  'Commit and conquer.',
  'Small steps, big wins.',
  'Grit over quit.',
  'Dream. Plan. Do.',
  'Discomfort breeds growth.',
  'Be relentless.',
  'Push your limits.',
  'Sacrifice for success.',
  'Think big. Work bigger.',
  'No pain, no gain.',
  'Earned, not given.',
  'You got this.',
  'Move with purpose.',
  'Work now, shine later.',
  'Progress over comfort.',
  'Stay focused.',
  'Rise and grind.',
  'Success loves effort.',
  'Fear less, do more.',
  'One day or day one.',
  'Dream. Believe. Achieve.',
  'Keep showing up.',
  'Make yourself proud.',
  'Stay patient. Stay hungry.',
  'Turn pain into power.',
  'Be your future self.',
  'Less talk, more action.',
  'Excuses change nothing.',
  'Work until it\'s easy.',
  'Prove yourself right.',
  'Every day counts.',
  'Built, not born.',
  'Do the hard things.',
  'Start now.',
  'Earn it daily.',
  'Focus beats talent.',
  'Win the morning.',
  'Energy wins.',
  'Get obsessed.',
];

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const PROVIDER_ICON_MAP: Record<string, IconComponent> = {
  instagram: InstagramLogo,
  x: XLogo,
  youtube: YouTubeLogo,
  tiktok: TikTokLogo,
  facebook: FacebookLogo,
};

const QUICK_ACTIONS: { label: string; Icon: IconComponent; action: (nav: Props['navigation']) => void }[] = [
  { label: 'To-Do', Icon: ClipboardList, action: nav => nav.navigate('TodoList') },
  { label: 'Journal', Icon: Book, action: nav => nav.navigate('Journal') },
  { label: 'Blocker', Icon: BlockerIcon, action: nav => nav.navigate('BlockerHub') },
  { label: 'My Sky', Icon: Cloud, action: nav => nav.navigate('MySky') },
  { label: 'Meditate', Icon: MeditationIcon, action: nav => nav.navigate('Reset') },
];

const BOTTOM_NAV: { key: string; Icon: IconComponent; action: (nav: Props['navigation']) => void }[] = [
  {
    key: 'collab',
    Icon: Handshake,
    action: nav => nav.navigate('CollaborationHub', { initialTab: 'partnerships' }),
  },
  { key: 'progress', Icon: BarChart2, action: nav => nav.navigate('Progress') },
  { key: 'messages', Icon: Mail, action: nav => nav.navigate('Messages') },
  { key: 'community', Icon: MessageCircle, action: nav => nav.navigate('Community') },
  { key: 'profile', Icon: UserIcon, action: nav => nav.navigate('Profile') },
];

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const streakDays = 5;
  const lastScrollDate = useAppStore(state => state.lastScrollTimestamp);
  
  // Force status bar to dark-content on screen focus
  useStatusBarStyle('dark-content');
  const today = useMemo(() => new Date(), []);
  const scrollFreeDays = useMemo(() => {
    if (!lastScrollDate) {
      return 5;
    }

    const parsed = new Date(lastScrollDate);
    if (Number.isNaN(parsed.getTime())) {
      return 5;
    }

    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    const lastMidnight = new Date(parsed);
    lastMidnight.setHours(0, 0, 0, 0);

    const diffMs = todayMidnight.getTime() - lastMidnight.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [lastScrollDate, today]);
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isCompactVertical = screenHeight < 740;
  const isCompactHorizontal = screenWidth < 360;
  
  // Gamification - Mock XP for now
  const totalXP = 350;
  const userLevel = challengesService.getUserLevel(totalXP);

  // Mock data - in production, this would come from your backend/storage
  const dayStatuses = [true, true, true, false, true, true, false]; // Example: completed days

  const blockSets = useBlockingStore(selectBlockSets);
  const capability = useBlockingStore(selectBlockingCapability);
  const [focusLauncher, setFocusLauncher] = useState<{
    visible: boolean;
    hours: number;
    minutes: number;
    blockSetId: string;
  }>(() => ({
    visible: false,
    hours: 0,
    minutes: 25,
    blockSetId: blockSets[0]?.id ?? DEFAULT_BLOCK_SET_ID,
  }));
  const [todoSummary, setTodoSummary] = useState({
    daily: { total: 0, completed: 0 },
    weekly: { total: 0, completed: 0 },
  });
  const [isTodoSummaryLoading, setIsTodoSummaryLoading] = useState(false);
  const [permissionPromptVisible, setPermissionPromptVisible] = useState(false);

  const applySampleSummary = useCallback(() => {
    setTodoSummary({
      daily: { ...SAMPLE_TODO_SUMMARY.daily },
      weekly: { ...SAMPLE_TODO_SUMMARY.weekly },
    });
  }, []);

  const loadTodoSummary = useCallback(async () => {
    setIsTodoSummaryLoading(true);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        applySampleSummary();
        return;
      }

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        if (sessionError.message?.includes('Auth session missing')) {
          applySampleSummary();
          return;
        }
        throw sessionError;
      }

      const userId = sessionData.session?.user?.id;

      if (!userId) {
        applySampleSummary();
        return;
      }

      const records = await todoServiceDB.fetchTodos(userId);
      const daily = records.filter(record => record.scope === 'daily');
      const weekly = records.filter(record => record.scope === 'weekly');

      setTodoSummary({
        daily: {
          total: daily.length,
          completed: daily.filter(record => record.completed).length,
        },
        weekly: {
          total: weekly.length,
          completed: weekly.filter(record => record.completed).length,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : null;
      if (message && message.includes('Auth session missing')) {
        applySampleSummary();
      } else {
        console.warn('[Home] Failed to load to-do summary', error);
      }
    } finally {
      setIsTodoSummaryLoading(false);
    }
  }, [applySampleSummary]);

  useEffect(() => {
    loadTodoSummary();
  }, [loadTodoSummary]);

  useEffect(() => {
    setFocusLauncher(prev => {
      if (blockSets.some(set => set.id === prev.blockSetId)) {
        return prev;
      }
      return {
        ...prev,
        blockSetId: blockSets[0]?.id ?? DEFAULT_BLOCK_SET_ID,
      };
    });
  }, [blockSets]);

  const openFocusLauncher = () => {
    setFocusLauncher(prev => ({
      ...prev,
      visible: true,
    }));
  };

  const closeFocusLauncher = () => {
    setFocusLauncher(prev => ({
      ...prev,
      visible: false,
    }));
  };

  const handleFocusDurationChange = (field: 'hours' | 'minutes', value: string) => {
    const numeric = Number(value.replace(/[^0-9]/g, ''));
    const safeValue = Number.isNaN(numeric) ? 0 : Math.min(field === 'hours' ? 12 : 59, numeric);
    setFocusLauncher(prev => ({
      ...prev,
      [field]: safeValue,
    }));
  };

  const ensureBlockingCapability = () => {
    if (capability.authorized && capability.shieldsAvailable) {
      return true;
    }
    setPermissionPromptVisible(true);
    return false;
  };

  const handleLaunchFocusSession = () => {
    const totalMinutes = focusLauncher.hours * 60 + focusLauncher.minutes;
    const durationMin = totalMinutes > 0 ? totalMinutes : 25;
    if (!ensureBlockingCapability()) {
      return;
    }

    closeFocusLauncher();
    navigation.navigate('TaskTimer', {
      taskId: `home-focus-${Date.now()}`,
      title: 'Deep focus session',
      durationMin,
      blockSetId: focusLauncher.blockSetId,
    });
  };

  const handleProviderPress = (providerId: ProviderId) => {
    navigation.navigate('ProviderWebView', { providerId });
  };

  const daySeed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 32 + today.getDate();
  const quoteIndex = Math.abs(daySeed) % DAILY_QUOTES.length;
  const todayQuote = DAILY_QUOTES[quoteIndex];

  const quickActions = useMemo(
    () =>
      QUICK_ACTIONS.map(item => ({
        ...item,
        action: () => item.action(navigation),
      })),
    [navigation]
  );

  const bottomNavItems = useMemo(
    () =>
      BOTTOM_NAV.map(item => ({
        ...item,
        action: () => item.action(navigation),
      })),
    [navigation]
  );

  const topPadding = 0;
  const bottomSpacerHeight = SPACING.space_4 + (insets.bottom ?? 0);
  const bottomNavInset = Math.max((insets.bottom ?? 0) - 14, 0);

  return (
    <View style={styles.root}>
      {!isExpoGo && (
        <FocusAwareStatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_MAIN} />
      )}
      <View style={styles.paperBackground}>
        <Image
          source={{ uri: STITCH_PAPER_URL }}
          style={styles.homeBackground}
          resizeMode="cover"
          blurRadius={0.5}
          accessibilityIgnoresInvertColors
        />
        <Image
          source={paperTexture}
          style={styles.paperTexture}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <LinearGradient
          colors={['rgba(254, 243, 199, 0.55)', 'rgba(199, 210, 254, 0.35)', 'rgba(248, 250, 252, 0.6)']}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.paperVignette}
        />
        <GridOverlay />
        <View style={styles.paperTint} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            (isCompactVertical || isCompactHorizontal) && styles.scrollContentCompact,
            { paddingTop: topPadding, paddingBottom: bottomSpacerHeight },
          ]}
        >
          <View style={styles.screenBody}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.brandRow}>
                  <Text style={styles.brandTitle}>UNSCROLLER</Text>
                  <TouchableOpacity
                    style={styles.levelBadge}
                    onPress={() => navigation.navigate('Leaderboard')}
                    activeOpacity={0.9}
                  >
                    <View style={styles.levelBadgeBubble}>
                      <Text style={styles.levelBubbleText}>Lv {userLevel.level}</Text>
                    </View>
                    <View style={styles.levelCopy}>
                      <Text style={styles.levelCopyStrong}>Time</Text>
                      <Text style={styles.levelCopyLight}>Reclaimer</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakBadgeNumber}>{streakDays}</Text>
                  <Flame size={16} color="#f97316" />
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Settings')}
                  style={styles.settingsBadge}
                  activeOpacity={0.85}
                >
                  <Settings size={20} color="#1f2937" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Week rotation */}
            <View style={styles.weekStrip}>
              {DAYS.map((day, index) => (
                <WeekBadge key={`${day}-${index}`} label={day} completed={!!dayStatuses[index]} />
              ))}
            </View>

            <View style={styles.streakCluster}>
              <View style={styles.providerRow}>
                {PROVIDERS.map(provider => {
                  const IconComponent = PROVIDER_ICON_MAP[provider.id];
                  return (
                    <TouchableOpacity
                      key={provider.id}
                      style={styles.providerIconWrap}
                      onPress={() => handleProviderPress(provider.id)}
                      activeOpacity={0.85}
                    >
                      {IconComponent ? (
                        <IconComponent size={24} color="#1f2937" strokeWidth={1.8} />
                      ) : (
                        <Text style={styles.providerEmoji}>{provider.icon}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <StreakDialGraphic days={scrollFreeDays} />
              <Text style={styles.quoteText}>{`"${todayQuote}"`}</Text>
            </View>

            {/* focus + AI */}
            <View style={styles.primaryActionRow}>
              <WatercolorButton color="blue" onPress={openFocusLauncher} style={styles.primaryAction}>
                <Target size={24} color="#1f2937" strokeWidth={1.4} />
                <Text style={styles.actionTitle}>Focus Session</Text>
              </WatercolorButton>
              <WatercolorButton
                color="neutral"
                onPress={() => navigation.navigate('AIChat')}
                style={styles.primaryAction}
              >
                <Bot size={26} color="#1f2937" strokeWidth={1.4} />
                <Text style={styles.actionTitle}>AI Buddy</Text>
              </WatercolorButton>
            </View>

            {/* utility grid */}
            <View style={styles.utilityGrid}>
              {quickActions.map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.utilityCell}
                  onPress={item.action}
                  activeOpacity={0.85}
                >
                  <View style={styles.utilityIconShell}>
                    <item.Icon size={item.label === 'Meditate' ? 28 : 22} color="#1f2937" strokeWidth={1.3} />
                  </View>
                  <Text style={styles.utilityLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

          {/* progress */}
            <View style={styles.progressCapsuleRow}>
              <ProgressCapsule
                label={`${todoSummary.daily.completed}/${todoSummary.daily.total} Today`}
                current={todoSummary.daily.completed}
                total={todoSummary.daily.total}
                color="blue"
              />
              <ProgressCapsule
                label={`${todoSummary.weekly.completed}/${todoSummary.weekly.total} Week`}
                current={todoSummary.weekly.completed}
                total={todoSummary.weekly.total}
                color="green"
              />
            </View>
          {isTodoSummaryLoading ? <Text style={styles.todoLoading}>Updating to-dos…</Text> : null}

            {/* panic */}
            <PanicButton onPress={() => navigation.navigate('PanicButton')} />
          </View>
        </ScrollView>

        <Modal visible={focusLauncher.visible} transparent animationType="fade" onRequestClose={closeFocusLauncher}>
          <View style={styles.launcherOverlay}>
            <WatercolorCard style={styles.launcherCard}>
              <Text style={styles.launcherTitle}>Start a focus session</Text>

              <Text style={styles.launcherLabel}>Duration</Text>
              <View style={styles.durationInputs}>
                <View style={styles.durationField}>
                  <Text style={styles.inputHint}>Hours</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={String(focusLauncher.hours)}
                    onChangeText={value => handleFocusDurationChange('hours', value)}
                    style={styles.durationInput}
                    maxLength={2}
                  />
                </View>
                <View style={styles.durationField}>
                  <Text style={styles.inputHint}>Minutes</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={String(focusLauncher.minutes)}
                    onChangeText={value => handleFocusDurationChange('minutes', value)}
                    style={styles.durationInput}
                    maxLength={2}
                  />
                </View>
              </View>

              <Text style={styles.launcherLabel}>Focus mode</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.blockSetChips}>
                {blockSets.map(set => {
                  const isActive = set.id === focusLauncher.blockSetId;
                  return (
                    <TouchableOpacity
                      key={set.id}
                      style={[styles.blockSetChip, isActive && styles.blockSetChipActive]}
                      onPress={() => setFocusLauncher(prev => ({ ...prev, blockSetId: set.id }))}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.blockSetChipEmoji}>{set.blockedEmoji ?? '🛡️'}</Text>
                      <Text style={[styles.blockSetChipText, isActive && styles.blockSetChipTextActive]}>{set.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {!capability.authorized || !capability.shieldsAvailable ? (
                <Text style={styles.permissionHint}>
                  Blocking requires Screen Time permissions. Enable them in Settings → Blocking permissions.
                </Text>
              ) : null}

              <View style={styles.launcherActions}>
                <WatercolorButton color="neutral" onPress={closeFocusLauncher} style={styles.launcherActionButton}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </WatercolorButton>
                <WatercolorButton color="yellow" onPress={handleLaunchFocusSession} style={styles.launcherActionButton}>
                  <Text style={styles.primaryButtonText}>Start session</Text>
                </WatercolorButton>
              </View>
            </WatercolorCard>
          </View>
        </Modal>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNavContainer, { paddingBottom: bottomNavInset }]}>
          <View style={styles.bottomNav}>
            {bottomNavItems.map(item => (
              <TouchableOpacity key={item.key} style={styles.navItem} onPress={item.action} activeOpacity={0.85}>
                <View
                  style={[
                    styles.navIconShell,
                    item.key === 'messages' && styles.navIconShellActive,
                  ]}
                >
                  <item.Icon size={24} color="#1f2937" strokeWidth={1.4} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <BlockingPermissionPrompt
          visible={permissionPromptVisible}
          onConfirm={() => {
            setPermissionPromptVisible(false);
            navigation.navigate('BlockingPermissions');
          }}
          onDismiss={() => setPermissionPromptVisible(false)}
        />
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
    backgroundColor: '#fdfbf7',
  },
  paperBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  homeBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  paperTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  paperVignette: {
    ...StyleSheet.absoluteFillObject,
  },
  paperTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(253, 251, 247, 0.85)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.space_4,
    paddingBottom: SPACING.space_6,
  },
  scrollContentCompact: {
    paddingHorizontal: SPACING.space_3,
    paddingBottom: SPACING.space_4,
  },
  screenBody: {
    gap: SPACING.space_4,
    marginTop: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 0,
  },
  headerLeft: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  brandTitle: {
    fontFamily: 'AmaticSC-Regular',
    fontSize: 36,
    color: '#374151',
    letterSpacing: 1,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    marginLeft: SPACING.space_5,
  },
  levelBadgeBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#cfe5fb',
    borderWidth: 1,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#93c5fd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  levelBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#cfe5fb',
    borderWidth: 1,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#93c5fd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  levelBubbleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
  },
  levelCopy: {
    justifyContent: 'center',
  },
  levelCopyStrong: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  levelCopyLight: {
    fontSize: 13,
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#fff',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  streakBadgeNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  settingsBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  settingsIcon: {
    fontSize: 22,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -SPACING.space_1,
  },
  weekBadge: {
    alignItems: 'center',
    gap: 4,
  },
  weekBadgeRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  weekBadgeBlob: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    backgroundColor: 'rgba(147,197,253,0.35)',
  },
  weekBadgeIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#6b7280',
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_1,
  },
  providerIconWrap: {
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: '#1f2937',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdfbf7',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  providerEmoji: {
    fontSize: 24,
  },
  streakCluster: {
    gap: SPACING.space_1,
    marginBottom: SPACING.space_1,
  },
  streakDial: {
    width: STREAK_SIZE,
    height: STREAK_SIZE,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  streakDialCore: {
    position: 'absolute',
    inset: 30,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  streakDialLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  streakDialValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
  },
  streakDialSubtext: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  quoteText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 0,
  },
  primaryActionRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
  },
  primaryAction: {
    flex: 1,
  },
  watercolorButtonWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: 'rgba(14,23,45,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  watercolorButton: {
    borderRadius: 28,
  },
  watercolorButtonSurface: {
    borderRadius: 28,
    padding: SPACING.space_3,
  },
  watercolorButtonStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#1f2937',
    opacity: 0.6,
  },
  watercolorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.space_2,
  },
  actionEmoji: {
    fontSize: 30,
  },
  actionTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#0f172a',
  },
  actionSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#475569',
    marginTop: -4,
  },
  actionLabelStack: {
    justifyContent: 'center',
    gap: -2,
  },
  utilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  utilityCell: {
    width: '18%',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.space_2,
  },
  utilityIconShell: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  utilityLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#475569',
  },
  progressCapsuleRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    marginTop: -SPACING.space_1,
    marginBottom: SPACING.space_1,
  },
  progressCapsule: {
    flex: 1,
    gap: SPACING.space_1,
  },
  progressCapsuleLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 18,
    color: '#1f2937',
  },
  progressCapsuleTrack: {
    height: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#1f2937',
    padding: 4,
    backgroundColor: '#fff',
  },
  progressCapsuleFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#93c5fd',
  },
  progressCapsuleFillGreen: {
    backgroundColor: '#86efac',
  },
  todoLoading: {
    textAlign: 'center',
    fontFamily: 'PatrickHand-Regular',
    color: '#475569',
  },
  panicButtonWrapper: {
    marginTop: 4,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  panicGradient: {
    borderRadius: 26,
    padding: 2,
  },
  panicOutline: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#7f1d1d',
  },
  panicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  panicLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  panicIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  panicLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 22,
    color: '#7f1d1d',
  },
  panicLabelWrap: {
    flex: 1,
    alignItems: 'center',
  },
  navIconShell: {
    borderRadius: 18,
    borderWidth: 1.4,
    borderColor: '#0f172a',
    padding: 10,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  navIconShellActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#facc15',
    shadowColor: '#facc15',
  },
  bottomNavContainer: {
    width: '100%',
    paddingHorizontal: 0,
    marginBottom: -6,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 34,
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#0f172a',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    paddingHorizontal: 12,
  },
  launcherOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_4,
  },
  launcherCard: {
    width: '100%',
    maxWidth: 420,
    gap: SPACING.space_3,
    padding: SPACING.space_4,
  },
  launcherTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  launcherLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  durationInputs: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  durationField: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cbd5f5',
    borderRadius: 18,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    backgroundColor: '#fff',
  },
  inputHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  durationInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  blockSetChips: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    paddingVertical: SPACING.space_1,
  },
  blockSetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5f5',
    borderRadius: 999,
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    backgroundColor: '#fff',
  },
  blockSetChipActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#facc15',
  },
  blockSetChipEmoji: {
    fontSize: 18,
  },
  blockSetChipText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  blockSetChipTextActive: {
    fontWeight: '700',
    color: '#78350f',
  },
  launcherActions: {
    flexDirection: 'row',
    gap: SPACING.space_2,
  },
  launcherActionButton: {
    flex: 1,
  },
  permissionHint: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  focusOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  focusContainer: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  focusTitle: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  focusCountdown: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
  },
  focusSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  focusButton: {
    width: '100%',
  },
  focusButtonText: {
    fontFamily: 'PatrickHand-Regular',
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '700',
  },
});
