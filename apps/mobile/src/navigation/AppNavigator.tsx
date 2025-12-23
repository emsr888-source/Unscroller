import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store';
import { ProviderId } from '@/types';
import { CommunityChallengeId } from '@/constants/communityChallenges';
import type { Challenge } from '@/services/challengesService.database';
import { COLORS } from '../core/theme/colors';
import { isExpoGo } from '@/utils/isExpoGo';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import PaywallScreen from '../screens/PaywallScreen';
import HomeScreen from '../screens/HomeScreen';
import ProviderWebViewScreen from '../screens/ProviderWebViewScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingWelcomeScreen from '../screens/OnboardingWelcomeScreen';
import OnboardingNameScreen from '../screens/OnboardingNameScreen';
import OnboardingProfileCardScreen from '../screens/OnboardingProfileCardScreen';
import OnboardingReflectionScreen from '../screens/OnboardingReflectionScreen';
import OnboardingPersonaScreen from '../screens/OnboardingPersonaScreen';
import OnboardingAgeScreen from '../screens/OnboardingAgeScreen';
import OnboardingBuildFocusScreen from '../screens/OnboardingBuildFocusScreen';
import OnboardingIdentitySummaryScreen from '../screens/OnboardingIdentitySummaryScreen';
import OnboardingQuizScreen from '../screens/OnboardingQuizScreen';
import OnboardingNotificationsScreen from '../screens/OnboardingNotificationsScreen';
import QuizQuestionScreen from '../screens/QuizQuestionScreen';
import QuizSymptomsScreen from '../screens/QuizSymptomsScreen';
import QuizResultLoadingScreen from '../screens/QuizResultLoadingScreen';
import QuizGenderScreen from '../screens/QuizGenderScreen';
import QuizFinalInfoScreen from '../screens/QuizFinalInfoScreen';
import QuizSupportNeedScreen from '../screens/QuizSupportNeedScreen';
import ExpertQuotesScreen from '../screens/ExpertQuotesScreen';
import RecoveryGraphScreen from '../screens/RecoveryGraphScreen';
import GoalSelectionScreen from '../screens/GoalSelectionScreen';
import ReferralCodeScreen from '../screens/ReferralCodeScreen';
import RatingRequestScreen from '../screens/RatingRequestScreen';
import SupportScreen from '../screens/SupportScreen';
import CommitmentScreen from '../screens/CommitmentScreen';
import PlanPreviewScreen from '../screens/PlanPreviewScreen';
import CustomPlanScreen from '../screens/CustomPlanScreen';
import BenefitsShowcaseScreen from '../screens/BenefitsShowcaseScreen';
import HabitsGuideScreen from '../screens/HabitsGuideScreen';
import HabitGridScreen from '../screens/HabitGridScreen';
import TakeBackControlScreen from '../screens/TakeBackControlScreen';
import QuizReferralScreen from '../screens/QuizReferralScreen';
import CalculatingScreen from '../screens/CalculatingScreen';
import AnalysisCompleteScreen from '../screens/AnalysisCompleteScreen';
import OneTimeOfferScreen from '../screens/OneTimeOfferScreen';
import SevenDayTrialScreen from '../screens/SevenDayTrialScreen';
import NotificationReminderScreen from '../screens/NotificationReminderScreen';
import NotificationPermissionScreen from '../screens/NotificationPermissionScreen';
import TrialOfferScreen from '../screens/TrialOfferScreen';
import TwentyFourHourTrialScreen from '../screens/TwentyFourHourTrialScreen';
import FreeTrialInviteScreen from '../screens/FreeTrialInviteScreen';
import CheckInScreen from '../screens/CheckInScreen';
import TrophyScreen from '../screens/TrophyScreen';
import ProgressScreen from '../screens/ProgressScreen';
import CommunityScreen from '../screens/CommunityScreen';
import PanicButtonScreen from '../screens/PanicButtonScreen';
import TodoListScreen from '../screens/TodoListScreen';
import TaskTimerScreen from '../screens/TaskTimerScreen';
import ScreenTimeDashboardScreen from '../screens/ScreenTimeDashboardScreen';
import AIChatScreen from '../screens/AIChatScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ReferralsScreen from '../screens/ReferralsScreen';
import InfoScreen from '../screens/InfoScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import JournalScreen from '../screens/JournalScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ChallengeCreateScreen from '../screens/ChallengeCreateScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import MySkyScreen from '../screens/MySkyScreen';
import MeditationScreen from '../screens/MeditationScreen';
import ResetScreen from '../screens/ResetScreen';
import BreathSessionScreen from '../screens/BreathSessionScreen';
import ManifestProgressScreen from '../screens/ManifestProgressScreen';
import ManifestSessionScreen from '../screens/ManifestSessionScreen';
import MessagesScreen from '../screens/MessagesScreen';
import DirectMessageThreadScreen from '../screens/DirectMessageThreadScreen';
import BuildProjectThreadScreen from '../screens/BuildProjectThreadScreen';
import BuildUpdateThreadScreen from '../screens/BuildUpdateThreadScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import UserContentListScreen from '../screens/UserContentListScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import GoalsScreen from '../screens/GoalsScreen';
import BlockingPermissionsScreen from '../screens/BlockingPermissionsScreen';
import WeeklyFocusPlannerScreen from '../screens/WeeklyFocusPlannerScreen';
import BlockerHubScreen from '../screens/BlockerHubScreen';
import FocusJournalScreen from '../screens/FocusJournalScreen';
import OnboardingQuizResultScreen from '../screens/OnboardingQuizResultScreen';
import DisclosuresScreen from '../screens/DisclosuresScreen';
import ChallengeProgressScreen from '../screens/ChallengeProgressScreen';
import PolicyBypassWarningScreen from '../screens/PolicyBypassWarningScreen';
import CollaborationHubScreen from '../screens/CollaborationHubScreen';
import type { BuildProject, BuildUpdate } from '@/services/communityService';

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Paywall: undefined;
  NotificationReminder: undefined;
  NotificationPermission: undefined;
  TrialOffer: undefined;
  Home: undefined;
  ProviderWebView: { providerId: ProviderId };
  Settings: undefined;
  PolicyBypassWarning: undefined;
  OnboardingWelcome: undefined;
  OnboardingName: undefined;
  OnboardingProfileCard: undefined;
  OnboardingReflection: undefined;
  OnboardingPersona: undefined;
  OnboardingAge: undefined;
  OnboardingBuildFocus: undefined;
  OnboardingIdentitySummary: undefined;
  OnboardingQuiz: undefined;
  OnboardingNotifications: undefined;
  QuizQuestion: undefined;
  QuizGender: undefined;
  QuizSymptoms: undefined;
  QuizSupportNeed: undefined;
  QuizResultLoading: undefined;
  QuizFinalInfo: undefined;
  ExpertQuotes: undefined;
  RecoveryGraph: undefined;
  GoalSelection: undefined;
  ReferralCode: undefined;
  RatingRequest: undefined;
  Support: undefined;
  Commitment: undefined;
  PlanPreview: undefined;
  CustomPlan: undefined;
  BenefitsShowcase: undefined;
  HabitsGuide: undefined;
  TakeBackControl: undefined;
  ConversionShowcase: undefined;
  OnboardingQuizResult: undefined;
  FreeTrialInvite: undefined;
  QuizReferral: undefined;
  Calculating: undefined;
  AnalysisComplete: undefined;
  OneTimeOffer: undefined;
  SevenDayTrial: undefined;
  TwentyFourHourTrial: undefined;
  CheckIn: undefined;
  Trophy: undefined;
  Progress: undefined;
  Community: { initialTab?: 'Feed' | 'Challenges' | 'Leaderboard' } | undefined;
  PanicButton: undefined;
  TodoList: undefined;
  TaskTimer: { taskId: string; title: string; durationMin?: number; blockSetId?: string };
  ScreenTimeDashboard: undefined;
  HabitGrid: undefined;
  AIChat: undefined;
  Friends: undefined;
  Referrals: undefined;
  Info: undefined;
  Profile: undefined;
  BlockerHub: undefined;
  FocusJournal: { prefillTask?: { id: string; title: string; blockSetId?: string } } | undefined;
  WeeklyFocusPlanner: { prefillTask?: { id: string; title: string; blockSetId?: string } } | undefined;
  BlockingPermissions: undefined;
  Notifications: undefined;
  Journal: undefined;
  Calendar: undefined;
  Challenges: undefined;
  Leaderboard: undefined;
  MySky: undefined;
  Meditation: undefined;
  Reset: undefined;
  BreathSession: { presetId: string };
  ManifestProgress: { prompt: string };
  ManifestSession: { prompt: string; script: string; usedFallback: boolean };
  Messages: undefined;
  DirectMessageThread: { partnerId: string; partnerName?: string | null; avatar?: string | null };
  Resources: undefined;
  Goals: undefined;
  Disclosures: undefined;
  ChallengeDetail: { challengeId: CommunityChallengeId | string; initialChallenge?: Challenge };
  ChallengeProgress: { challengeId: CommunityChallengeId | string };
  ChallengeCreate: undefined;
  CollaborationHub: { initialTab?: 'partnerships' | 'build' } | undefined;
  BuildProjectThread: { projectId: string; initialProject?: BuildProject };
  BuildUpdateThread: { updateId: string; projectId?: string; initialProject?: BuildProject; initialUpdate?: BuildUpdate };
  UserProfile: { userId: string };
  UserContentList: {
    title: string;
    subtitle?: string;
    items: {
      id: string;
      title: string;
      subtitle?: string;
      timestamp?: string;
      badge?: string;
      icon?: string;
      route?: { name: keyof RootStackParamList; params?: Record<string, unknown> };
    }[];
  };
  Congratulations: undefined;
  MotivationalFacts: undefined;
  Personalization: undefined;
  SuccessFlow: undefined;
  FunFacts: undefined;
  WelcomeToJourney: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.ACCENT_GRADIENT_START,
    background: COLORS.BACKGROUND_MAIN,
    card: COLORS.BACKGROUND_ELEVATED,
    text: COLORS.TEXT_PRIMARY,
    border: COLORS.GLASS_BORDER,
    notification: COLORS.ACCENT_GRADIENT_END,
  },
};

