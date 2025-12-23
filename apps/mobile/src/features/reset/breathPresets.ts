import type { BreathPhaseSpec, BreathPreset } from './types';

const seconds = (value: number) => value * 1000;

const buildPhases = (durations: {
  inhale: number;
  holdAfterInhale?: number;
  exhale: number;
  holdAfterExhale?: number;
}): BreathPhaseSpec[] => {
  const phases: BreathPhaseSpec[] = [
    { type: 'inhale', label: 'Breathe in', durationMs: seconds(durations.inhale) },
  ];

  if (durations.holdAfterInhale && durations.holdAfterInhale > 0) {
    phases.push({ type: 'hold_after_inhale', label: 'Hold', durationMs: seconds(durations.holdAfterInhale) });
  }

  phases.push({ type: 'exhale', label: 'Breathe out', durationMs: seconds(durations.exhale) });

  if (durations.holdAfterExhale && durations.holdAfterExhale > 0) {
    phases.push({ type: 'hold_after_exhale', label: 'Hold', durationMs: seconds(durations.holdAfterExhale) });
  }

  return phases;
};

export const BREATH_PRESETS: BreathPreset[] = [
  {
    id: 'box',
    name: 'Box',
    description: '4-4-4-4 square breathing',
    phases: buildPhases({ inhale: 4, holdAfterInhale: 4, exhale: 4, holdAfterExhale: 4 }),
    hasHold: true,
  },
  {
    id: 'coherent',
    name: 'Coherent',
    description: 'Balanced 5 second breath',
    phases: buildPhases({ inhale: 5, exhale: 5 }),
    hasHold: false,
  },
  {
    id: '478',
    name: '4-7-8',
    description: 'Relaxing extended exhale',
    phases: buildPhases({ inhale: 4, holdAfterInhale: 7, exhale: 8 }),
    hasHold: true,
  },
  {
    id: 'physiological',
    name: 'Physiological Sigh',
    description: 'Double inhale, long exhale',
    phases: [
      { type: 'inhale', label: 'Inhale', durationMs: seconds(1) },
      { type: 'inhale', label: 'Top-up inhale', durationMs: seconds(1) },
      { type: 'exhale', label: 'Slow exhale', durationMs: seconds(6) },
    ],
    hasHold: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Set your own timing',
    phases: buildPhases({ inhale: 4, holdAfterInhale: 4, exhale: 4, holdAfterExhale: 4 }),
    hasHold: true,
  },
];

export const getPresetById = (id: string): BreathPreset | undefined => BREATH_PRESETS.find(preset => preset.id === id);
