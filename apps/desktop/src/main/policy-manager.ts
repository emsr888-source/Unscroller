import { PolicyParser, PolicyCompiler, Policy } from '@creator-mode/policy-engine';
import Store from 'electron-store';
import * as https from 'https';
import * as http from 'http';
import type { OnBeforeRequestListenerDetails } from 'electron';
import type { DesktopCompiledRules } from '@creator-mode/policy-engine';

const store = new Store();
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export class PolicyManager {
  private cachedPolicy: Policy | null = null;

  async fetchPolicy(): Promise<Policy> {
    try {
      const response = await this.httpGet(`${BACKEND_URL}/api/policy`);
      const signedPolicy = JSON.parse(response);

      // Validate and parse
      const policy = PolicyParser.parse(signedPolicy.policy);

      // Cache
      store.set('policy', policy);
      store.set('policy-version', policy.version);
      this.cachedPolicy = policy;

      console.log(`[PolicyManager] Fetched policy version: ${policy.version}`);
      return policy;
    } catch (error) {
      console.error('[PolicyManager] Failed to fetch policy:', error);
      return this.getCachedPolicy();
    }
  }

  getCachedPolicy(): Policy {
    if (this.cachedPolicy) {
      return this.cachedPolicy;
    }

    const cached = store.get('policy') as Policy;
    if (cached) {
      this.cachedPolicy = cached;
      return this.cachedPolicy;
    }

    throw new Error('No policy available');
  }

  getCompiledRules(providerId: string): DesktopCompiledRules {
    const policy = this.getCachedPolicy();
    return PolicyCompiler.compile(policy, 'desktop', providerId);
  }

  isNavigationAllowed(providerId: string, url: string): boolean {
    const rules = this.getCompiledRules(providerId);
    return PolicyCompiler.isNavigationAllowed(url, rules.allowPatterns, rules.blockPatterns);
  }

  isNavigationBlocked(providerId: string, url: string): boolean {
    const rules = this.getCompiledRules(providerId);
    return PolicyCompiler.isExplicitlyBlocked(url, rules.blockPatterns);
  }

  isRequestAllowed(
    providerId: string,
    url: string,
    resourceType: OnBeforeRequestListenerDetails['resourceType']
  ): boolean {
    const rules = this.getCompiledRules(providerId);

    if (resourceType === 'mainFrame' || resourceType === 'subFrame') {
      if (PolicyCompiler.isExplicitlyBlocked(url, rules.blockPatterns)) {
        return false;
      }
      return true;
    }

    if (rules.webRequestFilters) {
      const matchesPattern = (pattern: string) => {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp(`^${escaped}$`).test(url);
      };
      for (const filter of rules.webRequestFilters) {
        if (filter.types && filter.types.length && !filter.types.includes(resourceType)) {
          continue;
        }
        if (filter.urls.some(matchesPattern)) {
          return false;
        }
      }
    }

    return PolicyCompiler.isResourceAllowed(url, rules.blockPatterns);
  }

  getProviders() {
    return PolicyParser.getProviders(this.getCachedPolicy());
  }

  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      protocol.get(url, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }).on('error', reject);
    });
  }
}
