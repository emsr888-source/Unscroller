export type CommunityChallengeId = 'deep_focus' | 'habit_reset' | 'creator_hour';

type DifficultyLevel = 'Starter' | 'Intermediate' | 'Advanced';

type FocusArea =
  | 'Focus'
  | 'Habits'
  | 'Community'
  | 'Productivity'
  | 'Mindset'
  | 'Accountability';

export interface CommunityChallengeDefinition {
  id: CommunityChallengeId;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  participants: number;
  completion: number;
  streakBoost: string;
  focusAreas: FocusArea[];
  dailyActions: string[];
  weeklyWins: string[];
  successMetrics: string[];
  timeCommitment: string;
  theme: {
    gradient: [string, string];
    accent: string;
  };
}

export const COMMUNITY_CHALLENGES: CommunityChallengeDefinition[] = [
  {
    id: 'deep_focus',
    title: '30-Day Deep Focus Sprint',
    description: 'Replace doom scrolling with a daily 45-minute creation block. Log your wins every night.',
    difficulty: 'Advanced',
    participants: 842,
    completion: 68,
    streakBoost: '+14 day streak boost',
    focusAreas: ['Focus', 'Productivity', 'Mindset'],
    dailyActions: [
      'Block off a 45-minute creation sprint on your calendar',
      'Silence notifications and enable Focus Mode on your phone',
      'Ship one tangible deliverable (design, code, writing, outreach)',
      'Log the win in your Unscroller journal before you sleep',
    ],
    weeklyWins: [
      'Join a mid-week accountability standup with other sprint members',
      'Share a Friday demo of what you shipped',
      'Plan one "deep work" outing (library, coworking, or cafe) for the weekend',
    ],
    successMetrics: [
      '25 creation sprints completed',
      'At least 5 public demos or updates shared',
      'Feel an increase in momentum and clarity around the project',
    ],
    timeCommitment: '45 minutes daily + 20 minute Friday retro',
    theme: {
      gradient: ['#7c3aed', '#312e81'],
      accent: '#a78bfa',
    },
  },
  {
    id: 'habit_reset',
    title: '7-Day Habit Reset',
    description: 'Follow the guided detox blueprint and rebuild your morning routine without social feeds.',
    difficulty: 'Starter',
    participants: 2430,
    completion: 52,
    streakBoost: '+5 day streak boost',
    focusAreas: ['Habits', 'Mindset'],
    dailyActions: [
      'Replace your wake-up scroll with a three-minute breathing reset',
      'Complete the daily “anchor habit” (journal, mobility, or hydration check-in)',
      'Audit and delete one distracting app, account, or notification rule',
      'Celebrate by logging a short reflection in the Detox Journal',
    ],
    weeklyWins: [
      'Set a Sunday reset ritual to plan the week without feeds',
      'Identify and remove one toxic trigger from your environment',
    ],
    successMetrics: [
      '7 consecutive mornings without doom scrolling',
      'Complete the detox checklist on days 1, 3, and 6',
      'Feel calmer and more intentional about how you start the day',
    ],
    timeCommitment: '15–20 minutes each morning',
    theme: {
      gradient: ['#34d399', '#047857'],
      accent: '#6ee7b7',
    },
  },
  {
    id: 'creator_hour',
    title: 'Creator Hour Accountability',
    description: 'Join a squad of 5 builders. Show up daily for your live creator hour with proof of progress.',
    difficulty: 'Intermediate',
    participants: 1215,
    completion: 74,
    streakBoost: '+9 day streak boost',
    focusAreas: ['Community', 'Accountability', 'Productivity'],
    dailyActions: [
      'Join the squad call on time (video optional, progress proof required)',
      'Post your “before” plan in the accountability thread',
      'Ship for 60 minutes with cameras off and distractions removed',
      'Share a screenshot or summary of your output when the hour ends',
    ],
    weeklyWins: [
      'Host one mini-teach-back for your squad (5 minutes)',
      'Pair up with another builder for a co-working power session',
    ],
    successMetrics: [
      'Attend at least 5 squad sessions per week',
      'Deliver 4 public accountability updates',
      'Ship one “flagship” deliverable by the end of the month',
    ],
    timeCommitment: '60 minutes per day + optional weekend meetup',
    theme: {
      gradient: ['#f59e0b', '#b45309'],
      accent: '#fcd34d',
    },
  },
];

export const getCommunityChallenge = (id: string | undefined) =>
  COMMUNITY_CHALLENGES.find(challenge => challenge.id === id);
