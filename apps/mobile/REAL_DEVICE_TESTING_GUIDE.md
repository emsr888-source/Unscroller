# 📱 Real Device Testing Guide

**Purpose**: Test all retention features on actual iOS and Android devices  
**Timeline**: 1-2 hours for complete testing  
**Devices Needed**: iOS device (iPhone) and/or Android device

---

## 🔧 Pre-Testing Setup

### 1. Install Dependencies
```bash
cd apps/mobile
npm install
cd ios && pod install && cd ..
```

### 2. Set OpenAI API Key
Your `.env` file should have:
```
OPENAI_API_KEY=sk-...your-key-here
```

### 3. Build for Device

**iOS**:
```bash
npm run ios -- --device
# Or open in Xcode and run on connected device
```

**Android**:
```bash
npm run android
# Make sure device is connected via USB and has USB debugging enabled
```

---

## ✅ Test Checklist

### 1. AI Chat System ⭐ HIGH PRIORITY

**What to Test**:
- [ ] Open AI Chat from Home screen
- [ ] Send message: "I'm struggling today"
- [ ] Verify response appears (check if using OpenAI or fallback)
- [ ] Send another message to test conversation context
- [ ] Test quick reply buttons
- [ ] Verify loading indicator appears
- [ ] Verify auto-scroll to latest message
- [ ] Test on slow network (airplane mode toggle)

**Expected Results**:
- Messages send within 1-2 seconds
- Responses are contextually appropriate
- Loading indicator shows during API call
- Fallback works if API fails
- UI stays responsive

**Screenshot**: Take screenshot of conversation

---

### 2. Challenges System ⭐ HIGH PRIORITY

**What to Test**:
- [ ] Navigate: Home > 🏆 Challenges
- [ ] Verify 4 active challenges load
- [ ] Check progress bars update correctly
- [ ] Tap "Join Challenge" on available challenge
- [ ] Verify challenge moves to active section
- [ ] Check animations are smooth
- [ ] Scroll through list

**Expected Results**:
- Challenges load instantly
- Progress bars animate smoothly
- Join action feels immediate
- Type badges (⭐/👥) display correctly
- Animations have no lag

**Screenshot**: Take screenshot of challenges screen

---

### 3. Leaderboard System ⭐ HIGH PRIORITY

**What to Test**:
- [ ] Navigate: Home > Tap "Lv 3: Time Reclaimer" badge
- [ ] Verify leaderboard opens
- [ ] Check top 3 podium displays correctly
- [ ] Scroll through full rankings
- [ ] Change metric selector (Time Saved → Focus Hours → Streak Days)
- [ ] Change period selector (Weekly → Monthly → All-Time)
- [ ] Verify user is highlighted (purple border)
- [ ] Check animations

**Expected Results**:
- Podium looks impressive
- Selectors change data instantly
- Animations are smooth
- User highlighting is clear
- Crown appears on #1

**Screenshot**: Take screenshot of podium

---

### 4. Level & XP System ⭐ MEDIUM PRIORITY

**What to Test**:
- [ ] Check level badge in Home header
- [ ] Verify shows "Lv 3: Time Reclaimer"
- [ ] Tap badge → navigates to Leaderboard
- [ ] (If possible) Trigger XP award to see toast
- [ ] Verify toast animates up and fades

**Expected Results**:
- Badge is readable and tappable
- Navigation works instantly
- XP toast is visible and animates smoothly

**Screenshot**: Take screenshot of Home with level badge

---

### 5. Constellation Sky ⭐ HIGH PRIORITY

**What to Test**:
- [ ] Navigate: Home > My Sky (if added to home)
- [ ] Or navigate directly to MySky screen
- [ ] Verify night sky renders
- [ ] Check stars appear and twinkle
- [ ] Tap a star to see detail modal
- [ ] Verify modal shows action details
- [ ] Scroll constellation cards at bottom
- [ ] Check progress bars

**Expected Results**:
- Sky renders smoothly (60fps)
- Stars twinkle naturally
- Tap detection works accurately
- Modal is readable and beautiful
- No lag when scrolling cards

**Screenshot**: Take full-screen screenshot of sky

---

### 6. Notifications Permission ⭐ MEDIUM PRIORITY

**What to Test**:
- [ ] Navigate to OnboardingNotifications screen
- [ ] Read all 4 benefit cards
- [ ] Tap "Enable Notifications"
- [ ] Verify iOS/Android permission dialog appears
- [ ] Grant permission
- [ ] Verify navigation continues
- [ ] Check Settings > Notifications (device settings)
- [ ] Confirm app has notification permission

