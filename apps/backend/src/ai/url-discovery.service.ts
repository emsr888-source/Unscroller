import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface DiscoveredURL {
  url: string;
  platform: string;
  category: 'distracting' | 'useful' | 'unknown';
  confidence: number;
  timestamp: Date;
}

@Injectable()
export class URLDiscoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(URLDiscoveryService.name);
  private browser: Browser | null = null;
  private browserInitializing: Promise<Browser> | null = null;

  async onModuleInit() {
    // Initialize browser when module loads
    try {
      await this.ensureBrowser();
      this.logger.log('Browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize browser:', error instanceof Error ? error.message : String(error));
    }
  }

  async onModuleDestroy() {
    // Clean up browser when module is destroyed
    await this.cleanup();
  }

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    // If already initializing, wait for it
    if (this.browserInitializing) {
      return this.browserInitializing;
    }

    // Start initialization
    this.browserInitializing = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      this.browser = await this.browserInitializing;
      this.browserInitializing = null;
      return this.browser;
    } catch (error) {
      this.browserInitializing = null;
      throw error;
    }
  }

  async discoverPlatformURLs(platform: string): Promise<DiscoveredURL[]> {
    const urls = await this.crawlPlatform(platform);
    return this.analyzeURLs(urls, platform);
  }

  private async crawlPlatform(platform: string): Promise<string[]> {
    const startUrls = this.getPlatformStartUrls(platform);
    const discoveredUrls: Set<string> = new Set();

    const browser = await this.ensureBrowser();

    for (const startUrl of startUrls) {
      try {
        const page = await browser.newPage();
        await page.goto(startUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        // Extract all URLs from the page
        const urls = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href], [src], [data-src]'));
          return links.map(link => {
            const href = (link as any).href || (link as any).src || (link as any).getAttribute('data-src');
            return href ? new URL(href, window.location.origin).href : null;
          }).filter(Boolean);
        });

        urls.forEach(url => discoveredUrls.add(url));

        // Navigate to different sections to find more URLs
        await this.navigateAndDiscover(page, discoveredUrls);

        await page.close();
      } catch (error) {
        this.logger.error(`Error crawling ${platform} from ${startUrl}:`, error.message);
      }
    }

    return Array.from(discoveredUrls);
  }

  private getPlatformStartUrls(platform: string): string[] {
    const platformUrls: Record<string, string[]> = {
      instagram: [
        'https://www.instagram.com/',
        'https://www.instagram.com/explore/',
        'https://www.instagram.com/direct/inbox/'
      ],
      youtube: [
        'https://www.youtube.com/',
        'https://www.youtube.com/feed/subscriptions',
        'https://www.youtube.com/shorts'
      ],
      tiktok: [
        'https://www.tiktok.com/',
        'https://www.tiktok.com/foryou',
        'https://www.tiktok.com/upload'
      ],
      facebook: [
        'https://www.facebook.com/',
        'https://m.facebook.com/',
        'https://www.facebook.com/messages'
      ],
      snapchat: [
        'https://web.snapchat.com/',
        'https://www.snapchat.com/discover'
      ]
    };

    return platformUrls[platform] || [];
  }

  private async navigateAndDiscover(page: any, discoveredUrls: Set<string>) {
    // Try to find navigation elements and click them to discover more URLs
    try {
      const navigationSelectors = [
        'a[href*="explore"]',
        'a[href*="trending"]',
        'a[href*="shorts"]',
        'a[href*="reels"]',
        'a[href*="stories"]',
        '[data-testid*="nav"]',
        '[role="navigation"] a'
      ];

      for (const selector of navigationSelectors) {
        try {
          const elements = await page.$$(selector);
          for (const element of elements.slice(0, 3)) { // Limit to avoid infinite loops
            const href = await element.evaluate(el => (el as any).href);
            if (href && href.startsWith('http')) {
              discoveredUrls.add(href);
            }
          }
        } catch (e) {
          // Continue if selector fails
        }
      }
    } catch (error) {
      this.logger.warn('Error during navigation discovery:', error.message);
    }
  }

  private analyzeURLs(urls: string[], platform: string): DiscoveredURL[] {
    return urls.map(url => {
      const analysis = this.analyzeURL(url, platform);
      return {
        url,
        platform,
        category: analysis.category,
        confidence: analysis.confidence,
        timestamp: new Date()
      };
    });
  }

  private analyzeURL(url: string, platform: string): { category: 'distracting' | 'useful' | 'unknown', confidence: number } {
    // AI-powered analysis based on URL patterns and platform-specific rules
    const distractingPatterns = this.getDistractingPatterns(platform);
    const usefulPatterns = this.getUsefulPatterns(platform);

    // Check for distracting patterns first
    for (const pattern of distractingPatterns) {
      if (pattern.test(url)) {
        return { category: 'distracting', confidence: 0.9 };
      }
    }

    // Check for useful patterns
    for (const pattern of usefulPatterns) {
      if (pattern.test(url)) {
        return { category: 'useful', confidence: 0.9 };
      }
    }

    // Analyze URL structure and content
    return this.analyzeURLStructure(url, platform);
  }

  private getDistractingPatterns(platform: string): RegExp[] {
    const patterns: Record<string, RegExp[]> = {
      instagram: [
        /\/explore/i,
        /\/reels/i,
        /\/p\//i,
        /\/reel\//i,
        /\/stories/i,
        /\/tag\//i,
        /\/accounts\/activity/i,
        /\/suggested/i
      ],
      youtube: [
        /\/shorts/i,
        /\/feed\/trending/i,
        /\/feed\/explore/i,
        /\/results/i,
        /\/hashtag/i,
        /\/gaming/i
      ],
      tiktok: [
        /\/foryou/i,
        /\/following/i,
        /\/@[^\/]+$/i,
        /\/tag\//i,
        /\/discover/i,
        /\/trending/i
      ],
      facebook: [
        /\/watch/i,
        /\/groups/i,
        /\/marketplace/i,
        /\/gaming/i,
        /\/events/i,
        /\/story/i
      ],
      snapchat: [
        /\/discover/i,
        /\/spotlight/i,
        /\/stories/i
      ]
    };

    return patterns[platform] || [];
  }

  private getUsefulPatterns(platform: string): RegExp[] {
    const patterns: Record<string, RegExp[]> = {
      instagram: [
        /\/direct/i,
        /\/api\//i,
        /\/ajax\//i,
        /\/graphql/i,
        /static\.cdninstagram\.com/i,
        /scontent.*\.cdninstagram\.com/i
      ],
      youtube: [
        /\/feed\/subscriptions/i,
        /\/watch/i,
        /\/youtubei/i,
        /i\.ytimg\.com/i,
        /static\.doubleclick\.net/i
      ],
      tiktok: [
        /\/upload/i,
        /\/creator-center/i,
        /\/api\//i,
        /p16-sign.*\.tiktokcdn\.com/i
      ],
      facebook: [
        /\/messages/i,
        /\/messaging/i,
        /\/api\//i,
        /static\.xx\.fbcdn\.net/i
      ],
      snapchat: [
        /web\.snapchat\.com/i,
        /accounts\.snapchat\.com/i,
        /cf-st\.sc-cdn\.net/i
      ]
    };

    return patterns[platform] || [];
  }

  private analyzeURLStructure(url: string, platform: string): { category: 'distracting' | 'useful' | 'unknown', confidence: number } {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;

      // Analyze based on URL structure
      if (pathname === '/' || pathname === '') {
        return { category: 'distracting', confidence: 0.7 }; // Homepage is usually distracting
      }

      if (pathname.includes('/api/') || pathname.includes('/ajax/')) {
        return { category: 'useful', confidence: 0.8 }; // API calls are usually necessary
      }

      if (parsedUrl.hostname.includes('cdn') || parsedUrl.hostname.includes('static')) {
        return { category: 'useful', confidence: 0.8 }; // CDN resources are usually necessary
      }

      // Check for common distracting path patterns
      const distractingPaths = ['/explore', '/trending', '/search', '/hashtag', '/tag'];
      if (distractingPaths.some(path => pathname.includes(path))) {
        return { category: 'distracting', confidence: 0.7 };
      }

      return { category: 'unknown', confidence: 0.5 };
    } catch (error) {
      return { category: 'unknown', confidence: 0.1 };
    }
  }

  async cleanup() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.logger.log('Browser closed successfully');
      } catch (error) {
        this.logger.error('Error closing browser:', error instanceof Error ? error.message : String(error));
      } finally {
        this.browser = null;
        this.browserInitializing = null;
      }
    }
  }
}
