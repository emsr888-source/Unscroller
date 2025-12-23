import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';

type ProfilePreview = {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

type DirectMessageRecord = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

type CommunityPostSummary = {
  id: string;
  content: string;
  image_url?: string | null;
  likes_count?: number | null;
  comments_count?: number | null;
  created_at: string;
};

type PartnershipPostSummary = {
  id: string;
  headline: string;
  project_summary: string;
  updated_at: string;
  status: string;
  applications_count?: number | null;
  creator?: ProfilePreview | null;
};

type PartnershipPostRow = Omit<PartnershipPostSummary, 'creator'> & {
  creator?: ProfilePreview | ProfilePreview[] | null;
};

type ChallengeBrief = {
  id: string;
  title: string;
  description: string;
  cover_emoji?: string | null;
  metric: string;
  target: number;
  start_date: string;
  end_date: string;
};

type ChallengeCreatedSummary = ChallengeBrief & {
  created_at: string;
};

type ChallengeParticipationSummary = {
  id: string;
  current_progress: number;
  completed: boolean;
  joined_at: string;
  challenge: ChallengeBrief;
};

type BuildProjectBrief = {
  id: string;
  title: string;
};

type BuildUpdateSummary = {
  id: string;
  project_id: string;
  content: string;
  milestone?: string | null;
  created_at: string;
  progress_percent?: number | null;
  project: BuildProjectBrief;
};

type ChallengeParticipationRow = Omit<ChallengeParticipationSummary, 'challenge'> & {
  challenge: ChallengeBrief | ChallengeBrief[] | null;
};

type BuildUpdateRow = Omit<BuildUpdateSummary, 'project'> & {
  project: BuildProjectBrief | BuildProjectBrief[] | null;
};

type HubCollections = {
  communityPosts: CommunityPostSummary[];
  challengesCreated: ChallengeCreatedSummary[];
  challengesJoined: ChallengeParticipationSummary[];
  buildUpdates: BuildUpdateSummary[];
};

type LatestContentBlocks = {
  community: CommunityPostSummary | null;
  partnership: PartnershipPostSummary | null;
  challengesCreated: ChallengeCreatedSummary | null;
  challengesJoined: ChallengeParticipationSummary | null;
  build: BuildUpdateSummary | null;
};

@Injectable()
export class SocialService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  private extractSingle<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return value ?? null;
  }

  private requireClient() {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }
    return this.supabase;
  }

  /**
   * Get user's friends/followers
   */
  async getFriends(userId: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following_id,
        profiles:following_id (
          id,
          full_name,
          username,
          avatar_url,
          current_streak,
          current_project
        )
      `)
      .eq('follower_id', userId);

    if (error) throw error;
    return data?.map(f => f.profiles) || [];
  }

  /**
   * Follow a user
   */
  async followUser(userId: string, targetUserId: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: userId,
        following_id: targetUserId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markThreadAsRead(userId: string, partnerId: string) {
    const supabase = this.requireClient();

    const { error } = await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', partnerId)
      .eq('read', false);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string, targetUserId: string) {
    const supabase = this.requireClient();

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Get message threads
   */
  async getMessageThreads(userId: string) {
    const supabase = this.requireClient();

    const { data: messageRows, error: messageError } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(200);

    if (messageError) throw messageError;
    const messages = (messageRows as DirectMessageRecord[]) || [];

    if (!messages.length) {
      return [];
    }

    const threadMap = new Map<string, DirectMessageRecord>();
    const orderedPartnerIds: string[] = [];

    messages.forEach(message => {
      const partnerId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      if (!threadMap.has(partnerId)) {
        threadMap.set(partnerId, message);
        orderedPartnerIds.push(partnerId);
      }
    });

    const partnerIds = new Set<string>(orderedPartnerIds);

    const { data: unreadRows, error: unreadError } = await supabase
      .from('direct_messages')
      .select('sender_id')
      .eq('receiver_id', userId)
      .eq('read', false);

    if (unreadError) throw unreadError;
    const unreadCounts = new Map<string, number>();
    unreadRows?.forEach(row => {
      if (!row?.sender_id) return;
      unreadCounts.set(row.sender_id, (unreadCounts.get(row.sender_id) || 0) + 1);
    });

    const profileIds = new Set<string>(partnerIds);
    profileIds.add(userId);

    let profileRows: ProfilePreview[] = [];
    if (profileIds.size) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', Array.from(profileIds));

      if (profileError) throw profileError;
      profileRows = (profiles as ProfilePreview[]) || [];
    }

    const profileMap = new Map<string, ProfilePreview>();
    profileRows.forEach(profile => {
      profileMap.set(profile.id, profile);
    });

    return orderedPartnerIds.map(partnerId => {
      const lastMessage = threadMap.get(partnerId);
      if (!lastMessage) {
        return {
          partner: profileMap.get(partnerId) || { id: partnerId },
          lastMessage: null,
          unreadCount: unreadCounts.get(partnerId) || 0,
        };
      }

      const senderProfile = profileMap.get(lastMessage.sender_id) || null;
      const receiverProfile = profileMap.get(lastMessage.receiver_id) || null;

      return {
        partner: profileMap.get(partnerId) || { id: partnerId },
        lastMessage: {
          ...lastMessage,
          sender: senderProfile,
          receiver: receiverProfile,
        },
        unreadCount: unreadCounts.get(partnerId) || 0,
      };
    });
  }

  /**
   * Get messages with a specific user
   */
  async getMessagesWithUser(userId: string, otherUserId: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:sender_id (id, full_name, username, avatar_url),
        receiver:receiver_id (id, full_name, username, avatar_url)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Send a message
   */
  async sendMessage(userId: string, receiverId: string, content: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: userId,
        receiver_id: receiverId,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('id', messageId)
      .eq('receiver_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user notifications
   */
  async getNotifications(userId: string, limit = 50) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(userId: string) {
    const supabase = this.requireClient();

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { success: true };
  }

  async getUserProfile(viewerId: string, targetUserId: string) {
    const supabase = this.requireClient();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio, current_project, current_streak, focus_goal')
      .eq('id', targetUserId)
      .single();

    if (profileError) throw profileError;

    const [{ count: followersCount, error: followersError }, { count: followingCount, error: followingError }] = await Promise.all([
      supabase
        .from('user_follows')
        .select('*', { head: true, count: 'exact' })
        .eq('following_id', targetUserId),
      supabase
        .from('user_follows')
        .select('*', { head: true, count: 'exact' })
        .eq('follower_id', targetUserId),
    ]);

    if (followersError) throw followersError;
    if (followingError) throw followingError;

    const [{ data: isFollowingRow }, { data: isFollowerRow }] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', viewerId)
        .eq('following_id', targetUserId)
        .maybeSingle(),
      supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', targetUserId)
        .eq('following_id', viewerId)
        .maybeSingle(),
    ]);

    const buddySummary = await this.getBuddySummary(viewerId, targetUserId);
    const buddyCount = await this.getBuddyCount(targetUserId, supabase);
    const hubCollections = await this.getHubCollections(targetUserId, supabase);

    const { data: partnershipRowsRaw, error: partnershipsError } = await supabase
      .from('partnership_posts')
      .select(`
        id,
        headline,
        project_summary,
        status,
        applications_count,
        updated_at,
        creator:creator_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('creator_id', targetUserId)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (partnershipsError) throw partnershipsError;

    const { data: buildProjects, error: projectsError } = await supabase
      .from('build_projects')
      .select(`
        id,
        title,
        summary,
        goal,
        tags,
        followers_count,
        created_at,
        owner:owner_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        updates:build_updates (
          id,
          content,
          created_at,
          progress_percent,
          milestone,
          author:author_id (
            id,
            full_name,
            username,
            avatar_url
          )
        )
      `)
      .eq('owner_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (projectsError) throw projectsError;

    const partnershipRows = (partnershipRowsRaw as PartnershipPostRow[] | null) ?? [];
    const partnershipSummaries: PartnershipPostSummary[] = [];
    for (const row of partnershipRows) {
      const creator = this.extractSingle(row.creator);
      if (!creator) continue;
      partnershipSummaries.push({
        ...row,
        creator,
      });
    }
    const latestContent = this.buildLatestContentBlocks({
      communityPosts: hubCollections.communityPosts,
      partnershipPosts: partnershipSummaries,
      challengesCreated: hubCollections.challengesCreated,
      challengesJoined: hubCollections.challengesJoined,
      buildUpdates: hubCollections.buildUpdates,
    });

    return {
      profile,
      stats: {
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
        buddies: buddyCount,
      },
      relationships: {
        isSelf: viewerId === targetUserId,
        isFollowing: Boolean(isFollowingRow),
        isFollowedBy: Boolean(isFollowerRow),
        ...buddySummary.relationships,
      },
      buddy: buddySummary.buddy,
      latestContent,
      hubCollections,
      partnershipPosts: partnershipSummaries,
      buildProjects: buildProjects || [],
    };
  }

  private buildLatestContentBlocks({
    communityPosts,
    partnershipPosts,
    challengesCreated,
    challengesJoined,
    buildUpdates,
  }: {
    communityPosts: CommunityPostSummary[];
    partnershipPosts: PartnershipPostSummary[];
    challengesCreated: ChallengeCreatedSummary[];
    challengesJoined: ChallengeParticipationSummary[];
    buildUpdates: BuildUpdateSummary[];
  }): LatestContentBlocks {
    return {
      community: communityPosts[0] ?? null,
      partnership: partnershipPosts[0] ?? null,
      challengesCreated: challengesCreated[0] ?? null,
      challengesJoined: challengesJoined[0] ?? null,
      build: buildUpdates[0] ?? null,
    };
  }

  private async getHubCollections(userId: string, supabase: SupabaseClient): Promise<HubCollections> {
    const [communityPostsResp, createdChallengesResp, joinedChallengesResp, buildUpdatesResp] = await Promise.all([
      supabase
        .from('community_posts')
        .select('id, content, image_url, likes_count, comments_count, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('challenges')
        .select('id, title, description, cover_emoji, metric, target, start_date, end_date, created_at')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('user_challenges')
        .select(`
          id,
          current_progress,
          completed,
          joined_at,
          challenge:challenges (
            id,
            title,
            description,
            cover_emoji,
            metric,
            target,
            start_date,
            end_date
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(20),
      supabase
        .from('build_updates')
        .select(`
          id,
          project_id,
          content,
          milestone,
          created_at,
          progress_percent,
          project:build_projects (
            id,
            title
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const communityPosts = (communityPostsResp?.data as CommunityPostSummary[]) || [];
    const challengesCreated = (createdChallengesResp?.data as ChallengeCreatedSummary[]) || [];

    const challengeRows = (joinedChallengesResp?.data as ChallengeParticipationRow[] | null) ?? [];
    const challengesJoined: ChallengeParticipationSummary[] = challengeRows.flatMap(row => {
      const challenge = this.extractSingle(row.challenge);
      if (!challenge) return [];
      return [
        {
          ...row,
          challenge,
        },
      ];
    });

    const buildRows = (buildUpdatesResp?.data as BuildUpdateRow[] | null) ?? [];
    const buildUpdates: BuildUpdateSummary[] = buildRows.flatMap(row => {
      const project = this.extractSingle(row.project);
      if (!project) return [];
      return [
        {
          ...row,
          project,
        },
      ];
    });

    return {
      communityPosts,
      challengesCreated,
      challengesJoined,
      buildUpdates,
    };
  }

  private async getBuddyCount(userId: string, supabase: SupabaseClient) {
    const { count } = await supabase
      .from('buddy_pairs')
      .select('*', { head: true, count: 'exact' })
      .eq('status', 'active')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    return count ?? 0;
  }

  async updateFocusGoal(userId: string, focusGoal: string | null) {
    const supabase = this.requireClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ focus_goal: focusGoal ?? null })
      .eq('id', userId)
      .select('focus_goal')
      .single();

    if (error) throw error;
    return data;
  }

  async getBuddies(userId: string) {
    const supabase = this.requireClient();
    const { data: pairs, error } = await supabase
      .from('buddy_pairs')
      .select('id, user_id_1, user_id_2, status, paired_at, last_interaction_at')
      .eq('status', 'active')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (error) throw error;
    if (!pairs?.length) return [];

    const buddyIds = Array.from(
      new Set(
        pairs.map(pair => (pair.user_id_1 === userId ? pair.user_id_2 : pair.user_id_1)),
      ),
    );

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, current_streak, focus_goal')
      .in('id', buddyIds);

    if (profileError) throw profileError;

    const profileMap = new Map((profiles || []).map(profile => [profile.id, profile]));

    return pairs.map(pair => {
      const otherUserId = pair.user_id_1 === userId ? pair.user_id_2 : pair.user_id_1;
      return {
        pairId: pair.id,
        buddy: profileMap.get(otherUserId) || { id: otherUserId },
        paired_at: pair.paired_at,
        last_interaction_at: pair.last_interaction_at,
      };
    });
  }

  async getBuddyRequests(userId: string) {
    const supabase = this.requireClient();
    const { data: requests, error } = await supabase
      .from('buddy_requests')
      .select('id, from_user_id, to_user_id, status, message, created_at, responded_at')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!requests?.length) {
      return {
        incoming: [],
        outgoing: [],
      };
    }

    const profileIds = Array.from(
      new Set(
        requests.flatMap(req => [req.from_user_id, req.to_user_id]),
      ),
    );

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, current_streak')
      .in('id', profileIds);

    if (profileError) throw profileError;

    const profileMap = new Map((profiles || []).map(profile => [profile.id, profile]));

    return {
      incoming: (requests || [])
        .filter(req => req.to_user_id === userId)
        .map(req => ({
          ...req,
          from_user: profileMap.get(req.from_user_id) || { id: req.from_user_id },
        })),
      outgoing: (requests || [])
        .filter(req => req.from_user_id === userId)
        .map(req => ({
          ...req,
          to_user: profileMap.get(req.to_user_id) || { id: req.to_user_id },
        })),
    };
  }

  async sendBuddyRequest(userId: string, targetUserId: string, message?: string) {
    if (userId === targetUserId) {
      throw new Error('You cannot buddy with yourself.');
    }

    const supabase = this.requireClient();
    const ordered = [userId, targetUserId].sort();

    const { data: existingPair } = await supabase
      .from('buddy_pairs')
      .select('id, status')
      .eq('user_id_1', ordered[0])
      .eq('user_id_2', ordered[1])
      .maybeSingle();

    if (existingPair?.status === 'active') {
      throw new Error('You are already buddies.');
    }

    const { data: inboundRequest } = await supabase
      .from('buddy_requests')
      .select('*')
      .eq('from_user_id', targetUserId)
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (inboundRequest) {
      await this.respondToBuddyRequest(userId, inboundRequest.id, 'accept');
      return { autoAccepted: true };
    }

    const { data: existingPending } = await supabase
      .from('buddy_requests')
      .select('id')
      .eq('from_user_id', userId)
      .eq('to_user_id', targetUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPending) {
      return existingPending;
    }

    const { data, error } = await supabase
      .from('buddy_requests')
      .insert({
        from_user_id: userId,
        to_user_id: targetUserId,
        message: message ?? null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async respondToBuddyRequest(userId: string, requestId: string, action: 'accept' | 'decline') {
    const supabase = this.requireClient();
    const { data: request, error } = await supabase
      .from('buddy_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (error) throw error;
    if (!request) {
      throw new Error('Request not found.');
    }
    if (request.to_user_id !== userId) {
      throw new Error('You can only respond to requests sent to you.');
    }
    if (request.status !== 'pending') {
      return request;
    }

    if (action === 'accept') {
      await this.ensureBuddyPairExists(request.from_user_id, request.to_user_id);
    }

    const { data: updated, error: updateError } = await supabase
      .from('buddy_requests')
      .update({
        status: action === 'accept' ? 'accepted' : 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select('*')
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  private async ensureBuddyPairExists(userA: string, userB: string) {
    const supabase = this.requireClient();
    const ordered = [userA, userB].sort();
    const { data: existingPair } = await supabase
      .from('buddy_pairs')
      .select('id, status')
      .eq('user_id_1', ordered[0])
      .eq('user_id_2', ordered[1])
      .maybeSingle();

    if (existingPair?.status === 'active') {
      return existingPair;
    }

    if (existingPair) {
      const { data, error } = await supabase
        .from('buddy_pairs')
        .update({
          status: 'active',
          paired_at: new Date().toISOString(),
        })
        .eq('id', existingPair.id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('buddy_pairs')
      .insert({
        user_id_1: ordered[0],
        user_id_2: ordered[1],
        status: 'active',
        paired_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  private async getBuddySummary(viewerId: string, targetUserId: string) {
    if (!viewerId || !targetUserId) {
      return {
        relationships: {
          isBuddy: false,
          buddyRequestStatus: null,
        },
        buddy: null,
      };
    }

    const supabase = this.requireClient();

    const { data: activeBuddy } = await supabase
      .from('buddy_pairs')
      .select('*')
      .or(`and(user_id_1.eq.${viewerId},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${viewerId})`)
      .eq('status', 'active')
      .maybeSingle();

    if (activeBuddy) {
      const buddyUserId = activeBuddy.user_id_1 === viewerId ? activeBuddy.user_id_2 : activeBuddy.user_id_1;
      const { data: buddyProfile } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, current_streak')
        .eq('id', buddyUserId)
        .maybeSingle();

      return {
        relationships: {
          isBuddy: true,
          buddyRequestStatus: 'accepted',
          buddyRequestDirection: null,
          buddyRequestId: null,
        },
        buddy: buddyProfile,
      };
    }

    const { data: pendingRequest } = await supabase
      .from('buddy_requests')
      .select('id, from_user_id, to_user_id, status, created_at')
      .or(`and(from_user_id.eq.${viewerId},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${viewerId})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const buddyRequestStatus = pendingRequest?.status ?? null;
    const buddyRequestDirection = pendingRequest
      ? pendingRequest.from_user_id === viewerId
        ? 'outgoing'
        : 'incoming'
      : null;
    const buddyRequestId = pendingRequest?.id ?? null;

    return {
      relationships: {
        isBuddy: false,
        buddyRequestStatus,
        buddyRequestDirection,
        buddyRequestId,
      },
      buddy: null,
    };
  }

  async updateAvatar(userId: string, base64Image: string, mimeType: string) {
    if (!base64Image) {
      throw new Error('Image is required');
    }

    const supabase = this.requireClient();
    const extension = mimeType?.split('/')?.[1] || 'jpg';
    const filePath = `${userId}/${Date.now()}.${extension}`;
    const fileBuffer = Buffer.from(base64Image, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, fileBuffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from('user-avatars').getPublicUrl(filePath);
    const avatarUrl = publicUrlData?.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return { avatar_url: avatarUrl };
  }
}
