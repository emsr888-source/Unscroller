import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldSetBadge: false,
    shouldPlaySound: true,
  }),
});

type NotificationTrigger =
  | { type: 'time'; hour: number; minute: number; repeats?: boolean }
  | { type: 'interval'; seconds: number; repeats?: boolean }
  | { type: 'calendar'; weekday?: number; hour?: number; minute?: number; repeats?: boolean };

interface NotificationSchedule {
  id: string;
  title: string;
  body: string;
  trigger: NotificationTrigger;
  data?: Record<string, unknown>;
}

interface NotificationSettings {
  enabled: boolean;
  focusReminders: boolean;
  streakReminders: boolean;
  milestoneNotifications: boolean;
  communityUpdates: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

const SETTINGS_STORAGE_KEY = '@unscroller:notification-settings';
const SCHEDULE_STORAGE_KEY = '@unscroller:notification-schedules';

class NotificationService {
  private settings: NotificationSettings = {
    enabled: true,
    focusReminders: true,
    streakReminders: true,
    milestoneNotifications: true,
    communityUpdates: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  };

  private scheduledNotifications: Record<string, string> = {};
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    await this.loadSettings();
    await this.loadScheduledNotifications();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== Notifications.AuthorizationStatus.GRANTED) {
      const requestResult = await Notifications.requestPermissionsAsync();
      finalStatus = requestResult.status;
    }

    if (finalStatus !== Notifications.AuthorizationStatus.GRANTED) {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    this.initialized = true;
    return true;
  }

  async scheduleSmartReminders(userContext: {
    typicalScrollTime?: string;
    preferredFocusTime?: string;
    streakDays: number;
    timezone: string;
  }): Promise<void> {
    const granted = await this.ensureInitialized();
    if (!granted) {
      throw new Error('Notifications are not enabled.');
    }

    const { typicalScrollTime, preferredFocusTime, streakDays } = userContext;

    if (typicalScrollTime && this.settings.focusReminders) {
      await this.scheduleNotification({
        id: 'intercept-scroll',
        title: 'Ready to build instead? 🚀',
        body: 'Start a focus session or check in with your goals',
        trigger: {
          type: 'time',
          hour: this.parseHour(typicalScrollTime),
          minute: 50,
          repeats: true,
        },
        data: { action: 'open_focus' },
      });
    }

    if (preferredFocusTime && this.settings.focusReminders) {
      await this.scheduleNotification({
        id: 'midday-focus',
        title: 'Ready for a focus session? ⚡',
        body: '25 minutes can save you from the afternoon slump!',
        trigger: {
          type: 'time',
          hour: this.parseHour(preferredFocusTime),
          minute: 0,
          repeats: true,
        },
        data: { action: 'start_focus_session' },
      });
    }

    await this.scheduleNotification({
      id: 'evening-winddown',
      title: 'Unwind without scrolling tonight 🌙',
      body: 'Try journaling or a 5-min meditation instead',
      trigger: {
        type: 'time',
        hour: 20,
        minute: 30,
        repeats: true,
      },
      data: { action: 'open_meditation' },
    });

    if (streakDays > 0 && this.settings.streakReminders) {
      await this.scheduleNotification({
        id: 'streak-protection',
        title: `Protect your ${streakDays}-day streak! 🔥`,
        body: 'Check in before midnight to keep it alive',
        trigger: {
          type: 'time',
          hour: 21,
          minute: 0,
          repeats: true,
        },
        data: { action: 'open_checkin' },
      });
    }
  }

  async sendMilestoneCelebration(milestone: {
    type: 'streak' | 'time_saved' | 'focus_hours';
    value: number;
  }): Promise<void> {
    const { type, value } = milestone;
    let title = '';
    let body = '';

    switch (type) {
      case 'streak':
        if (value === 7) {
          title = '🎉 ONE WEEK FEED-FREE!';
          body = 'You did it! 7 days is huge. Keep building!';
        } else if (value === 30) {
          title = '🏆 30 DAYS TRANSFORMED!';
          body = "You've officially built a new habit. Incredible!";
        } else if (value === 90) {
          title = '🌟 90-DAY MASTER!';
          body = "You're in the top 1%. Share your story!";
        }
        break;
      case 'time_saved':
        if (value >= 100) {
          title = '⏰ 100+ Hours Reclaimed!';
          body = `That's ${Math.floor(value / 8)} full workdays back in your life!`;
        } else if (value >= 50) {
          title = '🎯 50 Hours Saved!';
          body = 'Imagine what you can build with that time!';
        }
        break;
      case 'focus_hours':
        if (value >= 100) {
          title = '💪 100 Focus Hours!';
          body = 'Your concentration is supercharged. Keep going!';
        }
        break;
      default:
        break;
    }

    if (title && this.settings.milestoneNotifications) {
      await this.sendNotification({
        id: `milestone-${type}-${value}`,
        title,
        body,
        data: { action: 'open_progress', milestone: { type, value } },
      });
    }
  }

