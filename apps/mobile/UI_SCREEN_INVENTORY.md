# UI Screen Inventory

## Overview
This document catalogs the current React Native screens in the Unscroller mobile app for redesign work. Each entry captures the major UI elements, copy, and layout order so a design AI can reimagine visuals while preserving functional structure.

---

## Navigation Flow

### WelcomeScreen (`Welcome`)
- **Purpose:** Introduces Unscroller and funnels users into authentication.
- **Layout (top → bottom):**
  1. Light-status bar over gradient background.
  2. Centered content block with:
     - Title: **"Unscroller"**.
     - Subtitle: **"Distraction-Free Social Browser"**.
     - Body copy: `Post, DM, and manage your social profiles—without feeds, Reels, Shorts, or Spotlight` (two lines).
     - Provider list badge showing platform emojis/text.
  3. Footer section:
     - CTA button text: **"Get Started"**.
     - Disclaimer: `Independent browser. Not affiliated with any social platform.`

### AuthScreen (`Auth`)
- **Purpose:** Email-based sign in with optional Apple/Google.
- **Layout:**
  1. Header row with text back button **"← Back"** left-aligned.
  2. Form block containing:
     - Title **"Sign In"** and subtitle **"Enter your email to get started"**.
     - Card with email text input placeholder **"Email"**, CTA button text **"Send Magic Link"** (`"Sending…"` while loading).
     - Divider row label **"or continue with"**.
     - Social buttons stacked vertically:
       - **" Continue with Apple"** (`"Signing in…"` state).
       - **"G Continue with Google"** (`"Signing in…"` state).
  3. Footer disclaimer: `Independent browser. We never post on your behalf.`

### PaywallScreen (`Paywall`)
- **Purpose:** Presents subscription options and upsell copy.
- **Layout:**
  1. Bottom sheet-style wrapper with grabber, headline **"Unlock the accountability system creators rely on"**, subtitle `Swap infinite feeds for structured focus...`.
  2. Checklist of features (✓ `Use social media without infinite feeds.`, `Track hours saved and see your progress.`, `Run focus sessions with built-in breaks.`, `Get gentle nudges and an AI accountability coach.`).
  3. Plan selector cards:
     - **Annual Focus Plan** badge (`67% OFF`, highlight "Most popular"), price **"$6.48/mo"**, billing detail `Billed $77.77 annually`, description `Full accountability systems...`.
     - **Monthly Builder Plan** badge (`45% OFF`), price **"$11.11/mo"** with compare-at `$19.99`, billing detail `Lock in 45% savings vs. the usual $19.99/mo`, description `All premium features...`.
  4. Footnote `Annual billed $77.77 upfront... Monthly billed $11.11/mo — typically $19.99/mo.`
  5. CTA button text switches between **"Unlock Annual Plan"** / **"Unlock Monthly Plan"** (shows `Processing…` during purchase), plus links **"I want to keep wasting my time"** (navigates to trials) and **"Restore purchase"** (`Restoring…` state).

### PolicyBypassWarningScreen (`PolicyBypassWarning`)
- **Purpose:** Warns user before disabling content guards.
- **Layout:**
  1. Centered card with badge **"Security Notice"**.
  2. Title **"Disable Content Guards?"** and body copy explaining risks (`Turning off content guards lifts feed hiding...`).
  3. Bullet reminders:
     - `• Use this mode only to complete provider login flows.`
     - `• While disabled, feeds and distracting UI will be visible.`
     - `• Remember to re-enable guards as soon as you finish logging in.`
  4. Buttons: red **"Temporarily Disable Guards"** and secondary **"Keep Guards On"**.

### OnboardingWelcomeScreen (`OnboardingWelcome`)
- **Purpose:** Primary onboarding welcome with social auth CTAs.
- **Layout:**
  1. Back button pill displaying **"‹"** top-left.
  2. Animated wordmark **"UNSCROLLER"**.
  3. Center illustration featuring the app logo.
  4. Content column:
     - Headline **"Stop Scrolling, Start Building"**.
     - Subtitle: `Break free from endless feeds and reclaim your time.
       Turn mindless scrolling into focused creating — and start building your dreams.`
     - Buttons container:
       - Apple: **"Continue with Apple"** (`"Signing in…"` state).
       - Google: **"Continue with Google"**.
     - Bottom trust text: `Join thousands breaking the scroll cycle.`
     - Outline button: **"Skip"**.

### OnboardingProfileCardScreen (`OnboardingProfileCard`)
- **Purpose:** Shows starter "Progress Card" with user info.
- **Layout:**
  1. Back icon **"‹"** top-left.
  2. Header text welcoming the user by email prefix (fallback "Member") and subtitle `This is your Progress Card — your personal tracker for your Unscroller journey.`
  3. Glassmorphism card containing:
     - Header row: circular logo badge ("U") and sparkle emoji **"✨"**.
     - Streak section with label **"Active Streak"**, value **"0 days"**, hint `Each day without endless scrolling keeps this streak climbing.`
     - Footer row showing **"Name"** and **"Started"** values (current date).
  4. Bottom text: **"Now, let's set up Unscroller for you."**
  5. CTA button: **"Next"**.

### OnboardingReflectionScreen (`OnboardingReflection`)
- **Purpose:** Transitional reflection splash encouraging a pause.
- **Layout:**
  1. Full-screen pressable area.
  2. Badge near top with logo text **"UNSCROLLER"** inside glowing pill.
  3. Centered text stack:
     - Title **"Embrace this pause."**
     - Subtitle **"Reflect before you scroll."**
     - Animated row of five ⭐ icons.
  4. Bottom hint: **"Tap anywhere to continue →"**.

