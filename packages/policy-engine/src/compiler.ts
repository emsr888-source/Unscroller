import { Policy, CompiledPolicy, Platform } from './types';
import { IOSCompiler } from './compilers/ios-compiler';
import { AndroidCompiler } from './compilers/android-compiler';
import { DesktopCompiler } from './compilers/desktop-compiler';
import { buildNavigationTargets } from './utils/patterns';

export class PolicyCompiler {
  /**
   * Compile full policy for all platforms
   */
  static compileAll(policy: Policy): CompiledPolicy {
    const compiled: CompiledPolicy = {
      version: policy.version,
      providers: {},
    };

    for (const [providerId, providerPolicy] of Object.entries(policy.providers)) {
      // Determine filter mode (YouTube-specific)
      const filterMode = providerId === 'youtube' ? policy.youtubeFilterMode : undefined;

      compiled.providers[providerId] = {
        ios: IOSCompiler.compile(providerPolicy, filterMode),
        android: AndroidCompiler.compile(providerPolicy, filterMode),
        desktop: DesktopCompiler.compile(providerPolicy, filterMode),
        quick: providerPolicy.quick || {},
      };
    }

    return compiled;
  }

  /**
   * Compile policy for specific platform
   */
  static compile(policy: Policy, platform: Platform, providerId?: string): any {
    if (providerId) {
      const providerPolicy = policy.providers[providerId];
      if (!providerPolicy) {
        throw new Error(`Provider ${providerId} not found in policy`);
      }

      const filterMode = providerId === 'youtube' ? policy.youtubeFilterMode : undefined;

      switch (platform) {
        case 'ios':
          return IOSCompiler.compile(providerPolicy, filterMode);
        case 'android':
          return AndroidCompiler.compile(providerPolicy, filterMode);
        case 'desktop':
          return DesktopCompiler.compile(providerPolicy, filterMode);
      }
    }

    // Compile all providers for the platform
    return this.compileAll(policy);
  }

  /**
   * Check if navigation is allowed
   * Allow patterns are checked FIRST to ensure necessary resources load
   */
  static isNavigationAllowed(url: string, allowPatterns: RegExp[], blockPatterns: RegExp[]): boolean {
    const targets = buildNavigationTargets(url);

    // Allow patterns take precedence
    for (const pattern of allowPatterns) {
      if (targets.some(target => pattern.test(target))) {
        return true;
      }
    }

    // Explicitly blocked paths/URLs
    for (const pattern of blockPatterns) {
      if (targets.some(target => pattern.test(target))) {
        return false;
      }
    }

    // Default fail-closed behaviour
    return false;
  }

  /**
   * Check if a sub-resource request should be allowed.
   * Only block when it explicitly matches a blocked pattern.
   */
  static isResourceAllowed(url: string, blockPatterns: RegExp[]): boolean {
    const targets = buildNavigationTargets(url);

    for (const pattern of blockPatterns) {
      if (targets.some(target => pattern.test(target))) {
        return false;
      }
    }

    return true;
  }

  static isExplicitlyBlocked(url: string, blockPatterns: RegExp[]): boolean {
    const targets = buildNavigationTargets(url);
    return blockPatterns.some(pattern => targets.some(target => pattern.test(target)));
  }

  /**
   * Get nearest allowed route
   */
  static getNearestAllowedRoute(
    url: string,
    allowPatterns: RegExp[],
    startURL: string
  ): string {
    // For now, just return start URL
    // Could implement smarter logic to find closest allowed route
    return startURL;
  }
}
