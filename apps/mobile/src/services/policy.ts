import { PolicyParser, PolicyCompiler, Policy, Platform } from '@unscroller/policy-engine';
import { createSafeStorage } from '../lib/safeStorage';
import { getAccessToken } from './supabase';
import { CONFIG } from '../config/environment';
import type { ProviderId } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const embeddedPolicyJson = require('../../../../policy/policy.json');
const embeddedPolicy: Policy = PolicyParser.parse(embeddedPolicyJson);

const storage = createSafeStorage('policy-storage');

export class PolicyService {
  private static cachedPolicy: Policy | null = null;

  /**
   * Fetch and cache policy from backend
   */
  static async fetchPolicy(): Promise<Policy> {
    try {
      const apiUrl = CONFIG.API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const token = await getAccessToken();
      const response = await fetch(`${apiUrl}/policy`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policy');
      }

      const payload = await response.json();

      const policyPayload = (() => {
        if (payload?.policy) {
          return payload.policy;
        }
        return payload;
      })();

      if (!policyPayload) {
        throw new Error('Policy payload missing');
      }

      const parsedPolicy =
        typeof policyPayload === 'string'
          ? PolicyParser.parse(JSON.parse(policyPayload))
          : PolicyParser.parse(policyPayload);

      // Cache
      storage.set('policy', JSON.stringify(parsedPolicy));
      storage.set('policy-version', parsedPolicy.version);
      this.cachedPolicy = parsedPolicy;

      return parsedPolicy;
    } catch (error) {
      console.error('Failed to fetch policy:', error);
      // Return cached policy as fallback
      return this.getCachedPolicy();
    }
  }

  /**
   * Clear policy cache and reload from embedded policy
   */
  static clearCache(): void {
    this.cachedPolicy = null;
    storage.delete('policy');
    storage.delete('policy-version');
    // Force reload embedded policy
    this.cachedPolicy = embeddedPolicy;
  }

  /**
   * Get cached policy
   */
  static getCachedPolicy(): Policy {
    if (this.cachedPolicy) {
      return this.cachedPolicy;
    }

    const cached = storage.getString('policy');
    if (cached) {
      this.cachedPolicy = PolicyParser.parse(JSON.parse(cached));
      return this.cachedPolicy;
    }

    // Fail-closed: use embedded default policy
    this.cachedPolicy = embeddedPolicy;
    return embeddedPolicy;
  }

  /**
   * Get compiled rules for provider
   */
  static getProviderRules(providerId: ProviderId, platform: Platform) {
    const policy = this.getCachedPolicy();
    return PolicyCompiler.compile(policy, platform, providerId);
  }

  /**
   * Check if navigation is allowed
   */
  static isNavigationAllowed(providerId: ProviderId, url: string, platform: Platform): boolean {
    const rules = this.getProviderRules(providerId, platform);

    if (!rules) {
      return false;
    }

    const explicitlyBlocked = PolicyCompiler.isExplicitlyBlocked(url, rules.blockPatterns ?? []);
    if (explicitlyBlocked) {
      return false;
    }

    if (!rules.allowPatterns || rules.allowPatterns.length === 0) {
      return true;
    }

    const explicitlyAllowed = PolicyCompiler.isNavigationAllowed(url, rules.allowPatterns, []);
    if (explicitlyAllowed) {
      return true;
    }

    return true;
  }

  /**
   * Get quick actions for provider
   */
  static getQuickActions(providerId: ProviderId) {
    const policy = this.getCachedPolicy();
    return policy.providers[providerId]?.quick || {};
  }
}
