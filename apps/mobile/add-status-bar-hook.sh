#!/bin/bash

# Script to add useStatusBarStyle hook to all onboarding and quiz screens

screens=(
  "OnboardingReflectionScreen"
  "OnboardingPersonaScreen"
  "OnboardingAgeScreen"
  "OnboardingBuildFocusScreen"
  "OnboardingIdentitySummaryScreen"
  "OnboardingQuizScreen"
  "OnboardingNotificationsScreen"
  "OnboardingQuizResultScreen"
  "QuizQuestionScreen"
  "QuizGenderScreen"
  "QuizSymptomsScreen"
  "QuizSupportNeedScreen"
  "QuizFinalInfoScreen"
  "QuizReferralScreen"
  "QuizResultLoadingScreen"
)

for screen in "${screens[@]}"; do
  file="src/screens/${screen}.tsx"
  
  if [ -f "$file" ]; then
    echo "Processing $file"
    
    # Add import if not present
    if ! grep -q "useStatusBarStyle" "$file"; then
      # Find the line with SPACING import and add after it
      if grep -q "from '@/core/theme/spacing';" "$file"; then
        sed -i '' "/from '@\/core\/theme\/spacing';/a\\
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';
" "$file"
      fi
      
      # Add hook call at start of component function
      # Find the export default function line
      sed -i '' "/^export default function ${screen}/,/^  const/ {
        /^  const/i\\
  useStatusBarStyle('dark-content');\\

      }" "$file"
    fi
  fi
done

echo "Done!"
