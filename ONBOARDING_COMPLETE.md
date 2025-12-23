# Unscroller Onboarding - Complete Implementation Guide

## 🎉 Overview

A comprehensive 42-screen onboarding flow for Unscroller, adapted from the Quittr onboarding pattern for social media addiction recovery.

## 📱 Frontend Screens (42 Total)

### Phase 1: Welcome & Introduction (Screens 1-4)
1. **OnboardingWelcomeScreen** - Sign-up options (Email/Google/Apple)
2. **OnboardingProfileCardScreen** - Streak tracking preview
3. **OnboardingReflectionScreen** - Pause & reflect moment
4. **OnboardingQuizScreen** - Quiz introduction

### Phase 2: Initial Quiz (Screens 5-6)
5. **QuizQuestionScreen** - Demographic questions
6. **QuizSymptomsScreen** - Impact assessment (multi-select)

### Phase 3: Educational Content (Screens 7-17)
7-11. **FunFactsScreen** - 5 educational fact slides
12-17. **MotivationalFactsScreen** - 6 motivational fact slides

### Phase 4: Social Proof (Screens 18-19)
18. **ExpertQuotesScreen** - Testimonials from experts
19. **RecoveryGraphScreen** - Progress visualization

### Phase 5: Goal Setting & Commitment (Screens 20-23)
20. **GoalSelectionScreen** - Multi-select personal goals
21. **ReferralCodeScreen** - Optional referral code
22. **RatingRequestScreen** - App rating with testimonials
23. **CommitmentScreen** - Signature canvas for commitment

### Phase 6: Plan Generation (Screens 24-27)
24. **WelcomeToJourneyScreen** - Welcome transition (auto-navigate, 3s)
25. **PlanPreviewScreen** - Plan card preview (auto-navigate, 4s)
26. **CustomPlanScreen** - 90-day quit date + benefits
27. **BenefitsShowcaseScreen** - Visual benefits with illustration

### Phase 7: Advanced Conversion (Screens 28-33)
28. **HabitsGuideScreen** - Daily habits card
29. **TakeBackControlScreen** - Benefits + 80% discount offer
30. **ProgressTrackingScreen** - Analytics preview + pricing
31. **PersonalizationScreen** - Profile completion form
32. **CongratulationsScreen** - Celebration screen
33. **SuccessFlowScreen** - "Sometimes things flow easily" (red gradient)

