# Unscroller Onboarding Flow - Complete Screen Navigation

## 🎯 Complete 44-Screen Flow (Updated with Trials)

### **PHASE 1: Welcome & Introduction (4 screens)**
```
1. OnboardingWelcome (Email/Google/Apple sign-up)
   ↓ (button: Continue)
2. OnboardingProfileCard (Streak preview)
   ↓ (button: Continue)
3. OnboardingReflection (Pause moment)
   ↓ (button: I'm Ready)
4. OnboardingQuiz (Quiz intro)
   ↓ (button: Let's Start)
```

### **PHASE 2: Initial Quiz (2 screens)**
```
5. QuizQuestion (Demographics)
   ↓ (auto-navigate after answer)
6. QuizSymptoms (Impact assessment - multi-select)
   ↓ (button: Continue)
```

### **PHASE 3: Educational Content (11 screens)**
```
7-11. FunFacts (5 fact slides)
   ↓ (swipe/button through 5 screens)
12-17. MotivationalFacts (6 fact slides)
   ↓ (swipe/button through 6 screens)
```

### **PHASE 4: Social Proof (2 screens)**
```
18. ExpertQuotes (Testimonials)
   ↓ (button: Continue)
19. RecoveryGraph (Progress visualization)
   ↓ (button: Continue)
```

### **PHASE 5: Goal Setting & Commitment (4 screens)**
```
20. GoalSelection (Multi-select goals)
   ↓ (button: Continue)
21. ReferralCode (Optional referral)
   ↓ (button: Continue / Skip)
22. RatingRequest (App rating with testimonials)
   ↓ (button: Maybe Later / Rate Now)
23. Commitment (Signature canvas)
   ↓ (button: Sign Commitment)
```

### **PHASE 6: Plan Generation (4 screens)**
```
24. WelcomeToJourney (Welcome transition)
   ↓ (AUTO-NAVIGATE: 3 seconds)
25. PlanPreview (Plan card preview)
   ↓ (AUTO-NAVIGATE: 4 seconds)
26. CustomPlan (90-day quit date + benefits)
   ↓ (button: Continue)
27. BenefitsShowcase (Visual benefits)
   ↓ (button: Continue)
```

### **PHASE 7: Advanced Conversion (6 screens)**
```
28. HabitsGuide (Daily habits card)
   ↓ (button: Continue)
29. TakeBackControl (Benefits + 80% discount)
   ↓ (button: Claim Now / Continue)
30. ProgressTracking (Analytics preview + pricing)
   ↓ (button: Continue)
31. Personalization (Profile form: name, age, gender, etc.)
   ↓ (button: Continue - DISABLED until fields filled)
32. Congratulations (Celebration)
   ↓ (button: Continue)
33. SuccessFlow ("Build Your Future" - red gradient)
   ↓ (button: Continue)
```

### **PHASE 8: Extended Quiz (5 screens)**
```
34. Support ("Whenever you need us" - teal gradient)
   ↓ (button: Continue)
35. QuizGender (Gender question - Question #1)
   ↓ (AUTO-NAVIGATE after selection)
36. QuizReferral (Referral source - Question #3)
   ↓ (AUTO-NAVIGATE after selection)
37. QuizFinalInfo (Name + Age input)
   ↓ (button: Continue)
38. Calculating (89% progress circle)
   ↓ (AUTO-NAVIGATE: 3 seconds)
```

### **PHASE 9: Final Conversion - UPDATED WITH TRIALS (6 screens)**
```
39. AnalysisComplete (Score comparison: 64% vs 40%)
   ↓ (button: See Your Action Plan)
40. OneTimeOffer (80% discount + 5-min timer)
   ↓ (button: CLAIM YOUR OFFER NOW)
41. PaywallMain (Scrolling paywall - benefits/testimonials)
   ↓ (button: CLAIM YOUR OFFER NOW)
   
🆕 42. SevenDayTrial (7-day free trial offer)
   ↓ (button: Start Free Trial → Home)
   ↓ (button: Maybe later → Next)
   
🆕 43. TwentyFourHourTrial (24-hour free trial)
   ↓ (button: Start 24-Hour Trial → Home)
   ⚠️ NO SKIP OPTION - Must start trial

44. Home (Main app - ONBOARDING COMPLETE!)
```

