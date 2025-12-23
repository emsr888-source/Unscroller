import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  @Get('user')
  async getUserAchievements(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('challenges')
  async getAllChallenges() {
    return this.achievementsService.getAllChallenges();
  }

  @Get('challenges/user')
  async getUserChallenges(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.achievementsService.getUserChallenges(userId);
  }

  @Post('challenges/:id/join')
  async joinChallenge(
    @Headers('authorization') auth: string,
    @Param('id') challengeId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.achievementsService.joinChallenge(userId, challengeId);
  }

  @Put('challenges/:id/progress')
  async updateChallengeProgress(
    @Headers('authorization') auth: string,
    @Param('id') challengeId: string,
    @Body() body: { progress: number },
  ) {
    const userId = this.extractUserId(auth);
    return this.achievementsService.updateChallengeProgress(userId, challengeId, body.progress);
  }

  @Get('goals')
  async getUserGoals(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.achievementsService.getUserGoals(userId);
  }

  @Post('goals')
  async createGoal(
    @Headers('authorization') auth: string,
    @Body() goalData: {
      title: string;
      description?: string;
      goal_type: string;
      target_value: number;
      icon?: string;
    },
  ) {
    const userId = this.extractUserId(auth);
    return this.achievementsService.createGoal(userId, goalData);
  }

  @Put('goals/:id')
  async updateGoalProgress(
    @Headers('authorization') auth: string,
    @Param('id') goalId: string,
    @Body() body: { current_value: number },
  ) {
    const userId = this.extractUserId(auth);
    return this.achievementsService.updateGoalProgress(userId, goalId, body.current_value);
  }

  @Delete('goals/:id')
  async deleteGoal(
    @Headers('authorization') auth: string,
    @Param('id') goalId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.achievementsService.deleteGoal(userId, goalId);
  }

  @Get('xp')
  async getUserXP(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.achievementsService.getUserXP(userId);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.achievementsService.getLeaderboard(limit ? parseInt(limit) : 100);
  }

  private extractUserId(auth: string): string {
    return auth?.replace('Bearer ', '') || 'anonymous';
  }
}
