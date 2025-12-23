import { CONFIG } from '@/config/environment';
import { getAccessToken } from './supabase';

const COMMUNITY_BASE_URL = `${CONFIG.API_URL}/community`;

async function authorizedRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in again.');
  }

  const response = await fetch(`${COMMUNITY_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

type ProfilePreview = {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
};

const isDevEnv = typeof __DEV__ !== 'undefined' && __DEV__;

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const DEV_PROFILES: Record<string, ProfilePreview> = {
  alex: {
    id: 'dev_user_alex',
    full_name: 'Alex Rivera',
    username: 'alexbuilds',
    avatar_url: 'https://avatars.githubusercontent.com/u/0000001?v=4',
  },
  maya: {
    id: 'dev_user_maya',
    full_name: 'Maya Chen',
    username: 'mayaships',
    avatar_url: 'https://avatars.githubusercontent.com/u/0000002?v=4',
  },
  leo: {
    id: 'dev_user_leo',
    full_name: 'Leo Andrade',
    username: 'leocodes',
    avatar_url: 'https://avatars.githubusercontent.com/u/0000003?v=4',
  },
};

const DEV_PARTNERSHIP_APPLICATIONS: Record<string, PartnershipApplication[]> = {
  dev_partner_focus_circle: [
    {
      id: 'dev_app_focus_maya',
      partnership_post_id: 'dev_partner_focus_circle',
      applicant_id: DEV_PROFILES.maya.id,
      pitch: 'I host two accountability pods and can bring a supportive vibe + async facilitation.',
      experience: 'Community builder @ Calm, shipped 4 mobile cohorts.',
      contact_method: '@mayaships on Threads',
      status: 'pending',
      created_at: isoDaysAgo(2),
      applicant: DEV_PROFILES.maya,
    },
    {
      id: 'dev_app_focus_leo',
      partnership_post_id: 'dev_partner_focus_circle',
      applicant_id: DEV_PROFILES.leo.id,
      pitch: 'Full-stack dev who loves building focus tools. Happy to own backend + infra.',
      experience: 'Led Supabase migration for a YC startup.',
      contact_method: 'leo@shipfast.dev',
      status: 'pending',
      created_at: isoDaysAgo(1),
      applicant: DEV_PROFILES.leo,
    },
  ],
  dev_partner_creator_ai: [
    {
      id: 'dev_app_creator_alex',
      partnership_post_id: 'dev_partner_creator_ai',
      applicant_id: DEV_PROFILES.alex.id,
      pitch: 'I can lead the React Native app + AI prompt orchestration.',
      experience: 'Shipped Creator Compass + 3 AI copilots.',
      contact_method: 'alex@momentum.build',
      status: 'accepted',
      created_at: isoDaysAgo(4),
      applicant: DEV_PROFILES.alex,
    },
  ],
};

type PartnershipTemplate = PartnershipPost & { autoAppliedUserId?: string };

const DEV_PARTNERSHIP_POST_TEMPLATES: PartnershipTemplate[] = [
  {
    id: 'dev_partner_focus_circle',
    headline: 'Focus Circle Co-founder',
    project_summary: 'Building a calm accountability circle for indie founders who want daily shipping energy.',
    looking_for: 'Looking for a co-host who can run weekly ritual calls + help polish the onboarding funnel.',
    why_you: 'I have the curriculum + brand, just need a community ops partner.',
    contact_method: '@alexbuilds on Threads',
    skills: ['Community Ops', 'Design Systems', 'CRM'],
    commitment: '3-5 hrs/week',
    status: 'open',
    created_at: isoDaysAgo(3),
    updated_at: isoDaysAgo(1),
    creator: DEV_PROFILES.alex,
    applications_count: DEV_PARTNERSHIP_APPLICATIONS.dev_partner_focus_circle.length,
    user_has_applied: false,
    autoAppliedUserId: DEV_PROFILES.maya.id,
  },
  {
    id: 'dev_partner_creator_ai',
    headline: 'Creator AI Studio Partner',
    project_summary: 'Toolkit that helps content creators outline, script, and repurpose shorts in minutes.',
    looking_for: 'A vision-led PM or marketer who can recruit beta creators + handle GTM experiments.',
    why_you: 'Already have an MVP and 150 people on the waitlist.',
    contact_method: 'DM @leocodes',
    skills: ['Product Marketing', 'Creator Economy', 'Automations'],
    commitment: '5 hrs/week',
    status: 'open',
    created_at: isoDaysAgo(7),
    updated_at: isoDaysAgo(2),
    creator: DEV_PROFILES.leo,
    applications_count: DEV_PARTNERSHIP_APPLICATIONS.dev_partner_creator_ai.length,
    user_has_applied: false,
    autoAppliedUserId: DEV_PROFILES.leo.id,
  },
];

const createDevPartnershipPosts = (): PartnershipPost[] =>
  DEV_PARTNERSHIP_POST_TEMPLATES.map(template => ({
    ...template,
    user_has_applied: template.autoAppliedUserId ? CONFIG.DEV_BYPASS_USER_ID === template.autoAppliedUserId : false,
  }));

const devApplicationsForPost = (postId: string): PartnershipApplication[] => deepClone(DEV_PARTNERSHIP_APPLICATIONS[postId] || []);

const DEV_BUILD_UPDATES: Record<string, BuildUpdate[]> = {
  dev_project_momentum_os: [
    {
      id: 'dev_update_momentum_nudges',
      project_id: 'dev_project_momentum_os',
      content: 'Shipped the "nudges" update – reminders now adapt to your energy levels. Also added native sharing.',
      progress_percent: 42,
      milestone: 'Beta wave 2',
      metrics: { waitlist: 812, active_cohorts: 3 },
      created_at: isoDaysAgo(1),
      author: DEV_PROFILES.alex,
      likes: 18,
      liked_by_user: CONFIG.DEV_BYPASS_USER_ID === DEV_PROFILES.maya.id,
      comments: [
        {
          id: 'dev_comment_maya_question',
          update_id: 'dev_project_momentum_os',
          content: 'This looks gorgeous. Curious how you personalize the nudges?',
          created_at: isoDaysAgo(1),
          author: DEV_PROFILES.maya,
        },
      ],
    },
  ],
  dev_project_signal: [
    {
      id: 'dev_update_signal_calendar',
      project_id: 'dev_project_signal',
      content: 'Wrapped up the calendar sync + added a Safari extension for fast wins logging.',
      progress_percent: 70,
      milestone: 'Private launch prep',
      metrics: { chrome_installs: 56 },
      created_at: isoDaysAgo(5),
      author: DEV_PROFILES.leo,
      likes: 9,
      liked_by_user: false,
      comments: [],
    },
  ],
};

const DEV_BUILD_PROJECTS: BuildProject[] = [
  {
    id: 'dev_project_momentum_os',
    title: 'Momentum OS',
    summary: 'A calm execution playground for people quitting doomscrolling – rituals, wins, nudges.',
    goal: 'Launch public beta in January',
    tags: ['Productivity', 'Wellness', 'React Native'],
    category: 'Focus',
    visibility: 'public',
    owner: DEV_PROFILES.alex,
    followers_count: 184,
    is_following: false,
    created_at: isoDaysAgo(14),
    updates: DEV_BUILD_UPDATES.dev_project_momentum_os,
  },
  {
    id: 'dev_project_signal',
    title: 'Signal Zero',
    summary: 'Minimal social timer that sends AI summaries of your progress to your accountability buddy.',
    goal: 'Ship onboarding + DM v1',
    tags: ['AI', 'Indie SaaS'],
    category: 'Social Health',
    visibility: 'public',
    owner: DEV_PROFILES.leo,
    followers_count: 93,
    is_following: false,
    created_at: isoDaysAgo(21),
    updates: DEV_BUILD_UPDATES.dev_project_signal,
  },
];

const createDevBuildProjects = (): BuildProject[] =>
  DEV_BUILD_PROJECTS.map(project => ({
    ...project,
    is_following:
      project.owner.id === CONFIG.DEV_BYPASS_USER_ID || (project.owner.id === DEV_PROFILES.alex.id && CONFIG.DEV_BYPASS_USER_ID === DEV_PROFILES.maya.id)
        ? true
        : project.is_following,
    updates: project.updates.map(update => ({
      ...update,
      liked_by_user: update.author.id !== CONFIG.DEV_BYPASS_USER_ID && update.liked_by_user,
    })),
  }));

async function withDevMock<T>(request: () => Promise<T>, mockFactory: () => T): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (isDevEnv) {
      console.warn('[CommunityService] Falling back to dev mock data', error);
      return deepClone(mockFactory());
    }
    throw error;
  }
}

export interface PartnershipPost {
  id: string;
  headline: string;
  project_summary: string;
  looking_for: string;
  why_you: string;
  contact_method: string;
  skills?: string[];
  commitment?: string;
  status: 'open' | 'matched' | 'closed';
  created_at: string;
  updated_at: string;
  creator: ProfilePreview;
  applications_count: number;
  user_has_applied: boolean;
}

export interface PartnershipApplication {
  id: string;
  partnership_post_id: string;
  applicant_id: string;
  pitch: string;
  experience: string;
  contact_method: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  applicant: ProfilePreview;
}

export interface BuildUpdateComment {
  id: string;
  update_id: string;
  content: string;
  created_at: string;
  author: ProfilePreview;
}

export interface BuildUpdate {
  id: string;
  project_id: string;
  content: string;
  progress_percent: number | null;
  milestone?: string | null;
  metrics?: Record<string, unknown> | null;
  created_at: string;
  author: ProfilePreview;
  likes: number;
  liked_by_user: boolean;
  comments: BuildUpdateComment[];
}

export interface BuildProject {
  id: string;
  title: string;
  summary: string;
  goal?: string | null;
  tags?: string[];
  category?: string | null;
  visibility: 'public' | 'private';
  owner: ProfilePreview;
  followers_count: number;
  is_following: boolean;
  created_at: string;
  updates: BuildUpdate[];
}

export interface BuildUpdateThreadResponse {
  project: BuildProject;
  update: BuildUpdate;
}

export type CreatePartnershipPayload = {
  headline: string;
  projectSummary: string;
  lookingFor: string;
  whyYou: string;
  contact: string;
  skills?: string[];
  commitment?: string;
};

export type PartnershipApplicationPayload = {
  pitch: string;
  experience: string;
  contact: string;
};

export type CreateBuildProjectPayload = {
  title: string;
  summary: string;
  goal?: string;
  tags?: string[];
  category?: string;
};

export type BuildUpdatePayload = {
  content: string;
  progressPercent?: number;
  milestone?: string;
  metrics?: Record<string, unknown>;
};

export async function reportPost(postId: string, reason: string, details?: string) {
  return authorizedRequest(`/posts/${postId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason, details }),
  });
}

