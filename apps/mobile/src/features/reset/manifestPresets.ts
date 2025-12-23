import type { ManifestationPromptConfig } from './types';

export const MANIFEST_PROMPTS: ManifestationPromptConfig[] = [
  {
    id: 'morning_clarity',
    title: 'Morning Clarity',
    prompt:
      'Guide the listener through a calm morning visualization that anchors their purpose, highlights one meaningful win they will create today, and ends with an empowering affirmation.',
    durationMin: 6,
    voice: 'system_female',
    speechRate: 1,
    ambient: 'frequency',
  },
  {
    id: 'self_compassion',
    title: 'Self-Compassion Reset',
    prompt:
      'Create a gentle script that helps the listener release shame, acknowledge effort, and reconnect with a compassionate inner voice that cheers them onwards.',
    durationMin: 8,
    voice: 'system_female',
    speechRate: 0.95,
    ambient: 'frequency',
  },
  {
    id: 'future_self',
    title: 'Future Self Momentum',
    prompt:
      'Paint a vivid picture of the listener meeting their future self who has stayed consistent with healthy digital habits, describing the environment, feelings, and gratitude shared.',
    durationMin: 7,
    voice: 'system_male',
    speechRate: 1,
    ambient: 'frequency',
  },
  {
    id: 'evening_unwind',
    title: 'Evening Unwind',
    prompt:
      'Help the listener release the day, scan their body for tension, and drift into restorative rest while affirming that tomorrow welcomes focused, intentional energy.',
    durationMin: 9,
    voice: 'system_female',
    speechRate: 0.9,
    ambient: 'none',
  },
];

export const findManifestPrompt = (id: string) => MANIFEST_PROMPTS.find(prompt => prompt.id === id);
