import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friends')
  async getFriends(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.socialService.getFriends(userId);
  }

  @Get('profiles/:userId')
  async getUserProfile(
    @Headers('authorization') auth: string,
    @Param('userId') targetUserId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.getUserProfile(userId, targetUserId);
  }

  @Post('follow/:userId')
  async followUser(
    @Headers('authorization') auth: string,
    @Param('userId') targetUserId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.followUser(userId, targetUserId);
  }

  @Post('profiles/avatar')
  async uploadAvatar(
    @Headers('authorization') auth: string,
    @Body() body: { image_base64: string; mime_type: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.updateAvatar(userId, body.image_base64, body.mime_type);
  }

  @Put('profiles/focus-goal')
  async updateFocusGoal(
    @Headers('authorization') auth: string,
    @Body() body: { focus_goal?: string | null },
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.updateFocusGoal(userId, body.focus_goal ?? null);
  }

  @Delete('follow/:userId')
  async unfollowUser(
    @Headers('authorization') auth: string,
    @Param('userId') targetUserId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.unfollowUser(userId, targetUserId);
  }

  @Get('messages')
  async getMessageThreads(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.socialService.getMessageThreads(userId);
  }

  @Get('messages/:userId')
  async getMessagesWithUser(
    @Headers('authorization') auth: string,
    @Param('userId') otherUserId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.getMessagesWithUser(userId, otherUserId);
  }

  @Post('messages/:userId')
  async sendMessage(
    @Headers('authorization') auth: string,
    @Param('userId') receiverId: string,
    @Body() body: { content: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.sendMessage(userId, receiverId, body.content);
  }

  @Put('messages/:messageId/read')
  async markMessageAsRead(
    @Headers('authorization') auth: string,
    @Param('messageId') messageId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.markMessageAsRead(messageId, userId);
  }

  @Put('messages/thread/:partnerId/read')
  async markThreadAsRead(
    @Headers('authorization') auth: string,
    @Param('partnerId') partnerId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.markThreadAsRead(userId, partnerId);
  }

  @Get('notifications')
  async getNotifications(
    @Headers('authorization') auth: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.getNotifications(userId, limit ? parseInt(limit) : 50);
  }

  @Put('notifications/:id/read')
  async markNotificationAsRead(
    @Headers('authorization') auth: string,
    @Param('id') notificationId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.markNotificationAsRead(notificationId, userId);
  }

  @Put('notifications/read-all')
  async markAllNotificationsAsRead(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.socialService.markAllNotificationsAsRead(userId);
  }

  @Get('buddies')
  async getBuddies(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.socialService.getBuddies(userId);
  }

  @Get('buddies/requests')
  async getBuddyRequests(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.socialService.getBuddyRequests(userId);
  }

  @Post('buddies/:userId/request')
  async sendBuddyRequest(
    @Headers('authorization') auth: string,
    @Param('userId') targetUserId: string,
    @Body() body: { message?: string },
  ) {
    const userId = this.extractUserId(auth);
    return this.socialService.sendBuddyRequest(userId, targetUserId, body?.message);
  }

  @Post('buddies/requests/:requestId/respond')
  async respondToBuddyRequest(
    @Headers('authorization') auth: string,
    @Param('requestId') requestId: string,
    @Body() body: { action: 'accept' | 'decline' },
  ) {
    const userId = this.extractUserId(auth);
    if (!body?.action || !['accept', 'decline'].includes(body.action)) {
      throw new BadRequestException('Invalid action. Use "accept" or "decline".');
    }
    return this.socialService.respondToBuddyRequest(userId, requestId, body.action);
  }

  private extractUserId(auth: string): string {
    return auth?.replace('Bearer ', '') || 'anonymous';
  }
}
