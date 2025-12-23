# UI/UX Light Theme Progress Log

Tracking the light-theme + brand refresh rollout across mobile screens. Use this as a handoff checklist for the next pass.

## Palette & Components
- ✅ Updated global colors to off-white surfaces, dark text, blue→mint accents (`src/core/theme/colors.ts`, design constants).
- ✅ StatusBar default to `dark-content` on light background.
- ✅ Shared wrappers: `ScreenWrapper` updated to use brand background image/gradient.
- ✅ Primary/Answer buttons rethemed to light surfaces/gradient accents.
- ✅ Navigation container theme aligned to light palette.

## Screens Converted
- Auth / Welcome / Onboarding reflection & welcome
- Onboarding quiz flow: gender, symptoms, referral, final info, question status bar, result loading
- Quiz result summary card layout
- Calculating
- Paywall
- Commitment (signature)
- Support / Success Flow
- Fun Facts
- Trials/offers: TwentyFourHourTrialScreen, SevenDayTrialScreen
- OneTimeOfferScreen
- CongratulationsScreen
- WelcomeToJourneyScreen
- BenefitsShowcaseScreen
- TakeBackControlScreen
- CustomPlanScreen
- PersonalizationScreen
- PlanPreviewScreen
- ProgressTrackingScreen
- ResourcesScreen
- ProgressScreen
- TrophyScreen
- InfoScreen
- ChallengeProgressScreen
- NotificationsScreen
- MessagesScreen
- PanicButtonScreen
- ChallengesScreen
- AIChatScreen
- MeditationScreen
- CalendarScreen
- JournalScreen
- ProfileScreen
- TodoListScreen
- CommunityScreen
- DisclosuresScreen
- ChallengeDetailScreen
- SettingsScreen
- LeaderboardScreen
- HomeScreen (light pass)
- GoalsScreen
- OnboardingNotificationsScreen
- OnboardingQuizScreen (dev controls)
- AuthScreen (glass back/social CTAs)
- QuizGenderScreen
- QuizReferralScreen
- QuizFinalInfoScreen
- OnboardingWelcomeScreen
- OnboardingProfileCardScreen

## Screens Remaining (to convert)
- ProviderWebViewScreen and PolicyBypassWarningScreen still using AnimatedButton.
- FunFacts/MySky/ReferralCode/HabitsGuide screens need light/glass buttons.
- Re-scan for any other screens with dark gradients or legacy button styles.

## Conversion Recipe
1) Wrap with `ScreenWrapper` + `StatusBar` `dark-content` `backgroundColor={COLORS.BACKGROUND_MAIN}`.
2) Replace dark backgrounds/gradients with light surfaces (`COLORS.BACKGROUND_ELEVATED`) and glass border shadows.
3) Swap bespoke buttons to `PrimaryButton` / `PremiumButton` where appropriate.
4) Adjust chips/cards to use `COLORS.GLASS_BORDER`, light shadows, and blue→mint accents.
5) Verify typography uses `TYPOGRAPHY` tokens and spacing uses `SPACING`.