  async sendCommunityNotification(notification: {
    type: 'new_post' | 'comment' | 'challenge_invite' | 'buddy_message';
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    if (!this.settings.communityUpdates) {
      return;
    }

    await this.sendNotification({
      id: `community-${Date.now()}`,
      title: notification.title,
      body: notification.body,
      data: { action: 'open_community', ...notification.data },
    });
  }

  async sendEncouragement(context: {
    urgeDetected?: boolean;
    streakAtRisk?: boolean;
    longInactive?: boolean;
  }): Promise<void> {
    if (context.urgeDetected) {
      await this.sendNotification({
        id: 'urge-support',
        title: 'Feeling an urge? 💪',
        body: "It will pass in 15 minutes. You've got this!",
        data: { action: 'open_ai_chat' },
      });
    }

    if (context.streakAtRisk) {
      await this.sendNotification({
        id: 'streak-risk',
        title: "Don't lose your streak! 🔥",
        body: 'Quick check-in to keep your momentum alive',
        data: { action: 'open_checkin' },
      });
    }

    if (context.longInactive) {
      await this.sendNotification({
        id: 'comeback',
        title: 'We miss you! 👋',
        body: "Your goals are waiting. Let's get back on track.",
        data: { action: 'open_home' },
      });
    }
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  private async sendNotification(notification: {
    id: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    const granted = await this.ensureInitialized();
    if (!granted || !this.settings.enabled || this.isQuietHours()) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      },
      trigger: null,
    });
  }

  private async scheduleNotification(schedule: NotificationSchedule): Promise<void> {
    if (!this.settings.enabled) {
      return;
    }

    await this.cancel(schedule.id);

    const trigger = this.toTriggerInput(schedule.trigger);
    const nativeId = await Notifications.scheduleNotificationAsync({
      content: {
        title: schedule.title,
        body: schedule.body,
        data: schedule.data,
      },
      trigger,
    });

    this.scheduledNotifications[schedule.id] = nativeId;
    await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(this.scheduledNotifications));
  }

  private toTriggerInput(trigger: NotificationTrigger): unknown {
    switch (trigger.type) {
      case 'interval':
        return {
          seconds: trigger.seconds,
          repeats: trigger.repeats ?? false,
        };
      case 'calendar':
        return {
          repeats: trigger.repeats ?? false,
          weekday: trigger.weekday,
          hour: trigger.hour,
          minute: trigger.minute,
        };
      case 'time':
      default:
        return {
          repeats: trigger.repeats ?? true,
          hour: trigger.hour,
          minute: trigger.minute,
        };
    }
  }

  private parseHour(time: string): number {
    return parseInt(time.split(':')[0] ?? '0', 10);
  }

  private isQuietHours(): boolean {
    if (!this.settings.quietHoursStart || !this.settings.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHoursEnd.split(':').map(Number);

    const startTime = (startHour ?? 0) * 60 + (startMin ?? 0);
    const endTime = (endHour ?? 0) * 60 + (endMin ?? 0);

    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('[Notifications] Failed to persist settings:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('[Notifications] Failed to load settings:', error);
    }
  }

  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (stored) {
        this.scheduledNotifications = JSON.parse(stored) ?? {};
      }
    } catch (error) {
      console.warn('[Notifications] Failed to load scheduled notifications:', error);
    }
  }

  async cancelAll(): Promise<void> {
    this.scheduledNotifications = {};
    await AsyncStorage.removeItem(SCHEDULE_STORAGE_KEY);
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  }

  async cancel(id: string): Promise<void> {
    const scheduledId = this.scheduledNotifications[id];
    if (scheduledId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(scheduledId);
      } catch (error) {
        console.warn('[Notifications] Failed to cancel notification:', error);
      }
      delete this.scheduledNotifications[id];
      await AsyncStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(this.scheduledNotifications));
    }
  }

  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    return this.initialize();
  }
}

export const notificationService = new NotificationService();
export default notificationService;