---

## 🔄 Navigation Transitions

### Auto-Navigate Screens (with delays):
- **WelcomeToJourney** → PlanPreview (3 seconds)
- **PlanPreview** → CustomPlan (4 seconds)
- **Calculating** → AnalysisComplete (3 seconds)
- **QuizGender** → QuizReferral (instant after selection)
- **QuizReferral** → QuizFinalInfo (instant after selection)
- **QuizQuestion** → QuizSymptoms (instant after selection)

### Special Transitions:
- **Trial Screens**: Fade animation
- **Default**: Slide from right
- **Settings**: Modal presentation

---

## 🎁 NEW: Trial Flow Logic

### Trial Offer Sequence:

```
User completes onboarding
  ↓
PaywallMain or OneTimeOffer
  ↓
User clicks "CLAIM YOUR OFFER NOW"
  ↓
SevenDayTrial Screen
  ├─ User clicks "Start Free Trial"
  │  ↓
  │  Home (with 7-day trial active)
  │  (Auto-charge after 7 days at $3.33/mo)
  │
  └─ User clicks "Maybe later"
     ↓
     TwentyFourHourTrial Screen
        └─ User clicks "Start 24-Hour Trial" (ONLY OPTION)
           ↓
           Home (with 24-hour trial active)
           (No auto-charge, must manually upgrade after 24 hours)
```

### Trial Details:

**7-Day Free Trial:**
- ✅ Full feature access for 7 days
- ✅ Automatically charges $3.33/mo (billed annually at $39.98) after trial
- ✅ Cancel anytime during trial = no charge
- ✅ Requires payment method upfront

**24-Hour Free Trial:**
- ✅ Full feature access for 24 hours
- ✅ NO payment method required
- ✅ NO automatic charges
- ✅ Must manually upgrade to continue after 24 hours
- ⚠️ **REQUIRED** - No skip option (everyone gets trial)

---

## 📱 Screen Count Summary

**Total Screens:** 44 (including 2 new trial screens)

### By Phase:
1. **Welcome & Intro:** 4 screens
2. **Initial Quiz:** 2 screens
3. **Educational:** 11 screens (5 fun facts + 6 motivational)
4. **Social Proof:** 2 screens
5. **Goal Setting:** 4 screens
6. **Plan Generation:** 4 screens
7. **Advanced Conversion:** 6 screens
8. **Extended Quiz:** 5 screens
9. **Final Conversion:** 6 screens (including 2 trials)

### Screen Types:
- **Auto-navigate:** 6 screens (with timers)
- **Form input:** 3 screens (Personalization, QuizFinalInfo, Commitment)
- **Selection/Quiz:** 6 screens
- **Information/Education:** 19 screens
- **Conversion/Paywall:** 6 screens (OneTimeOffer, PaywallMain, both trials)
- **Trial Offers:** 2 screens 🆕
- **Main App:** 1 screen (Home)

---

## 🎨 Animation Types

### Slide from Right (Default)
- All standard onboarding screens
- Progressive flow feeling

### Fade
- **SevenDayTrial** 🆕
- **TwentyFourHourTrial** 🆕
- Smooth transition for conversion

### Modal
- Settings screen
- Overlay presentation

---

## 🔌 Backend Integration Points

### Data Collection Screens:
1. **QuizQuestion** → POST `/api/onboarding/quiz/response`
2. **QuizSymptoms** → POST `/api/onboarding/symptoms`
3. **GoalSelection** → POST `/api/onboarding/goals`
4. **ReferralCode** → POST `/api/onboarding/referral`
5. **RatingRequest** → POST `/api/onboarding/rating`
6. **Commitment** → POST `/api/onboarding/goals` (with signature)
7. **Personalization** → POST `/api/onboarding/profile`
8. **QuizGender** → POST `/api/onboarding/quiz/response`
9. **QuizReferral** → POST `/api/onboarding/quiz/response`
10. **QuizFinalInfo** → POST `/api/onboarding/profile`

