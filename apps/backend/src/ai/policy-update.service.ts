import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { URLDiscoveryService, DiscoveredURL } from './url-discovery.service';
import { PatternAnalysisService, URLAnalysis } from './pattern-analysis.service';

export interface PolicyUpdate {
  platform: string;
  newAllowPatterns: string[];
  newBlockPatterns: string[];
  removedPatterns: string[];
  confidence: number;
  timestamp: Date;
}

@Injectable()
export class PolicyUpdateService {
  private readonly logger = new Logger(PolicyUpdateService.name);
  private readonly policyPath = path.join(process.cwd(), 'policy/policy.json');

  constructor(
    private readonly urlDiscovery: URLDiscoveryService,
    private readonly patternAnalysis: PatternAnalysisService
  ) {}

  async generatePolicyUpdate(platform: string): Promise<PolicyUpdate> {
    this.logger.log(`Generating policy update for ${platform}`);

    // Discover new URLs
    const discoveredUrls = await this.urlDiscovery.discoverPlatformURLs(platform);

    // Analyze URLs
    const analyses = discoveredUrls.map(discoveredUrl =>
      this.patternAnalysis.analyzeURL(discoveredUrl.url, platform)
    );

    // Generate update recommendations
    const update = this.generateUpdateRecommendation(platform, analyses);

    this.logger.log(`Generated update for ${platform}: ${update.newAllowPatterns.length} allow, ${update.newBlockPatterns.length} block patterns`);

    return update;
  }

  async applyPolicyUpdate(update: PolicyUpdate, dryRun: boolean = false): Promise<boolean> {
    try {
      if (!fs.existsSync(this.policyPath)) {
        throw new Error('Policy file not found');
      }

      const policy = JSON.parse(fs.readFileSync(this.policyPath, 'utf8'));

      if (dryRun) {
        this.logger.log('DRY RUN - Would apply update:', update);
        return true;
      }

      // Apply updates to policy
      const updatedPolicy = this.applyUpdateToPolicy(policy, update);

      // Validate updated policy
      const isValid = this.validatePolicy(updatedPolicy);
      if (!isValid) {
        throw new Error('Updated policy validation failed');
      }

      // Backup current policy
      const backupPath = `${this.policyPath}.backup.${Date.now()}`;
      fs.copyFileSync(this.policyPath, backupPath);

      // Write updated policy
      fs.writeFileSync(this.policyPath, JSON.stringify(updatedPolicy, null, 2));

      this.logger.log(`Applied policy update for ${update.platform}, backed up to ${backupPath}`);

      return true;
    } catch (error) {
      this.logger.error('Failed to apply policy update:', error.message);
      return false;
    }
  }

  private generateUpdateRecommendation(platform: string, analyses: URLAnalysis[]): PolicyUpdate {
    const currentPolicy = this.loadCurrentPolicy();

    const newAllowPatterns: string[] = [];
    const newBlockPatterns: string[] = [];
    const removedPatterns: string[] = [];

    // Analyze each discovered URL
    for (const analysis of analyses) {
      const { url, category, confidence } = analysis;

      // Skip low confidence analyses
      if (confidence < 0.7) continue;

      // Check if URL is already covered by current policy
      const isCovered = this.isURLCoveredByPolicy(url, currentPolicy, platform);

      if (!isCovered) {
        // Generate appropriate pattern
        const pattern = this.generatePatternFromURL(url, platform);

        if (category === 'useful' && confidence > 0.8) {
          newAllowPatterns.push(pattern);
        } else if (category === 'distracting' && confidence > 0.8) {
          newBlockPatterns.push(pattern);
        }
      }
    }

    // Check for patterns that might no longer be needed
    removedPatterns.push(...this.findObsoletePatterns(currentPolicy, analyses, platform));

    return {
      platform,
      newAllowPatterns: [...new Set(newAllowPatterns)], // Remove duplicates
      newBlockPatterns: [...new Set(newBlockPatterns)],
      removedPatterns: [...new Set(removedPatterns)],
      confidence: this.calculateOverallConfidence(analyses),
      timestamp: new Date()
    };
  }

  private loadCurrentPolicy(): any {
    if (!fs.existsSync(this.policyPath)) {
      return { version: '1.0.0', providers: {} };
    }
    return JSON.parse(fs.readFileSync(this.policyPath, 'utf8'));
  }

  private isURLCoveredByPolicy(url: string, policy: any, platform: string): boolean {
    const providerPolicy = policy.providers?.[platform];
    if (!providerPolicy) return false;

    const allPatterns = [
      ...(providerPolicy.allow || []),
      ...(providerPolicy.block || [])
    ];

    return allPatterns.some((pattern: string) => {
      const regex = this.patternToRegex(pattern);
      return regex.test(url);
    });
  }

