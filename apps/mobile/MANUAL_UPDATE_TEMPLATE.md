# Manual Screen Update Template

Use this template to manually update any screen to the new design system.

## ✅ Screens Already Updated

- WelcomeScreen  
- OnboardingWelcomeScreen
- AuthScreen
- OnboardingQuizResultScreen
- RecoveryGraphScreen
- ProfileScreen ✅ NEW
- HomeScreen (already well-designed)
- SettingsScreen (already well-designed)

## 🔧 Template for Remaining Screens

### 1. Update Imports (Top of File)

```typescript
// BEFORE
import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

// AFTER
import React from 'react';
import { View, Text, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
```

### 2. Add Responsive Hook (Inside Component)

```typescript
// BEFORE
export default function YourScreen({ navigation }: Props) {
  const [state, setState] = useState(false);
  
  return (
    //...

// AFTER
export default function YourScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const [state, setState] = useState(false);
  
  return (
    //...
```

### 3. Update Return Statement

```typescript
// BEFORE
return (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" />
    {/* Your content */}
  </View>
);

// AFTER
return (
  <SafeAreaView 
    style={[styles.safeArea, isCompact && styles.safeAreaCompact]} 
    edges={['top', 'bottom']}
  >
    <StatusBar barStyle="light-content" />
    {/* Your content */}
  </SafeAreaView>
);
```

### 4. Update Base Styles

```typescript
// BEFORE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0118',
    padding: 24,
  },
  
// AFTER
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  safeAreaCompact: {
    // Additional styles for compact screens if needed
  },
```

### 5. Replace Common Style Patterns

#### Headers
```typescript
// BEFORE
header: {
  fontSize: 24,
  fontWeight: '700',
  color: '#fff',
  marginBottom: 16,
},

// AFTER
header: {
  ...TYPOGRAPHY.H2,
  color: COLORS.TEXT_PRIMARY,
  marginBottom: SPACING.space_4,
},
```

#### Body Text
```typescript
// BEFORE
bodyText: {
  fontSize: 16,
  color: '#c0c0c0',
  lineHeight: 24,
  marginBottom: 12,
},

// AFTER
bodyText: {
  ...TYPOGRAPHY.Body,
  color: COLORS.TEXT_SECONDARY,
  marginBottom: SPACING.space_3,
},
```

#### Buttons
```typescript
// BEFORE
button: {
  backgroundColor: '#fff',
  padding: 18,
  borderRadius: 12,
  alignItems: 'center',
},

// AFTER
button: {
  backgroundColor: COLORS.TEXT_PRIMARY,
  paddingVertical: SPACING.space_5,
  borderRadius: 18,
  alignItems: 'center',
  shadowColor: COLORS.TEXT_PRIMARY,
  shadowOpacity: 0.3,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
},
```

#### Cards
```typescript
// BEFORE
card: {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
},

// AFTER
card: {
  backgroundColor: COLORS.GLASS_TINT,
  borderRadius: 18,
  padding: SPACING.space_5,
  borderWidth: 1,
  borderColor: COLORS.GLASS_BORDER,
  gap: SPACING.space_3,
},
```

#### Spacing & Layout
```typescript
// BEFORE
section: {
  paddingHorizontal: 24,
  marginBottom: 32,
},

// AFTER
section: {
  paddingHorizontal: SPACING.space_5,
  marginBottom: SPACING.space_6,
  gap: SPACING.space_4,
},
```

## 📝 Screens Checklist

Copy this checklist and check off screens as you update them:

### Priority 1: Core Screens
- [ ] ProgressScreen
- [ ] GoalsScreen
- [ ] ChallengesScreen

### Priority 2: Social & Community
- [ ] CommunityScreen
- [ ] FriendsScreen
- [ ] MessagesScreen
- [ ] LeaderboardScreen

### Priority 3: Content & Tools
- [ ] JournalScreen
- [ ] CalendarScreen
- [ ] MeditationScreen
- [ ] CheckInScreen
- [ ] HabitsGuideScreen

### Priority 4: Utility Screens
- [ ] NotificationsScreen
- [ ] TrophyScreen
- [ ] InfoScreen
- [ ] RatingRequestScreen
- [ ] ReferralsScreen
- [ ] StreakHistoryScreen

### Remaining Screens (40+)
- [ ] AIChatScreen
- [ ] AnalysisCompleteScreen
- [ ] BenefitsShowcaseScreen
- [ ] CalculatingScreen
- [ ] CommitmentScreen
- [ ] CongratulationsScreen
- [ ] ConversionShowcaseScreen
- [ ] CustomPlanScreen
- [ ] ExpertQuotesScreen
- [ ] FunFactsScreen
- [ ] GoalSelectionScreen
- [ ] MySkyScreen
- [ ] OnboardingNotificationsScreen
- [ ] OnboardingProfileCardScreen
- [ ] OnboardingQuizScreen
- [ ] OnboardingReflectionScreen
- [ ] OneTimeOfferScreen
- [ ] PanicButtonScreen
- [ ] PersonalizationScreen
- [ ] PlanPreviewScreen
- [ ] ProviderWebViewScreen
- [ ] QuizFinalInfoScreen
- [ ] QuizGenderScreen
- [ ] QuizReferralScreen
- [ ] QuizResultLoadingScreen
- [ ] SevenDayTrialScreen
- [ ] SocialProofScreen
- [ ] SuccessStoriesScreen
- [ ] TestimonialScreen
- [ ] TimerScreen
- [ ] UserStoryScreen
- [ ] ValuePropositionScreen
- [ ] WaitlistScreen
- [ ] WelcomeBackScreen
- ...and more

## 🔍 Verification Steps

After updating each screen:

1. **Import Check**
   ```bash
   # Check if all design tokens are imported
   grep -n "COLORS\|SPACING\|TYPOGRAPHY" YourScreen.tsx
   ```

2. **SafeAreaView Check**
   ```bash
   # Verify SafeAreaView usage
   grep -n "SafeAreaView" YourScreen.tsx
   ```

3. **Visual Test**
   - Run on iPhone SE (small screen)
   - Run on iPhone 15 Pro Max (large screen)
   - Check safe areas around notch
   - Verify spacing looks consistent

4. **Token Usage**
   - No hardcoded colors (except special cases)
   - No hardcoded spacing values
   - Typography uses design tokens

## 💡 Tips

1. **Start Simple**: Update easiest screens first to build momentum
2. **Test Often**: Check each screen after updating
3. **Keep Backups**: Save `.backup` files until satisfied
4. **Batch Similar Screens**: Update all list screens together, etc.
5. **Use Find/Replace**: VS Code's multi-file find/replace is powerful

## 🚀 Quick Commands

```bash
# Make script executable
chmod +x scripts/update-screen-improvements.sh

# Run automated updates
./scripts/update-screen-improvements.sh

# Check which screens need updates
grep -L "SafeAreaView" src/screens/*.tsx

# Count updated screens
grep -l "SafeAreaView" src/screens/*.tsx | wc -l
```

---

**Remember**: Quality over speed. It's better to update 5 screens perfectly than 20 screens poorly.
