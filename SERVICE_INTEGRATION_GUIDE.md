# 🔧 Service Integration Guide

**Status**: ✅ All database services created and ready to use!

---

## ✅ What's Ready

I've created database-connected versions of all three services:

1. ✅ **constellationService.database.ts** - Persistent star & constellation data
2. ✅ **challengesService.database.ts** - Real challenges, XP, and leaderboards
3. ✅ **aiService.database.ts** - OpenAI chat with conversation history

---

## 🚀 How to Integrate

### Step 1: Import the Database Services

Replace the mock service imports with database versions:

**Before** (in any screen/component):
```typescript
import { constellationService } from '@/services/constellationService';
import { challengesService } from '@/services/challengesService';
import { aiService } from '@/services/aiService';
```

**After**:
```typescript
import { constellationServiceDB as constellationService } from '@/services/constellationService.database';
import { challengesServiceDB as challengesService } from '@/services/challengesService.database';
import { aiServiceDB as aiService } from '@/services/aiService.database';
```

That's it! The API is the same, but now it saves to the database.

---

## 📝 Usage Examples

### Constellation Service

```typescript
import { constellationServiceDB } from '@/services/constellationService.database';

// Initialize for new user (do this once during onboarding)
await constellationServiceDB.initializeConstellations(userId, ['Work better', 'Sleep better']);

// Award a star
const star = await constellationServiceDB.awardFocusSessionStar(userId, 25);
console.log('Star awarded!', star);

// Get user's sky
const skyState = await constellationServiceDB.getSkyState(userId);
console.log('Total stars:', skyState.totalStars);
console.log('Constellations:', skyState.constellations);

// Get today's stats
const stats = await constellationServiceDB.getTodayStats(userId);
console.log('Stars today:', stats.starsEarned);
console.log('Progress:', stats.constellationProgress);

// Update streak (affects cloud cover)
await constellationServiceDB.updateStreak(userId, 7);
```

### Challenges Service

```typescript
import { challengesServiceDB } from '@/services/challengesService.database';

// Get active challenges
const challenges = await challengesServiceDB.getActiveChallenges(userId);
console.log('Active challenges:', challenges);

// Get available challenges to join
const available = await challengesServiceDB.getAvailableChallenges(userId);
console.log('Can join:', available);

// Join a challenge
const success = await challengesServiceDB.joinChallenge(userId, challengeId);

// Award XP
const xp = await challengesServiceDB.awardXP(userId, {
  type: 'focus_session'
});
console.log('XP awarded:', xp);

// Get user level
const level = await challengesServiceDB.getUserLevel(userId);
console.log('Level:', level.level, level.title);
console.log('XP to next level:', level.xpToNextLevel);

// Get leaderboard
const leaderboard = await challengesServiceDB.getLeaderboard('time_saved', 'weekly');
console.log('Top users:', leaderboard.entries);
```

### AI Chat Service

```typescript
import { aiServiceDB } from '@/services/aiService.database';

// Send a message (automatically saves to database)
const response = await aiServiceDB.sendMessage(userId, 'I'm struggling today');
console.log('AI:', response.message);
console.log('Used OpenAI:', !response.usedFallback);

// Get conversation history
const history = await aiServiceDB.getConversationHistory(userId);
console.log('Previous messages:', history);

// Clear history
await aiServiceDB.clearConversationHistory(userId);

// Get proactive check-in
const checkIn = aiServiceDB.getProactiveCheckIn(streakDays, 25);

// Get celebration message
const celebration = aiServiceDB.getCelebrationMessage({
  type: 'streak',
  value: 7
});
```

---

## 🔧 Integration Checklist

### Update These Files:

#### 1. MySkyScreen.tsx
```typescript
// Change line ~18
import { constellationServiceDB as constellationService } from '@/services/constellationService.database';

// Now getSkyState() will load from database!
```

#### 2. ChallengesScreen.tsx
```typescript
// Change line ~10
import { challengesServiceDB as challengesService } from '@/services/challengesService.database';

// Now getActiveChallenges() will load from database!
```

#### 3. LeaderboardScreen.tsx
```typescript
// Change line ~10
import { challengesServiceDB as challengesService } from '@/services/challengesService.database';

// Now getLeaderboard() will load from database!
```

#### 4. AIChatScreen.tsx
```typescript
// Change line ~15
import { aiServiceDB as aiService } from '@/services/aiService.database';

// Now sendMessage() will save to database!
```

#### 5. HomeScreen.tsx
```typescript
// Change line ~15
import { constellationServiceDB as constellationService } from '@/services/constellationService.database';
import { challengesServiceDB as challengesService } from '@/services/challengesService.database';

// Now level badge will show real data!
```

#### 6. useXP.tsx hook
```typescript
// Change line ~5
import { challengesServiceDB as challengesService } from '@/services/challengesService.database';

// Now XP awards will save to database!
```

---

## ⚠️ Important: User ID

All database methods require a `userId`. Make sure you have the user's ID available:

```typescript
// Get from Supabase auth
import { supabase } from '@/services/supabase';

const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;

if (!userId) {
  console.error('User not authenticated');
  return;
}

// Now use with services
await constellationServiceDB.initializeConstellations(userId, goals);
```

---

## 🧪 Testing

### Test Constellation Service:
```typescript
// Award a test star
const star = await constellationServiceDB.awardFocusSessionStar(userId, 25);
console.log('✅ Star created:', star);

// Reload the app - star should still be there!
const skyState = await constellationServiceDB.getSkyState(userId);
console.log('✅ Stars persist:', skyState.totalStars);
```

