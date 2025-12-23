import { CONFIG } from '@/config/environment';
import { getAccessToken } from './supabase';

const SOCIAL_BASE_URL = `${CONFIG.API_URL}/social`;

async function request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in again.');
  }

  const response = await fetch(`${SOCIAL_BASE_URL}${path}`, {
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

export interface ProfilePreview {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: ProfilePreview;
  receiver?: ProfilePreview;
}

export interface MessageThread {
  partner: ProfilePreview;
  lastMessage: DirectMessage;
  unreadCount: number;
}

export interface UserProfileSummary {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  current_project?: string | null;
  current_streak?: number | null;
  focus_goal?: string | null;
}

export interface BuddyRelationship {
  isBuddy: boolean;
  buddyRequestStatus: 'pending' | 'accepted' | 'declined' | null;
}

export interface BuddyPreview {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  current_streak?: number | null;
}

export interface UserProfileResponse {
  profile: UserProfileSummary;
  stats: {
    followers: number;
    following: number;
  };
  relationships: {
    isSelf: boolean;
    isFollowing: boolean;
    isFollowedBy: boolean;
  } & BuddyRelationship;
  buddy: BuddyPreview | null;
  latestContent: {
    community: {
      id: string;
      content: string;
      image_url?: string | null;
      likes_count?: number | null;
      comments_count?: number | null;
      created_at: string;
    } | null;
    partnership: {
      id: string;
      headline: string;
      project_summary: string;
      updated_at: string;
      status: string;
    } | null;
    challengesCreated: {
      id: string;
      title: string;
      description: string;
      cover_emoji?: string | null;
      metric: string;
      target: number;
      start_date: string;
      end_date: string;
      created_at: string;
    } | null;
    challengesJoined: {
      id: string;
      current_progress: number;
      completed: boolean;
      joined_at: string;
      challenge: {
        id: string;
        title: string;
        description: string;
        cover_emoji?: string | null;
        metric: string;
        target: number;
        start_date: string;
        end_date: string;
      };
    } | null;
    build: {
      id: string;
      project_id: string;
      content: string;
      milestone?: string | null;
      created_at: string;
      progress_percent?: number | null;
      project: {
        id: string;
        title: string;
      };
    } | null;
  };
  partnershipPosts: Array<{
    id: string;
    headline: string;
    project_summary: string;
    status: string;
    applications_count: number;
    updated_at: string;
    creator: ProfilePreview;
  }>;
  buildProjects: Array<{
    id: string;
    title: string;
    summary: string;
    goal?: string | null;
    tags?: string[];
    followers_count: number;
    created_at: string;
    owner: ProfilePreview;
    updates: Array<{
      id: string;
      content: string;
      created_at: string;
      progress_percent?: number | null;
      milestone?: string | null;
      author: ProfilePreview;
    }>;
  }>;
}

export async function fetchThreads(): Promise<MessageThread[]> {
  return request('/messages');
}

export async function fetchConversation(partnerId: string): Promise<DirectMessage[]> {
  return request(`/messages/${partnerId}`);
}

export async function sendDirectMessage(partnerId: string, content: string) {
  return request(`/messages/${partnerId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function markThreadAsRead(partnerId: string) {
  return request(`/messages/thread/${partnerId}/read`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
}

export async function fetchFriends(): Promise<ProfilePreview[]> {
  return request('/friends');
}

export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  return request(`/profiles/${userId}`);
}

export async function followUser(userId: string) {
  return request(`/follow/${userId}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function unfollowUser(userId: string) {
  return request(`/follow/${userId}`, {
    method: 'DELETE',
  });
}

export async function uploadAvatar(imageBase64: string, mimeType: string) {
  return request<{ avatar_url: string }>(`/profiles/avatar`, {
    method: 'POST',
    body: JSON.stringify({ image_base64: imageBase64, mime_type: mimeType }),
  });
}
