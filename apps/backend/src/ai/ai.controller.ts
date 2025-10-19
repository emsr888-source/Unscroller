import { Controller, Get, Post, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { URLDiscoveryService, DiscoveredURL } from './url-discovery.service';
import { PatternAnalysisService, URLAnalysis } from './pattern-analysis.service';
import { PolicyUpdateService, PolicyUpdate } from './policy-update.service';
import { OpenAIService, OpenAIAnalysis } from './openai.service';
import { DailyAnalysisService } from './daily-analysis.service';

@Controller('api/ai')
export class AIController {
  constructor(
    private readonly urlDiscovery: URLDiscoveryService,
    private readonly patternAnalysis: PatternAnalysisService,
    private readonly policyUpdate: PolicyUpdateService,
    private readonly openai: OpenAIService,
    private readonly dailyAnalysis: DailyAnalysisService
  ) {}

  @Get('discover/:platform')
  async discoverURLs(@Param('platform') platform: string) {
    try {
      const urls = await this.urlDiscovery.discoverPlatformURLs(platform);
      return {
        platform,
        discoveredUrls: urls.length,
        urls: urls.slice(0, 100), // Limit response size
        timestamp: new Date()
      };
    } catch (error) {
      throw new HttpException(`Failed to discover URLs for ${platform}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('analyze')
  async analyzeURLs(@Body() body: { urls: string[], platform: string }) {
    try {
      const analyses: URLAnalysis[] = [];

      for (const url of body.urls) {
        const analysis = this.patternAnalysis.analyzeURL(url, body.platform);
        analyses.push(analysis);
      }

      return {
        platform: body.platform,
        totalAnalyzed: analyses.length,
        analyses,
        timestamp: new Date()
      };
    } catch (error) {
      throw new HttpException(`Failed to analyze URLs: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('openai-analyze')
  async openaiAnalyze(@Body() body: { url: string, platform: string, context?: string }) {
    try {
      if (!(await this.openai.isConfigured())) {
        throw new HttpException('OpenAI API key not configured', HttpStatus.SERVICE_UNAVAILABLE);
      }

      const analysis = await this.openai.analyzeURL(body.url, body.platform, body.context);

      return {
        platform: body.platform,
        analysis,
        timestamp: new Date()
      };
    } catch (error) {
      throw new HttpException(`OpenAI analysis failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('openai-network-analysis')
  async openaiNetworkAnalysis(@Body() body: { urls: string[], platform: string }) {
    try {
      if (!(await this.openai.isConfigured())) {
        throw new HttpException('OpenAI API key not configured', HttpStatus.SERVICE_UNAVAILABLE);
      }

      const analysis = await this.openai.analyzeNetworkPatterns(body.urls, body.platform);

      return {
        platform: body.platform,
        analysis,
        timestamp: new Date()
      };
    } catch (error) {
      throw new HttpException(`OpenAI network analysis failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('openai-policy-recommendations')
  async openaiPolicyRecommendations(@Body() body: {
    platform: string,
    currentAllow: string[],
    currentBlock: string[],
    discoveries: any[]
  }) {
    try {
      if (!(await this.openai.isConfigured())) {
        throw new HttpException('OpenAI API key not configured', HttpStatus.SERVICE_UNAVAILABLE);
      }

      const recommendations = await this.openai.generatePolicyRecommendations(
        body.platform,
        { allow: body.currentAllow, block: body.currentBlock },
        body.discoveries
      );

      return {
        platform: body.platform,
        recommendations,
        timestamp: new Date()
      };
    } catch (error) {
      throw new HttpException(`OpenAI policy recommendations failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('update-policy/:platform')
  async updatePolicy(@Param('platform') platform: string, @Query('dryRun') dryRun?: string) {
    try {
      const update = await this.policyUpdate.generatePolicyUpdate(platform);
      const applied = await this.policyUpdate.applyPolicyUpdate(update, dryRun === 'true');

      return {
        platform,
        update,
        applied,
        dryRun: dryRun === 'true',
        timestamp: new Date()
      };
    } catch (error) {
      throw new HttpException(`Failed to update policy for ${platform}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('update-all-policies')
  async updateAllPolicies(@Query('dryRun') dryRun?: string) {
    try {
      const platforms = ['instagram', 'youtube', 'tiktok', 'facebook'];
      const results = [];

      for (const platform of platforms) {
        try {
          const update = await this.policyUpdate.generatePolicyUpdate(platform);
          const applied = await this.policyUpdate.applyPolicyUpdate(update, dryRun === 'true');

          results.push({
            platform,
            success: true,
            update,
            applied
          });
        } catch (error) {
          results.push({
            platform,
            success: false,
            error: error.message
          });
        }
      }

      return {
        totalPlatforms: platforms.length,
        results,
        dryRun: dryRun === 'true',
        timestamp: new Date()
      };
    } catch (error) {
      throw new HttpException(`Failed to update all policies: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('trigger-daily-analysis')
  async triggerDailyAnalysis(@Query('platform') platform?: string) {
    try {
      await this.dailyAnalysis.triggerManualAnalysis(platform);
      return {
        success: true,
        platform: platform || 'all',
        timestamp: new Date()
      };
    } catch (error) {
      throw new HttpException(`Failed to trigger daily analysis: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('scheduler-status')
  async getSchedulerStatus() {
    try {
      return {
        ...this.dailyAnalysis.getStatus(),
        timestamp: new Date()
      };
    } catch (error) {
      throw new HttpException(`Failed to get scheduler status: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('policy-stats')
  async getPolicyStats() {
    try {
      return await this.policyUpdate.getPolicyStats();
    } catch (error) {
      throw new HttpException(`Failed to get policy stats: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('openai-usage')
  async getOpenAIUsage() {
    try {
      if (!(await this.openai.isConfigured())) {
        throw new HttpException('OpenAI API key not configured', HttpStatus.SERVICE_UNAVAILABLE);
      }

      return await this.openai.getUsageStats();
    } catch (error) {
      throw new HttpException(`Failed to get OpenAI usage: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('health')
  async getHealth() {
    const openaiConfigured = await this.openai.isConfigured();

    return {
      status: 'healthy',
      services: {
        urlDiscovery: 'active',
        patternAnalysis: 'active',
        policyUpdate: 'active',
        openai: openaiConfigured ? 'active' : 'not-configured',
        dailyScheduler: 'active'
      },
      timestamp: new Date()
    };
  }
}
