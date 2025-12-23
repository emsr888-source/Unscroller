export const TYPOGRAPHY = {
  H1: {
    fontFamily: 'Inter-Bold',
    fontSize: 34,
    lineHeight: 40,
  },
  H2: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    lineHeight: 30,
  },
  H3: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    lineHeight: 26,
  },
  H4: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  HeadingLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 48,
    lineHeight: 54,
  },
  Body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  Caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  Subtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  Button: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
} as const;

export type TypographyToken = keyof typeof TYPOGRAPHY;
