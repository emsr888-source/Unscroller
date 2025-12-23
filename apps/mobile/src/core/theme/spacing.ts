export const SPACING = {
  space_1: 4,
  space_2: 8,
  space_3: 12,
  space_4: 16,
  space_5: 24,
  space_6: 32,
  space_7: 48,
} as const;

export type SpacingToken = keyof typeof SPACING;
