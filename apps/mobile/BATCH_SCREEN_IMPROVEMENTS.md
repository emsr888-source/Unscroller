# Batch Screen Improvements - Implementation Guide

## Quick Reference: Apply to All Screens

### Step 1: Update Imports

**Find:**
```typescript
import { View, Text, StyleSheet } from 'react-native';
```

**Replace with:**
```typescript
import { View, Text, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/core/theme/colors';
import { SPACING } from '@/core/theme/spacing';
import { TYPOGRAPHY } from '@/core/theme/typography';
```

### Step 2: Add Adaptive Layout Hook

**Add after component declaration:**
```typescript
export default function YourScreen({ navigation }: Props) {
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  
  // ... rest of component
```

### Step 3: Wrap Content in SafeAreaView

**Find:**
```typescript
return (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" />
    {/* content */}
  </View>
);
```

**Replace with:**
```typescript
return (
  <SafeAreaView style={[styles.safeArea, isCompact && styles.safeAreaCompact]} edges={['top', 'bottom']}>
    <StatusBar barStyle="light-content" />
    {/* content */}
  </SafeAreaView>
);
```

### Step 4: Update Styles

**Add these base styles:**
```typescript
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: SPACING.space_5, // 24px
    paddingTop: SPACING.space_5,
    paddingBottom: SPACING.space_6, // 32px
    backgroundColor: COLORS.BACKGROUND_MAIN,
  },
  safeAreaCompact: {
    paddingTop: SPACING.space_4, // 16px
    paddingBottom: SPACING.space_5, // 24px
  },
  // ... rest of styles
});
```

### Step 5: Replace Hardcoded Values

**Typography:**
- Headers: Use `...TYPOGRAPHY.H1`, `...TYPOGRAPHY.H2`, `...TYPOGRAPHY.H3`
- Body text: `...TYPOGRAPHY.Body`
- Small text: `...TYPOGRAPHY.Subtext`

**Colors:**
- `#0D0D1A` → `COLORS.BACKGROUND_MAIN`
- `#1A1A2B` → `COLORS.BACKGROUND_ELEVATED`
- `#FFFFFF` → `COLORS.TEXT_PRIMARY`
- `#A0A0B5` → `COLORS.TEXT_SECONDARY`
- `#A060FF` → `COLORS.ACCENT_GRADIENT_START`

**Spacing:**
- `8` → `SPACING.space_2`
- `12` → `SPACING.space_3`
- `16` → `SPACING.space_4`
- `24` → `SPACING.space_5`
- `32` → `SPACING.space_6`
- `48` → `SPACING.space_7`

## Screen-Specific Patterns

### For List/ScrollView Screens

```typescript
<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
  <StatusBar barStyle="light-content" />
  <ScrollView 
    contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollContentCompact]}
    showsVerticalScrollIndicator={false}
  >
    {/* content */}
  </ScrollView>
</SafeAreaView>
```

```typescript
scrollContent: {
  flexGrow: 1,
  paddingHorizontal: SPACING.space_5,
  paddingBottom: SPACING.space_7,
  gap: SPACING.space_5,
},
scrollContentCompact: {
  paddingBottom: SPACING.space_6,
  gap: SPACING.space_4,
},
```

### For Modal Screens

```typescript
<Modal visible={visible} animationType="slide" transparent>
  <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
    {/* modal content */}
  </SafeAreaView>
</Modal>
```

### For Screens with Bottom Navigation

```typescript
<SafeAreaView style={styles.safeArea} edges={['top']}> {/* Only top edge */}
  {/* content */}
  <View style={styles.bottomNav}>
    {/* navigation items */}
  </View>
</SafeAreaView>
```

## Premium Component Patterns

### Card Component
```typescript
card: {
  backgroundColor: 'rgba(20, 22, 45, 0.85)',
  borderRadius: 20,
  padding: SPACING.space_5,
  borderWidth: 1,
  borderColor: COLORS.GLASS_BORDER,
  gap: SPACING.space_3,
},
```

