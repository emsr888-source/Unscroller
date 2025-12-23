import { create } from 'zustand';

export type UseLevel = 'Light' | 'Moderate' | 'Heavy' | 'Very Heavy';
export type ImpactLevel = 'Early Warning' | 'Mild Impact' | 'Noticeable Impact' | 'High Impact';

export type PrimaryUseCase = 'work' | 'friends_family' | 'entertainment' | 'news' | 'boredom' | 'other';
export type PeakScrollTime = 'morning_in_bed' | 'work_or_school' | 'evening' | 'late_night' | 'all_day';
export type HardestPlatform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'facebook' | 'other';
export type AutopilotFrequency = 'rarely' | 'few_times' | 'five_to_ten' | 'ten_plus';
export type InterferenceLevel = 'never' | 'once' | 'few_times' | 'most_days' | 'every_day';
export type ReadinessValue = 1 | 2 | 3 | 4 | 5 | 6;
export type BiggestStruggle = 'time' | 'drained' | 'sleep_focus' | 'comparison' | 'all';
export type ReclaimTimeFocus = 'side_hustle' | 'content' | 'study' | 'mental_health' | 'loved_ones';
export type SocialApproach = 'addicted' | 'distracted' | 'work_mode';
export type SupportNeed =
  | 'limit_time'
  | 'block_content'
  | 'find_motivation'
  | 'connect'
  | 'productivity_tools'
  | 'all';
export type FeelingAfterScroll = 'positive' | 'neutral' | 'behind' | 'anxious';
export type PersonaRole = 'builder' | 'creator' | 'student' | 'professional' | 'other';
export type BuildFocus = 'business' | 'brand' | 'audience' | 'career' | 'health' | 'custom';

export interface OnboardingAssessmentState {
  phoneHoursPerDay: number | null;
  hoursPerDay: number | null;
  ageRangeLabel: string | null;
  firstName: string | null;
  symptomsSelected: string[];
  primaryUseCase: PrimaryUseCase | null;
  peakScrollTime: PeakScrollTime | null;
  hardestPlatform: HardestPlatform | null;
  autopilotFrequency: AutopilotFrequency | null;
  biggestStruggle: BiggestStruggle | null;
  reclaimTimeFocus: ReclaimTimeFocus | null;
  socialApproach: SocialApproach | null;
  supportNeed: SupportNeed | null;
  feelingAfterScroll: FeelingAfterScroll | null;
  interferenceLevel: InterferenceLevel | null;
  readinessToChange: ReadinessValue | null;
  personaRoles: PersonaRole[];
  buildFocus: BuildFocus | null;
  buildCustomFocus: string;
  thirtyDayGoal: string;
  setPhoneHoursPerDay: (hours: number | null) => void;
  setHoursPerDay: (hours: number | null) => void;
  setAgeRangeLabel: (label: string | null) => void;
  setFirstName: (name: string | null) => void;
  setSymptomsSelected: (symptoms: string[]) => void;
  setPrimaryUseCase: (value: PrimaryUseCase | null) => void;
  setPeakScrollTime: (value: PeakScrollTime | null) => void;
  setHardestPlatform: (value: HardestPlatform | null) => void;
  setAutopilotFrequency: (value: AutopilotFrequency | null) => void;
  setBiggestStruggle: (value: BiggestStruggle | null) => void;
  setReclaimTimeFocus: (value: ReclaimTimeFocus | null) => void;
  setSocialApproach: (value: SocialApproach | null) => void;
  setSupportNeed: (value: SupportNeed | null) => void;
  setFeelingAfterScroll: (value: FeelingAfterScroll | null) => void;
  setInterferenceLevel: (value: InterferenceLevel | null) => void;
  setReadinessToChange: (value: ReadinessValue | null) => void;
  setPersonaRoles: (roles: PersonaRole[]) => void;
  setBuildFocus: (focus: BuildFocus | null) => void;
  setBuildCustomFocus: (value: string) => void;
  setThirtyDayGoal: (value: string) => void;
  reset: () => void;
}

const initialState: Pick<
  OnboardingAssessmentState,
  | 'phoneHoursPerDay'
  | 'hoursPerDay'
  | 'ageRangeLabel'
  | 'firstName'
  | 'symptomsSelected'
  | 'primaryUseCase'
  | 'peakScrollTime'
  | 'hardestPlatform'
  | 'autopilotFrequency'
  | 'biggestStruggle'
  | 'reclaimTimeFocus'
  | 'socialApproach'
  | 'supportNeed'
  | 'feelingAfterScroll'
  | 'interferenceLevel'
  | 'readinessToChange'
  | 'personaRoles'
  | 'buildFocus'
  | 'buildCustomFocus'
  | 'thirtyDayGoal'
> = {
  phoneHoursPerDay: null,
  hoursPerDay: null,
  ageRangeLabel: null,
  firstName: null,
  symptomsSelected: [],
  primaryUseCase: null,
  peakScrollTime: null,
  hardestPlatform: null,
  autopilotFrequency: null,
  biggestStruggle: null,
  reclaimTimeFocus: null,
  socialApproach: null,
  supportNeed: null,
  feelingAfterScroll: null,
  interferenceLevel: null,
  readinessToChange: null,
  personaRoles: [],
  buildFocus: null,
  buildCustomFocus: '',
  thirtyDayGoal: '',
};

export const useOnboardingAssessment = create<OnboardingAssessmentState>(set => ({
  ...initialState,
  setPhoneHoursPerDay: hours => set({ phoneHoursPerDay: hours }),
  setHoursPerDay: hours => set({ hoursPerDay: hours }),
  setAgeRangeLabel: label => set({ ageRangeLabel: label }),
  setFirstName: name => set({ firstName: name }),
  setSymptomsSelected: symptoms => set({ symptomsSelected: symptoms }),
  setPrimaryUseCase: value => set({ primaryUseCase: value }),
  setPeakScrollTime: value => set({ peakScrollTime: value }),
  setHardestPlatform: value => set({ hardestPlatform: value }),
  setAutopilotFrequency: value => set({ autopilotFrequency: value }),
  setBiggestStruggle: value => set({ biggestStruggle: value }),
  setReclaimTimeFocus: value => set({ reclaimTimeFocus: value }),
  setSocialApproach: value => set({ socialApproach: value }),
  setSupportNeed: value => set({ supportNeed: value }),
  setFeelingAfterScroll: value => set({ feelingAfterScroll: value }),
  setInterferenceLevel: value => set({ interferenceLevel: value }),
  setReadinessToChange: value => set({ readinessToChange: value }),
  setPersonaRoles: roles => set({ personaRoles: roles }),
  setBuildFocus: focus => set({ buildFocus: focus }),
  setBuildCustomFocus: value => set({ buildCustomFocus: value }),
  setThirtyDayGoal: value => set({ thirtyDayGoal: value }),
  reset: () => set({ ...initialState }),
}));