### OnboardingQuizScreen (`OnboardingQuiz`)
- **Purpose:** Introduces the habit assessment quiz.
- **Layout:**
  1. Header logo text **"UNSCROLLER"** centered.
  2. Headline **"Let’s assess your habits"**.
  3. Subhead: `How is endless scrolling affecting you? Answer a few high-signal questions to find out.`
  4. Decorative gradient illustration card (orb + halo elements).
  5. CTA stack with primary button **"Start Quiz"** and hint text **"Takes under 90 seconds"**.

### OnboardingNotificationsScreen (`OnboardingNotifications`)
- **Purpose:** Request push-notification permission.
- **Layout:**
  1. Background starfield backdrop.
  2. Header center stack with bell emoji **"🔔"**, title **"Stay on Track"**, subtitle `Smart notifications help you build habits that stick`.
  3. Vertical list of benefit cards:
     - `⏰ Smart Reminders – Get nudges right before your typical scroll times`
     - `🎯 Focus Prompts – Reminders for deep work when you need them most`
     - `🔥 Streak Protection – Never lose your progress with timely alerts`
     - `🎉 Milestone Celebrations – Get celebrated when you hit major achievements`
  4. Privacy note pill: lock emoji **"🔒"** plus copy `We respect your schedule. Set quiet hours anytime in settings.`
  5. Actions: primary button **"Enable Notifications"** (`"Enabling..."` state) and secondary text button **"Maybe Later"**.

### WelcomeToJourneyScreen (`WelcomeToJourney`)
- **Purpose:** Celebratory transition before plan preview.
- **Layout:**
  1. Full-screen tap target with starfield backdrop.
  2. Centered headline: **"Welcome to Unscroller, your path to freedom."** (two-line).
  3. Bottom loading ring indicator.
  4. Auto-advances after ~3 seconds or immediately on tap.

## Assessment Quiz Flow

### QuizQuestionScreen (`QuizQuestion`)
- **Purpose:** Presents a sequence of single-choice and scale questions about scrolling habits.
- **Layout:**
  1. Status bar plus top bar showing `Question {n} of 9` and percentage (e.g., `44%`), followed by animated progress bar.
  2. Horizontal pager where each slide contains:
     - Question text (examples include **"What is your age range?"**, **"How many hours per day do you spend on social media?"**, **"When do you tend to scroll the most?"**, etc.).
     - Either a vertical stack of answer buttons or a 1–5 readiness scale.
     - For `hoursPerDay`, contextual feedback appears below with one of:
       - `Nice — that’s under 7 hours a week. Keep that time working for you.`
       - `That’s up to 21 hours a week — nearly a full day of scrolling. Imagine reclaiming that time.`
       - `At 3–5 hours daily, you’re losing 21–35 hours a week. That’s a part-time job worth of time.`
       - `5+ hours a day is 35+ hours weekly — more than a full waking day spent scrolling.`
  3. Questions and exact option labels:
     - Age range options: `Under 18`, `18-25`, `26-35`, `36-50`, `Over 50`.
     - Daily hours options: `Less than 1 hour`, `1-3 hours`, `3-5 hours`, `More than 5 hours`.
     - Primary use case options: `Work / clients / business`, `Staying in touch with friends and family`, `Entertainment and passing time`, `News and updates`, `Killing time when I’m bored`, `Something else`.
     - Peak scroll time options: `In the morning, still in bed`, `During work or school`, `Evenings after the day is done`, `Late at night in bed`, `All throughout the day`.
     - Hardest platform options: `TikTok / For You page`, `Instagram / Reels`, `YouTube / Shorts`, `X (Twitter)`, `Facebook`, `Another app`.
     - Autopilot frequency options: `Rarely`, `A few times a day`, `5–10 times a day`, `More than 10 times a day`.
     - Interference level options: `Never`, `Once`, `A few times`, `Most days`, `Every day`.
     - Readiness scale: buttons `1`–`5` with labels `Not ready` → `All-in and ready`.
     - Feeling after scroll options: `Inspired and positive`, `No different than before`, `Drained or behind on my goals`, `Anxious, guilty, or overwhelmed`.

### QuizSymptomsScreen (`QuizSymptoms`)
- **Purpose:** Lets users tag symptoms across Mental, Social, and Physical categories.
- **Layout:**
  1. Header block: eyebrow text **"STEP 5 OF 12"**, title **"How is social media affecting you?"**, subtitle `Select every symptom you’re noticing so we can tailor your plan.`
  2. Animated badge showing count: `{n} selected`.
  3. Highlight banner copy: `Pinpointing your pain points helps Unscroller target the routines and guardrails you’ll feel fastest.`
  4. Category sections (Mental, Social, Physical) each listing tappable tags with copy exactly as in code (e.g., `Feeling unmotivated`, `Fear of missing out (FOMO)`, `Eye strain or 'brain fog'`, etc.) and a check circle that shows `✓` when active.
  5. Bottom bar with CTA button text switching between **"Select at least one"** (disabled) and **"Continue your journey"** plus hint `This helps us gauge impact intensity before crafting your plan.`

### QuizGenderScreen (`QuizGender`)
- **Purpose:** Asks the first demographic question in a stripped-down flow.
- **Layout:**
  1. Starfield background with top header row: back button **"‹"**, progress bar at 10%, language pill `🇺🇸 EN`.
  2. Copy stack: `Question #1`, headline **"What is your gender?"**.
  3. Two pill buttons labeled **"Male"** and **"Female"** with selection indicators showing `✓` when chosen. Selecting auto-navigates forward.