**Expected Results**:
- UI is clear and convincing
- Permission dialog appears
- Permission is granted correctly
- No crashes

**Screenshot**: Permission dialog

---

### 7. Performance Tests ⭐ HIGH PRIORITY

**What to Test**:
- [ ] Navigate between screens rapidly
- [ ] Check frame rate during animations
- [ ] Monitor battery usage over 10 minutes
- [ ] Check memory usage in dev tools
- [ ] Test with poor network (3G simulation)
- [ ] Test with airplane mode

**Expected Results**:
- No dropped frames
- Smooth 60fps animations
- Battery usage is normal
- Memory stable (no leaks)
- Graceful offline handling

**Tools**:
- iOS: Xcode Instruments (Time Profiler, Network)
- Android: Android Studio Profiler

---

### 8. Edge Cases ⭐ MEDIUM PRIORITY

**What to Test**:
- [ ] Force close app and reopen
- [ ] Test on different screen sizes
- [ ] Test with accessibility features (large text)
- [ ] Test with VoiceOver/TalkBack
- [ ] Rotate device (if supported)
- [ ] Background app and return
- [ ] Test with low battery mode

**Expected Results**:
- State persists correctly
- Layouts adapt to screen sizes
- Accessibility works
- No crashes on rotation
- Background transitions smoothly

---

## 🐛 Common Issues & Fixes

### AI Chat

**Issue**: "No response from AI"
- **Check**: OpenAI API key is set correctly
- **Check**: Device has internet connection
- **Check**: Console logs for errors
- **Fix**: Fallback should work regardless

**Issue**: "Loading forever"
- **Check**: Network timeout settings
- **Fix**: Add timeout to API calls (30s max)

### Challenges

**Issue**: "Challenges not loading"
- **Check**: challengesService initialized
- **Fix**: Verify mock data is present

### Leaderboard

**Issue**: "User not highlighted"
- **Check**: User ID matches in leaderboard data
- **Fix**: Update mock data to include current user

### Constellation Sky

**Issue**: "Stars not appearing"
- **Check**: constellationService initialized
- **Check**: At least one star has been awarded
- **Fix**: Award test star manually

**Issue**: "Poor performance/lag"
- **Check**: Number of stars (should handle 100+)
- **Optimize**: Reduce animation complexity on older devices

### Notifications

**Issue**: "Permission not granted"
- **Check**: User actually tapped "Allow"
- **Check**: Device settings
- **Fix**: Add prompt to go to settings

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | Method |
|--------|--------|--------|
| Screen Navigation | <100ms | Time between tap and screen change |
| API Response | <2s | Time to receive AI response |
| Animation FPS | 60fps | Monitor during animations |
| Memory Usage | <150MB | Check in dev tools |
| Battery Drain | <5%/hour | Monitor over 30 min |
| Cold Start | <3s | Time from tap to first screen |

### How to Measure

**iOS (Xcode)**:
1. Product > Profile > Time Profiler
2. Record while using app
3. Check CPU usage per screen
4. Verify no memory leaks in Leaks instrument

**Android (Android Studio)**:
1. View > Tool Windows > Profiler
2. Select app process
3. Monitor CPU, Memory, Network
4. Check for memory leaks

---

## 📸 Required Screenshots

For documentation and bug reports:

1. **Home Screen** - Shows level badge
2. **AI Chat** - Conversation in progress
3. **Challenges Screen** - Active challenges
4. **Leaderboard** - Top 3 podium
5. **My Sky Screen** - Full constellation sky
6. **XP Toast** - +10 XP animation (if possible)
7. **Notification Permission** - System dialog
8. **Star Detail Modal** - Tapped star info

---

## 🧪 Test Scenarios

### Scenario 1: New User Journey
1. Start app
2. Complete onboarding
3. See notification permission screen
4. Grant permission
5. Arrive at Home
6. See level badge (Lv 1)
7. Tap 🏆 Challenges
8. Join a challenge
9. Tap level badge → see leaderboard
10. Navigate to My Sky
11. See empty sky (no stars yet)

### Scenario 2: Active User
1. Open app (skip onboarding)
2. See Home with stars: 25
3. Complete focus session
4. See +10 XP toast
5. Check My Sky
6. See new star in sky
7. Tap star → see details
8. Check constellation progress
9. Navigate to challenges
10. Complete challenge → +100 XP

### Scenario 3: Streak Break
1. Simulate 7-day streak
2. Break streak (reset to 0)
3. Open My Sky
4. Verify cloud cover appears
5. Restore streak (1 day)
6. Cloud cover reduces
7. Reach 7 days
8. Cloud cover clears

---

## 🔍 Detailed Feature Tests

### AI Chat - Deep Test

