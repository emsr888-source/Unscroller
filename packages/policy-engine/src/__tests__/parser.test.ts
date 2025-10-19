import { PolicyParser } from '../parser';
import { Policy } from '../types';

describe('PolicyParser', () => {
  const validPolicy = {
    version: '1.0.0',
    youtubeFilterMode: 'safe' as const,
    providers: {
      instagram: {
        start: 'https://www.instagram.com/direct/inbox/',
        allow: ['/direct/', '/compose/'],
        block: ['/explore/', '/reels/'],
        dom: {
          hide: ['a[href="/explore"]'],
        },
        quick: {
          dm: 'https://www.instagram.com/direct/inbox/',
          compose: 'https://www.instagram.com/p/create/',
        },
      },
    },
  };

  describe('parse', () => {
    it('should parse valid policy JSON', () => {
      const policy = PolicyParser.parse(validPolicy);
      expect(policy).toBeDefined();
      expect(policy.version).toBe('1.0.0');
      expect(policy.providers.instagram).toBeDefined();
    });

    it('should throw on invalid policy JSON', () => {
      const invalidPolicy = {
        version: '1.0.0',
        // missing providers
      };
      expect(() => PolicyParser.parse(invalidPolicy)).toThrow();
    });

    it('should throw on invalid provider config', () => {
      const invalidProvider = {
        version: '1.0.0',
        providers: {
          instagram: {
            // missing start URL
            allow: [],
            block: [],
          },
        },
      };
      expect(() => PolicyParser.parse(invalidProvider)).toThrow();
    });
  });

  describe('validate', () => {
    it('should return valid: true for valid policy', () => {
      const result = PolicyParser.validate(validPolicy);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return valid: false with errors for invalid policy', () => {
      const invalidPolicy = {
        version: '1.0.0',
        // missing providers
      };
      const result = PolicyParser.validate(invalidPolicy);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('getVersion', () => {
    it('should return policy version', () => {
      const policy = PolicyParser.parse(validPolicy);
      const version = PolicyParser.getVersion(policy);
      expect(version).toBe('1.0.0');
    });
  });

  describe('getProviders', () => {
    it('should return list of provider IDs', () => {
      const policy = PolicyParser.parse(validPolicy);
      const providers = PolicyParser.getProviders(policy);
      expect(providers).toEqual(['instagram']);
    });
  });
});

