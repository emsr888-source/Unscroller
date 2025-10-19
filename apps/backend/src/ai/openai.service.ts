import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface OpenAIAnalysis {
  url: string;
  platform: string;
  category: 'distracting' | 'useful' | 'neutral';
  confidence: number;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  
  // Cost control settings
  private readonly dailyBudget: number;
  private readonly requestLimit: number = 1000; // Max requests per day
  private requestsToday: number = 0;
  private costToday: number = 0;
  private lastResetDate: string = new Date().toISOString().split('T')[0];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OpenAI API key not found. Advanced AI features will be disabled.');
      return;
    }

    this.dailyBudget = parseFloat(this.configService.get<string>('OPENAI_DAILY_BUDGET') || '10.00');

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.logger.log(`OpenAI service initialized successfully (Daily budget: $${this.dailyBudget})`);
  }

  private resetDailyCounters() {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.requestsToday = 0;
      this.costToday = 0;
      this.lastResetDate = today;
      this.logger.log('Daily OpenAI counters reset');
    }
  }

  private checkBudget() {
    this.resetDailyCounters();
    
    if (this.costToday >= this.dailyBudget) {
      throw new Error(`Daily OpenAI budget of $${this.dailyBudget} exceeded (current: $${this.costToday.toFixed(2)})`);
    }

    if (this.requestsToday >= this.requestLimit) {
      throw new Error(`Daily OpenAI request limit of ${this.requestLimit} exceeded`);
    }
  }

  private estimateCost(model: string, tokens: number): number {
    // Approximate costs (as of 2024)
    const costs: Record<string, number> = {
      'gpt-4': 0.03 / 1000, // $0.03 per 1K tokens
      'gpt-3.5-turbo': 0.002 / 1000, // $0.002 per 1K tokens
    };
    return (costs[model] || 0.03 / 1000) * tokens;
  }

  private trackUsage(model: string, tokensUsed: number) {
    this.requestsToday++;
    this.costToday += this.estimateCost(model, tokensUsed);
    
    if (this.costToday >= this.dailyBudget * 0.8) {
      this.logger.warn(`⚠️ OpenAI budget at ${((this.costToday / this.dailyBudget) * 100).toFixed(1)}% ($${this.costToday.toFixed(2)}/$${this.dailyBudget})`);
    }
  }

  async analyzeURL(url: string, platform: string, context?: string): Promise<OpenAIAnalysis> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    this.checkBudget();

    try {
      const prompt = this.buildAnalysisPrompt(url, platform, context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing social media URLs and network patterns for content blocking systems.

You must classify URLs as:
- "distracting": Content that wastes time, algorithmic feeds, entertainment
- "useful": Core functionality, messaging, content creation, necessary APIs
- "neutral": Uncertain or mixed-purpose content

Provide JSON response with: category, confidence (0-1), reasoning, riskLevel (low/medium/high), recommendations (array of strings)`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Track usage
      const tokensUsed = response.usage?.total_tokens || 500;
      this.trackUsage('gpt-4', tokensUsed);

      const analysis = JSON.parse(content) as OpenAIAnalysis;

      // Validate and normalize the response
      return {
        url,
        platform,
        category: ['distracting', 'useful', 'neutral'].includes(analysis.category)
          ? analysis.category as 'distracting' | 'useful' | 'neutral'
          : 'neutral',
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        reasoning: analysis.reasoning || 'AI analysis completed',
        riskLevel: ['low', 'medium', 'high'].includes(analysis.riskLevel)
          ? analysis.riskLevel as 'low' | 'medium' | 'high'
          : 'medium',
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
      };

    } catch (error) {
      this.logger.error(`OpenAI analysis failed for ${url}:`, error.message);
      throw error;
    }
  }

  async analyzeNetworkPatterns(urls: string[], platform: string): Promise<{
    patterns: Array<{
      pattern: string;
      category: string;
      confidence: number;
      description: string;
    }>;
    summary: string;
  }> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    this.checkBudget();

    try {
      const urlList = urls.slice(0, 50).join('\n'); // Limit for API constraints

      const prompt = `Analyze these ${platform} URLs and identify network patterns:

${urlList}

Group them into categories:
1. Core functionality (messaging, content creation, necessary APIs)
2. Algorithmic content (feeds, recommendations, trending)
3. Static resources (CDN, images, scripts)
4. Tracking/analytics
5. Distracting features (shorts, reels, stories, explore)

For each category, suggest URL patterns to block or allow.

Return JSON with patterns array and summary.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a network security expert analyzing social media traffic patterns for content blocking systems.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Track usage
      const tokensUsed = response.usage?.total_tokens || 1000;
      this.trackUsage('gpt-4', tokensUsed);

      return JSON.parse(content);

    } catch (error) {
      this.logger.error(`OpenAI network analysis failed for ${platform}:`, error.message);
      throw error;
    }
  }

  async generatePolicyRecommendations(
    platform: string,
    currentPatterns: { allow: string[], block: string[] },
    newDiscoveries: any[]
  ): Promise<{
    recommendations: Array<{
      action: 'add' | 'remove' | 'modify';
      pattern: string;
      category: string;
      reasoning: string;
      confidence: number;
    }>;
    summary: string;
  }> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    this.checkBudget();

    try {
      const prompt = `Analyze these ${platform} content blocking patterns and suggest improvements:

Current Allow Patterns: ${JSON.stringify(currentPatterns.allow)}
Current Block Patterns: ${JSON.stringify(currentPatterns.block)}

New URL Discoveries: ${JSON.stringify(newDiscoveries.slice(0, 20))}

Platform: ${platform}

Suggest specific pattern changes with reasoning. Consider:
- Core functionality preservation
- Distracting content elimination
- API and CDN access
- Platform-specific behaviors

Return JSON with recommendations array and summary.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a content blocking policy expert optimizing social media filtering systems.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Track usage
      const tokensUsed = response.usage?.total_tokens || 1500;
      this.trackUsage('gpt-4', tokensUsed);

      return JSON.parse(content);

    } catch (error) {
      this.logger.error(`OpenAI policy recommendation failed for ${platform}:`, error.message);
      throw error;
    }
  }

  private buildAnalysisPrompt(url: string, platform: string, context?: string): string {
    const platformContext = this.getPlatformContext(platform);

    return `Analyze this ${platform} URL for content blocking:

URL: ${url}
Platform: ${platform}
Context: ${context || 'General web browsing'}

${platformContext}

Classify as "distracting", "useful", or "neutral" and explain why.

Consider:
- Is this core functionality or distracting content?
- Does it serve ads, algorithms, or entertainment?
- Is it necessary for the platform to function?
- What user intent does it serve?

Return valid JSON only.`;
  }

  private getPlatformContext(platform: string): string {
    const contexts: Record<string, string> = {
      instagram: `Instagram context:
- Core: Direct messages, posting content, viewing own profile
- Distracting: Feed, Explore page, Reels, Stories, suggested posts
- Mixed: Search (can be useful for discovery)`,

      youtube: `YouTube context:
- Core: Subscriptions feed, individual video watching, content creation
- Distracting: Homepage recommendations, Shorts, Trending, Search results
- Mixed: Search (can find specific content)`,

      tiktok: `TikTok context:
- Core: Upload interface, creator tools, direct messages
- Distracting: For You Page, Following feed, trending content
- Mixed: Search, hashtags`,

      facebook: `Facebook context:
- Core: Messages, events, groups (for legitimate use)
- Distracting: News Feed, Watch, Marketplace, algorithmic content
- Mixed: Search, specific pages`,

      snapchat: `Snapchat context:
- Core: Chat, stories from friends, camera
- Distracting: Discover page, Spotlight, suggested content
- Mixed: Search for friends`
    };

    return contexts[platform] || '';
  }

  async isConfigured(): Promise<boolean> {
    return !!this.openai;
  }

  async getUsageStats(): Promise<{
    requests: number;
    cost: number;
    budget: number;
    budgetUsed: number;
    lastReset: string;
  }> {
    this.resetDailyCounters();
    
    return {
      requests: this.requestsToday,
      cost: parseFloat(this.costToday.toFixed(4)),
      budget: this.dailyBudget,
      budgetUsed: parseFloat(((this.costToday / this.dailyBudget) * 100).toFixed(2)),
      lastReset: this.lastResetDate
    };
  }
}
