# Unscroller Production Audit Report

**Date:** November 7, 2025  
**Status:** ⚠️ **CRITICAL ISSUES FOUND**  
**Ready for Production:** ❌ **NO** (requires fixes)

---

## 🔴 CRITICAL ISSUES

### 1. **Multi-Tenancy Security - CRITICAL**
**Status:** ❌ **BROKEN**

**Problem:**
- RLS (Row Level Security) policies use `USING (true)` and `WITH CHECK (true)`
- This allows ANY user to access ANY other user's data
- NOT multi-tenant secure!

**Location:**
- `/apps/backend/src/db/migrations/004_home_features.sql`
- Lines 61-98: All RLS policies

**Current Code:**
```sql
CREATE POLICY user_streaks_select ON user_streaks
  FOR SELECT USING (true);  -- ❌ ALLOWS ALL ACCESS
```

**Required Fix:**
```sql
CREATE POLICY user_streaks_select ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);  -- ✅ SECURE

CREATE POLICY user_streaks_insert ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);  -- ✅ SECURE

CREATE POLICY user_streaks_update ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);  -- ✅ SECURE
```

**Impact:** HIGH - Data breach risk, violates privacy laws
**Priority:** 🔴 **IMMEDIATE FIX REQUIRED**

---

### 2. **Missing Core Authentication Table**
**Status:** ❌ **MISSING**

**Problem:**
- No `users` table migration
- No auth.users integration with Supabase Auth
- Foreign key constraints not defined

**Required:**
- Create migration `001_auth_users.sql`
- Set up Supabase Auth integration
- Add foreign key constraints to all user_id columns

**Impact:** HIGH - App cannot function without user management
**Priority:** 🔴 **CRITICAL**

---

### 3. **App Store Privacy Requirements - INCOMPLETE**
**Status:** ⚠️ **MISSING**

#### iOS Missing (Info.plist):
- ❌ `NSCameraUsageDescription` (if using camera)
- ❌ `NSPhotoLibraryUsageDescription` (if using photos)
- ❌ `NSUserTrackingUsageDescription` (REQUIRED for iOS 14.5+)
- ❌ `NSLocationWhenInUseUsageDescription` (if tracking)
- ❌ Privacy manifest (PrivacyInfo.xcprivacy) - **REQUIRED since iOS 17**

#### Android Missing (AndroidManifest.xml):
- ⚠️ Storage permissions (READ/WRITE_EXTERNAL_STORAGE) - deprecated for Android 13+
- ❌ Missing data safety declarations
- ⚠️ `android:allowBackup="false"` - should be true with encrypted backup

**Priority:** 🟠 **HIGH** (required for app store approval)

---

### 4. **Backend-Frontend Integration**
**Status:** ⚠️ **INCOMPLETE**

**Problem:**
- Frontend screens don't call backend APIs
- No API service layer for new screens (Profile, Calendar, Challenges, etc.)
- Mock data everywhere, no real data fetching

**Missing API Services:**
- ❌ ProfileService
- ❌ NotificationsService  
- ❌ JournalService
- ❌ CalendarService
- ❌ ChallengesService
- ❌ MessagesService
- ❌ GoalsService

**Current:**
```typescript
// CheckInScreen.tsx - Using mock data
const [streakDays, setStreakDays] = useState(45);
```

**Required:**
```typescript
// Should fetch from API
const { data: streak } = useQuery('streak', () => 
  api.get('/home/streak')
);
```

**Priority:** 🟠 **HIGH**

---

## 🟡 IMPORTANT ISSUES

### 5. **Environment Variables Security**
**Status:** ⚠️ **NEEDS ATTENTION**

**Problem:**
- Placeholder values in environment.ts
- No .env.example for mobile app
- API keys hardcoded as fallbacks

**Files:**
- `/apps/mobile/src/config/environment.ts`
- Missing: `/apps/mobile/.env.example`

**Required:**
Create `.env.example`:
```bash
# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your-anon-key

# RevenueCat
REACT_APP_REVENUECAT_IOS=your-ios-key
REACT_APP_REVENUECAT_ANDROID=your-android-key

# API
REACT_APP_API_URL=https://api.unscroller.app
```

**Priority:** 🟡 **MEDIUM**

---