### QuizReferralScreen (`QuizReferral`)
- **Purpose:** Captures referral source information (Question #3) with emoji tiles.
- **Layout:**
  1. Same starfield header treatment with progress bar filled to 60% and language pill `🇺🇸 EN`.
  2. Question copy: `Question #3` and **"Where did you hear about us?"**.
  3. Vertical stack of six buttons, each with emoji and label: `🔍 Google`, `📺 TV`, `✖️ X`, `📷 Instagram`, `🎵 TikTok`, `👍 Facebook`. Selection auto-navigates.

### QuizFinalInfoScreen (`QuizFinalInfo`)
- **Purpose:** Collects name and age to finish the questionnaire.
- **Layout:**
  1. Starfield header with back arrow **"‹"**, progress bar at 90%, language pill `🇺🇸 EN`.
  2. Title **"Finally"**, subtitle **"A little more about you"**.
  3. Form with two rounded inputs: placeholder `Sam` for name and `24` for age (number pad, max length 2).
  4. Bottom CTA button text **"Complete Quiz"** (disabled state applied until both fields filled).

### CalculatingScreen (`Calculating`)
- **Purpose:** Displays circular progress while computing the personalized plan.
- **Layout:**
  1. Centered radial progress indicator showing percentage (`0–100%`).
  2. Headline **"Calculating your plan"**.
  3. Status text sequence: `Analyzing your habits…` then `Building your custom plan…`.
  4. Auto-navigates to OnboardingQuizResult after progress completes (~3.3s).

### QuizResultLoadingScreen (`QuizResultLoading`)
- **Purpose:** Animated bridge between symptom selection and results.
- **Layout:**
  1. Concentric glow and rotating ring around core label **"Calibrating"**.
  2. Headline copy **"Designing your detox blueprint…"**.
  3. Cycling subtext from list: `Synthesizing your signals...`, `Mapping symptoms to routines...`, `Tailoring the next phase...`.
  4. Auto-redirects to `OnboardingQuizResult` after a short delay.

### OnboardingQuizResultScreen (`OnboardingQuizResult`)
- **Purpose:** Summarizes assessment findings and tees up motivational content.
- **Layout:**
  1. Hero gradient card with label **"Personalized Snapshot"**, title using user name (`"{Name}, here’s your scroll profile"` fallback `"Here’s your scroll profile"`), subtitle `We analyzed your answers, time estimates, and symptoms to map the guardrails you’ll need next.`
  2. Metrics row showing **"Daily use"** (hours/day) and **"Weekly impact"** (hours/week) plus chips such as `Moderate usage`, `High Impact`.
  3. Summary card labeled **"What we noticed"** with either early-warning or level-specific copy (e.g., `You’re using social media lightly...`).
  4. Insight card noting `You selected {n} signs that scrolling is affecting your focus or energy.` with pills for `Symptoms` and `Impact band`.
  5. Two stacked bullet sections titled **"Why that matters"** and **"How Unscroller will respond"** with bullet copy matching the arrays in code.
  6. Bottom CTA **"Continue"** and hint `Next, we’ll show you what’s really going on behind endless feeds — and how to join other driven people breaking the cycle.`

## Education & Commitment Flow

### FunFactsScreen (`FunFacts`)
- **Purpose:** Carousel of high-impact statistics contextualizing social media harm.
- **Layout:**
  1. Full-bleed background tinted per fact color with `UNSCROLLER` logo header.
  2. Illustration circle containing fact emoji (`🧠`, `📱`, `😴`, `💭`, `🎯`) plus floating question mark.
  3. Fact text block with title (e.g., **"Built to Hook You"**) and descriptive paragraph for each slide.
  4. Pagination dots reflecting five slides.
  5. CTA button toggles **"Next →"** until final slide where it reads **"Get Started →"**.

### MotivationalFactsScreen (`MotivationalFacts`)
- **Purpose:** Success-science carousel motivating continued journey.
- **Layout:**
  1. Colorful backgrounds with `UNSCROLLER` logo.
  2. Slide-specific illustrations (e.g., growing plant, rocket, puzzle piece) or emoji from fact list.
  3. Title/description pairs like **"Your Path to Recovery"** and `Good news: recovery is possible...`.
  4. Secondary badges (on slide 2) showing "Featured in" row (Forbes/TechCrunch/Wired).
  5. Pagination dots and CTA button text switching between **"Next →"** and **"Continue →"** on final slide.

### ExpertQuotesScreen (`ExpertQuotes`)
- **Purpose:** Displays expert opinions and user testimonials.
- **Layout:**
  1. Header with back chevron **"‹"** and title **"Success Stories & Expert Insights"**.
  2. Scrollable card list containing avatar (photo or initials), author name + credential, optional verified check, quote title, and body.
  3. Bottom CTA button **"Continue"**.

### RecoveryGraphScreen (`RecoveryGraph`)
- **Purpose:** Visualizes guided vs. solo recovery progress.
- **Layout:**
  1. Header with back chevron and title **"Your Recovery Journey"**.
  2. Graph card showing two SVG paths: bright green "with Unscroller" curve with labelled points; dashed red solo path labelled `Without support: slower progress and more relapses.`
  3. Supporting copy `With guidance, you build healthy habits much faster...`.
  4. CTA button **"Start My Journey"**.

### GoalSelectionScreen (`GoalSelection`)
- **Purpose:** Collects multiple life goals to tailor plan.
- **Layout:**
  1. Header block `STEP 9 OF 12`, title **"Where do you want to improve first?"**, subtitle `Pick every goal that resonates...`.
  2. Animated list of goal chips (emoji + title) toggling selection checkmarks (`❤️ Stronger relationships`, `🎯 Improved self-control`, etc.).
  3. CTA button text swaps between **"Select at least one goal"** (disabled) and **"Track these goals"**.

### ReferralCodeScreen (`ReferralCode`)
- **Purpose:** Optional input for referral code.
- **Layout:**
  1. Back chevron header.
  2. Title **"Do you have a
     referral code?"**, subtitle **"You can skip this step."**
  3. Rounded input field placeholder **"Referral Code"** (uppercase entry).
  4. Button **"Next"**.

### RatingRequestScreen (`RatingRequest`)
- **Purpose:** Requests app rating with social proof.
- **Layout:**
  1. Title **"Give us a rating"** with five-star row.
  2. Social proof blurb `This app was designed for people like you.` plus avatar trio and `+ 1,000,000 people` counter.
  3. Testimonial cards showing avatar initials, name/username, five stars, and quotes.
  4. Buttons: primary **"Rate Unscroller"**, secondary **"Skip for now"**.

### CommitmentScreen (`Commitment`)
- **Purpose:** Captures signature affirming continued progress.
- **Layout:**
  1. Header `STEP 10 OF 12`, title **"Sign your commitment"**, subtitle `Anchor the promise to your future self...`.
  2. Signature canvas with `Start over` link and hint `Use your finger to sign anywhere in the box.`
  3. CTA button **"Finish"** (disabled until signature drawn) with note `Your signature stays on-device...`.

### CongratulationsScreen (`Congratulations`)
- **Purpose:** Celebratory splash acknowledging completion of onboarding steps.
- **Layout:**
  1. Bright green background with `UNSCROLLER` logo.
  2. Title **"Nice work, {name}!\nYou're off to a great start."**
  3. Illustrated rocket scene (colored blobs, rocket, grid pattern).
  4. Footer pill text **"TAP ANYWHERE TO CONTINUE"** (whole screen is tappable and continues to SuccessFlow).

### SuccessFlowScreen (`SuccessFlow`)
- **Purpose:** Keeps momentum with playful "SUCCESS" motif.
- **Layout:**
  1. Full-screen button with magenta background and logo.
  2. Title **"Sometimes things\nflow easily..."**
  3. Illustration spelling "SUCCESS" using black tiles and animated hands (👋, ✋, 🤚, 👐, 🖐️).
  4. Footer text **"TAP ANYWHERE TO CONTINUE"** leading to Support screen.

### SupportScreen (`Support`)
- **Purpose:** Reassures user of ongoing help before premium upsell.
- **Layout:**
  1. Aqua background, logo, and title **"Whenever you need\nus, we're right here."**
  2. Radial cluster of emoji icons (✉️, ✅, 🚀, ❓, 💬, 💗) over subtle grid.
  3. CTA button **"Let's go"** (navigates toward paywall).

### AnalysisCompleteScreen (`AnalysisComplete`)
- **Purpose:** Summarizes habit analysis results with comparison chart.
- **Layout:**
  1. Starfield background, back link **"‹ Back"**.
  2. Title row **"Analysis Complete"** with green check, subtitle `Here's what your habits reveal...`.
  3. Message `You're spending too much time\nscrolling instead of building*`.
  4. Bar chart comparing `Your Score 64%` vs `Average 40%`, result text `64% more time wasted than average user 📊`, disclaimer `* Based on your self-reported habits...`.
  5. CTA button **"See Your Action Plan"**.

### SevenDayTrialScreen (`SevenDayTrial`)
- **Purpose:** Offers a 7-day free trial with premium features summary.
- **Layout:**
  1. Gradient backdrop, gift emoji `🎁`, headline **"Start Your Creator\nJourney FREE"**, subtitle **"7 Days. Zero Risk. Cancel Anytime."**
  2. Animated benefit list (block infinite scroll, daily challenges, track streaks, join community, deep focus mode).
  3. Gradient pricing card labeled **"7-Day Free Trial"**, line `Then $3.33/mo billed annually`, `Save 80% • Just $39.98/year`, badge **"LIMITED TIME"**.
  4. Disclaimer `No charges for 7 days... Auto-renews after trial period.`
  5. Buttons: primary **"Start 7-Day Free Trial"**, secondary text **"No thanks, show me other options"** plus subtext `Try our 24-hour trial instead`.

### TwentyFourHourTrialScreen (`TwentyFourHourTrial`)
- **Purpose:** Presents fallback 24-hour free access without payment.
- **Layout:**
  1. Dark theme with lightning emoji `⚡`, headline **"Last Chance:\n24 Hours FREE"**, subtitle **"No Payment Required.\nStart Building Right Now."**
  2. Benefit list (full blocking features, creator challenges, focus mode, no credit card required).
  3. Urgency card **"🔥 Why wait?"** with copy encouraging immediate use.
  4. Disclaimer `After 24 hours, upgrade anytime... No automatic charges.`
  5. CTA button **"Start 24-Hour Trial"**.

### OneTimeOfferScreen (`OneTimeOffer`)
- **Purpose:** High-urgency countdown upsell before returning to paywall.
- **Layout:**
  1. Deep purple backdrop with floating close button `✕` in top-right.
  2. Center stack: `UNSCROLLER` wordmark, title **"ONE TIME OFFER"**, subtitle **"You will never see this again."**
  3. Discount card showing **"80% DISCOUNT"**, ticking timer `This offer will expire in {MM:SS}`.
  4. Pricing card labeled **"68% OFF - LOWEST PRICE"** outlining `Annual Plan`, `Billed as $77.77/year`, strikethrough `Was $19.99/mo`, price **"$6.48/mo"**.
  5. Primary CTA **"CLAIM YOUR OFFER NOW"**, secondary link button **"I'll stay stuck"**, disclaimer `Cancel anytime · Take control / Restore Purchase`.

### SettingsScreen (`Settings`)
- **Purpose:** Central hub for account info, policy controls, shields, and account management.
- **Layout:**
  1. Starfield background with SafeArea scroll.
  2. Header: back button `←`, title **"Settings"**, spacer.
  3. Sections (glass cards) each titled (Account, Policy, Content Guards, YouTube Filter, Screen Time Shields, Data, Account Management) with respective rows/buttons:
     - Account: `Email`, `Subscription` values.
     - Policy: `Version`, buttons **"Refresh Policy"**, **"View Disclosures & Support"**, **"Privacy Policy"**.
     - Content Guards: description, status pill `Guards Active`/`Guards Off — login assist mode`, warning text, button toggling **"Temporarily Disable Guards"** / **"Restore Content Guards"**.
     - YouTube Filter: text `Current mode: {mode}`, button **"Change Filter Mode"**.
     - Screen Time Shields: status row `Status: ✅ Active/❌ Inactive`, apps count, button **"Enable Shields"**/`"Disable Shields"`, hint text.
     - Data: button **"Clear All Site Data"**.
     - Account Management: description, buttons **"Sign Out"**, **"Delete Account"**, link **"Manage or delete from web"**.
  4. Footer text `Unscroller v1.0.0` and `Independent browser...`.

### CheckInScreen (`CheckIn`)
- **Purpose:** Daily streak confirmation modal for maintaining habit momentum.
- **Layout:**
  1. Starfield overlay with closable `✕` at top-right.
  2. When not checked in: checkmark badge `✓`, title **"Daily Check-In"**, subtitle `Stay consistent...`, streak card `Current Streak {n} days 🔥`, CTA **"Check In Now"**, disclaimer `Check in daily...`.
  3. After check-in: celebration `🎉`, title **"Check-In Complete!"**, subtitle `Keep building...`, large streak count card `{n} Day Streak`.

### TrophyScreen (`Trophy`)
- **Purpose:** Displays achievements with unlock status.
- **Layout:**
  1. Header row `←` back, title **"Achievements"**.
  2. Stats card showing `Unlocked 3`, `Total 6`, `Progress 50%` with dividers.
  3. Trophy list: cards with emoji, title (e.g., `7 Days Strong`), description, and check badge `✓` if unlocked; locked items dimmed.

### ProgressScreen (`Progress`)
- **Purpose:** Visualizes weekly metrics, stats, and recent achievements.
- **Layout:**
  1. Header `←` back, title **"Progress"**.
  2. Timeframe toggle buttons `Week`, `Month`, `Year`, `All`.
  3. Stats grid (Scroll-Free hours, Creating minutes, Focus Sessions, Day Streak).
  4. Bar chart `Daily Progress` showing hours per day with labels.
  5. Recent Achievements section with `See All` link to Trophy and list of recent trophies.

### ProviderWebViewScreen (`ProviderWebView`)
- **Purpose:** In-app browser enforcing guardrails for social providers.
- **Layout:**
  1. SafeArea WebView full-screen with horizontal scroll container for wider desktop layouts.
  2. Floating top overlay: **"Home"** button returning to main app, optional view toggle button labeled `Desktop View`/`Mobile View`.
  3. Instagram-specific bottom overlay button toggling **"Post"** / **"Mobile View"`**.
  4. WebView handles provider-specific start URLs, auto-blocks disallowed paths, injects guard scripts.

### NotificationsScreen (`Notifications`)
- **Purpose:** Inbox surface listing achievement, social, and reminder alerts.
- **Layout:**
  1. Starfield background, header `←` back, title **"Notifications"**.
  2. Filter bar with buttons **"All"** and **"Unread ({count})"**.
  3. Scroll list of notification cards: icon emoji, title (e.g., `New Achievement Unlocked!`), message, timestamp, unread dot for new items.
  4. Empty state view `🔔 All Caught Up!` when nothing to show.

### JournalScreen (`Journal`)
- **Purpose:** Guided journaling workspace with templates and history.
- **Layout:**
  1. Header row `←` back, title **"Journal"**.
  2. Toggle pill for journal types (`Gratitude`, `Manifestation`, `Freestyle`).
  3. Editor card: description, prompts inputs or freeform textarea, **"Save entry"** button disabled until text entered.
  4. Entries list cards showing template label, formatted date, preview snippet.

### CalendarScreen (`Calendar`)
- **Purpose:** Visual monthly tracker for completion rate.
- **Layout:**
  1. Header `←` back, title **"Calendar"**.
  2. Stats card (Days This Month, Success Rate).
  3. Calendar card with month navigation chevrons, weekday row, day grid showing completed days via highlight and check dot.
  4. Legend card explaining completed/incomplete colors.

### CommunityScreen (`Community`)
- **Purpose:** Social hub with feed, challenges, leaderboard, plus composer.
- **Layout:**
  1. Header `←` back, title **"Community"**, compose icon `✏️`.
  2. Tab bar (`Feed`, `Challenges`, `Leaderboard`).
  3. Feed tab: post cards with avatar, streak badge, post text, actions (like, comment, share, more); floating `+` button opens modal composer (title **"Share a win"**, textarea, **"Post to Feed"** button).
  4. Challenges tab: cards showing title, difficulty badge, description, participant/completion stats, progress bar, CTA **"Join Challenge"**.
  5. Leaderboard tab: ranked rows with avatar, metrics, streak column.
  6. Modals for comments (list, add comment) and report flow with reason buttons and **"Submit Report"**.

### GoalsScreen (`Goals`)
- **Purpose:** Lists active long-term goals with progress bars.
- **Layout:**
  1. Header `←` back, title **"Goals"**, add button `+`.
  2. Hero section `🎯 Build Your Future` with subtitle.
  3. Goal cards each with emoji, title, progress bar, numeric progress `x / y`.
  4. Tip card `💡 Set SMART Goals` with reminder text.

## Core Experience Screens

### HomeScreen (`Home`)
- **Purpose:** Daily command center showing progress, shortcuts, and focus tools.
- **Layout:**
  1. Global starfield backdrop with scrolling content and fixed bottom nav (icons: `🏠`, `📈`, `✓`, `💬`, `👤`).
  2. Header row: wordmark **"UNSCROLLER"**, level badge `Lv {level}` + title, streak pill `🔥 {streakDays}`, gear icon button to Settings.
  3. Weekday streak tracker: 7 circles with check/`−` indicators.
  4. Providers row: circular emoji buttons from `PROVIDERS` (e.g., Instagram/TikTok) linked to `ProviderWebView`.
  5. Center holographic circle showing **"Scroll-free streak"**, `{scrollFreeDays} Days`, subtext `Keep it up! 🔥`.
  6. Motivation card copy surfaces one of the `DAILY_QUOTES` strings.
  7. Emergency row buttons:
     - `Panic Button` gradient tile (emoji `🚨`).
     - `AI Buddy` gradient tile (emoji `🤖`).
  8. Quick action grid (To-Do, Journal, Challenges, My Sky, Stats) each with emoji icon + label.
  9. To-do summary card: today/weekly counts (`{completed}/{total}`) plus optional `Loading…` note.
 10. CTA button: emoji `🎯` + text **"Start Focus Session"**.
 11. Modal when active focus session: title toggles `Deep Focus Session` / `Session Complete`, countdown timer, subtitle lines `Stay in creator mode...` or `Nice work...`, button text `End Session Early` / `Finish Session`.

### PanicButtonScreen (`PanicButton`)
- **Purpose:** Provides immediate grounding techniques when the urge to scroll spikes.
- **Layout:**
  1. Header with back arrow, title **"Need Help?"**.
  2. Hero section featuring animated pulsating circle with 🚨 button; tapping swaps view to breathing instructions.
  3. List of relief technique cards (🌬️ Deep Breathing, 🧘 Quick Meditation, 🚶 Take a Walk, 💧 Cold Water, 📝 Journal, ☎️ Call Someone) showing subtitle and duration.
  4. Motivation card `You've Got This` with supportive copy.
  5. Calming state replaces list with `Breathe` circle, 4-7-8 instructions, **"I Feel Better"** button.

### AIChatScreen (`AIChat`)
- **Purpose:** Chat interface for the AI accountability buddy.
- **Layout:**
  1. Header row with back arrow, title **"AI Buddy"**, online indicator dot.
  2. Scrollable conversation with assistant/user bubbles; assistant includes 🤖 avatar.
  3. Quick replies row (`Feeling strong 💪`, `Struggling today`, etc.) when thread is empty.
  4. Typing indicator bubble with spinner + "Thinking..." while awaiting response.
  5. Composer: multiline input `Message your buddy...`, send button ➤ disabled when empty or sending; respects daily 50-message limit alert.

### TodoListScreen (`TodoList`)
- **Purpose:** Manages daily/weekly creator tasks with Supabase sync fallback.
- **Layout:**
  1. Header with back arrow, title **"To-Do Lists"**.
  2. Progress cards (`Daily Focus`, `Weekly Momentum`) showing fractions and progress bars.
  3. Sections: **"Today’s Focus"** and **"Weekly Targets"** with input row (`Add an item` field + add button) and task list where each entry toggles completion (checkbox + task text, strikethrough when done).
  4. Error banner when offline/local mode with copy `Using local-only to-do list...`.
  5. Tip card `Momentum tip` offering guidance.

### FriendsScreen (`Friends`)
- **Purpose:** Displays friends list and requests with streak/context info.
- **Layout:**
  1. Header `←` back, title **"Friends"**, arrow button.
  2. Tabs **"Friends"** / **"Requests"**.
  3. Search bar `Search friends...`.
  4. Friend cards: avatar emoji, name, status dot (`online/building/offline`), streak badge `🔥 {days} days`, project text, chat button 💬.
  5. Requests tab empty state `👥 No Requests` placeholder.

### MessagesScreen (`Messages`)
- **Purpose:** Inbox for direct messages from community members.
- **Layout:**
  1. Header with back arrow, title **"Messages"**, compose icon `✏️`.
  2. List of message rows showing avatar emoji, sender name, time stamp, preview text, unread dot for new chats.

### ReferralsScreen (`Referrals`)
- **Purpose:** Referral program overview with share actions.
- **Layout:**
  1. Header `←` back, title **"Referrals"**.
  2. Hero `Invite Friends, Get Rewards` with 🎁 icon and benefit copy.
  3. Stats card (Friends Joined, Bonus Days).
  4. Referral code card `BUILD247` with copy-to-clipboard button 📋.
  5. Share button with 🔗 icon + **"Share with Friends"**.
  6. "How It Works" numbered steps and `🌟 Build Together` benefits card summarizing free months.

### InfoScreen (`Info`)
- **Purpose:** Educational facts reinforcing behavior change.
- **Layout:**
  1. Header `←` back, title **"Learn & Grow"**.
  2. Hero copy `Knowledge is Power`.
  3. Fact cards list (🧠 Dopamine Reset, ⏰ Average Time Wasted, 🎯 Focus & Flow, etc.) each with icon, title, description.
  4. CTA card inviting users to **"Join Community"** button.

### ProfileScreen (`Profile`)
- **Purpose:** User profile editing and stats overview.
- **Layout:**
  1. Header row with back arrow, title **"Profile"**, edit toggle button (✏️ / ✓).
  2. Profile header: avatar emoji, streak badge, editable name & bio fields when in edit mode.
  3. Stats grid showing `Total Days`, `Shipped`, `Posts`.
  4. "Currently Building" section (card with 🚀 icon or editable input).
  5. Quick actions list linking to Achievements, Progress, Referrals.

### MySkyScreen (`MySky`)
- **Purpose:** Visualizes earned stars/constellations and progress over time.
- **Layout:**
  1. Gradient backdrop with ConstellationSky component displaying interactive stars.
  2. Header overlay with back arrow, title **"My Sky"**, subtitle `{totalStars} stars earned`, stage badge.
  3. Bottom sheet sections: universe stage card (label, description, stats, energy meter), today stats pill `✨ {stars} stars today`, constellation cards (emoji, description, progress bar, completion badge).
  4. Star detail modal showing action taken, constellation, timestamp, **"Close"** button.

### MeditationScreen (`Meditation`)
- **Purpose:** Library of quick mindfulness exercises.
- **Layout:**
  1. Header `←` back, title **"Meditation"**.
  2. Hero `Find Your Center` with 🧘 emoji.
  3. Exercise cards listing icon, title, description, duration pill (e.g., `5 min`).
  4. Tip card with 💡 icon recommending usage timing.

### ChallengesScreen (`Challenges`)
- **Purpose:** Landing hub for active and available creator challenges.
- **Layout:**
  1. Header `←` back, title **"Challenges"**.
  2. Hero block `🎯 Take on Challenges` with subtitle `Complete challenges to earn XP and unlock rewards`.
  3. Active challenges list: cards showing type badge (`👥 Community`/`⭐ Personal`), title, description, participant count, reward badge (`+{xp} XP` or `🏆 Badge`), progress bar with percent, completed badge `✅ Completed!` when finished.
  4. "Available to Join" section: cards with icon `🎯`, description, participants count, and CTA button **"Join Challenge"**.
  5. Loading state overlay (`Loading challenges...`) when fetching.

### ChallengeDetailScreen (`ChallengeDetail`)
- **Purpose:** Deep dive for a single community challenge with join flow.
- **Layout:**
  1. Gradient background with header row (`←` back, difficulty pill).
  2. Title, description, meta row (Participants, Completion %, Boost), focus area chips.
  3. Info cards for `Time Commitment`, `Daily Actions`, `Weekly Wins`, `Success Metrics` (bullet lists).
  4. Footer card: headline **"Ready to commit?"**, subtitle, join states (`Joining challenge…`, success banner, error text), CTA **"Join Challenge"** (disabled while joining) and link buttons (`Track Progress`, `Back to Challenges`) after joining.

### ChallengeProgressScreen (`ChallengeProgress`)
- **Purpose:** Tracks user progress toward challenge goals with checklist logging.
- **Layout:**
  1. Header `←` back, centered title with gradient backdrop.
  2. Description text and optional `Preview mode` banner or error banner.
  3. Progress card: label `Overall progress`, percent badge, progress bar, metric summary `{current}/{target} {metric}`, button **"Log today’s win"**.
  4. Sections for `Daily actions`, `Weekly wins`, `Success metrics` rendered as checklist rows (checkbox + label).
  5. Loading state (`Loading challenge tracker…`) while fetching.

### LeaderboardScreen (`Leaderboard`)
- **Purpose:** Ranks users across metrics/time periods.
- **Layout:**
  1. Header `←` back, title **"Leaderboard"**.
  2. Hero `🏆 Top Performers` with subtitle.
  3. Metric selector buttons (`Time Saved`, `Focus Hours`, `Streak Days`) and period selector (`Daily`, `Weekly`, `Monthly`, `All-Time`).
  4. Loading state `Loading rankings...` spinner.
  5. Podium for top 3 (🥇🥈🥉) with avatars, usernames, scores; crown icon for first.
  6. Rankings list: cards with rank badge, avatar, username (flags `👥 Friend`, `(You)`), score text, highlight for current user/friends. Empty state `🏆 No Rankings Yet` otherwise.

### ResourcesScreen (`Resources`)
- **Purpose:** Curated articles, videos, and tools supporting habit change.
- **Layout:**
  1. Header `←` back, title **"Resources"**.
  2. Hero `📚 Learn & Grow` with subtitle.
  3. Category sections (e.g., Articles, Videos, Tools) each with icon, title, and resource cards showing title plus duration/label, trailing arrow.

### DisclosuresScreen (`Disclosures`)
- **Purpose:** Legal/support overview for filtering, billing, and data policies.
- **Layout:**
  1. Header `←` back, title **"Disclosures & Support"**.
  2. Intro card **"How Unscroller Works"** with description and **"Back to Settings"** button.
  3. Section cards for `Filtering & Safe Browsing`, `Provider Controls`, `Billing & Subscriptions`, `Data & Privacy`, `Help & Support` (each multi-paragraph).
  4. Legal links list (In-App Info & Tutorials, Contact Support, Provider Guidance, Manage Subscription, Privacy Policy, Deletion Support) plus support email text.

### PlanPreviewScreen (`PlanPreview`)
- **Purpose:** Animated progress wheel prepping user for conversion narrative.
- **Layout:**
  1. Center radial progress (`{progress}%`) with twin half-arc animation.
  2. Headline **"Crafting your plan"**.
  3. Subtitle `We’re crunching your inputs and aligning them with proven routines. Hang tight — your roadmap is seconds away.`
  4. Auto-forwards to ConversionShowcase after animation.

### ConversionShowcaseScreen (`ConversionShowcase`)
- **Purpose:** Displays benefits, habits, and social proof before paywall personalization.
- **Layout:**
  1. Hero block: eyebrow **"Your custom plan"**, title `Scroll-free by {formattedQuitDate}`, subtitle `Here’s what unlocking Unscroller gives you — tailored routines, tangible progress, and the guardrails to keep momentum.`
  2. Benefits grid cards (icons/labels: `🎯 Deep Focus`, `🚀 Build & Create`, `⏰ Reclaim Your Time`, `💡 Clear Thinking`, `📈 Real Progress`, `🎨 Creative Flow`).
  3. Habits list: cards for `Set creation time blocks`, `Track your real-life progress`, `Daily creator challenge` with descriptive copy.
  4. Highlight card **"Creators already feel the shift"** with stats `2.5hrs Avg. daily time saved` and `87% Stick with us past 30 days`.
  5. Bottom CTA button **"Buy back your time"**.

### BenefitsShowcaseScreen (`BenefitsShowcase`)
- **Purpose:** High-energy marketing splash highlighting value pillars.
- **Layout:**
  1. Starfield background with trophy/⭐ decoration row.
  2. Title **"Build Your Dreams,
     Not Your Scroll Count"**, subtitle **"Transform. Create. Level Up."**
  3. Colored badges for benefits (icons/labels identical to conversion screen).
  4. Sunburst illustration with meditation emoji `🧘` and caption **"Conquer yourself"**.
  5. CTA button **"Buy Back Your Time"**, disclaimer block `Subscription appears discretely
     Cancel Anytime ✅ Take Control 🛡️`.

### HabitsGuideScreen (`HabitsGuide`)
- **Purpose:** Reinforces daily routine commitments with milestone date.
- **Layout:**
  1. Card headline **"From Consumer to Creator"** with description `Build focus, create daily, and achieve your dreams...`.
  2. Milestone section: label **"Your transformation milestone:"** with date chip `{formattedQuitDate}`.
  3. Subtitle **"Your daily creator routine:"** followed by habit list (same three habits, emoji icons).
  4. Bottom CTA **"Buy Back Your Time"** + disclaimer (same as BenefitsShowcase); starfield background persists.

### TakeBackControlScreen (`TakeBackControl`)
- **Purpose:** Final upsell offering discount before paywall/personalization.
- **Layout:**
  1. Emoji hero `🙌` and title **"Build Your Future"**.
  2. Benefit bullets with colored pills (`🎯 Build unshakeable focus`, `🚀 Create and ship your projects`, `📈 Level up in real life`).
  3. 5-star rating bar and message `Stop wasting time scrolling...`
  4. Discount card copy: **"Special Discount!"**, `Get 80% off on Unscroller Premium!`, button **"Claim Now"**.
  5. CTA **"Buy Back Your Time"** plus standard disclaimer.

### CustomPlanScreen (`CustomPlan`)
- **Purpose:** Congratulates user and reiterates benefits before marketing flow.
- **Layout:**
  1. Starfield background with checkmark badge `✓` and headline **"{name}, your creator\njourney starts now."**
  2. Goal date section: label **"Your transformation goal date:"** with white pill showing `{formattedQuitDate}`.
  3. Benefits deck: trophy/⭐ row, title **"Become the best of\nyourself with Unscroller"**, subtitle **"More Present. More Focused. More You."**, grid of colored badges (`🎯 Deep Focus`, `🚀 Build & Create`, `⏰ Reclaim Your Time`, `💡 Clear Thinking`, `📈 Real Progress`, `🎨 Creative Flow`).
  4. Bottom CTA **"Buy Back Your Time"** plus disclaimer `Subscription appears discretely\nCancel Anytime ✅ Take Control 🛡️`.

### PersonalizationScreen (`Personalization`)
- **Purpose:** Confirms user details before congrats screen.
- **Layout:**
  1. Header title **"Is this correct?"**, subtitle `We're personalizing your experience on Unscroller.`
  2. Form rows with labels and chevrons:
     - **First Name** (placeholder `Enter your name`, shows error `First name is required.` if blank when attempted).
     - **Age** (placeholder `24`, error `Enter a valid age.` if invalid).
     - **Gender** toggle pills `Male` / `Female`.
     - Region row showing `North America`.
  3. Bottom button **"Next →"** (disabled when form invalid).

### SuccessFlowScreen (`SuccessFlow`)
- **Purpose:** Playful transition card leading into support resources.
- **Layout:**
  1. Tappable full screen with brand logo.
  2. Title **"Sometimes things
     flow easily..."**.
  3. Illustration spelling “SUCCESS” with alternating hands (emojis `👋`, `✋`, `🤚`, `👐`, `🖐️`).
  4. Footer pill text **"TAP ANYWHERE TO CONTINUE"**.