**Test 1: Context Retention**
1. Send: "I love coffee"
2. Send: "What did I just say?"
3. Expected: AI references coffee

**Test 2: Fallback**
1. Turn off WiFi
2. Send message
3. Expected: Fallback response appears
4. Turn on WiFi
5. Send message
6. Expected: OpenAI response resumes

**Test 3: Long Conversation**
1. Send 10+ messages
2. Verify no slowdown
3. Check memory usage
4. Expected: Performance stable

### Constellation Sky - Deep Test

**Test 1: Star Award**
1. Award 5 stars via console
2. Open My Sky
3. Expected: 5 new stars appear
4. Expected: Twinkle animation active

**Test 2: Constellation Progress**
1. Award 15 stars to "Deep Work"
2. Check progress: 50%
3. Award 15 more
4. Expected: Constellation completes
5. Expected: Completion celebration (console log)

**Test 3: Sky Features**
1. Set streak to 30 days
2. Open My Sky
3. Expected: Aurora effect visible
4. Award 100 total stars
5. Expected: Shooting stars appear

---

## 📋 Sign-Off Checklist

Before considering testing complete:

### Critical (Must Pass)
- [ ] App launches without crash
- [ ] All screens navigate correctly
- [ ] AI Chat works (OpenAI or fallback)
- [ ] Challenges load and display
- [ ] Leaderboard loads and displays
- [ ] Level badge shows correct info
- [ ] No major visual glitches

### Important (Should Pass)
- [ ] Animations are smooth (no lag)
- [ ] XP toasts appear correctly
- [ ] My Sky renders without issues
- [ ] Star tap detection works
- [ ] Notification permission flow works
- [ ] No memory leaks after 10 min

### Nice to Have (Can Fix Later)
- [ ] Perfect 60fps everywhere
- [ ] Battery usage optimized
- [ ] Accessibility fully supported
- [ ] All edge cases handled
- [ ] Offline mode works perfectly

---

## 🚨 Critical Bugs to Watch For

1. **App Crashes**
   - On navigation
   - On API call
   - On animation start
   
2. **Memory Leaks**
   - After 10+ min of use
   - After navigating 20+ times
   - After awarding 100+ stars

3. **Performance Degradation**
   - Lag after 5 min
   - Animations slow down
   - Touch responses delayed

4. **Data Loss**
   - XP not persisting
   - Stars disappearing
   - Level resetting

5. **Visual Glitches**
   - Text overlapping
   - Images not loading
   - Colors incorrect
   - Animations stuttering

---

## 📝 Bug Report Template

If you find issues:

```markdown
**Bug Title**: [Short description]

**Device**: iPhone 14 Pro / Pixel 7
**OS Version**: iOS 17.1 / Android 14
**App Version**: 1.0.0

**Steps to Reproduce**:
1. Open app
2. Navigate to X
3. Tap Y
4. Observe Z

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach screenshots]

**Console Logs**:
[Paste relevant logs]

**Frequency**:
- [ ] Always
- [ ] Sometimes (50%)
- [ ] Rare (<10%)

**Severity**:
- [ ] Critical (blocks usage)
- [ ] Major (impacts experience)
- [ ] Minor (cosmetic)
```

---

## ✅ Final Test Report

After completing all tests:

**Date**: [Date]  
**Tester**: [Name]  
**Device**: [iPhone X / Pixel X]  
**OS**: [iOS 17 / Android 14]  

**Pass Rate**: __/40 tests passed

**Critical Issues**: [None / List]  
**Major Issues**: [None / List]  
**Minor Issues**: [None / List]  

**Overall Assessment**:
- [ ] Ready for production
- [ ] Needs bug fixes first
- [ ] Needs optimization first

**Recommendations**:
[Any suggestions for improvements]

---

## 🎯 Success Criteria

Testing is successful when:
- ✅ No critical bugs
- ✅ All major features work
- ✅ Performance is smooth (no lag)
- ✅ UI looks good on test devices
- ✅ No crashes after 30 min use
- ✅ Users can complete key flows

**Ready to ship!** 🚀

---

## 📞 Need Help?

If you encounter issues during testing:
1. Check console logs in dev tools
2. Review error messages carefully
3. Test on simulator first to isolate device-specific issues
4. Compare with documentation
5. Check if it's a known limitation

**Common Test Devices**:
- iOS: iPhone 12+, iOS 15+
- Android: Pixel 5+, Samsung S21+, Android 11+

---

**Testing Time Estimate**: 1-2 hours for thorough testing  
**Required**: At least one physical device (iOS or Android)  
**Optional**: Both iOS and Android for full coverage

Good luck with testing! 🧪✨
