import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { URLDiscoveryService, DiscoveredURL } from './url-discovery.service';
import { OpenAIService } from './openai.service';
import { PolicyUpdateService, PolicyUpdate } from './policy-update.service';

@Injectable()
export class DailyAnalysisService implements OnModuleInit {
  private readonly logger = new Logger(DailyAnalysisService.name);
  private analysisJob: cron.ScheduledTask;
  private readonly schedulerEnabled: boolean;

  constructor(
    private readonly urlDiscovery: URLDiscoveryService,
    private readonly openai: OpenAIService,
    private readonly policyUpdate: PolicyUpdateService
  ) {
    this.schedulerEnabled = process.env.ENABLE_AI_SCHEDULER === 'true';
  }

  onModuleInit() {
    if (this.schedulerEnabled) {
      this.scheduleDailyAnalysis();
    } else {
      this.logger.log('Daily AI scheduler is disabled (set ENABLE_AI_SCHEDULER=true to enable)');
    }
  }

  private scheduleDailyAnalysis() {
    // Run daily at 2 AM
    this.analysisJob = cron.schedule('0 2 * * *', async () => {
      await this.performDailyAnalysis();
    });

    this.logger.log('✅ Daily analysis scheduler started - runs daily at 2:00 AM');
  }

  async performDailyAnalysis(): Promise<void> {
    this.logger.log('🚀 Starting daily AI-powered content analysis...');

    if (!(await this.openai.isConfigured())) {
      this.logger.warn('OpenAI not configured - skipping daily analysis');
      return;
    }

    const platforms = ['instagram', 'youtube', 'tiktok', 'facebook'];
    const results = [];

    for (const platform of platforms) {
      try {
        this.logger.log(`📱 Analyzing ${platform}...`);

        // Discover new URLs
        const discoveredUrls = await this.urlDiscovery.discoverPlatformURLs(platform);

        // Analyze with OpenAI
        const analyses = [];
        for (const url of discoveredUrls.slice(0, 20)) { // Limit for API costs
          try {
            const analysis = await this.openai.analyzeURL(url.url, platform);
            analyses.push(analysis);
          } catch (error) {
            this.logger.warn(`Failed to analyze ${url.url}: ${error.message}`);
          }
        }

        // Generate policy recommendations
        const currentPolicy = this.loadCurrentPolicy();
        const platformPolicy = currentPolicy.providers?.[platform];

        if (platformPolicy) {
          const recommendations = await this.openai.generatePolicyRecommendations(
            platform,
            { allow: platformPolicy.allow || [], block: platformPolicy.block || [] },
            analyses
          );

          // Apply recommendations if confident
          if (recommendations.recommendations.length > 0) {
            const policyUpdate: PolicyUpdate = {
              platform,
              newAllowPatterns: recommendations.recommendations
                .filter(r => r.action === 'add' && r.category === 'useful')
                .map(r => r.pattern),
              newBlockPatterns: recommendations.recommendations
                .filter(r => r.action === 'add' && r.category === 'distracting')
                .map(r => r.pattern),
              removedPatterns: recommendations.recommendations
                .filter(r => r.action === 'remove')
                .map(r => r.pattern),
              confidence: 0.8,
              timestamp: new Date()
            };

            await this.policyUpdate.applyPolicyUpdate(policyUpdate);
            this.logger.log(`✅ Applied ${policyUpdate.newAllowPatterns.length} allow, ${policyUpdate.newBlockPatterns.length} block patterns for ${platform}`);
          }

          results.push({
            platform,
            discoveredUrls: discoveredUrls.length,
            analyses: analyses.length,
            recommendations: recommendations.recommendations.length,
            applied: 0 // Will be calculated after application
          });
        }

      } catch (error) {
        this.logger.error(`Failed to analyze ${platform}:`, error.message);
        results.push({
          platform,
          error: error.message
        });
      }
    }

    // Log summary
    const summary = {
      totalPlatforms: platforms.length,
      successfulAnalyses: results.filter(r => !r.error).length,
      totalRecommendations: results.reduce((sum, r) => sum + (r.recommendations || 0), 0),
      totalApplied: results.reduce((sum, r) => sum + (r.applied || 0), 0)
    };
    this.logger.log(`📊 Daily analysis complete: ${JSON.stringify(summary)}`);

    // Send notification (could be webhook, email, etc.)
    await this.sendAnalysisReport(results);
  }