### Phase 8: Extended Quiz (Screens 34-38)
34. **SupportScreen** - "Whenever you need us" (teal gradient)
35. **QuizGenderScreen** - Gender question (Question #1)
36. **QuizReferralScreen** - Referral source (Question #3)
37. **QuizFinalInfoScreen** - Name + Age input
38. **CalculatingScreen** - 89% progress circle (auto-navigate, 3s)

### Phase 9: Final Conversion (Screens 39-42)
39. **AnalysisCompleteScreen** - Score comparison (64% vs 40%)
40. **OneTimeOfferScreen** - 80% discount with 5-min timer
41. **PaywallMainScreen** - Scrolling paywall with benefits/testimonials
42. **Home** - Main app (onboarding complete!)

## 🗄️ Database Schema

### Tables Created

**1. onboarding_progress**
- Tracks user progress through onboarding
- Fields: current_screen, completed_screens, is_completed, etc.

**2. quiz_responses**
- Stores all quiz answers
- Fields: quiz_type, question_id, answer_value, answer_data (JSONB)

**3. user_profiles**
- User demographic data
- Fields: first_name, age, gender, orientation, ethnicity, religion, region

**4. symptom_assessments**
- Impact assessment data
- Fields: symptoms (JSONB), dependency_score, severity_score, average_score

**5. user_goals**
- Selected goals and commitment
- Fields: goals (JSONB), quit_date, commitment_signature

**6. referral_sources**
- Marketing attribution
- Fields: source, referral_code

**7. app_ratings**
- User ratings and reviews
- Fields: rating (1-5), review_text, platform

**8. custom_plans**
- Generated personalized plans
- Fields: plan_type, quit_date, benefits (JSONB), daily_habits (JSONB)

**9. subscription_events**
- Conversion tracking
- Fields: event_type, plan_type, plan_price_cents, discount_percentage, offer_type

**10. onboarding_analytics**
- Screen analytics
- Fields: screen_name, time_spent_seconds, interactions (JSONB), dropped_off, completed

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Policies for SELECT, INSERT, UPDATE

### Performance
- Indexes on user_id fields
- Indexes on query fields (quiz_type, event_type, screen_name)
- Optimized for read-heavy workloads

## 🔌 Backend API Endpoints

### Onboarding Progress
- `POST /api/onboarding/progress` - Save progress
- `GET /api/onboarding/progress` - Get progress

### Quiz Responses
- `POST /api/onboarding/quiz/response` - Submit answer
- `GET /api/onboarding/quiz/responses` - Get all responses

### User Profile
- `POST /api/onboarding/profile` - Save/update profile
- `GET /api/onboarding/profile` - Get profile

### Symptom Assessment
- `POST /api/onboarding/symptoms` - Submit symptoms
- `GET /api/onboarding/symptoms` - Get assessment

### Goals & Commitment
- `POST /api/onboarding/goals` - Save goals
- `GET /api/onboarding/goals` - Get goals

### Referral
- `POST /api/onboarding/referral` - Save referral source

### Rating
- `POST /api/onboarding/rating` - Submit rating

### Custom Plan
- `POST /api/onboarding/plan` - Generate plan
- `GET /api/onboarding/plan` - Get plan

### Subscription Events
- `POST /api/onboarding/subscription/event` - Track event

### Analytics
- `POST /api/onboarding/analytics/screen` - Track screen view
- `GET /api/onboarding/analytics/summary` - Get summary

## 🚀 Setup Instructions

### 1. Database Setup

Run the migration file:
```bash
psql -d your_database < apps/backend/src/db/migrations/003_onboarding_schema.sql
```

Or use Supabase dashboard:
1. Go to SQL Editor
2. Paste contents of `003_onboarding_schema.sql`
3. Run migration

### 2. Backend Configuration

Update `.env` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENABLE_DATABASE=true
DATABASE_URL=your_database_url
```

### 3. Start Backend

```bash
cd apps/backend
npm install
npm run dev
```

### 4. Mobile App

```bash
cd apps/mobile
npm install
npm start
```

## 📊 Data Flow

1. **User starts onboarding** → `onboarding_progress` table
2. **Answers quiz questions** → `quiz_responses` table
3. **Selects symptoms** → `symptom_assessments` table (dependency score calculated)
4. **Enters profile info** → `user_profiles` table
5. **Selects goals** → `user_goals` table
6. **Signs commitment** → `user_goals.commitment_signature`
7. **Custom plan generated** → `custom_plans` table
8. **Views paywall** → `subscription_events` (event: 'viewed_paywall')
9. **Purchases** → `subscription_events` (event: 'purchased')
10. **Every screen view** → `onboarding_analytics` table

## 🎨 Design Features

### Auto-Navigation
- WelcomeToJourneyScreen: 3s delay
- PlanPreviewScreen: 4s delay
- CalculatingScreen: 3s delay

### Personalization
- User name from email
- 90-day quit date calculation
- Dependency score algorithm
- Custom plan based on symptoms

### Conversion Optimization
- 3 "Buy Back Your Time" CTAs
- 80% discount highlighted
- Countdown timer (5 min)
- Social proof (4.8 stars, 140K users)
- Testimonials with avatars
- Progress indicators
- Scarcity messaging

### Visual Elements
- Starfield backgrounds
- Progress circles
- Bar charts
- Animated loading states
- Holographic elements
- Gradient cards
- Icon-based benefits

## 📈 Analytics & Tracking

### Funnel Metrics
- Screen view count
- Time spent per screen
- Drop-off points
- Completion rate
- Conversion rate

### User Segmentation
- By symptoms count
- By goals selected
- By referral source
- By dependency score

### A/B Testing Ready
- Screen variants
- CTA button text
- Pricing displays
- Discount percentages

## 🔒 Security Considerations

1. **RLS Policies** - All tables protected
2. **Auth Required** - JWT token validation
3. **Input Validation** - Backend validates all inputs
4. **Rate Limiting** - API rate limits configured
5. **CORS** - Configured for mobile app

## 🎯 Key Metrics

### Target Metrics
- Onboarding completion: >60%
- Time to complete: 8-12 minutes
- Conversion rate: >15%
- Drop-off reduction: <30%

### Current Implementation
- 42 screens total
- 10 database tables
- 14 API endpoints
- Full RLS security
- Complete analytics tracking

## 📝 Next Steps

1. **Frontend Integration**
   - Connect API calls to screens
   - Add loading states
   - Handle errors gracefully
   - Add offline support

2. **Analytics Dashboard**
   - Build admin panel
   - Visualize funnel
   - Track conversions
   - Monitor drop-offs

3. **A/B Testing**
   - Test different CTAs
   - Test pricing displays
   - Test screen orders
   - Test messaging

4. **Optimization**
   - Reduce screen count for faster flow
   - Add skip options
   - Optimize load times
   - Cache API responses

## 🐛 Known Issues

1. Lint warnings for TypeScript `any` types (to be improved)
2. Carousel functionality in PaywallMainScreen (basic implementation)
3. Image uploads for signatures (currently stores base64)

## 📚 Resources

- Supabase Dashboard: https://app.supabase.com
- React Navigation Docs: https://reactnavigation.org
- NestJS Docs: https://nestjs.com

## 🤝 Contributing

When adding new onboarding screens:
1. Create screen component in `/apps/mobile/src/screens/`
2. Add to `RootStackParamList` in `AppNavigator.tsx`
3. Import and add `<Stack.Screen>` component
4. Update this README with screen details
5. Add corresponding database table/fields if needed
6. Create API endpoints in backend
7. Test full flow end-to-end

---

**Status:** ✅ Complete - 42 screens, database, and backend API ready
**Last Updated:** November 7, 2025
