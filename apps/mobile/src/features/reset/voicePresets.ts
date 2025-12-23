export const VOICE_PRESETS = {
  system_female: {
    label: 'Warm Female',
    pitch: 1.02,
    language: 'en-US',
    openAiVoice: 'nova',
  },
  system_male: {
    label: 'Grounded Male',
    pitch: 0.94,
    language: 'en-US',
    openAiVoice: 'onyx',
  },
} as const;

export type VoiceKey = keyof typeof VOICE_PRESETS;
export type VoicePreset = (typeof VOICE_PRESETS)[VoiceKey];