### 6. **Backend Database Migrations**
**Status:** ⚠️ **INCOMPLETE**

**Current Migrations:**
- ✅ `003_onboarding_schema.sql`
- ✅ `004_home_features.sql`

**Missing Migrations:**
- ❌ `001_auth_users.sql` - Core users table
- ❌ `002_profiles.sql` - User profiles
- ❌ `005_community.sql` - Posts, comments, likes
- ❌ `006_social.sql` - Friends, followers, messages
- ❌ `007_achievements.sql` - Trophies, challenges, goals
- ❌ `008_content.sql` - Journal, resources, notifications

**Priority:** 🟡 **MEDIUM**

---

### 7. **App Bundle Identifiers**
**Status:** ⚠️ **NEEDS UPDATE**

**Current:**
- iOS: `org.name.CreatorMode` (Info.plist line 60)
- Android: Not checked

**Should be:**
- iOS: `com.unscroller.app` or similar
- Android: `com.unscroller.app`

**Priority:** 🟡 **MEDIUM**

---

## 🟢 WORKING CORRECTLY

### 8. **Supabase Client Setup**
**Status:** ✅ **GOOD**

- Proper MMKV storage integration
- Auto token refresh enabled
- Session persistence working
- Graceful fallback when not configured

**File:** `/apps/mobile/src/services/supabase.ts`

---

### 9. **Navigation Structure**
**Status:** ✅ **EXCELLENT**

- All 75 screens properly registered
- TypeScript types correctly defined
- Deep linking configured
- Cross-platform compatible

**File:** `/apps/mobile/src/navigation/AppNavigator.tsx`

---

### 10. **Backend Module Structure**
**Status:** ✅ **GOOD**

- Clean NestJS architecture
- Proper module separation
- Conditional loading based on env
- Home module properly integrated

**File:** `/apps/backend/src/app.module.ts`

---

## 📋 App Store Compliance Checklist

### iOS App Store Requirements:

#### REQUIRED for Approval:
- [ ] Privacy Nutrition Labels (App Privacy Report)
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] App Store Connect metadata
- [ ] Screenshots (6.5", 6.7", 12.9" displays)
- [ ] App Preview videos (optional but recommended)
- [ ] Privacy manifest file (PrivacyInfo.xcprivacy)
- [ ] NSUserTrackingUsageDescription (if tracking)
- [ ] Data collection disclosure
- [ ] Sign in with Apple (if using other social logins)

#### Technical:
- [ ] Valid provisioning profile
- [ ] App signing certificates
- [ ] Unique bundle identifier
- [ ] Version number compliance
- [ ] iOS 15.0+ minimum deployment target (current: check)

---

### Android Play Store Requirements:

#### REQUIRED for Approval:
- [ ] Privacy Policy URL
- [ ] Data Safety section completed
- [ ] App content rating questionnaire
- [ ] Target API level 34+ (Android 14+)
- [ ] Screenshots (phone, tablet, TV if applicable)
- [ ] Feature graphic (1024x500)
- [ ] High-res icon (512x512)
- [ ] Store listing content

#### Technical:
- [ ] Signed APK/AAB with release keystore
- [ ] ProGuard/R8 enabled for production
- [ ] Removed unnecessary permissions
- [ ] Updated to scoped storage (Android 11+)
- [ ] Proper app bundle id

---

## 🔧 FIXES REQUIRED (Immediate)

### Fix 1: Secure RLS Policies

**File:** `/apps/backend/src/db/migrations/004_home_features.sql`

Replace all RLS policies with:

```sql
-- Drop existing insecure policies
DROP POLICY IF EXISTS user_streaks_select ON user_streaks;
DROP POLICY IF EXISTS user_streaks_insert ON user_streaks;
DROP POLICY IF EXISTS user_streaks_update ON user_streaks;
DROP POLICY IF EXISTS scroll_free_time_select ON scroll_free_time;
DROP POLICY IF EXISTS scroll_free_time_insert ON scroll_free_time;
DROP POLICY IF EXISTS scroll_free_time_update ON scroll_free_time;
DROP POLICY IF EXISTS creation_progress_select ON creation_progress;
DROP POLICY IF EXISTS creation_progress_insert ON creation_progress;
DROP POLICY IF EXISTS creation_progress_update ON creation_progress;
DROP POLICY IF EXISTS daily_check_ins_select ON daily_check_ins;
DROP POLICY IF EXISTS daily_check_ins_insert ON daily_check_ins;
DROP POLICY IF EXISTS daily_check_ins_update ON daily_check_ins;

-- Create SECURE multi-tenant policies
CREATE POLICY user_streaks_select ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_streaks_insert ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_streaks_update ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY scroll_free_time_select ON scroll_free_time
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY scroll_free_time_insert ON scroll_free_time
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY scroll_free_time_update ON scroll_free_time
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY creation_progress_select ON creation_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY creation_progress_insert ON creation_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY creation_progress_update ON creation_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY daily_check_ins_select ON daily_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY daily_check_ins_insert ON daily_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY daily_check_ins_update ON daily_check_ins
  FOR UPDATE USING (auth.uid() = user_id);
```

---

### Fix 2: Add Privacy Manifest (iOS 17+ Required)

**File:** `/apps/mobile/ios/CreatorMode/PrivacyInfo.xcprivacy` (CREATE NEW)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeUserID</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

---

### Fix 3: Update Info.plist with Required Descriptions

**File:** `/apps/mobile/ios/CreatorMode/Info.plist`

Add before `</dict>`:

```xml
<!-- Privacy Descriptions -->
<key>NSUserTrackingUsageDescription</key>
<string>We use tracking to provide personalized progress insights and improve your experience</string>
<key>NSCameraUsageDescription</key>
<string>Take photos to share your builds and progress with the community</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Access photos to share your projects and achievements</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save progress screenshots and achievement badges</string>
```

---

### Fix 4: Update Android Permissions (Modern Approach)

**File:** `/apps/mobile/android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  
  <!-- Modern Android 13+ approach - request only when needed -->
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  
  <!-- Remove deprecated storage permissions for Android 13+ -->
  <!-- Use scoped storage instead -->

  <queries>
    <intent>
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="https" />
    </intent>
  </queries>

  <application 
    android:name=".MainApplication" 
    android:label="@string/app_name" 
    android:icon="@mipmap/ic_launcher" 
    android:roundIcon="@mipmap/ic_launcher_round" 
    android:allowBackup="true"
    android:fullBackupContent="@xml/backup_rules"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="false">
    
    <activity 
      android:name=".MainActivity" 
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode" 
      android:launchMode="singleTask" 
      android:windowSoftInputMode="adjustResize" 
      android:theme="@style/Theme.App.SplashScreen" 
      android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
      
      <!-- Deep linking support -->
      <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="unscroller.app" />
        <data android:scheme="unscroller" />
      </intent-filter>
    </activity>
    
    <activity 
      android:name="com.facebook.react.devsupport.DevSettingsActivity" 
      android:exported="false"/>
  </application>
</manifest>
```

---

## 📊 Summary

### Security: 🔴 **CRITICAL**
- RLS policies must be fixed immediately
- Data breach risk until fixed
- Not production-ready

### Multi-Tenancy: 🔴 **BROKEN**
- All user data accessible by everyone
- Requires immediate RLS policy update

### App Store Readiness: 🟠 **60%**
- Missing privacy manifests
- Missing required descriptions
- Bundle IDs need updating

### Backend-Frontend Integration: 🟠 **40%**
- APIs exist but not called from frontend
- Need API service layer
- Most screens use mock data

### Overall Status: ❌ **NOT READY**

---

## ✅ Action Plan (Priority Order)

### IMMEDIATE (Today):
1. ✅ Fix RLS policies to use `auth.uid()`
2. ✅ Create auth users migration
3. ✅ Add privacy manifest (iOS)
4. ✅ Update Info.plist descriptions

### HIGH (This Week):
5. ⬜ Create API service layer for all screens
6. ⬜ Integrate frontend with backend APIs
7. ⬜ Add missing database migrations
8. ⬜ Update bundle identifiers

### MEDIUM (Before Launch):
9. ⬜ Complete app store metadata
10. ⬜ Add privacy policy & terms
11. ⬜ Test multi-tenant isolation
12. ⬜ Security audit
13. ⬜ Performance testing

---

**Next Step:** Apply immediate fixes to make app production-ready and multi-tenant secure.