### Primary Button
```typescript
primaryButton: {
  backgroundColor: COLORS.TEXT_PRIMARY,
  paddingVertical: 20,
  borderRadius: 18,
  alignItems: 'center',
  shadowColor: COLORS.TEXT_PRIMARY,
  shadowOpacity: 0.3,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
},
primaryButtonText: {
  ...TYPOGRAPHY.Button,
  color: COLORS.BACKGROUND_MAIN,
},
```

### Secondary Button
```typescript
secondaryButton: {
  paddingVertical: 18,
  borderRadius: 18,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: COLORS.GLASS_BORDER,
  backgroundColor: COLORS.GLASS_TINT,
},
secondaryButtonText: {
  ...TYPOGRAPHY.Button,
  color: COLORS.TEXT_PRIMARY,
},
```

### Section Header
```typescript
sectionHeader: {
  ...TYPOGRAPHY.H3,
  color: COLORS.TEXT_PRIMARY,
  marginBottom: SPACING.space_3,
},
```

### Input Field
```typescript
input: {
  backgroundColor: COLORS.BACKGROUND_ELEVATED,
  color: COLORS.TEXT_PRIMARY,
  paddingVertical: SPACING.space_4,
  paddingHorizontal: SPACING.space_4,
  borderRadius: 14,
  ...TYPOGRAPHY.Body,
  borderWidth: 1,
  borderColor: COLORS.GLASS_BORDER,
},
```

## Screens Priority List

### Batch 1: Core User Screens (PRIORITY 1)
- [x] WelcomeScreen
- [x] OnboardingWelcomeScreen  
- [x] AuthScreen
- [x] HomeScreen (already good)
- [ ] ProfileScreen
- [ ] ProgressScreen
- [ ] SettingsScreen (already good)

### Batch 2: Feature Screens (PRIORITY 2)
- [ ] ChallengesScreen
- [ ] GoalsScreen
- [ ] CommunityScreen
- [ ] JournalScreen
- [ ] CalendarScreen
- [ ] MeditationScreen
- [ ] CheckInScreen

### Batch 3: Secondary Screens (PRIORITY 3)
- [ ] LeaderboardScreen
- [ ] NotificationsScreen
- [ ] FriendsScreen
- [ ] MessagesScreen
- [ ] TrophyScreen
- [ ] HabitsGuideScreen

### Batch 4: Remaining Screens (Apply as needed)
- All other 40+ screens following the same patterns

## Automated Find/Replace Guide

### VS Code Regex Patterns

**1. Add SafeAreaView import:**
```regex
Find: (import.*from 'react-native';)
Replace: $1\nimport { SafeAreaView } from 'react-native-safe-area-context';
```

**2. Replace container with safeArea:**
```regex
Find: <View style={styles\.container}>
Replace: <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
```

**3. Replace closing tag:**
```regex
Find: </View>(\s*);(\s*)}(\s*)export
Replace: </SafeAreaView>$1;$2}$3export
```

**4. Update spacing values:**
```regex
Find: padding(?:Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*24
Replace: padding$1: SPACING.space_5
```

## Testing Checklist

After applying improvements to each screen:
- [ ] Screen renders without errors
- [ ] SafeAreaView properly handles notch/safe areas
- [ ] Content is visible on small devices (iPhone SE)
- [ ] Content is properly spaced on large devices (iPhone Pro Max)
- [ ] Typography is readable
- [ ] Buttons are properly sized (min 44x44 touch target)
- [ ] Scrolling works smoothly
- [ ] Colors match design system

## Common Pitfalls

1. **Don't forget to close SafeAreaView** - Match opening/closing tags
2. **Import design tokens** - Add imports at the top
3. **Use edges prop correctly** - `edges={['top', 'bottom']}` for most screens
4. **Keep existing starfield/background** - Many screens have custom backgrounds
5. **Preserve existing logic** - Only update layout/styling, not functionality

## Quick Wins

Screens that only need minimal changes (5 minutes each):
- Any screen with simple list layouts
- Settings-type screens
- Info/static content screens

Screens that need more attention (15-20 minutes each):
- Complex dashboards
- Screens with charts/graphs
- Screens with custom animations
- Multi-step forms

---

**Last Updated:** Nov 9, 2025
**Status:** Guide complete, apply to remaining 40+ screens systematically
