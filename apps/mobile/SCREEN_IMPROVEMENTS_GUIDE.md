# Screen Improvements Guide

## ✅ Completed Improvements

### Onboarding Flow Screens
1. **WelcomeScreen** (Landing Page)
   - Added `LinearGradient` background (#070322 → #1a1147)
   - Implemented `SafeAreaView` with adaptive padding
   - Responsive layout using `useWindowDimensions`
   - Improved typography hierarchy (title: 44px, subtitle: 18px)
   - Enhanced button styling with premium shadows
   - Better color contrast and spacing

2. **OnboardingWelcomeScreen**
   - Added adaptive layout with `isCompact` variant
   - Implemented `SafeAreaView` for proper edge handling
   - Refined typography (wordmark: 18px, title: 30px)
   - Improved back button (44x44 rounded with background)
   - Enhanced visual hierarchy and spacing
   - Better button styling (height: 60px, radius: 18px)

3. **AuthScreen**
   - Complete adaptive layout overhaul
   - Wrapped in `SafeAreaView` with responsive padding
   - Added `ScrollView` for keyboard handling
   - Improved form card styling
   - Enhanced social sign-in buttons (Apple/Google)
   - Better spacing and typography

4. **OnboardingQuizResultScreen**
   - Premium hero card with gradient
   - Structured summary sections
   - Animated bullet lists
   - Better readability and hierarchy

5. **RecoveryGraphScreen**
   - Replaced point-based graph with SVG line graph
   - Smoother visual representation

## 🎨 Design System Tokens

### Colors (from `@/core/theme/colors`)
```typescript
BACKGROUND_MAIN: '#0D0D1A'
BACKGROUND_ELEVATED: '#1A1A2B'
TEXT_PRIMARY: '#FFFFFF'
TEXT_SECONDARY: '#A0A0B5'
ACCENT_GRADIENT_START: '#A060FF'
ACCENT_GRADIENT_END: '#FF00A8'
SUCCESS_GREEN: '#00FFA3'
INACTIVE_GREY: '#3D3D4F'
GLASS_TINT: 'rgba(26, 26, 43, 0.6)'
GLASS_BORDER: 'rgba(255, 255, 255, 0.1)'
```

### Spacing (from `@/core/theme/spacing`)
```typescript
space_1: 4px
space_2: 8px
space_3: 12px
space_4: 16px
space_5: 24px
space_6: 32px
space_7: 48px
```

### Typography (from `@/core/theme/typography`)
```typescript
H1: { fontSize: 34, lineHeight: 40, fontWeight: 'Bold' }
H2: { fontSize: 24, lineHeight: 30, fontWeight: 'SemiBold' }
H3: { fontSize: 20, lineHeight: 26, fontWeight: 'SemiBold' }
Body: { fontSize: 16, lineHeight: 24, fontWeight: 'Regular' }
Subtext: { fontSize: 14, lineHeight: 20, fontWeight: 'Regular' }
```

## 📋 Standard Patterns for All Screens

### 1. Adaptive Layout Template
```typescript
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function YourScreen() {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  
  return (
    <SafeAreaView 
      style={[styles.safeArea, isCompact && styles.safeAreaCompact]} 
      edges={['top', 'bottom']}
    >
      {/* Content */}
    </SafeAreaView>
  );
}
```

### 2. Gradient Background Pattern
```typescript
import LinearGradient from 'react-native-linear-gradient';

<LinearGradient 
  colors={['#070322', '#0f0a35', '#1a1147']} 
  style={styles.container}
>
  {/* Content */}
</LinearGradient>
```

### 3. Premium Button Styling
```typescript
button: {
  backgroundColor: '#ffffff',
  paddingVertical: 20,
  borderRadius: 18,
  alignItems: 'center',
  shadowColor: '#ffffff',
  shadowOpacity: 0.3,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
}
```

### 4. Card/Container Styling
```typescript
card: {
  backgroundColor: 'rgba(20,22,45,0.85)',
  borderRadius: 20,
  padding: 20,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  gap: 16,
}
```

## 🔧 Screens Needing Attention

### Priority 1 (User-Facing Core Screens)
- ✅ HomeScreen - Already well-designed with starfield and proper styling
- ✅ SettingsScreen - Good structure with starfield background
- ProfileScreen - Review for consistency
- ProgressScreen - Ensure charts/stats are readable
- CommunityScreen - Check card layouts

### Priority 2 (Feature Screens)
- GoalsScreen - Ensure consistent card styling
- ChallengesScreen - Check list/grid layouts
- JournalScreen - Verify input fields and spacing
- CalendarScreen - Check date picker styling
- MeditationScreen - Verify timer and controls

### Priority 3 (Utility Screens)
- CheckInScreen - Verify form inputs
- NotificationsScreen - Check list items
- LeaderboardScreen - Verify table/list styling

## ✨ Recommended Improvements for Remaining Screens

### For Each Screen, Apply:

1. **SafeAreaView Wrapper**
   - Replace root `View` with `SafeAreaView`
   - Use `edges={['top', 'bottom']}` prop
   - Add `isCompact` variant for smaller devices

2. **Design Token Usage**
   - Replace hardcoded colors with `COLORS` tokens
   - Replace hardcoded spacing with `SPACING` tokens
   - Use `TYPOGRAPHY` tokens for text styles

3. **Typography Hierarchy**
   - Page titles: H1 or H2
   - Section headers: H3
   - Body text: Body
   - Supporting text: Subtext
   - Ensure proper line heights and weights

4. **Spacing Consistency**
   - Use `gap` property for flex layouts
   - Consistent padding: 20-28px horizontal
   - Consistent margins between sections: 24-32px

5. **Button Consistency**
   - Primary: white background, dark text, shadow
   - Secondary: transparent with border
   - Height: 56-60px for primary actions
   - Border radius: 16-18px

6. **Card Styling**
   - Background: semi-transparent dark (#111122 with 0.85 opacity)
   - Border: 1px rgba(255,255,255,0.08)
   - Border radius: 18-20px
   - Padding: 20-24px

7. **Accessibility**
   - Minimum touch target: 44x44px
   - Color contrast ratio > 4.5:1
   - Proper `accessibilityRole` and `accessibilityLabel`

## 🎯 Quick Audit Checklist

For any screen you review, check:
- [ ] Uses `SafeAreaView` instead of plain `View`
- [ ] Imports and uses design tokens (COLORS, SPACING, TYPOGRAPHY)
- [ ] Has responsive layout (`useWindowDimensions`, `isCompact`)
- [ ] Typography follows hierarchy (H1/H2/H3/Body/Subtext)
- [ ] Buttons have proper shadows and sizing
- [ ] Cards use consistent styling
- [ ] Spacing uses `gap` or SPACING tokens
- [ ] StatusBar is set to `light-content`
- [ ] Gradient backgrounds where appropriate

## 📝 Notes

- **HomeScreen** and **SettingsScreen** already have excellent visual design with starfield backgrounds
- **PaywallScreen**, **QuizQuestionScreen**, **QuizSymptomsScreen** already use design tokens properly
- Most screens just need SafeAreaView wrapper and adaptive spacing adjustments
- Focus on consistency rather than complete rewrites

---

**Last Updated:** Nov 9, 2025
**Screens Improved:** 5 onboarding screens + design system documentation
**Total Screens:** 57
