import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import type {
  AppLimit,
  BlockSet,
  Schedule,
  Task,
  UsageSample,
  UsageSummary,
} from './types';

type AuthorizationResult = {
  authorized: boolean;
  platform: 'ios' | 'android';
  shieldsAvailable: boolean;
};

export interface Spec extends TurboModule {
  authorize(): Promise<AuthorizationResult>;
  pickAppsForBlockSet(blockSetId: string): Promise<BlockSet>;
  startTask(task: Task): Promise<void>;
  stopTask(taskId: string): Promise<void>;
  addSchedule(schedule: Schedule): Promise<void>;
  removeSchedule(scheduleId: string): Promise<void>;
  setAppLimits(limits: AppLimit[]): Promise<void>;
  getUsage(fromTs: number, toTs: number): Promise<UsageSample[]>;
  getUsageSummary(fromTs: number, toTs: number): Promise<UsageSummary>;
  setShieldTheme(blockSetId: string, emoji: string, message: string, backgroundColor?: string): Promise<void>;
  allowOneMinute(appId: string): Promise<void>;
  openPermissionSettings(target: 'usage' | 'accessibility' | 'overlay' | 'app_settings'): Promise<void>;
  getPermissionState(): Promise<{ usage: boolean; accessibility: boolean; overlay: boolean }>;
  showUsageReport(): Promise<void>;
}

export const MODULE_NAME = 'BlockService';

const BlockServiceModule = TurboModuleRegistry.get<Spec>(MODULE_NAME);
const fallback: Spec = {
  authorize: async () => ({ authorized: false, platform: 'ios', shieldsAvailable: false }),
  pickAppsForBlockSet: async blockSetId => ({
    id: blockSetId,
    name: 'Default',
    blockedEmoji: '🚫',
    blockedMessage: '',
    iosTokens: [],
    androidPackages: [],
  }),
  startTask: async () => {},
  stopTask: async () => {},
  addSchedule: async () => {},
  removeSchedule: async () => {},
  setAppLimits: async () => {},
  getUsage: async () => [],
  getUsageSummary: async (fromTs, toTs) => ({
    fromTs,
    toTs,
    totalForegroundMs: 0,
    perApp: [],
  }),
  setShieldTheme: async () => {},
  allowOneMinute: async () => {},
  openPermissionSettings: async () => {},
  getPermissionState: async () => ({ usage: false, accessibility: false, overlay: false }),
  showUsageReport: async () => {},
};

export default BlockServiceModule ?? (fallback as unknown as Spec);
