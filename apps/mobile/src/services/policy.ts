import { PolicyParser, PolicyCompiler, Policy, Platform } from '@creator-mode/policy-engine';
import { MMKV } from 'react-native-mmkv';
import { getAccessToken } from './supabase';
import { CONFIG } from '../config/environment';

const storage = new MMKV({ id: 'policy-storage' });

export class PolicyService {
  private static cachedPolicy: Policy | null = null;

  /**
   * Fetch and cache policy from backend
   */
  static async fetchPolicy(): Promise<Policy> {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${CONFIG.API_URL}/api/policy`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policy');
      }

      const signedPolicy = await response.json();

      // Validate signature (simplified - in production, verify with public key)
      const policy = PolicyParser.parse(signedPolicy.policy);

      // Cache
      storage.set('policy', JSON.stringify(policy));
      storage.set('policy-version', policy.version);
      this.cachedPolicy = policy;

      return policy;
    } catch (error) {
      console.error('Failed to fetch policy:', error);
      // Return cached policy as fallback
      return this.getCachedPolicy();
    }
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
    throw new Error('No policy available');
  }

  /**
   * Get compiled rules for provider
   */
  static getProviderRules(providerId: string, platform: Platform) {
    const policy = this.getCachedPolicy();
    return PolicyCompiler.compile(policy, platform, providerId);
  }

  /**
   * Check if navigation is allowed
   */
  static isNavigationAllowed(providerId: string, url: string, platform: Platform): boolean {
    const rules = this.getProviderRules(providerId, platform);
    return PolicyCompiler.isNavigationAllowed(url, rules.allowPatterns, rules.blockPatterns);
  }

  /**
   * Get quick actions for provider
   */
  static getQuickActions(providerId: string) {
    const policy = this.getCachedPolicy();
    return policy.providers[providerId]?.quick || {};
  }
}
