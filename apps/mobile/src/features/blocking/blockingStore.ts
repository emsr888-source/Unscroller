import { nanoid } from 'nanoid/non-secure';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BlockService, BlockSet, Schedule, Task, AppLimit, UsageSummary } from '@unscroller/block-service';
import { createSafeStorage } from '../../lib/safeStorage';
import { isNativeBlockServiceAvailable, explainNativeLimitation } from '../../lib/platformCapabilities';

export const DEFAULT_BLOCK_BACKGROUND = '#101726';

type BlockSetTemplate = Omit<BlockSet, 'id'> & { id?: string };

const mapNativeError = (error: unknown, scope: 'schedule' | 'limits' | 'task') => {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'block_service_not_implemented') {
      return new Error('Blocking service missing required permission or implementation.');
    }
    if (err.message) {
      return new Error(err.message);
    }
  }
  return new Error(`Unable to complete ${scope} operation. Grant permissions and try again.`);
};

const BLOCK_SET_TEMPLATES: Record<string, BlockSetTemplate> = {
  deep_focus: {
    id: 'deep_focus',
    name: 'Deep Focus',
    blockedEmoji: '🧠',
    blockedMessage: 'Heads down. Messaging and socials are blocked.',
    blockedBackgroundColor: '#111827',
    kind: 'preset',
    iosTokens: [],
    androidPackages: [],
  },
  social_fast: {
    id: 'social_fast',
    name: 'Social Fast',
    blockedEmoji: '📵',
    blockedMessage: 'Social media is off limits until you finish.',
    blockedBackgroundColor: '#1F2937',
    kind: 'preset',
    iosTokens: [],
    androidPackages: [],
  },
  entertainment_freeze: {
    id: 'entertainment_freeze',
    name: 'Entertainment Freeze',
    blockedEmoji: '🎬',
    blockedMessage: 'Streaming and games are paused for now.',
    blockedBackgroundColor: '#2C1810',
    kind: 'preset',
    iosTokens: [],
    androidPackages: [],
  },
};

const makeBlockSetFromTemplate = (template: BlockSetTemplate): BlockSet => ({
  id: template.id ?? nanoid(),
  name: template.name,
  blockedEmoji: template.blockedEmoji,
  blockedMessage: template.blockedMessage,
  blockedBackgroundColor: template.blockedBackgroundColor ?? DEFAULT_BLOCK_BACKGROUND,
  iosTokens: template.iosTokens ?? [],
  androidPackages: template.androidPackages ?? [],
  kind: template.kind ?? 'custom',
  createdAt: template.createdAt ?? Date.now(),
});

export type ActiveTaskState = {
  task: Task;
  startedAt: number;
  remainingMs?: number;
};

export type SessionLimit = {
  id: string;
  blockSetId: string;
  appId: string;
  minutes: number;
};

export interface BlockingState {
  blockSets: Record<string, BlockSet>;
  schedules: Record<string, Schedule>;
  limits: Record<string, AppLimit>;
  sessionLimits: Record<string, SessionLimit>;
  activeTask: ActiveTaskState | null;
  lastUsageSummary: UsageSummary | null;
  lastUsageFetchedAt: number | null;
  serviceAuthorized: boolean;
  shieldsAvailable: boolean;
  blockingPauseUntil: number | null;
  authorize: () => Promise<void>;
  upsertBlockSet: (blockSet: BlockSet) => void;
  removeBlockSet: (blockSetId: string) => void;
  createBlockSetFromTemplate: (
    templateId: string,
    overrides?: Partial<Omit<BlockSet, 'id' | 'iosTokens' | 'androidPackages'>>
  ) => BlockSet | null;
  createCustomBlockSet: (input: {
    name: string;
    blockedEmoji?: string;
    blockedMessage?: string;
    blockedBackgroundColor?: string;
    iosTokens?: string[];
    androidPackages?: string[];
  }) => BlockSet;
  updateBlockSetMeta: (
    blockSetId: string,
    updates: Partial<Pick<BlockSet, 'name' | 'blockedEmoji' | 'blockedMessage' | 'blockedBackgroundColor'>>
  ) => Promise<void>;
  pickAppsForBlockSet: (blockSetId: string) => Promise<BlockSet | null>;
  upsertSchedule: (schedule: Schedule) => Promise<void>;
  removeSchedule: (scheduleId: string) => Promise<void>;
  setLimits: (limits: AppLimit[]) => Promise<void>;
  setOrUpdateLimit: (appId: string, minutesPerDay: number) => Promise<void>;
  setSessionLimit: (blockSetId: string, appId: string, minutes: number) => void;
  pauseBlocking: (durationMinutes: number) => void;
  resumeBlocking: () => void;
  startTask: (task: Task) => Promise<void>;
  stopTask: (taskId: string) => Promise<void>;
  refreshUsageSummary: (fromTs: number, toTs: number) => Promise<void>;
}