  private generatePatternFromURL(url: string, platform: string): string {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      // Platform-specific pattern generation
      switch (platform) {
        case 'instagram':
          if (hostname.includes('cdninstagram.com')) {
            return `*://${hostname}/*`;
          }
          return `*://${hostname}${parsedUrl.pathname}*`;

        case 'youtube':
          if (hostname.includes('youtube.com')) {
            return `*://${hostname}${parsedUrl.pathname}*`;
          }
          return `*://${hostname}/*`;

        case 'tiktok':
          if (hostname.includes('tiktok.com')) {
            return `*://${hostname}${parsedUrl.pathname}*`;
          }
          return `*://${hostname}/*`;

        case 'facebook':
          if (hostname.includes('facebook.com')) {
            return `*://${hostname}${parsedUrl.pathname}*`;
          }
          return `*://${hostname}/*`;

        case 'snapchat':
          if (hostname.includes('snapchat.com')) {
            return `*://${hostname}${parsedUrl.pathname}*`;
          }
          return `*://${hostname}/*`;

        default:
          return `*://${hostname}${parsedUrl.pathname}*`;
      }
    } catch (error) {
      return url;
    }
  }

  private patternToRegex(pattern: string): RegExp {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    return new RegExp(`^${regexPattern}$`);
  }

  private findObsoletePatterns(policy: any, analyses: URLAnalysis[], platform: string): string[] {
    const providerPolicy = policy.providers?.[platform];
    if (!providerPolicy) return [];

    const currentPatterns = [
      ...(providerPolicy.allow || []),
      ...(providerPolicy.block || [])
    ];

    const obsoletePatterns: string[] = [];

    for (const pattern of currentPatterns) {
      const regex = this.patternToRegex(pattern);

      // Check if any discovered URLs match this pattern
      const isUsed = analyses.some(analysis => regex.test(analysis.url));

      if (!isUsed) {
        obsoletePatterns.push(pattern);
      }
    }

    return obsoletePatterns;
  }

  private calculateOverallConfidence(analyses: URLAnalysis[]): number {
    if (analyses.length === 0) return 0;

    const totalConfidence = analyses.reduce((sum, analysis) => sum + analysis.confidence, 0);
    return totalConfidence / analyses.length;
  }

  private applyUpdateToPolicy(policy: any, update: PolicyUpdate): any {
    const updatedPolicy = { ...policy };

    if (!updatedPolicy.providers) {
      updatedPolicy.providers = {};
    }

    if (!updatedPolicy.providers[update.platform]) {
      updatedPolicy.providers[update.platform] = {
        start: this.getDefaultStartUrl(update.platform),
        allow: [],
        block: []
      };
    }

    const providerPolicy = updatedPolicy.providers[update.platform];

    // Add new allow patterns
    if (!providerPolicy.allow) providerPolicy.allow = [];
    providerPolicy.allow.push(...update.newAllowPatterns);
    providerPolicy.allow = [...new Set(providerPolicy.allow)]; // Remove duplicates

    // Add new block patterns
    if (!providerPolicy.block) providerPolicy.block = [];
    providerPolicy.block.push(...update.newBlockPatterns);
    providerPolicy.block = [...new Set(providerPolicy.block)]; // Remove duplicates

    // Remove obsolete patterns
    providerPolicy.allow = providerPolicy.allow.filter((pattern: string) =>
      !update.removedPatterns.includes(pattern)
    );
    providerPolicy.block = providerPolicy.block.filter((pattern: string) =>
      !update.removedPatterns.includes(pattern)
    );

    // Update version
    updatedPolicy.version = this.incrementVersion(policy.version);

    return updatedPolicy;
  }

  private getDefaultStartUrl(platform: string): string {
    const startUrls: Record<string, string> = {
      instagram: 'https://www.instagram.com/direct/inbox/',
      youtube: 'https://www.youtube.com/feed/subscriptions',
      tiktok: 'https://www.tiktok.com/upload',
      facebook: 'https://m.facebook.com/messages/',
      snapchat: 'https://web.snapchat.com/'
    };

    return startUrls[platform] || `https://www.${platform}.com/`;
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    if (parts.length >= 2) {
      const patch = parseInt(parts[2] || '0', 10);
      return `${parts[0]}.${parts[1]}.${patch + 1}`;
    }
    return '1.0.1';
  }

  private validatePolicy(policy: any): boolean {
    try {
      // Basic validation
      if (!policy.version || !policy.providers) {
        return false;
      }

      for (const [platform, providerPolicy] of Object.entries(policy.providers)) {
        if (!providerPolicy || typeof providerPolicy !== 'object') {
          return false;
        }

        const pp = providerPolicy as any;
        if (!pp.start || (!pp.allow && !pp.block)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async getPolicyStats(): Promise<{
    platforms: string[];
    totalPatterns: number;
    lastUpdated: Date | null;
  }> {
    const policy = this.loadCurrentPolicy();

    return {
      platforms: Object.keys(policy.providers || {}),
      totalPatterns: Object.values(policy.providers || {}).reduce((total: number, provider: any) => {
        return total + (provider.allow?.length || 0) + (provider.block?.length || 0);
      }, 0) as number,
      lastUpdated: fs.existsSync(this.policyPath) ? fs.statSync(this.policyPath).mtime : null
    };
  }
}
