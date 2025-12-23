#!/bin/bash

# Screen Improvements Automation Script
# This script applies consistent UI/UX improvements across all screens

SCREENS_DIR="./src/screens"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting screen improvements automation...${NC}\n"

# List of screens to process (add more as needed)
SCREENS=(
  "ChallengesScreen.tsx"
  "GoalsScreen.tsx"
  "CommunityScreen.tsx"
  "JournalScreen.tsx"
  "CalendarScreen.tsx"
  "MeditationScreen.tsx"
  "CheckInScreen.tsx"
  "LeaderboardScreen.tsx"
  "NotificationsScreen.tsx"
  "FriendsScreen.tsx"
  "MessagesScreen.tsx"
  "TrophyScreen.tsx"
  "HabitsGuideScreen.tsx"
  "InfoScreen.tsx"
  "RatingRequestScreen.tsx"
  "ReferralsScreen.tsx"
  "StreakHistoryScreen.tsx"
  "MySkyScreen.tsx"
)

# Function to check if screen needs updating
needs_update() {
  local file=$1
  if grep -q "SafeAreaView" "$file"; then
    return 1 # Already updated
  fi
  return 0 # Needs update
}

# Function to backup file
backup_file() {
  local file=$1
  cp "$file" "$file.backup"
  echo -e "${GREEN}✓${NC} Backed up: $file"
}

# Function to add imports
add_imports() {
  local file=$1
  
  # Check if already has SafeAreaView
  if grep -q "SafeAreaView" "$file"; then
    echo -e "${BLUE}⊘${NC} Skipping $file (already has SafeAreaView)"
    return 1
  fi
  
  # Add useWindowDimensions to react-native imports if not present
  if ! grep -q "useWindowDimensions" "$file"; then
    sed -i '' "s/import { \(.*\) } from 'react-native';/import { \1, useWindowDimensions } from 'react-native';/" "$file"
  fi
  
  # Add SafeAreaView import after react-native import
  if ! grep -q "react-native-safe-area-context" "$file"; then
    sed -i '' "/from 'react-native';/a\\
import { SafeAreaView } from 'react-native-safe-area-context';
" "$file"
  fi
  
  # Add design token imports before type Props
  if ! grep -q "@/core/theme/colors" "$file"; then
    sed -i '' "/type Props/i\\
import { COLORS } from '@/core/theme/colors';\\
import { SPACING } from '@/core/theme/spacing';\\
import { TYPOGRAPHY } from '@/core/theme/typography';\\
\\
" "$file"
  fi
  
  echo -e "${GREEN}✓${NC} Added imports to: $(basename "$file")"
  return 0
}

# Function to add responsive hook
add_responsive_hook() {
  local file=$1
  
  # Add after component declaration
  sed -i '' "/export default function.*Props.*{/a\\
  const { height } = useWindowDimensions();\\
  const isCompact = height < 720;\\
" "$file"
  
  echo -e "${GREEN}✓${NC} Added responsive hook to: $(basename "$file")"
}

# Function to wrap in SafeAreaView
wrap_safe_area() {
  local file=$1
  
  # Replace opening container View with SafeAreaView
  sed -i '' "s/<View style={styles\.container}>/<SafeAreaView style={[styles.safeArea, isCompact \&\& styles.safeAreaCompact]} edges={['top', 'bottom']}>/" "$file"
  
  # Find and replace the closing View tag (before export or end of component)
  sed -i '' "/export default function/,/^}/ s/<\/View>/<\/SafeAreaView>/" "$file"
  
  echo -e "${GREEN}✓${NC} Wrapped in SafeAreaView: $(basename "$file")"
}

# Function to update styles
update_styles() {
  local file=$1
  
  # Add safeArea styles after StyleSheet.create
  sed -i '' "/const styles = StyleSheet\.create({/a\\
  safeArea: {\\
    flex: 1,\\
    backgroundColor: COLORS.BACKGROUND_MAIN,\\
  },\\
  safeAreaCompact: {\\
    // Compact layout adjustments\\
  },
" "$file"
  
  # Remove old container style if it exists
  sed -i '' "/container: {/,/},/d" "$file"
  
  echo -e "${GREEN}✓${NC} Updated styles in: $(basename "$file")"
}

# Main processing loop
processed=0
skipped=0
errors=0

for screen in "${SCREENS[@]}"; do
  file="$SCREENS_DIR/$screen"
  
  if [ ! -f "$file" ]; then
    echo -e "${RED}✗${NC} File not found: $screen"
    ((errors++))
    continue
  fi
  
  if needs_update "$file"; then
    echo -e "\n${BLUE}Processing:${NC} $screen"
    
    # Backup original
    backup_file "$file"
    
    # Apply transformations
    if add_imports "$file"; then
      add_responsive_hook "$file"
      wrap_safe_area "$file"
      update_styles "$file"
      ((processed++))
    else
      ((skipped++))
    fi
  else
    echo -e "${BLUE}⊘${NC} Skipped $screen (already updated)"
    ((skipped++))
  fi
done

echo -e "\n${BLUE}═══════════════════════════════════${NC}"
echo -e "${GREEN}✓ Processed:${NC} $processed screens"
echo -e "${BLUE}⊘ Skipped:${NC} $skipped screens"
echo -e "${RED}✗ Errors:${NC} $errors screens"
echo -e "${BLUE}═══════════════════════════════════${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo "1. Review changes in each file"
echo "2. Test screens on device/simulator"
echo "3. Adjust spacing/typography as needed"
echo "4. Remove .backup files once satisfied"
echo ""
echo -e "${GREEN}Done!${NC}"
