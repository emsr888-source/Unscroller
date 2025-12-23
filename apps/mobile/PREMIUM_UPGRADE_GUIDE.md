# Premium Visual Upgrade — Implementation Guide

## ✅ Completed Screens (14/61)

### Fully Upgraded
1. **HomeScreen** — Core app screen with full premium styling
2. **SevenDayTrialScreen** — Paywall with staggered animations
3. **OnboardingWelcomeScreen** — Sign-in flow with enhanced shadows
4. **SettingsScreen** — All buttons and sections upgraded
5. **ProgressScreen** — Interactive elements with AnimatedButton
6. **PanicButtonScreen** — Staggered techniques, heavy haptics
7. **AIChatScreen** — Premium message bubbles and buttons
8. **CommunityScreen** — Social features with haptic feedback
9. **TodoListScreen** — Build list with premium cards
10. **JournalScreen** — Mood selector and entry cards
11. **CalendarScreen** — Month view with premium styling
12. **ProgressScreen** — Stats and timeframe selector
13. **AppNavigator** — Page transitions configured
14. **Design System** — `/constants/design.ts` created

---

## 🔄 Upgrade Pattern (Apply to Remaining 47 Screens)

### Step 1: Update Imports

```tsx
// BEFORE
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// AFTER
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedButton } from '@/components/AnimatedButton';
```

### Step 2: Replace TouchableOpacity

```tsx
// BEFORE
<TouchableOpacity onPress={handlePress}>
  <Text>Button</Text>
</TouchableOpacity>

// AFTER
<AnimatedButton onPress={handlePress} hapticType="medium">
  <Text>Button</Text>
</AnimatedButton>
```

**Haptic Guidelines:**
- `hapticType="light"` — Navigation, secondary actions
- `hapticType="medium"` — Primary CTAs, important actions
- `hapticType="heavy"` — Destructive actions, warnings
- `enableHaptic={false}` — Disable for minor taps (likes, tabs)

### Step 3: Add Premium Shadows

```tsx
// Cards and elevated elements
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.15,
shadowRadius: 12,
elevation: 4,

// Buttons with brand color
shadowColor: '#8a2be2',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.3,
shadowRadius: 8,
elevation: 4,
```

### Step 4: Refine Borders

```tsx
// BEFORE
borderRadius: 12,
borderWidth: 2,

// AFTER
borderRadius: 16,  // More premium
borderWidth: 1,    // Hairline borders
borderColor: 'rgba(255, 255, 255, 0.1)',
```

### Step 5: Add Staggered Animations (Lists Only)

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimationStagger } from '@/constants/design';

{items.map((item, index) => (
  <Animated.View 
    key={item.id}
    entering={FadeInDown.delay(index * AnimationStagger.list)}
  >
    <AnimatedButton style={styles.card}>
      {/* content */}
    </AnimatedButton>
  </Animated.View>
))}
```

---

## 📋 Remaining Screens Checklist (47 screens)

### High Priority (User-Facing)
- [ ] **ProviderWebViewScreen** — Main content viewing
- [ ] **TrophyScreen** — Reward celebrations
- [ ] **ProfileScreen** — User settings
- [ ] **FriendsScreen** — Social features
- [ ] **ReferralsScreen** — Sharing
- [ ] **TwentyFourHourTrialScreen** — Alternative paywall
- [ ] **NotificationsScreen** — Alerts
- [ ] **MessagesScreen** — Communication
- [ ] **ChallengesScreen** — Gamification
- [ ] **MeditationScreen** — Wellness

### Medium Priority (Onboarding Flow)
- [ ] **OnboardingProfileCardScreen**
- [ ] **OnboardingQuizScreen**
- [ ] **QuizQuestionScreen**
- [ ] **QuizSymptomsScreen**
- [ ] **QuizGenderScreen**
- [ ] **QuizReferralScreen**
- [ ] **QuizFinalInfoScreen**
- [ ] **FunFactsScreen**
- [ ] **MotivationalFactsScreen**
- [ ] **ExpertQuotesScreen**
- [ ] **RecoveryGraphScreen**
- [ ] **GoalSelectionScreen**

### Lower Priority (Secondary Flows)
- [ ] **WelcomeScreen**
- [ ] **AuthScreen**
- [ ] **PaywallScreen**
- [ ] **OnboardingReflectionScreen**
- [ ] **ReferralCodeScreen**
- [ ] **RatingRequestScreen**
- [ ] **CommitmentScreen**
- [ ] **WelcomeToJourneyScreen**
- [ ] **PlanPreviewScreen**
- [ ] **CustomPlanScreen**
- [ ] **BenefitsShowcaseScreen**
- [ ] **HabitsGuideScreen**
- [ ] **TakeBackControlScreen**
- [ ] **ConversionShowcaseScreen**
- [ ] **PersonalizationScreen**
- [ ] **CongratulationsScreen**
- [ ] **SuccessFlowScreen**
- [ ] **SupportScreen**
- [ ] **CalculatingScreen**
- [ ] **AnalysisCompleteScreen**
- [ ] **OneTimeOfferScreen**
- [ ] **CheckInScreen**
- [ ] **InfoScreen**
- [ ] **GoalsScreen**
- [ ] **ResourcesScreen**

---

## 🎨 Design System Reference

### Animation Constants (`/constants/design.ts`)

```tsx
AnimationDuration = {
  micro: 120,      // Quick interactions
  standard: 180,   // Default animations
  overlay: 220,    // Modals/sheets
  sheen: 8000      // Gradient effects
}

