# Screen Time Shields Feature

## Overview
The Screen Time Shields feature helps users block native social media apps on iOS and Android, forcing them to use the filtered Unscroller experience instead.

## How It Works

### iOS Implementation
- Guides users to set up **iOS Screen Time** app limits
- Blocks: Instagram, TikTok, X (Twitter), YouTube, Facebook
- Users set daily time limits and enable "Block at End of Limit"
- When time limit is reached, apps are blocked and user is prompted to use Unscroller

### Android Implementation  
- Guides users to set up **Android Focus Mode**
- Blocks: Instagram, TikTok, X (Twitter), YouTube, Facebook
- Users create custom focus mode or use Work mode
- When focus mode is active, native apps are blocked

## User Experience

1. **Enable Shields**: User taps "Enable Shields" in Settings
2. **Platform Guide**: Step-by-step instructions for iOS/Android setup
3. **Manual Setup**: User completes native OS configuration  
4. **Confirmation**: User confirms setup is complete
5. **Active Status**: App shows shields are active with blocked apps count

## Future Enhancements

### Automatic App Interception (Not Yet Implemented)
- **Android**: Accessibility Service to detect app launches and redirect to Unscroller
- **iOS**: Screen Time API integration for automatic blocking
- **Smart Routing**: Allow native app for content creation, block for mindless browsing

### Smart Redirect Logic
- **Block**: Feed browsing, Explore/Search, Reels/Stories consumption
- **Allow**: Content creation (posting), Direct messaging, Business tools

## Technical Implementation

### Services
- `ScreenTimeShieldService`: Main service class
- Platform-specific setup guides
- AsyncStorage for configuration persistence

### Blocked Apps
- **iOS**: Instagram, TikTok, X, YouTube, Facebook (app names)
- **Android**: com.instagram.android, com.zhiliaoapp.musically, com.twitter.android, com.google.android.youtube, com.facebook.katana (package names)

### Configuration Storage
```typescript
interface ShieldConfig {
  enabled: boolean;
  blockedApps: string[];
  lastUpdated: string;
}
```

## Usage
1. Go to Settings → Screen Time Shields
2. Tap "Enable Shields" 
3. Follow platform-specific setup guide
4. Confirm native OS setup is complete
5. Shields are now active!

## Limitations
- Currently requires manual setup in native OS settings
- No automatic app launch interception (future enhancement)
- User must complete native OS configuration for shields to work

## Benefits
- Prevents bypassing content filters via native apps
- Encourages use of filtered Unscroller experience  
- Reduces mindless scrolling on native platforms
- Maintains access to essential features (messaging, content creation)
