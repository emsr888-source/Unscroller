import { Platform, Alert, Linking } from 'react-native';
import { createSafeStorage } from '../lib/safeStorage';

const shieldStorage = createSafeStorage('screenTime-shield-storage');
const SHIELD_STATUS_KEY = 'screenTimeShield_enabled';

export interface ShieldConfig {
  enabled: boolean;
  blockedApps: string[];
  lastUpdated: string;
}

export class ScreenTimeShieldService {
  private static instance: ScreenTimeShieldService;
  private config: ShieldConfig = {
    enabled: false,
    blockedApps: [],
    lastUpdated: new Date().toISOString(),
  };

  static getInstance(): ScreenTimeShieldService {
    if (!ScreenTimeShieldService.instance) {
      ScreenTimeShieldService.instance = new ScreenTimeShieldService();
    }
    return ScreenTimeShieldService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const stored = shieldStorage.getString(SHIELD_STATUS_KEY);
      if (stored) {
        this.config = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load shield config:', error);
    }
  }

  async getConfig(): Promise<ShieldConfig> {
    return { ...this.config };
  }

  async enableShields(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await this.enableiOSScreenTime();
      } else {
        return await this.enableAndroidFocusMode();
      }
    } catch (error) {
      console.error('Failed to enable shields:', error);
      return false;
    }
  }

  async disableShields(): Promise<boolean> {
    try {
      this.config.enabled = false;
      await this.saveConfig();
      
      if (Platform.OS === 'ios') {
        return await this.disableiOSScreenTime();
      } else {
        return await this.disableAndroidFocusMode();
      }
    } catch (error) {
      console.error('Failed to disable shields:', error);
      return false;
    }
  }

  private async enableiOSScreenTime(): Promise<boolean> {
    // iOS Screen Time integration
    // This would require iOS Screen Time API integration
    // For now, we'll guide user to manual setup
    
    Alert.alert(
      'Enable Screen Time Shield',
      'To block native apps on iOS, you need to:\n\n1. Open Settings → Screen Time\n2. Tap "App Limits"\n3. Add limits for social apps:\n   • Instagram\n   • TikTok\n   • X (Twitter)\n   • YouTube\n   • Facebook\n\nSet daily limits and enable "Block at End of Limit"',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => this.openiOSSettings()
        },
        { 
          text: 'I Did It', 
          onPress: async () => {
            this.config.enabled = true;
            this.config.blockedApps = ['instagram', 'tiktok', 'x', 'youtube', 'facebook'];
            await this.saveConfig();
            return true;
          }
        }
      ]
    );
    
    return false; // User needs to complete manual setup
  }

  private async disableiOSScreenTime(): Promise<boolean> {
    Alert.alert(
      'Disable Screen Time Shield',
      'To disable app blocking:\n\n1. Open Settings → Screen Time\n2. Tap "App Limits"\n3. Remove social app limits',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => this.openiOSSettings()
        },
        { 
          text: 'I Did It', 
          onPress: () => true
        }
      ]
    );
    
    return false; // User needs to complete manual setup
  }

  private async enableAndroidFocusMode(): Promise<boolean> {
    // Android Focus Mode integration
    // This would require Android Digital Wellbeing API integration
    // For now, we'll guide user to manual setup
    
    Alert.alert(
      'Enable Focus Mode Shield',
      'To block native apps on Android, you need to:\n\n1. Open Settings → Digital Wellbeing\n2. Tap "Focus Mode"\n3. Select "Work" or create custom mode\n4. Add these apps to block:\n   • Instagram\n   • TikTok\n   • X (Twitter)\n   • YouTube\n   • Facebook\n\nEnable Focus Mode when using Unscroller',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => this.openAndroidSettings()
        },
        { 
          text: 'I Did It', 
          onPress: async () => {
            this.config.enabled = true;
            this.config.blockedApps = ['com.instagram.android', 'com.zhiliaoapp.musically', 'com.twitter.android', 'com.google.android.youtube', 'com.facebook.katana'];
            await this.saveConfig();
            return true;
          }
        }
      ]
    );
    
    return false; // User needs to complete manual setup
  }

  private async disableAndroidFocusMode(): Promise<boolean> {
    Alert.alert(
      'Disable Focus Mode Shield',
      'To disable app blocking:\n\n1. Open Settings → Digital Wellbeing\n2. Tap "Focus Mode"\n3. Turn off Focus Mode or remove apps from blocked list',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => this.openAndroidSettings()
        },
        { 
          text: 'I Did It', 
          onPress: () => true
        }
      ]
    );
    
    return false; // User needs to complete manual setup
  }

  private async openiOSSettings(): Promise<void> {
    try {
      await Linking.openURL('App-Prefs:SCREEN_TIME');
    } catch (error) {
      // Fallback to general settings
      await Linking.openURL('App-Prefs:');
    }
  }

  private async openAndroidSettings(): Promise<void> {
    try {
      await Linking.openURL('android.settings.DIGITAL_WELLBEING_SETTINGS');
    } catch (error) {
      // Fallback to general settings
      await Linking.openURL('android.settings.SETTINGS');
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      this.config.lastUpdated = new Date().toISOString();
      shieldStorage.set(SHIELD_STATUS_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save shield config:', error);
    }
  }

  async isShieldEnabled(): Promise<boolean> {
    return this.config.enabled;
  }

  async getBlockedApps(): Promise<string[]> {
    return [...this.config.blockedApps];
  }

  // Future: Automatic app launch interception
  async setupAppInterception(): Promise<void> {
    if (Platform.OS === 'android') {
      // Would require Android Accessibility Service
      console.log('Android app interception not yet implemented');
    } else {
      // Would require iOS Screen Time API
      console.log('iOS app interception not yet implemented');
    }
  }
}
