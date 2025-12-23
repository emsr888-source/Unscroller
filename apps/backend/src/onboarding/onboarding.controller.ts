import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { OnboardingService } from './onboarding.service';

type UserIdentity = { id?: string } | undefined;

interface RequestWithUser extends Request {
  user?: UserIdentity;
}

interface BaseOnboardingPayload {
  user_id?: string;
}

type ProgressPayload = BaseOnboardingPayload & Record<string, unknown>;
type QuizResponsePayload = BaseOnboardingPayload & Record<string, unknown>;
type ProfilePayload = BaseOnboardingPayload & Record<string, unknown>;
interface SymptomsPayload extends BaseOnboardingPayload {
  symptoms: string[];
}
type GoalsPayload = BaseOnboardingPayload & Record<string, unknown>;
type SubscriptionPayload = BaseOnboardingPayload & Record<string, unknown>;

@Controller('api/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('progress')
  async saveProgress(@Body() body: ProgressPayload, @Req() req: RequestWithUser) {
    const userId = req.user?.id ?? body.user_id;
    return this.onboardingService.saveProgress(userId, body);
  }

  @Post('quiz/response')
  async saveQuizResponse(@Body() body: QuizResponsePayload, @Req() req: RequestWithUser) {
    const userId = req.user?.id ?? body.user_id;
    return this.onboardingService.saveQuizResponse(userId, body);
  }

  @Post('profile')
  async saveProfile(@Body() body: ProfilePayload, @Req() req: RequestWithUser) {
    const userId = req.user?.id ?? body.user_id;
    return this.onboardingService.saveProfile(userId, body);
  }

  @Post('symptoms')
  async saveSymptoms(@Body() body: SymptomsPayload, @Req() req: RequestWithUser) {
    const userId = req.user?.id ?? body.user_id;
    return this.onboardingService.saveSymptoms(userId, body.symptoms);
  }

  @Post('goals')
  async saveGoals(@Body() body: GoalsPayload, @Req() req: RequestWithUser) {
    const userId = req.user?.id ?? body.user_id;
    return this.onboardingService.saveGoals(userId, body);
  }

  @Post('subscription/event')
  async trackSubscriptionEvent(@Body() body: SubscriptionPayload, @Req() req: RequestWithUser) {
    const userId = req.user?.id ?? body.user_id;
    return this.onboardingService.trackSubscriptionEvent(userId, body);
  }
}