### Test Challenges Service:
```typescript
// Award XP
const xp = await challengesServiceDB.awardXP(userId, { type: 'focus_session' });
console.log('✅ XP awarded:', xp);

// Reload the app - XP should still be there!
const level = await challengesServiceDB.getUserLevel(userId);
console.log('✅ XP persists:', level.xp);
```

### Test AI Service:
```typescript
// Send message
const response = await aiServiceDB.sendMessage(userId, 'Hello!');
console.log('✅ AI response:', response.message);

// Reload the app - history should still be there!
const history = await aiServiceDB.getConversationHistory(userId);
console.log('✅ History persists:', history.length, 'messages');
```

---

## 🔄 Migration Strategy

### Option 1: All at Once (Recommended)
Replace all service imports at once and test thoroughly.

### Option 2: Gradual (Safer)
1. Week 1: Constellation service only
2. Week 2: Add challenges service
3. Week 3: Add AI service

### Option 3: Feature Flag (Most Flexible)
```typescript
// config/features.ts
export const USE_DATABASE = process.env.USE_DATABASE === 'true';

// services/index.ts
import { constellationService as mockConstellation } from './constellationService';
import { constellationServiceDB } from './constellationService.database';
import { USE_DATABASE } from '@/config/features';

export const constellationService = USE_DATABASE 
  ? constellationServiceDB 
  : mockConstellation;
```

Then toggle `USE_DATABASE=true` in your environment.

---

## ✅ Success Criteria

After integration, you should see:

1. ✅ **Stars persist** - Close and reopen app, stars are still there
2. ✅ **XP persists** - Level and XP don't reset on restart
3. ✅ **Challenges tracked** - Progress saves across sessions
4. ✅ **Chat history saved** - Previous conversations available
5. ✅ **Leaderboard updates** - Real user rankings (when you add more users)

---

## 🐛 Troubleshooting

### "Supabase not configured" error
Check that `apps/mobile/src/config/environment.ts` has correct credentials:
```typescript
SUPABASE_URL: 'https://jjpzbtdgxyqjykxpujyn.supabase.co'
SUPABASE_ANON_KEY: 'eyJhbGci...'
```

### "User not found" errors
Make sure user profile is created in database:
```sql
-- Check if user exists
SELECT * FROM user_profiles WHERE id = 'user-id-here';

-- Create if missing
INSERT INTO user_profiles (id, username) VALUES ('user-id', 'username');
```

### "Constellation not found" errors
Make sure constellations are initialized:
```typescript
await constellationServiceDB.initializeConstellations(userId, ['Work better']);
```

### OpenAI not working
Check that OpenAI API key is set:
```typescript
// In aiService.database.ts line 14
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-key-here';
```

If not set, it will use fallback responses (which is fine for testing).

---

## 📊 Performance Tips

### 1. Cache User Data
```typescript
// Cache user ID
const userId = await AsyncStorage.getItem('userId');

// Cache level (refresh every 5 minutes)
const cachedLevel = await AsyncStorage.getItem('userLevel');
```

### 2. Optimistic Updates
```typescript
// Show XP toast immediately
showXPToast(+10);

// Save to database in background
challengesServiceDB.awardXP(userId, { type: 'focus_session' });
```

### 3. Batch Operations
```typescript
// Award multiple stars at once
await Promise.all([
  constellationServiceDB.awardFocusSessionStar(userId, 25),
  challengesServiceDB.awardXP(userId, { type: 'focus_session' })
]);
```

---

## 🎯 Next Steps

1. **Update imports** in all screens (see checklist above)
2. **Test each feature** (award stars, XP, send messages)
3. **Verify persistence** (close app, reopen, check data is there)
4. **Monitor errors** (check console for any database errors)
5. **Deploy to TestFlight/Play Store Beta**

---

## 📚 API Reference

### Constellation Service
- `initializeConstellations(userId, goals)` - Set up constellations
- `awardFocusSessionStar(userId, minutes)` - Award star for focus
- `awardTimeSavedStar(userId, minutes)` - Award star for time saved
- `awardGoalStar(userId, description, constellation)` - Award star for goal
- `awardMilestoneStar(userId, description, constellation)` - Award milestone star
- `getSkyState(userId)` - Get all constellations and stars
- `updateStreak(userId, days)` - Update streak (affects cloud cover)
- `getTodayStats(userId)` - Get today's star count

### Challenges Service
- `getActiveChallenges(userId)` - Get user's active challenges
- `getAvailableChallenges(userId)` - Get challenges to join
- `joinChallenge(userId, challengeId)` - Join a challenge
- `leaveChallenge(userId, challengeId)` - Leave a challenge
- `updateChallengeProgress(userId, challengeId, progress)` - Update progress
- `getLeaderboard(metric, period)` - Get rankings
- `awardXP(userId, action)` - Award XP points
- `getUserLevel(userId)` - Get user's level and progress

### AI Service
- `sendMessage(userId, message)` - Send message (saves to DB)
- `getConversationHistory(userId)` - Load previous messages
- `clearConversationHistory(userId)` - Delete history
- `getProactiveCheckIn(streakDays, hoursSinceLastSession)` - Get check-in message
- `getCelebrationMessage(milestone)` - Get celebration message

---

🎉 **Everything is ready! Just update the imports and you're done!** 🎉

**Estimated time**: 30-60 minutes to update all imports and test.
