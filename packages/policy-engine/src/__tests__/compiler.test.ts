import { PolicyCompiler } from '../compiler';
import { PolicyParser } from '../parser';
import { Policy } from '../types';

describe('PolicyCompiler', () => {
  const validPolicy: Policy = {
    version: '1.0.0',
    youtubeFilterMode: 'safe',
    providers: {
      instagram: {
        start: 'https://www.instagram.com/direct/inbox/',
        allow: [
          '*://www.instagram.com/direct/*',
          '*://instagram.com/direct/*',
          '/direct/.*',
          '/api/.*',
        ],
        block: [
          '^https?://(?:www\\.)?instagram\\.com/?$',
          '/explore',
          '/reels/.*',
        ],
        dom: {
          hide: ['a[href="/explore"]', 'a[href="/reels"]'],
        },
        quick: {
          dm: 'https://www.instagram.com/direct/inbox/',
          compose: 'https://www.instagram.com/p/create/',
        },
      },
    },
  };

  describe('compile', () => {
    it('should compile policy for iOS platform', () => {
      const compiled = PolicyCompiler.compile(validPolicy, 'ios', 'instagram');
      expect(compiled).toBeDefined();
      expect(compiled.contentRules).toBeDefined();
      expect(compiled.userScript).toBeDefined();
      expect(compiled.allowPatterns).toBeDefined();
      expect(compiled.blockPatterns).toBeDefined();
      expect(compiled.startURL).toBe('https://www.instagram.com/direct/inbox/');
    });

    it('should compile policy for Android platform', () => {
      const compiled = PolicyCompiler.compile(validPolicy, 'android', 'instagram');
      expect(compiled).toBeDefined();
      expect(compiled.blockUrls).toBeDefined();
      expect(compiled.domScript).toBeDefined();
      expect(compiled.allowPatterns).toBeDefined();
      expect(compiled.blockPatterns).toBeDefined();
    });

    it('should compile policy for Desktop platform', () => {
      const compiled = PolicyCompiler.compile(validPolicy, 'desktop', 'instagram');
      expect(compiled).toBeDefined();
      expect(compiled.webRequestFilters).toBeDefined();
      expect(compiled.contentScript).toBeDefined();
      expect(compiled.allowPatterns).toBeDefined();
      expect(compiled.blockPatterns).toBeDefined();
    });
  });

  describe('isNavigationAllowed', () => {
    const desktopRules = PolicyCompiler.compile(validPolicy, 'desktop', 'instagram');
    const allowPatterns = desktopRules.allowPatterns;
    const blockPatterns = desktopRules.blockPatterns;

    it('should allow URLs matching allow patterns', () => {
      const url = 'https://www.instagram.com/direct/inbox/';
      const allowed = PolicyCompiler.isNavigationAllowed(url, allowPatterns, blockPatterns);
      expect(allowed).toBe(true);
    });

    it('should block URLs matching path-only block patterns', () => {
      const url = 'https://www.instagram.com/explore/';
      const allowed = PolicyCompiler.isNavigationAllowed(url, allowPatterns, blockPatterns);
      expect(allowed).toBe(false);
    });

    it('should block URLs matching block patterns', () => {
      const url = 'https://www.instagram.com/reels/';
      const allowed = PolicyCompiler.isNavigationAllowed(url, allowPatterns, blockPatterns);
      expect(allowed).toBe(false);
    });

    it('should block URLs matching regex homepage rule', () => {
      const url = 'https://www.instagram.com/';
      const allowed = PolicyCompiler.isNavigationAllowed(url, allowPatterns, blockPatterns);
      expect(allowed).toBe(false);
    });

    it('should prioritize allow patterns over block patterns', () => {
      const url = 'https://www.instagram.com/api/';
      const allowed = PolicyCompiler.isNavigationAllowed(url, allowPatterns, blockPatterns);
      expect(allowed).toBe(true);
    });

    it('should block URLs not in allow or block patterns (fail-closed)', () => {
      const url = 'https://www.instagram.com/unknown/page/';
      const allowed = PolicyCompiler.isNavigationAllowed(url, allowPatterns, blockPatterns);
      expect(allowed).toBe(false);
    });
  });

  describe('isResourceAllowed', () => {
    const desktopRules = PolicyCompiler.compile(validPolicy, 'desktop', 'instagram');
    const blockPatterns = desktopRules.blockPatterns;

    it('should allow resources not matching block patterns', () => {
      const url = 'https://static.cdninstagram.com/some/script.js';
      const allowed = PolicyCompiler.isResourceAllowed(url, blockPatterns);
      expect(allowed).toBe(true);
    });

    it('should block resources matching block patterns', () => {
      const url = 'https://www.instagram.com/reels/awesome/content.js';
      const allowed = PolicyCompiler.isResourceAllowed(url, blockPatterns);
      expect(allowed).toBe(false);
    });
  });

  describe('isExplicitlyBlocked', () => {
    const desktopRules = PolicyCompiler.compile(validPolicy, 'desktop', 'instagram');
    const blockPatterns = desktopRules.blockPatterns;

    it('returns true for URLs matching block patterns', () => {
      expect(PolicyCompiler.isExplicitlyBlocked('https://www.instagram.com/explore/', blockPatterns)).toBe(true);
    });

    it('returns false when no block pattern matches', () => {
      expect(PolicyCompiler.isExplicitlyBlocked('https://www.instagram.com/direct/inbox/', blockPatterns)).toBe(false);
    });
  });

  describe('compileAll', () => {
    it('should compile policy for all platforms', () => {
      const compiled = PolicyCompiler.compileAll(validPolicy);
      expect(compiled.version).toBe('1.0.0');
      expect(compiled.providers.instagram).toBeDefined();
      expect(compiled.providers.instagram.ios).toBeDefined();
      expect(compiled.providers.instagram.android).toBeDefined();
      expect(compiled.providers.instagram.desktop).toBeDefined();
      expect(compiled.providers.instagram.quick).toBeDefined();
      expect(compiled.providers.instagram.android.allowPatterns).toHaveLength(4);
      expect(compiled.providers.instagram.ios.allowPatterns).toHaveLength(4);
    });
  });
});