export async function blockUser(targetUserId: string) {
  return authorizedRequest(`/users/${targetUserId}/block`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// Partnerships
export async function getPartnershipPosts(): Promise<PartnershipPost[]> {
  return withDevMock(() => authorizedRequest('/partnerships'), createDevPartnershipPosts);
}

export async function createPartnershipPost(payload: CreatePartnershipPayload) {
  return authorizedRequest<PartnershipPost>('/partnerships', {
    method: 'POST',
    body: JSON.stringify({
      headline: payload.headline,
      project_summary: payload.projectSummary,
      looking_for: payload.lookingFor,
      why_you: payload.whyYou,
      contact_method: payload.contact,
      skills: payload.skills,
      commitment: payload.commitment,
    }),
  });
}

export async function applyToPartnership(postId: string, payload: PartnershipApplicationPayload) {
  return authorizedRequest(`/partnerships/${postId}/apply`, {
    method: 'POST',
    body: JSON.stringify({
      pitch: payload.pitch,
      experience: payload.experience,
      contact_method: payload.contact,
    }),
  });
}

export async function getPartnershipApplications(postId: string): Promise<PartnershipApplication[]> {
  return withDevMock(() => authorizedRequest(`/partnerships/${postId}/applications`), () => devApplicationsForPost(postId));
}

export async function updateApplicationStatus(applicationId: string, status: 'pending' | 'accepted' | 'declined') {
  return authorizedRequest(`/partnership-applications/${applicationId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function reportPartnershipPost(postId: string, reason: string, details?: string) {
  return authorizedRequest(`/partnerships/${postId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason, details }),
  });
}

