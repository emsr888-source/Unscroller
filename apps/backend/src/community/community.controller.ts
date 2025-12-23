import { Controller, Get, Post, Delete, Body, Param, Query, Headers, Put } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  async getFeed(
    @Headers('authorization') auth: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.getFeed(
      userId,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Post('posts')
  async createPost(
    @Headers('authorization') auth: string,
    @Body() body: { content: string; image_url?: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.createPost(userId, body.content, body.image_url);
  }

  @Post('posts/:postId/like')
  async likePost(
    @Headers('authorization') auth: string,
    @Param('postId') postId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.likePost(userId, postId);
  }

  @Delete('posts/:postId/like')
  async unlikePost(
    @Headers('authorization') auth: string,
    @Param('postId') postId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.unlikePost(userId, postId);
  }

  @Get('posts/:postId/comments')
  async getComments(@Param('postId') postId: string) {
    return this.communityService.getComments(postId);
  }

  @Post('posts/:postId/comments')
  async addComment(
    @Headers('authorization') auth: string,
    @Param('postId') postId: string,
    @Body() body: { content: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.addComment(userId, postId, body.content);
  }

  @Delete('posts/:postId')
  async deletePost(
    @Headers('authorization') auth: string,
    @Param('postId') postId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.deletePost(userId, postId);
  }

  @Post('posts/:postId/report')
  async reportPost(
    @Headers('authorization') auth: string,
    @Param('postId') postId: string,
    @Body() body: { reason: string; details?: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.reportPost(userId, postId, body.reason, body.details);
  }

  @Post('users/:targetUserId/block')
  async blockUser(
    @Headers('authorization') auth: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.blockUser(userId, targetUserId);
  }

  // Partnerships
  @Get('partnerships')
  async getPartnerships(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.communityService.getPartnershipPosts(userId);
  }

  @Post('partnerships')
  async createPartnership(
    @Headers('authorization') auth: string,
    @Body()
    body: {
      headline: string;
      project_summary: string;
      looking_for: string;
      why_you?: string;
      contact_method: string;
      skills?: string[];
      commitment?: string;
    },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.createPartnershipPost(userId, body);
  }

  @Post('partnerships/:postId/apply')
  async applyToPartnership(
    @Headers('authorization') auth: string,
    @Param('postId') postId: string,
    @Body() body: { pitch: string; experience?: string; contact_method: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.applyToPartnership(userId, postId, body);
  }

  @Get('partnerships/:postId/applications')
  async getApplications(
    @Headers('authorization') auth: string,
    @Param('postId') postId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.getPartnershipApplications(userId, postId);
  }

  @Put('partnership-applications/:applicationId')
  async updateApplication(
    @Headers('authorization') auth: string,
    @Param('applicationId') applicationId: string,
    @Body() body: { status: 'pending' | 'accepted' | 'declined' },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.updateApplicationStatus(userId, applicationId, body.status);
  }

  @Post('partnerships/:postId/report')
  async reportPartnership(
    @Headers('authorization') auth: string,
    @Param('postId') postId: string,
    @Body() body: { reason: string; details?: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.reportPartnershipPost(userId, postId, body.reason, body.details);
  }

  // Build-in-public
  @Get('build-projects')
  async getBuildProjects(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.communityService.getBuildProjects(userId);
  }

  @Post('build-projects')
  async createBuildProject(
    @Headers('authorization') auth: string,
    @Body() body: { title: string; summary: string; goal?: string; tags?: string[]; category?: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.createBuildProject(userId, body);
  }

  @Post('build-projects/:projectId/follow')
  async followBuildProject(
    @Headers('authorization') auth: string,
    @Param('projectId') projectId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.followBuildProject(userId, projectId);
  }

  @Delete('build-projects/:projectId/follow')
  async unfollowBuildProject(
    @Headers('authorization') auth: string,
    @Param('projectId') projectId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.unfollowBuildProject(userId, projectId);
  }

  @Get('build-projects/:projectId')
  async getBuildProject(
    @Headers('authorization') auth: string,
    @Param('projectId') projectId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.getBuildProjectById(userId, projectId);
  }

  @Post('build-projects/:projectId/updates')
  async addBuildUpdate(
    @Headers('authorization') auth: string,
    @Param('projectId') projectId: string,
    @Body()
    body: { content: string; progress_percent?: number; milestone?: string; metrics?: Record<string, unknown> },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.addBuildUpdate(userId, projectId, body);
  }

  @Post('build-updates/:updateId/like')
  async likeBuildUpdate(
    @Headers('authorization') auth: string,
    @Param('updateId') updateId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.likeBuildUpdate(userId, updateId);
  }

  @Delete('build-updates/:updateId/like')
  async unlikeBuildUpdate(
    @Headers('authorization') auth: string,
    @Param('updateId') updateId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.unlikeBuildUpdate(userId, updateId);
  }

  @Post('build-updates/:updateId/comments')
  async commentOnBuildUpdate(
    @Headers('authorization') auth: string,
    @Param('updateId') updateId: string,
    @Body() body: { content: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.commentOnBuildUpdate(userId, updateId, body.content);
  }

  @Get('build-updates/:updateId/thread')
  async getBuildUpdateThread(
    @Headers('authorization') auth: string,
    @Param('updateId') updateId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.getBuildUpdateThread(userId, updateId);
  }

  @Post('build-updates/:updateId/report')
  async reportBuildUpdate(
    @Headers('authorization') auth: string,
    @Param('updateId') updateId: string,
    @Body() body: { reason: string; details?: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.communityService.reportBuildUpdate(userId, updateId, body.reason, body.details);
  }

  private extractUserId(auth: string): string {
    // In production, verify JWT and extract user ID
    // For now, assume Bearer token format
    return auth?.replace('Bearer ', '') || 'anonymous';
  }
}
