import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/events')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async trackEvent(@Req() req, @Body() body: { eventType: string; metadata?: any }) {
    await this.analyticsService.trackEvent(req.user.id, body.eventType, body.metadata);
    return { success: true };
  }
}