const DEFAULT_BLOCK_SET: BlockSet = {
  id: 'default',
  name: 'Focus Sprint',
  blockedEmoji: '🚫',
  blockedMessage: 'Focus mode active. Apps in this set are temporarily blocked.',
  blockedBackgroundColor: DEFAULT_BLOCK_BACKGROUND,
  iosTokens: [],
  androidPackages: [],
  kind: 'custom',
  createdAt: Date.now(),
};

const PRESET_BLOCK_SETS: Record<string, BlockSet> = Object.values(BLOCK_SET_TEMPLATES).reduce(
  (acc, template) => {
    const blockSet = makeBlockSetFromTemplate(template);
    acc[blockSet.id] = blockSet;
    return acc;
  },
  {} as Record<string, BlockSet>
);

const INITIAL_BLOCK_SETS: Record<string, BlockSet> = {
  [DEFAULT_BLOCK_SET.id]: DEFAULT_BLOCK_SET,
  ...PRESET_BLOCK_SETS,
};

export const defaultBlockSet = DEFAULT_BLOCK_SET;
export const DEFAULT_BLOCK_SET_ID = DEFAULT_BLOCK_SET.id;
export const presetBlockSetTemplates = BLOCK_SET_TEMPLATES;

const safeStorage = createSafeStorage('blocking-state');
const warnNativeUnavailable = () => console.warn(explainNativeLimitation('App Blocking'));
let pauseTimer: ReturnType<typeof setTimeout> | null = null;
const clearPauseTimer = () => {
  if (pauseTimer) {
    clearTimeout(pauseTimer);
    pauseTimer = null;
  }
};

const storage = createJSONStorage<BlockingState>(() => ({
  getItem: key => safeStorage.getString(key) ?? null,
  setItem: (key, value) => safeStorage.set(key, value),
  removeItem: key => safeStorage.delete(key),
}));