  private loadCurrentPolicy(): any {
    const fs = require('fs');
    const path = require('path');
    const policyPath = path.join(process.cwd(), 'policy/policy.json');

    if (fs.existsSync(policyPath)) {
      return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    }

    return { version: '1.0.0', providers: {} };
  }

  private async sendAnalysisReport(results: any[]): Promise<void> {
    try {
      // This could send to Slack, Discord, email, etc.
      const successful = results.filter(r => !r.error);
      const failed = results.filter(r => r.error);

      this.logger.log(`📈 Daily Report: ${successful.length} successful, ${failed.length} failed analyses`);

      if (failed.length > 0) {
        const failedSummary = failed.map(f => `${f.platform}: ${f.error || 'unknown error'}`).join(', ');
        this.logger.warn(`Failed platforms: ${failedSummary}`);
      }
    } catch (error) {
      this.logger.error('Failed to send analysis report:', error.message);
    }
  }

  // Manual trigger for testing
  async triggerManualAnalysis(platform?: string): Promise<void> {
    this.logger.log('🔧 Manual analysis triggered');

    if (platform) {
      await this.performDailyAnalysisForPlatform(platform);
    } else {
      await this.performDailyAnalysis();
    }
  }

  private async performDailyAnalysisForPlatform(platform: string): Promise<void> {
    if (!(await this.openai.isConfigured())) {
      this.logger.warn('OpenAI not configured');
      return;
    }

    try {
      const discoveredUrls = await this.urlDiscovery.discoverPlatformURLs(platform);
      const analyses = [];

      for (const url of discoveredUrls.slice(0, 10)) {
        try {
          const analysis = await this.openai.analyzeURL(url.url, platform);
          analyses.push(analysis);
        } catch (error) {
          this.logger.warn(`Analysis failed for ${url.url}`);
        }
      }

      const currentPolicy = this.loadCurrentPolicy();
      const platformPolicy = currentPolicy.providers?.[platform];

      if (platformPolicy && analyses.length > 0) {
        const recommendations = await this.openai.generatePolicyRecommendations(
          platform,
          { allow: platformPolicy.allow || [], block: platformPolicy.block || [] },
          analyses
        );

        if (recommendations.recommendations.length > 0) {
          const update: PolicyUpdate = {
            platform,
            newAllowPatterns: recommendations.recommendations
              .filter(r => r.action === 'add' && r.category === 'useful')
              .map(r => r.pattern),
            newBlockPatterns: recommendations.recommendations
              .filter(r => r.action === 'add' && r.category === 'distracting')
              .map(r => r.pattern),
            removedPatterns: recommendations.recommendations
              .filter(r => r.action === 'remove')
              .map(r => r.pattern),
            confidence: 0.8,
            timestamp: new Date()
          };

          await this.policyUpdate.applyPolicyUpdate(update);
          this.logger.log(`✅ Manual update applied for ${platform}`);
        }
      }

    } catch (error) {
      this.logger.error(`Manual analysis failed for ${platform}:`, error.message);
    }
  }

  getStatus(): {
    isRunning: boolean;
    nextRun: Date | null;
    lastRun?: Date;
  } {
    return {
      isRunning: true, // Always running if scheduled
      nextRun: null, // Would need to calculate from cron
      lastRun: undefined
    };
  }

  async stopScheduler(): Promise<void> {
    if (this.analysisJob) {
      this.analysisJob.stop();
      this.logger.log('Daily analysis scheduler stopped');
    }
  }
}
