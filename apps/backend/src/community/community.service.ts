import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type BasicProfile = {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

type BuildUpdateCommentRecord = {
  id: string;
  update_id: string;
  content: string;
  created_at: string;
  author: BasicProfile;
};

type BuildUpdateRecord = {
  id: string;
  project_id: string;
  likes_count?: number | null;
  liked_by_user?: boolean;
  comments?: BuildUpdateCommentRecord[];
  author?: BasicProfile;
  [key: string]: unknown;
};

@Injectable()
export class CommunityService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  private requireClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }
    return this.supabase;
  }

  private async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    actionUrl?: string,
  ) {
    if (!userId) {
      return;
    }

    const supabase = this.requireClient();
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      action_url: actionUrl,
    });
  }

  /**
   * Get community feed (all posts)
   */
  async getFeed(userId: string, limit = 20, offset = 0) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: posts, error } = await this.supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Check if user has liked each post
    const postIds = posts?.map(p => p.id) || [];
    const { data: userLikes } = await this.supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);

    return posts?.map(post => ({
      ...post,
      user: post.profiles,
      liked_by_user: likedPostIds.has(post.id),
    }));
  }

  /**
   * Create a new post
   */
  async createPost(userId: string, content: string, imageUrl?: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.supabase
      .from('community_posts')
      .insert({
        user_id: userId,
        content,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Like a post
   */
  async likePost(userId: string, postId: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.supabase
      .from('post_likes')
      .insert({
        user_id: userId,
        post_id: postId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Unlike a post
   */
  async unlikePost(userId: string, postId: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.supabase
      .from('post_likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.supabase
      .from('post_comments')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Add a comment to a post
   */
  async addComment(userId: string, postId: string, content: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.supabase
      .from('post_comments')
      .insert({
        user_id: userId,
        post_id: postId,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a post (only if owner)
   */
  async deletePost(userId: string, postId: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await this.supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Report a post for moderation review
   */
  async reportPost(reporterId: string, postId: string, reason: string, details?: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.supabase
      .from('post_reports')
      .insert({
        post_id: postId,
        reporter_id: reporterId,
        reason,
        details,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Block a user (hide their posts + prevent future interactions)
   */
  async blockUser(userId: string, targetUserId: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await this.supabase
      .from('user_blocks')
      .upsert(
        {
          user_id: userId,
          blocked_user_id: targetUserId,
        },
        { onConflict: 'user_id,blocked_user_id' },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Partnership marketplace
   */
  async getPartnershipPosts(userId: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('partnership_posts')
      .select(
        `*,
        creator:creator_id (
          id,
          full_name,
          username,
          avatar_url
        )`,
      )
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const postIds = data?.map(post => post.id) || [];
    const appliedSet = new Set<string>();

    if (postIds.length) {
      const { data: applications } = await supabase
        .from('partnership_applications')
        .select('partnership_post_id')
        .eq('applicant_id', userId)
        .in('partnership_post_id', postIds);

      applications?.forEach(app => appliedSet.add(app.partnership_post_id));
    }

    return data?.map(post => ({
      ...post,
      user_has_applied: appliedSet.has(post.id),
    })) || [];
  }

  async createPartnershipPost(
    userId: string,
    payload: {
      headline: string;
      project_summary: string;
      looking_for: string;
      why_you?: string;
      contact_method: string;
      skills?: string[];
      commitment?: string;
    },
  ) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('partnership_posts')
      .insert({
        creator_id: userId,
        headline: payload.headline,
        project_summary: payload.project_summary,
        looking_for: payload.looking_for,
        why_you: payload.why_you,
        contact_method: payload.contact_method,
        skills: payload.skills,
        commitment: payload.commitment,
      })
      .select(
        `*,
        creator:creator_id (
          id,
          full_name,
          username,
          avatar_url
        )`,
      )
      .single();

    if (error) throw error;
    return data;
  }

  async applyToPartnership(
    userId: string,
    postId: string,
    payload: { pitch: string; experience?: string; contact_method: string },
  ) {
    const supabase = this.requireClient();

    const { data: post, error: postError } = await supabase
      .from('partnership_posts')
      .select('id, creator_id, headline')
      .eq('id', postId)
      .single();

    if (postError) throw postError;
    if (!post) {
      throw new Error('Listing not found');
    }
    if (post.creator_id === userId) {
      throw new Error('You cannot apply to your own listing');
    }

    const { data, error } = await supabase
      .from('partnership_applications')
      .insert({
        partnership_post_id: postId,
        applicant_id: userId,
        pitch: payload.pitch,
        experience: payload.experience,
        contact_method: payload.contact_method,
      })
      .select()
      .single();

    if (error) throw error;

    await this.createNotification(
      post.creator_id,
      'community',
      'New partnership application',
      'Someone just applied to collaborate on your project.',
      `/partnerships/${postId}`,
    );

    return data;
  }

  async getPartnershipApplications(userId: string, postId: string) {
    const supabase = this.requireClient();

    const { data: post, error: postError } = await supabase
      .from('partnership_posts')
      .select('creator_id')
      .eq('id', postId)
      .single();

    if (postError) throw postError;
    if (post?.creator_id !== userId) {
      throw new Error('Not authorized to view applications');
    }

    const { data, error } = await supabase
      .from('partnership_applications')
      .select(
        `*,
        applicant:applicant_id (
          id,
          full_name,
          username,
          avatar_url
        )`,
      )
      .eq('partnership_post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    status: 'pending' | 'accepted' | 'declined',
  ) {
    const supabase = this.requireClient();

    const { data: application, error: loadError } = await supabase
      .from('partnership_applications')
      .select('id, partnership_post_id, applicant_id, status')
      .eq('id', applicationId)
      .single();

    if (loadError) throw loadError;
    if (!application) {
      throw new Error('Application not found');
    }

    const { data: post, error: postError } = await supabase
      .from('partnership_posts')
      .select('creator_id, headline')
      .eq('id', application.partnership_post_id)
      .single();

    if (postError) throw postError;
    if (post?.creator_id !== userId) {
      throw new Error('Not authorized to update this application');
    }

    const { data, error } = await supabase
      .from('partnership_applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    if (application.applicant_id && application.applicant_id !== userId) {
      await this.createNotification(
        application.applicant_id,
        'community',
        `Application ${status}`,
        `Your application for "${post?.headline ?? 'a listing'}" was ${status}.`,
        `/partnerships/${application.partnership_post_id}`,
      );
    }

    return data;
  }

  async reportPartnershipPost(userId: string, postId: string, reason: string, details?: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('partnership_reports')
      .insert({
        partnership_post_id: postId,
        reporter_id: userId,
        reason,
        details,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Build in public features
   */
  async getBuildProjects(userId: string, options?: { projectId?: string }) {
    const supabase = this.requireClient();

    let query = supabase
      .from('build_projects')
      .select(
        `*,
        owner:owner_id (
          id,
          full_name,
          username,
          avatar_url
        )`,
      )
      .order('updated_at', { ascending: false });

    if (options?.projectId) {
      query = query.eq('id', options.projectId);
    }

    const { data: projects, error } = await query;

    if (error) throw error;

    const projectRows = (projects || []) as (Record<string, unknown> & {
      id: string;
      owner: BasicProfile;
    })[];
    const projectIds = projectRows.map(project => project.id);
    if (!projectIds.length) {
      return [];
    }

    const { data: updates } = await supabase
      .from('build_updates')
      .select(
        `*,
        author:author_id (
          id,
          full_name,
          username,
          avatar_url
        )`,
      )
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    const updateRows = (updates as BuildUpdateRecord[]) || [];
    const updateIds = updateRows.map(update => update.id);

    let comments: BuildUpdateCommentRecord[] = [];
    if (updateIds.length) {
      const { data: commentRows, error: commentError } = await supabase
        .from('build_update_comments')
        .select(
          `*,
          author:author_id (
            id,
            full_name,
            username,
            avatar_url
          )`,
        )
        .in('update_id', updateIds)
        .order('created_at', { ascending: true });

      if (commentError) throw commentError;
      comments = (commentRows as BuildUpdateCommentRecord[]) || [];
    }

    let likedUpdates: { update_id: string }[] = [];
    if (updateIds.length) {
      const { data: likeRows, error: likeError } = await supabase
        .from('build_update_likes')
        .select('update_id')
        .eq('user_id', userId)
        .in('update_id', updateIds);

      if (likeError) throw likeError;
      likedUpdates = likeRows || [];
    }

    const likedSet = new Set(likedUpdates.map(item => item.update_id));

    const commentsByUpdate = new Map<string, BuildUpdateCommentRecord[]>();
    comments.forEach(comment => {
      const list = commentsByUpdate.get(comment.update_id) || [];
      list.push(comment);
      commentsByUpdate.set(comment.update_id, list);
    });

    const updatesByProject: Map<string, BuildUpdateRecord[]> = new Map();
    updateRows.forEach(update => {
      const normalized: BuildUpdateRecord = {
        ...update,
        liked_by_user: likedSet.has(update.id),
        likes: (update as BuildUpdateRecord).likes_count ?? 0,
        comments: commentsByUpdate.get(update.id) || [],
      };
      const list = updatesByProject.get(update.project_id) || [];
      list.push(normalized);
      updatesByProject.set(update.project_id, list);
    });

    const { data: followerRows } = await supabase
      .from('build_project_followers')
      .select('project_id')
      .eq('follower_id', userId)
      .in('project_id', projectIds);

    const followingSet = new Set(followerRows?.map(row => row.project_id));

    return projectRows.map(project => ({
      ...project,
      is_following: followingSet.has(project.id),
      updates: updatesByProject.get(project.id) || [],
    }));
  }

  async getBuildProjectById(userId: string, projectId: string) {
    const projects = await this.getBuildProjects(userId, { projectId });
    if (!projects.length) {
      throw new Error('Project not found');
    }
    return projects[0];
  }

  async getBuildUpdateThread(userId: string, updateId: string) {
    const supabase = this.requireClient();

    const { data: updateRecord, error } = await supabase
      .from('build_updates')
      .select('project_id')
      .eq('id', updateId)
      .single();

    if (error) throw error;
    if (!updateRecord) {
      throw new Error('Update not found');
    }

    const project = await this.getBuildProjectById(userId, updateRecord.project_id);
    const update = project.updates.find(item => item.id === updateId);
    if (!update) {
      throw new Error('Update not found');
    }

    return {
      project,
      update,
    };
  }

  async createBuildProject(
    userId: string,
    payload: { title: string; summary: string; goal?: string; tags?: string[]; category?: string },
  ) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('build_projects')
      .insert({
        owner_id: userId,
        title: payload.title,
        summary: payload.summary,
        goal: payload.goal,
        tags: payload.tags,
        category: payload.category,
      })
      .select(
        `*,
        owner:owner_id (
          id,
          full_name,
          username,
          avatar_url
        )`,
      )
      .single();

    if (error) throw error;
    return data;
  }

  async followBuildProject(userId: string, projectId: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('build_project_followers')
      .insert({
        project_id: projectId,
        follower_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async unfollowBuildProject(userId: string, projectId: string) {
    const supabase = this.requireClient();

    const { error } = await supabase
      .from('build_project_followers')
      .delete()
      .eq('project_id', projectId)
      .eq('follower_id', userId);

    if (error) throw error;
    return { success: true };
  }

  async addBuildUpdate(
    userId: string,
    projectId: string,
    payload: { content: string; progress_percent?: number; milestone?: string; metrics?: Record<string, unknown> },
  ) {
    const supabase = this.requireClient();

    const { data: project, error: projectError } = await supabase
      .from('build_projects')
      .select('owner_id, title')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) {
      throw new Error('Project not found');
    }

    const { data, error } = await supabase
      .from('build_updates')
      .insert({
        project_id: projectId,
        author_id: userId,
        content: payload.content,
        progress_percent: payload.progress_percent,
        milestone: payload.milestone,
        metrics: payload.metrics,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: followerRows } = await supabase
      .from('build_project_followers')
      .select('follower_id')
      .eq('project_id', projectId)
      .neq('follower_id', userId);

    await Promise.all(
      followerRows?.map(row =>
        this.createNotification(
          row.follower_id,
          'community',
          'New build update',
          `${project.title} posted a new update.`,
          `/build/${projectId}`,
        ),
      ) || [],
    );

    return data;
  }

  async likeBuildUpdate(userId: string, updateId: string) {
    const supabase = this.requireClient();

    const { data: update, error: updateError } = await supabase
      .from('build_updates')
      .select('author_id, project_id')
      .eq('id', updateId)
      .single();

    if (updateError) throw updateError;

    const { data, error } = await supabase
      .from('build_update_likes')
      .insert({ update_id: updateId, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    if (update?.author_id && update.author_id !== userId) {
      await this.createNotification(
        update.author_id,
        'community',
        'New like on your update',
        'Someone reacted to your progress update.',
        `/build/${update.project_id}`,
      );
    }

    return data;
  }

  async unlikeBuildUpdate(userId: string, updateId: string) {
    const supabase = this.requireClient();

    const { error } = await supabase
      .from('build_update_likes')
      .delete()
      .eq('update_id', updateId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  async commentOnBuildUpdate(userId: string, updateId: string, content: string) {
    const supabase = this.requireClient();

    const { data: update, error: updateError } = await supabase
      .from('build_updates')
      .select('author_id, project_id')
      .eq('id', updateId)
      .single();

    if (updateError) throw updateError;

    const { data, error } = await supabase
      .from('build_update_comments')
      .insert({
        update_id: updateId,
        author_id: userId,
        content,
      })
      .select(
        `*,
        author:author_id (
          id,
          full_name,
          username,
          avatar_url
        )`,
      )
      .single();

    if (error) throw error;

    if (update?.author_id && update.author_id !== userId) {
      await this.createNotification(
        update.author_id,
        'community',
        'New comment on your update',
        'Someone commented on your progress update.',
        `/build/${update.project_id}`,
      );
    }

    return data;
  }

  async reportBuildUpdate(userId: string, updateId: string, reason: string, details?: string) {
    const supabase = this.requireClient();

    const { data, error } = await supabase
      .from('build_update_reports')
      .insert({
        update_id: updateId,
        reporter_id: userId,
        reason,
        details,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