AnimationEasing = {
  premium: [0.2, 0.8, 0.2, 1],  // Bezier curve
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 0.5
  }
}

Transform = {
  press: 0.98,      // Button press scale
  hover: 1.03,      // Hover scale
  overshoot: 1.03   // Spring overshoot
}

AnimationStagger = {
  list: 30,  // ms delay between list items
  card: 40   // ms delay between cards
}
```

### Typography

```tsx
Typography.size = {
  h1: 28,
  h2: 22,
  body: 16,
  small: 13
}

Typography.lineHeight = {
  h1: 1.2,
  h2: 1.3,
  body: 1.4,
  small: 1.4
}
```

### Colors

```tsx
Colors.primary.gradient = ['#3b7dff', '#8b5cf6']
Colors.surface.card = 'rgba(255, 255, 255, 0.05)'
Colors.border.card = 'rgba(255, 255, 255, 0.1)'
```

### Shadow System

```tsx
// Ambient shadow (soft)
Shadow.ambient = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12
}

// Key shadow (directional)
Shadow.key = {
  shadowColor: '#brandColor',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 8
}

// Combined (two-layer)
Shadow.combined = {
  ...Shadow.ambient,
  elevation: 4  // Android
}
```

---

## 🚀 Batch Upgrade Script

For rapid upgrades, use this search-and-replace pattern:

```bash
# Find all screens with TouchableOpacity
find apps/mobile/src/screens -name "*.tsx" -exec grep -l "TouchableOpacity" {} \;

# Common replacements (use with caution, verify each):
# 1. Import: Add AnimatedButton import
# 2. Replace: TouchableOpacity → AnimatedButton  
# 3. Close tags: </TouchableOpacity> → </AnimatedButton>
# 4. Remove: TouchableOpacity from imports
```

---

## ✅ Verification Checklist

After upgrading each screen:

1. **Visual**: Borders are 1px hairlines, radius 16px for buttons/cards
2. **Motion**: Press scales to 0.98 with spring animation
3. **Shadows**: Two-layer shadows on elevated elements
4. **Haptics**: Appropriate feedback on primary actions
5. **Accessibility**: 44pt hit targets maintained
6. **Performance**: Animations run at 60fps
7. **Reduced Motion**: AnimatedButton respects system setting

---

## 📊 Progress Tracking

**Completed**: 14 screens  
**Remaining**: 47 screens  
**Total**: 61 screens  
**Completion**: 23%

**Estimated Time**: ~2-3 minutes per screen × 47 = ~2 hours

---

## 🎯 Final Result

When complete, Unscroller will have:

✅ **Consistent motion language** across all 61 screens  
✅ **Premium micro-interactions** on every touchpoint  
✅ **Haptic feedback** calibrated by action importance  
✅ **60fps animations** with reduced motion support  
✅ **Two-layer shadow system** for depth  
✅ **WCAG AA accessibility** maintained  
✅ **Modern, expensive, calm** visual feel

**Brand Promise**: "From functional to premium without rearranging content"

---

**Last Updated**: Nov 7, 2024  
**Status**: Core screens complete, pattern established for remaining screens
