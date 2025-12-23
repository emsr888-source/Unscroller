import { nanoid } from 'nanoid/non-secure';
import { create } from 'zustand';
import { createSafeStorage } from '../../lib/safeStorage';
import type {
  BreathPreferences,
  ManifestPreferences,
  ResetPreferencesState,
  SessionLog,
  SessionLengthMinutes,
} from './types';

const STORAGE_KEY = 'reset-preferences';
const storage = createSafeStorage('reset-preferences');

const DEFAULT_BREATH_PREFERENCES: BreathPreferences = {
  lastPresetId: 'box',
  lastDuration: 5,
  soundEnabled: true,
  hapticsEnabled: true,
};

const DEFAULT_MANIFEST_PREFERENCES: ManifestPreferences = {
  lastDurationMin: 7,
  lastVoice: 'system_female',
  lastSpeechRate: 1,
  lastAmbient: 'none',
  favorites: [],
  lastPromptId: 'morning_clarity',
  lastCustomPromptText: '',
};

interface ResetStore extends ResetPreferencesState {
  hydrate: () => void;
  setBreathPreferences: (updates: Partial<BreathPreferences>) => void;
  setManifestPreferences: (updates: Partial<ManifestPreferences>) => void;
  addFavoritePrompt: (prompt: ManifestPreferences['favorites'][number]) => void;
  removeFavoritePrompt: (id: string) => void;
  logSession: (entry: Omit<SessionLog, 'id' | 'ts'> & { ts?: string; id?: string }) => SessionLog;
  clearLogs: () => void;
}

const readPersistedState = (): ResetPreferencesState | null => {
  try {
    const raw = storage.getString(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ResetPreferencesState;
    return {
      breath: { ...DEFAULT_BREATH_PREFERENCES, ...(parsed?.breath ?? {}) },
      manifest: { ...DEFAULT_MANIFEST_PREFERENCES, ...(parsed?.manifest ?? {}) },
      sessionLogs: Array.isArray(parsed?.sessionLogs) ? parsed.sessionLogs : [],
    };
  } catch (error) {
    console.warn('[ResetStore] Failed to parse preferences', error);
    return null;
  }
};

const persistState = (state: Pick<ResetStore, 'breath' | 'manifest' | 'sessionLogs'>) => {
  try {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({
        breath: state.breath,
        manifest: state.manifest,
        sessionLogs: state.sessionLogs,
      })
    );
  } catch (error) {
    console.warn('[ResetStore] Failed to persist preferences', error);
  }
};

export const useResetStore = create<ResetStore>(set => ({
  breath: DEFAULT_BREATH_PREFERENCES,
  manifest: DEFAULT_MANIFEST_PREFERENCES,
  sessionLogs: [],
  hydrate: () => {
    const hydrated = readPersistedState();
    if (hydrated) {
      set(hydrated);
    }
  },
  setBreathPreferences: updates => {
    set(prev => {
      const next = { ...prev.breath, ...updates };
      const snapshot = { ...prev, breath: next };
      persistState(snapshot);
      return snapshot;
    });
  },
  setManifestPreferences: updates => {
    set(prev => {
      const next = { ...prev.manifest, ...updates };
      const snapshot = { ...prev, manifest: next };
      persistState(snapshot);
      return snapshot;
    });
  },
  addFavoritePrompt: prompt => {
    set(prev => {
      const exists = prev.manifest.favorites.some(item => item.id === prompt.id);
      if (exists) {
        return prev;
      }
      const nextManifest = {
        ...prev.manifest,
        favorites: [...prev.manifest.favorites, prompt],
      };
      const snapshot = { ...prev, manifest: nextManifest };
      persistState(snapshot);
      return snapshot;
    });
  },
  removeFavoritePrompt: id => {
    set(prev => {
      const nextManifest = {
        ...prev.manifest,
        favorites: prev.manifest.favorites.filter(item => item.id !== id),
      };
      const snapshot = { ...prev, manifest: nextManifest };
      persistState(snapshot);
      return snapshot;
    });
  },
  logSession: entry => {
    const log: SessionLog = {
      id: entry.id ?? nanoid(),
      ts: entry.ts ?? new Date().toISOString(),
      kind: entry.kind,
      presetId: entry.presetId,
      durationSec: entry.durationSec,
    };
    set(prev => {
      const history = [log, ...prev.sessionLogs].slice(0, 200);
      const snapshot = { ...prev, sessionLogs: history };
      persistState(snapshot);
      return snapshot;
    });
    return log;
  },
  clearLogs: () => {
    set(prev => {
      const snapshot = { ...prev, sessionLogs: [] };
      persistState(snapshot);
      return snapshot;
    });
  },
}));

export const getDefaultDuration = (): SessionLengthMinutes => DEFAULT_BREATH_PREFERENCES.lastDuration;
