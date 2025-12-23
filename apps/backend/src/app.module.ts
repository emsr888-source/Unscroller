import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PolicyModule } from './policy/policy.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AIModule } from './ai/ai.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { HomeModule } from './home/home.module';
import { CommunityModule } from './community/community.module';
import { SocialModule } from './social/social.module';
import { AchievementsModule } from './achievements/achievements.module';
import { ContentModule } from './content/content.module';
import { AccountModule } from './account/account.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Policy module works without database
    PolicyModule,
    // AI module for intelligent policy updates
    AIModule,
    // Onboarding module for collecting user data
    OnboardingModule,
    // Home module for dashboard features
    HomeModule,
    // Community module for social features
    CommunityModule,
    // Social module for friends, messages, notifications
    SocialModule,
    // Achievements module for trophies, challenges, goals
    AchievementsModule,
    // Content module for journal, todos, resources
    ContentModule,
    // Conditionally load database-dependent modules
    ...(process.env.ENABLE_DATABASE === 'true' && process.env.DATABASE_URL
      ? [
          TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            autoLoadEntities: true,
            synchronize: process.env.NODE_ENV === 'development',
            retryAttempts: 3,
            retryDelay: 3000,
            logging: process.env.NODE_ENV === 'development',
          }),
          AuthModule,
          AnalyticsModule,
          AccountModule,
          SubscriptionModule,
          AdminModule,
        ]
      : []),
  ],
})
export class AppModule {}
