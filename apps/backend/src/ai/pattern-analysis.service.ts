import { Injectable, Logger } from '@nestjs/common';
import { URL } from 'url';

export interface URLAnalysis {
  url: string;
  platform: string;
  category: 'distracting' | 'useful' | 'neutral';
  confidence: number;
  reasoning: string[];
  features: {
    isHomepage: boolean;
    isApi: boolean;
    isCDN: boolean;
    hasQueryParams: boolean;
    pathDepth: number;
    containsKeywords: string[];
  };
}

@Injectable()
export class PatternAnalysisService {
  private readonly logger = new Logger(PatternAnalysisService.name);

  analyzeURL(url: string, platform: string): URLAnalysis {
    const features = this.extractFeatures(url);
    const analysis = this.classifyURL(url, platform, features);

    return {
      url,
      platform,
      category: analysis.category,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      features
    };
  }

  private extractFeatures(url: string): URLAnalysis['features'] {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const search = parsedUrl.search;

      return {
        isHomepage: pathname === '/' || pathname === '',
        isApi: pathname.includes('/api/') || pathname.includes('/ajax/') || pathname.includes('/graphql'),
        isCDN: parsedUrl.hostname.includes('cdn') || parsedUrl.hostname.includes('static'),
        hasQueryParams: search.length > 0,
        pathDepth: pathname.split('/').filter(p => p.length > 0).length,
        containsKeywords: this.extractKeywords(pathname)
      };
    } catch (error) {
      return {
        isHomepage: false,
        isApi: false,
        isCDN: false,
        hasQueryParams: false,
        pathDepth: 0,
        containsKeywords: []
      };
    }
  }

  private extractKeywords(pathname: string): string[] {
    const keywords = [
      'explore', 'trending', 'search', 'hashtag', 'tag', 'stories', 'reels',
      'shorts', 'feed', 'following', 'foryou', 'discover', 'spotlight',
      'watch', 'gaming', 'marketplace', 'groups', 'events', 'music'
    ];

    return keywords.filter(keyword =>
      pathname.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private classifyURL(url: string, platform: string, features: URLAnalysis['features']): {
    category: 'distracting' | 'useful' | 'neutral';
    confidence: number;
    reasoning: string[];
  } {
    const reasoning: string[] = [];

    // Rule-based classification with confidence scoring

    // High confidence: API and CDN resources are useful
    if (features.isApi || features.isCDN) {
      reasoning.push('API/CDN resource - necessary for functionality');
      return { category: 'useful', confidence: 0.95, reasoning };
    }

    // High confidence: Homepage is usually distracting
    if (features.isHomepage) {
      reasoning.push('Homepage - typically contains distracting content');
      return { category: 'distracting', confidence: 0.9, reasoning };
    }

    // Platform-specific rules
    const platformRules = this.getPlatformRules(platform);

    for (const rule of platformRules) {
      if (rule.condition(features)) {
        reasoning.push(rule.reason);
        return {
          category: rule.category,
          confidence: rule.confidence,
          reasoning
        };
      }
    }

    // Keyword-based classification
    const distractingKeywords = ['explore', 'trending', 'search', 'hashtag', 'tag', 'stories', 'reels', 'shorts', 'discover', 'spotlight'];
    const usefulKeywords = ['direct', 'messages', 'inbox', 'upload', 'subscriptions'];

    const hasDistractingKeywords = features.containsKeywords.some(kw =>
      distractingKeywords.includes(kw.toLowerCase())
    );

    const hasUsefulKeywords = features.containsKeywords.some(kw =>
      usefulKeywords.includes(kw.toLowerCase())
    );

    if (hasDistractingKeywords && !hasUsefulKeywords) {
      reasoning.push('Contains distracting keywords');
      return { category: 'distracting', confidence: 0.8, reasoning };
    }

    if (hasUsefulKeywords) {
      reasoning.push('Contains useful keywords');
      return { category: 'useful', confidence: 0.8, reasoning };
    }

    // Default classification based on path depth
    if (features.pathDepth <= 1) {
      reasoning.push('Shallow path - likely navigation or content page');
      return { category: 'distracting', confidence: 0.6, reasoning };
    }

    if (features.pathDepth >= 3) {
      reasoning.push('Deep path - likely specific content or functionality');
      return { category: 'neutral', confidence: 0.5, reasoning };
    }

    return { category: 'neutral', confidence: 0.5, reasoning };
  }

  private getPlatformRules(platform: string): Array<{
    condition: (features: URLAnalysis['features']) => boolean;
    category: 'distracting' | 'useful' | 'neutral';
    confidence: number;
    reason: string;
  }> {
    const rules: Record<string, any[]> = {
      instagram: [
        {
          condition: (f) => f.containsKeywords.includes('direct') || f.containsKeywords.includes('inbox'),
          category: 'useful' as const,
          confidence: 0.9,
          reason: 'Direct messages - core functionality'
        },
        {
          condition: (f) => f.containsKeywords.includes('stories') && !f.containsKeywords.includes('direct'),
          category: 'distracting' as const,
          confidence: 0.9,
          reason: 'Stories - addictive content'
        }
      ],
      youtube: [
        {
          condition: (f) => f.containsKeywords.includes('subscriptions'),
          category: 'useful' as const,
          confidence: 0.9,
          reason: 'Subscriptions feed - curated content'
        },
        {
          condition: (f) => f.containsKeywords.includes('shorts'),
          category: 'distracting' as const,
          confidence: 0.95,
          reason: 'Shorts - highly addictive format'
        }
      ],
      tiktok: [
        {
          condition: (f) => f.containsKeywords.includes('upload'),
          category: 'useful' as const,
          confidence: 0.9,
          reason: 'Upload functionality - content creation'
        },
        {
          condition: (f) => f.containsKeywords.includes('foryou') || f.containsKeywords.includes('following'),
          category: 'distracting' as const,
          confidence: 0.9,
          reason: 'FYP/Following - algorithmic feeds'
        }
      ],
      facebook: [
        {
          condition: (f) => f.containsKeywords.includes('messages'),
          category: 'useful' as const,
          confidence: 0.9,
          reason: 'Messages - core communication'
        },
        {
          condition: (f) => f.containsKeywords.includes('feed') && !f.containsKeywords.includes('subscriptions'),
          category: 'distracting' as const,
          confidence: 0.9,
          reason: 'Main feed - algorithmic content'
        }
      ],
      snapchat: [
        {
          condition: (f) => f.containsKeywords.includes('web'),
          category: 'useful' as const,
          confidence: 0.9,
          reason: 'Web interface - core functionality'
        },
        {
          condition: (f) => f.containsKeywords.includes('discover') || f.containsKeywords.includes('spotlight'),
          category: 'distracting' as const,
          confidence: 0.9,
          reason: 'Discover/Spotlight - content feeds'
        }
      ]
    };

    return rules[platform] || [];
  }

  // Advanced ML-based classification (placeholder for future enhancement)
  private async advancedClassification(url: string, platform: string): Promise<URLAnalysis> {
    // This would integrate with ML models like:
    // - URL embedding models
    // - Platform-specific classifiers
    // - Behavioral analysis

    // For now, return basic analysis
    return this.analyzeURL(url, platform);
  }
}
