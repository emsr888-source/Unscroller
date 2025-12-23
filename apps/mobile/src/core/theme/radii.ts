export const RADII = {
  radius_card: 24,
  radius_button: 32,
  radius_input: 16,
} as const;

export type RadiusToken = keyof typeof RADII;
