export type BreathPhaseType = 'inhale' | 'hold_after_inhale' | 'exhale' | 'hold_after_exhale';

export interface BreathPhaseSpec {
  type: BreathPhaseType;
  durationMs: number;
  label: string;
}

export interface BreathPreset {
  id: string;
  name: string;
  description: string;
  phases: BreathPhaseSpec[];
  hasHold: boolean;
}

export type SessionLengthMinutes = 3 | 5 | 7 | 10 | 15;

export interface BreathPreferences {
  lastPresetId: string;
  lastDuration: SessionLengthMinutes;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  customPhaseDurations?: {
    inhale: number;
    holdAfterInhale: number;
    exhale: number;
    holdAfterExhale: number;
  };
}

export interface ManifestationPromptConfig {
  id: string;
  title: string;
  prompt: string;
  durationMin: number;
  voice: string;
  speechRate: number;
  ambient: 'none' | 'frequency';
}

export interface ManifestPreferences {
  lastDurationMin: number;
  lastVoice: string;
  lastSpeechRate: number;
  lastAmbient: 'none' | 'frequency';
  favorites: ManifestationPromptConfig[];
  lastPromptId?: string;
  lastCustomPromptText?: string;
}

export interface SessionLog {
  id: string;
  ts: string;
  kind: 'breath' | 'manifest';
  presetId?: string;
  durationSec: number;
}

export interface ResetPreferencesState {
  breath: BreathPreferences;
  manifest: ManifestPreferences;
  sessionLogs: SessionLog[];
}