// Build in public
export async function getBuildProjects(): Promise<BuildProject[]> {
  return withDevMock(() => authorizedRequest('/build-projects'), createDevBuildProjects);
}

export async function getBuildProject(projectId: string): Promise<BuildProject> {
  return authorizedRequest(`/build-projects/${projectId}`);
}

export async function createBuildProject(payload: CreateBuildProjectPayload) {
  return authorizedRequest<BuildProject>('/build-projects', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      summary: payload.summary,
      goal: payload.goal,
      tags: payload.tags,
      category: payload.category,
    }),
  });
}

export async function followBuildProject(projectId: string) {
  return authorizedRequest(`/build-projects/${projectId}/follow`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function unfollowBuildProject(projectId: string) {
  return authorizedRequest(`/build-projects/${projectId}/follow`, {
    method: 'DELETE',
  });
}

export async function addBuildUpdate(projectId: string, payload: BuildUpdatePayload) {
  return authorizedRequest(`/build-projects/${projectId}/updates`, {
    method: 'POST',
    body: JSON.stringify({
      content: payload.content,
      progress_percent: payload.progressPercent,
      milestone: payload.milestone,
      metrics: payload.metrics,
    }),
  });
}

export async function likeBuildUpdate(updateId: string) {
  return authorizedRequest(`/build-updates/${updateId}/like`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function unlikeBuildUpdate(updateId: string) {
  return authorizedRequest(`/build-updates/${updateId}/like`, {
    method: 'DELETE',
  });
}

export async function commentOnBuildUpdate(updateId: string, content: string) {
  return authorizedRequest(`/build-updates/${updateId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getBuildUpdateThread(updateId: string): Promise<BuildUpdateThreadResponse> {
  return authorizedRequest(`/build-updates/${updateId}/thread`);
}

export async function reportBuildUpdate(updateId: string, reason: string, details?: string) {
  return authorizedRequest(`/build-updates/${updateId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason, details }),
  });
}