const linking = {
  prefixes: ['unscroller://'],
  config: {
    screens: {
      Home: 'home',
      ProviderWebView: {
        path: 'provider/:providerId',
        parse: {
          providerId: (providerId: string) => providerId as ProviderId,
        },
      },
      Settings: 'settings',
    },
  },
};

// Premium screen transition configuration
const premiumTransition = {
  animation: 'default' as const,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
};

const modalTransition = {
  animation: 'slide_from_bottom' as const,
  presentation: 'modal' as const,
  gestureEnabled: true,
};

export default function AppNavigator() {
  const { isAuthenticated, hasActiveSubscription, hasCompletedOnboarding } = useAppStore();
  const bypassAuth = true;
  const bypassOnboarding = false;

  // Determine initial route based on onboarding and subscription status
  const initialRouteName: keyof RootStackParamList =
    bypassOnboarding
      ? 'Home'
      : hasCompletedOnboarding
        ? (!hasActiveSubscription ? 'NotificationPermission' : 'Home')
        : 'OnboardingReflection';

  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      <Stack.Navigator
        id={undefined}
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          ...premiumTransition,
        }}
      >
        {!bypassAuth && !isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : !bypassAuth && !hasActiveSubscription ? (
          <>
            <Stack.Screen name="NotificationReminder" component={NotificationReminderScreen} />
            <Stack.Screen name="Paywall" component={PaywallScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CollaborationHub" component={CollaborationHubScreen} />
            <Stack.Screen name="Paywall" component={PaywallScreen} />
            <Stack.Screen 
              name="ProviderWebView" 
              component={ProviderWebViewScreen}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                title: 'Settings',
                ...modalTransition,
              }}
            />
            <Stack.Screen
              name="PolicyBypassWarning"
              component={PolicyBypassWarningScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="OnboardingWelcome"
              component={OnboardingWelcomeScreen}
              options={{
                statusBarStyle: isExpoGo ? undefined : 'dark',
                statusBarHidden: false,
                statusBarTranslucent: false,
              }}
            />
            <Stack.Screen
              name="OnboardingName"
              component={OnboardingNameScreen}
              options={{
                statusBarStyle: isExpoGo ? undefined : 'dark',
                statusBarHidden: false,
                statusBarTranslucent: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingProfileCard" 
              component={OnboardingProfileCardScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="OnboardingReflection" 
              component={OnboardingReflectionScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="OnboardingPersona" 
              component={OnboardingPersonaScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="OnboardingAge" 
              component={OnboardingAgeScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="OnboardingBuildFocus" 
              component={OnboardingBuildFocusScreen}
              options={{
              }}
            />
            <Stack.Screen
              name="OnboardingIdentitySummary"
              component={OnboardingIdentitySummaryScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="OnboardingQuiz" 
              component={OnboardingQuizScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="OnboardingNotifications" 
              component={OnboardingNotificationsScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="QuizQuestion" 
              component={QuizQuestionScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="QuizGender" 
              component={QuizGenderScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="QuizSymptoms" 
              component={QuizSymptomsScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="QuizSupportNeed" 
              component={QuizSupportNeedScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="QuizResultLoading" 
              component={QuizResultLoadingScreen}
              options={{
              }}
            />
            <Stack.Screen 
              name="QuizFinalInfo" 
              component={QuizFinalInfoScreen}
              options={{
              }}
            />
            <Stack.Screen name="ExpertQuotes" component= {ExpertQuotesScreen} />
            <Stack.Screen name="RecoveryGraph" component={RecoveryGraphScreen} />
            <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
            <Stack.Screen name="ReferralCode" component={ReferralCodeScreen} />
            <Stack.Screen name="RatingRequest" component={RatingRequestScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Commitment" component={CommitmentScreen} />
            <Stack.Screen name="PlanPreview" component={PlanPreviewScreen} />
            <Stack.Screen name="CustomPlan" component={CustomPlanScreen} />
            <Stack.Screen name="BenefitsShowcase" component={BenefitsShowcaseScreen} />
            <Stack.Screen name="HabitsGuide" component={HabitsGuideScreen} />
            <Stack.Screen name="TakeBackControl" component={TakeBackControlScreen} />
            <Stack.Screen name="HabitGrid" component={HabitGridScreen} />
            <Stack.Screen 
              name="OnboardingQuizResult" 
              component={OnboardingQuizResultScreen}
              options={{
              }}
            />
            <Stack.Screen name="FreeTrialInvite" component={FreeTrialInviteScreen} />
            <Stack.Screen 
              name="QuizReferral" 
              component={QuizReferralScreen}
              options={{
              }}
            />
            <Stack.Screen name="Calculating" component={CalculatingScreen} />
            <Stack.Screen name="AnalysisComplete" component={AnalysisCompleteScreen} />
            <Stack.Screen name="OneTimeOffer" component={OneTimeOfferScreen} />
            <Stack.Screen name="NotificationPermission" component={NotificationPermissionScreen} />
            <Stack.Screen name="TrialOffer" component={TrialOfferScreen} />
            <Stack.Screen 
              name="SevenDayTrial" 
              component={SevenDayTrialScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen 
              name="TwentyFourHourTrial" 
              component={TwentyFourHourTrialScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="Trophy" component={TrophyScreen} />
            <Stack.Screen name="Progress" component={ProgressScreen} />
            <Stack.Screen name="Community" component={CommunityScreen} />
            <Stack.Screen name="PanicButton" component={PanicButtonScreen} />
            <Stack.Screen name="TodoList" component={TodoListScreen} />
            <Stack.Screen
              name="TaskTimer"
              component={TaskTimerScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="ScreenTimeDashboard"
              component={ScreenTimeDashboardScreen}
            />
            <Stack.Screen name="AIChat" component={AIChatScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="Referrals" component={ReferralsScreen} />
            <Stack.Screen name="Info" component={InfoScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="BlockerHub" component={BlockerHubScreen} />
            <Stack.Screen name="FocusJournal" component={FocusJournalScreen} />
            <Stack.Screen name="WeeklyFocusPlanner" component={WeeklyFocusPlannerScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Journal" component={JournalScreen} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} />
            <Stack.Screen name="ChallengeCreate" component={ChallengeCreateScreen} />
            <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
            <Stack.Screen name="ChallengeProgress" component={ChallengeProgressScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="MySky" component={MySkyScreen} />
            <Stack.Screen name="Meditation" component={MeditationScreen} />
            <Stack.Screen name="Reset" component={ResetScreen} />
            <Stack.Screen name="BreathSession" component={BreathSessionScreen} />
            <Stack.Screen name="ManifestProgress" component={ManifestProgressScreen} />
            <Stack.Screen name="ManifestSession" component={ManifestSessionScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="DirectMessageThread" component={DirectMessageThreadScreen} />
            <Stack.Screen name="UserContentList" component={UserContentListScreen} />
            <Stack.Screen name="BuildProjectThread" component={BuildProjectThreadScreen} />
            <Stack.Screen name="BuildUpdateThread" component={BuildUpdateThreadScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="Resources" component={ResourcesScreen} />
            <Stack.Screen name="Goals" component={GoalsScreen} />
            <Stack.Screen name="Disclosures" component={DisclosuresScreen} />
            <Stack.Screen name="BlockingPermissions" component={BlockingPermissionsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
