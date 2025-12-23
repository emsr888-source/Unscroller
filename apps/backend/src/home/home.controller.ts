import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.homeService.getHomeDashboard(userId);
  }

  @Get('streak')
  async getStreak(@Req() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.homeService.getUserStreak(userId);
  }

  @Get('scroll-free-time')
  async getScrollFreeTime(@Req() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.homeService.getScrollFreeTime(userId);
  }

  @Get('creation-progress')
  async getCreationProgress(@Req() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.homeService.getCreationProgress(userId);
  }

  @Get('week-progress')
  async getWeekProgress(@Req() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.homeService.getWeekProgress(userId);
  }

  @Post('check-in')
  async checkIn(@Req() req: any) {
    const userId = req.user?.id || 'demo-user';
    return this.homeService.performCheckIn(userId);
  }

  @Post('update-scroll-free-time')
  async updateScrollFreeTime(
    @Req() req: any,
    @Body() body: { hours: number },
  ) {
    const userId = req.user?.id || 'demo-user';
    return this.homeService.updateScrollFreeTime(userId, body.hours);
  }

  @Post('update-creation-progress')
  async updateCreationProgress(
    @Req() req: any,
    @Body() body: { minutes: number },
  ) {
    const userId = req.user?.id || 'demo-user';
    return this.homeService.updateCreationProgress(userId, body.minutes);
  }
}