export const useBlockingStore = create<BlockingState>()(
  persist(
    (set, get) => ({
      blockSets: INITIAL_BLOCK_SETS,
      schedules: {},
      limits: {},
      sessionLimits: {},
      activeTask: null,
      lastUsageSummary: null,
      lastUsageFetchedAt: null,
      serviceAuthorized: false,
      shieldsAvailable: false,
      blockingPauseUntil: null,

      authorize: async () => {
        if (!isNativeBlockServiceAvailable) {
          warnNativeUnavailable();
          set({ serviceAuthorized: false, shieldsAvailable: false });
          return;
        }
        try {
          const result = await BlockService.authorize();
          set({ serviceAuthorized: result.authorized, shieldsAvailable: result.shieldsAvailable });
        } catch (error) {
          console.warn('[BlockService] authorize failed', error);
          set({ serviceAuthorized: false, shieldsAvailable: false });
        }
      },

      setOrUpdateLimit: async (appId, minutesPerDay) => {
        const current = get().limits;
        const nextLimits = {
          ...current,
          [appId]: { appId, minutesPerDay },
        };
        const values = Object.values(nextLimits);
        await get().setLimits(values);
      },

      setSessionLimit: (blockSetId, appId, minutes) => {
        const id = `${blockSetId}-${appId}`;
        set(prev => ({
          sessionLimits: {
            ...prev.sessionLimits,
            [id]: { id, blockSetId, appId, minutes },
          },
        }));
      },

      pauseBlocking: durationMinutes => {
        const durationMs = Math.max(1, durationMinutes) * 60 * 1000;
        const pauseUntil = Date.now() + durationMs;
        const { activeTask } = get();
        if (isNativeBlockServiceAvailable && activeTask) {
          void BlockService.stopTask(activeTask.task.id).catch(error =>
            console.warn('[BlockStore] pauseBlocking stopTask failed', error)
          );
        }
        clearPauseTimer();
        const resumeFn = () => {
          get().resumeBlocking();
        };
        pauseTimer = setTimeout(resumeFn, durationMs);
        set({ blockingPauseUntil: pauseUntil });
      },

      resumeBlocking: () => {
        clearPauseTimer();
        set({ blockingPauseUntil: null });
        const { activeTask } = get();
        if (isNativeBlockServiceAvailable && activeTask) {
          void BlockService.startTask({
            ...activeTask.task,
            startsAt: Date.now(),
          }).catch(error => console.warn('[BlockStore] resumeBlocking startTask failed', error));
        }
      },

      upsertBlockSet: blockSet => {
        set(prev => ({
          blockSets: {
            ...prev.blockSets,
            [blockSet.id]: {
              ...prev.blockSets[blockSet.id],
              ...blockSet,
              id: blockSet.id,
            },
          },
        }));
      },

      removeBlockSet: blockSetId => {
        if (blockSetId === DEFAULT_BLOCK_SET_ID) {
          console.warn('[BlockStore] Attempted to remove default block set');
          return;
        }
        set(prev => {
          const next = { ...prev.blockSets };
          delete next[blockSetId];
          return { blockSets: next };
        });
      },

      createBlockSetFromTemplate: (templateId, overrides) => {
        const template = BLOCK_SET_TEMPLATES[templateId];
        if (!template) {
          console.warn('[BlockStore] Missing block set template', templateId);
          return null;
        }

        const { id: presetTemplateId, ...templateWithoutId } = template;
        void presetTemplateId;
        const blockSet = makeBlockSetFromTemplate({
          ...templateWithoutId,
          ...overrides,
          kind: overrides?.kind ?? 'custom',
          createdAt: overrides?.createdAt ?? Date.now(),
        });
        set(prev => ({
          blockSets: {
            ...prev.blockSets,
            [blockSet.id]: blockSet,
          },
        }));
        return blockSet;
      },

      createCustomBlockSet: ({ name, blockedEmoji, blockedMessage, blockedBackgroundColor, iosTokens, androidPackages }) => {
        const trimmedName = name.trim() || 'New Block Set';
        const blockSet: BlockSet = {
          id: nanoid(),
          name: trimmedName,
          blockedEmoji: blockedEmoji ?? '🛡️',
          blockedMessage: blockedMessage ?? 'Apps in this set will be blocked during focus sessions.',
          blockedBackgroundColor: blockedBackgroundColor ?? DEFAULT_BLOCK_BACKGROUND,
          iosTokens: iosTokens ?? [],
          androidPackages: androidPackages ?? [],
          kind: 'custom',
          createdAt: Date.now(),
        };

        set(prev => ({
          blockSets: {
            ...prev.blockSets,
            [blockSet.id]: blockSet,
          },
        }));

        if (isNativeBlockServiceAvailable) {
          void BlockService.setShieldTheme(
            blockSet.id,
            blockSet.blockedEmoji,
            blockSet.blockedMessage,
            blockSet.blockedBackgroundColor ?? DEFAULT_BLOCK_BACKGROUND
          ).catch(error => {
            console.warn('[BlockStore] setShieldTheme (create) failed', error);
          });
        } else {
          warnNativeUnavailable();
        }

        return blockSet;
      },

      updateBlockSetMeta: async (blockSetId, updates) => {
        set(prev => {
          const existing = prev.blockSets[blockSetId];
          if (!existing) {
            console.warn('[BlockStore] Attempted to update missing block set', blockSetId);
            return prev;
          }

          const next: BlockSet = {
            ...existing,
            ...updates,
            blockedBackgroundColor: updates.blockedBackgroundColor ?? existing.blockedBackgroundColor ?? DEFAULT_BLOCK_BACKGROUND,
          };

          return {
            ...prev,
            blockSets: {
              ...prev.blockSets,
              [blockSetId]: next,
            },
          };
        });

        if (!isNativeBlockServiceAvailable) {
          warnNativeUnavailable();
          return;
        }

        try {
          const target = get().blockSets[blockSetId];
          if (target) {
            await BlockService.setShieldTheme(
              blockSetId,
              target.blockedEmoji,
              target.blockedMessage,
              target.blockedBackgroundColor ?? DEFAULT_BLOCK_BACKGROUND
            );
          }
        } catch (error) {
          console.warn('[BlockStore] setShieldTheme failed', error);
        }
      },

      pickAppsForBlockSet: async blockSetId => {
        if (!isNativeBlockServiceAvailable) {
          warnNativeUnavailable();
          return null;
        }
        try {
          const capability = get().serviceAuthorized;
          if (!capability) {
            await BlockService.authorize();
          }
          const result = await BlockService.pickAppsForBlockSet(blockSetId);
          if (!result) {
            return null;
          }

          set(prev => ({
            blockSets: {
              ...prev.blockSets,
              [result.id]: {
                ...prev.blockSets[result.id],
                ...result,
                id: result.id,
              },
            },
          }));

          return result;
        } catch (error) {
          console.warn('[BlockStore] pickAppsForBlockSet failed', error);
          return null;
        }
      },

      upsertSchedule: async schedule => {
        if (!isNativeBlockServiceAvailable) {
          warnNativeUnavailable();
          set(prev => ({
            schedules: { ...prev.schedules, [schedule.id]: schedule },
          }));
          return;
        }
        let nativeError: unknown = null;
        try {
          await BlockService.addSchedule(schedule);
        } catch (error) {
          nativeError = mapNativeError(error, 'schedule');
          console.warn('[BlockStore] addSchedule failed; storing locally', error);
        }
        set(prev => ({
          schedules: { ...prev.schedules, [schedule.id]: schedule },
        }));
        if (nativeError) {
          throw nativeError;
        }
      },

      removeSchedule: async scheduleId => {
        if (!isNativeBlockServiceAvailable) {
          warnNativeUnavailable();
          set(prev => {
            const next = { ...prev.schedules };
            delete next[scheduleId];
            return { schedules: next };
          });
          return;
        }
        let nativeError: unknown = null;
        try {
          await BlockService.removeSchedule(scheduleId);
        } catch (error) {
          nativeError = mapNativeError(error, 'schedule');
          console.warn('[BlockStore] removeSchedule failed; removing locally', error);
        }
        set(prev => {
          const next = { ...prev.schedules };
          delete next[scheduleId];
          return { schedules: next };
        });
        if (nativeError) {
          throw nativeError;
        }
      },

      setLimits: async limitsArray => {
        if (!isNativeBlockServiceAvailable) {
          warnNativeUnavailable();
          set({
            limits: limitsArray.reduce<Record<string, AppLimit>>((acc, limit) => {
              acc[limit.appId] = limit;
              return acc;
            }, {}),
          });
          return;
        }
        try {
          await BlockService.setAppLimits(limitsArray);
          set({
            limits: limitsArray.reduce<Record<string, AppLimit>>((acc, limit) => {
              acc[limit.appId] = limit;
              return acc;
            }, {}),
          });
        } catch (error) {
          console.warn('[BlockStore] setAppLimits failed', error);
          throw mapNativeError(error, 'limits');
        }
      },

      startTask: async task => {
        if (!isNativeBlockServiceAvailable) {
          warnNativeUnavailable();
          set({ activeTask: { task, startedAt: Date.now() } });
          return;
        }
        await BlockService.startTask(task);
        set({ activeTask: { task, startedAt: Date.now() } });
      },

      stopTask: async taskId => {
        if (!isNativeBlockServiceAvailable) {
          warnNativeUnavailable();
          const { activeTask } = get();
          if (activeTask?.task.id === taskId) {
            clearPauseTimer();
            set({ activeTask: null, blockingPauseUntil: null });
          }
          return;
        }
        await BlockService.stopTask(taskId);
        const { activeTask } = get();
        if (activeTask?.task.id === taskId) {
          clearPauseTimer();
          set({ activeTask: null, blockingPauseUntil: null });
        }
      },

      refreshUsageSummary: async (fromTs, toTs) => {
        if (!isNativeBlockServiceAvailable) {
          warnNativeUnavailable();
          set({ lastUsageSummary: null, lastUsageFetchedAt: Date.now() });
          return;
        }
        try {
          const summary = await BlockService.getUsageSummary(fromTs, toTs);
          set({ lastUsageSummary: summary, lastUsageFetchedAt: Date.now() });
        } catch (error) {
          console.warn('[BlockService] getUsageSummary failed', error);
        }
      },
    }),
    {
      name: 'blocking-state',
      storage,
      partialize: (state): Partial<BlockingState> => ({
        blockSets: state.blockSets,
        schedules: state.schedules,
        limits: state.limits,
        sessionLimits: state.sessionLimits,
        activeTask: state.activeTask,
        lastUsageSummary: state.lastUsageSummary,
        lastUsageFetchedAt: state.lastUsageFetchedAt,
        serviceAuthorized: state.serviceAuthorized,
        shieldsAvailable: state.shieldsAvailable,
        blockingPauseUntil: state.blockingPauseUntil,
      }),
    }
  )
);

export const selectBlockSets = (state: BlockingState): BlockSet[] => Object.values(state.blockSets);
export const selectSchedules = (state: BlockingState): Schedule[] => Object.values(state.schedules);
export const selectLimits = (state: BlockingState): AppLimit[] => Object.values(state.limits);
export const selectActiveTask = (state: BlockingState): ActiveTaskState | null => state.activeTask;
export const selectBlockingCapability = (state: BlockingState) => ({
  authorized: state.serviceAuthorized,
  shieldsAvailable: state.shieldsAvailable,
});
export const selectBlockingEnabled = (state: BlockingState) => state.serviceAuthorized && state.shieldsAvailable;
export const selectUsageSummary = (state: BlockingState) => state.lastUsageSummary;
export const selectUsageFetchedAt = (state: BlockingState) => state.lastUsageFetchedAt;
