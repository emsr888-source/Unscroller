import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { URLDiscoveryService } from './url-discovery.service';
import { PatternAnalysisService } from './pattern-analysis.service';
import { PolicyUpdateService } from './policy-update.service';
import { OpenAIService } from './openai.service';
import { DailyAnalysisService } from './daily-analysis.service';
import { AIController } from './ai.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AIController],
  providers: [
    URLDiscoveryService,
    PatternAnalysisService,
    PolicyUpdateService,
    OpenAIService,
    DailyAnalysisService
  ],
  exports: [
    URLDiscoveryService,
    PatternAnalysisService,
    PolicyUpdateService,
    OpenAIService,
    DailyAnalysisService
  ],
})
export class AIModule {}
