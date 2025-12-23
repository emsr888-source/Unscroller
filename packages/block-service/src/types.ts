export type BlockSet = {
  id: string;
  name: string;
  iosTokens?: string[];
  androidPackages?: string[];
  blockedEmoji: string;
  blockedMessage: string;
  blockedBackgroundColor?: string;
  kind?: 'custom' | 'preset';
  createdAt?: number;
};

export type Task = {
  id: string;
  title: string;
  durationMin: number;
  blockSetId: string;
  startsAt?: number;
};

export type Schedule = {
  id: string;
  name: string;
  blockSetId: string;
  days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>;
  startLocalTime: string;
  endLocalTime: string;
};

export type AppLimit = {
  appId: string;
  minutesPerDay: number;
};

export type UsageSample = {
  ts: number;
  appId: string;
  foregroundMs: number;
};

export type UsageSummary = {
  fromTs: number;
  toTs: number;
  totalForegroundMs: number;
  perApp: Array<{ appId: string; foregroundMs: number }>;
};