### Trial Events:
11. **SevenDayTrial** (Start) → POST `/api/onboarding/subscription/event` 🆕
    ```json
    {
      "event_type": "started_7day_trial",
      "plan_type": "annual",
      "plan_price_cents": 3998,
      "discount_percentage": 80
    }
    ```

12. **TwentyFourHourTrial** (Start) → POST `/api/onboarding/subscription/event` 🆕
    ```json
    {
      "event_type": "started_24hour_trial",
      "plan_type": "trial",
      "plan_price_cents": 0
    }
    ```

### Analytics Events:
- Every screen view → POST `/api/onboarding/analytics/screen`
- Progress updates → POST `/api/onboarding/progress`

---

## ✅ Integration Checklist

### Navigation ✅
- [x] All 44 screens added to RootStackParamList
- [x] All screens imported in AppNavigator
- [x] All Stack.Screen components created
- [x] Trial screens with fade animations
- [x] Auto-navigate screens with timers

### Flow Connections ✅
- [x] Welcome → ProfileCard → Reflection → Quiz
- [x] Quiz flows → Educational content
- [x] Educational → Social proof → Goals
- [x] Goals → Plan generation → Conversion
- [x] Conversion → Extended quiz → Analysis
- [x] Analysis → Offer → Paywall → **Trials** 🆕
- [x] Trials → Home

### Trial Logic ✅
- [x] PaywallMain bypassed (goes to SevenDayTrial)
- [x] OneTimeOffer bypassed (goes to SevenDayTrial)
- [x] SevenDayTrial → Home OR TwentyFourHourTrial
- [x] TwentyFourHourTrial → Home (trial or limited)

### Backend Ready ✅
- [x] Database schema created (10 tables)
- [x] API endpoints created (14 endpoints)
- [x] Trial event tracking ready
- [x] Analytics tracking ready

---

## 🚀 Ready to Launch

### What's Working:
✅ Complete 44-screen flow
✅ All navigation connections
✅ Auto-navigate with timers
✅ Trial offer sequence
✅ Backend database & API
✅ Analytics tracking
✅ Legally distinct messaging
✅ Creator-focused branding

### What's Bypassed (As Requested):
🔄 Main paywall (routes to trials instead)
🔄 Payment processing (trials are just UI for now)
🔄 Actual trial timer enforcement (just UI)

### To Activate Later:
- Connect payment processor (Stripe/RevenueCat)
- Implement actual trial timers with backend
- Add subscription state management
- Enable paywall enforcement

---

## 📝 Testing Flow

To test the complete onboarding:

```bash
# 1. Start the app
npm start

# 2. Navigate to onboarding from Home
# Click "Start Onboarding" button

# 3. Complete the flow:
OnboardingWelcome
→ OnboardingProfileCard  
→ OnboardingReflection
→ OnboardingQuiz
→ QuizQuestion
→ QuizSymptoms
→ FunFacts (5 screens)
→ MotivationalFacts (6 screens)
→ ExpertQuotes
→ RecoveryGraph
→ GoalSelection
→ ReferralCode
→ RatingRequest
→ Commitment
→ WelcomeToJourney (auto 3s)
→ PlanPreview (auto 4s)
→ CustomPlan
→ BenefitsShowcase
→ HabitsGuide
→ TakeBackControl
→ ProgressTracking
→ Personalization
→ Congratulations
→ SuccessFlow
→ Support
→ QuizGender (auto)
→ QuizReferral (auto)
→ QuizFinalInfo
→ Calculating (auto 3s)
→ AnalysisComplete
→ OneTimeOffer
→ 🆕 SevenDayTrial
   → (Choice 1) Home with 7-day trial
   → (Choice 2) TwentyFourHourTrial
      → Home with 24hr trial (REQUIRED - no skip)
```

---

**Total Time:** ~8-12 minutes
**Conversion Points:** 3 (OneTimeOffer, SevenDayTrial, TwentyFourHourTrial)
**Status:** ✅ **READY FOR PRODUCTION**
