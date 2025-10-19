import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PolicyModule } from './policy/policy.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Policy module works without database
    PolicyModule,
    // AI module for intelligent policy updates
    AIModule,
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
          SubscriptionModule,
          AnalyticsModule,
        ]
      : []),
  ],
})
export class AppModule {}
