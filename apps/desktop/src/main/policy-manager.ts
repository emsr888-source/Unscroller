import { PolicyParser, PolicyCompiler, Policy } from '@unscroller/policy-engine';
import Store from 'electron-store';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import type { OnBeforeRequestListenerDetails } from 'electron';
import type { DesktopCompiledRules } from '@unscroller/policy-engine';

const store = new Store();

export async function fetchRemotePolicy(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const obj = await res.json();
    if (!obj || typeof obj !== 'object' || !obj.providers) throw new Error('Invalid policy JSON');
    return obj;
  } catch (e) {
    console.warn('[policy] remote fetch failed:', e);
    return null;
  }
}

export class PolicyManager {
  private cachedPolicy: Policy | null = null;

  async fetchPolicy(): Promise<Policy> {
    const remote = await fetchRemotePolicy(process.env.POLICY_URL ?? 'http://localhost:3001/policy');
    if (remote) {
      try {
        const parsed = PolicyParser.parse(remote as Policy);
        store.set('policy', parsed);
        store.set('policy-version', parsed.version);
        this.cachedPolicy = parsed;
        console.log(`[PolicyManager] Fetched policy version: ${parsed.version}`);
        return parsed;
      } catch (error) {
        console.error('[PolicyManager] Remote policy parse failed:', error);
      }
    }

    const localPolicy = this.loadLocalPolicy();
    if (localPolicy) {
      return localPolicy;
    }
    return this.getCachedPolicy();
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

  private loadLocalPolicy(): Policy | null {
    const appPath = app.getAppPath();
    const candidatePaths = [
      path.resolve(appPath, 'policy', 'policy.json'),
      path.resolve(appPath, 'dist', 'policy', 'policy.json'),
      path.resolve(appPath, '..', 'policy', 'policy.json'),
      path.resolve(appPath, '..', '..', 'policy', 'policy.json'),
      path.resolve(appPath, '..', '..', '..', 'policy', 'policy.json'),
      path.resolve(__dirname, '..', '..', '..', '..', 'policy', 'policy.json'),
      path.resolve(process.cwd(), 'policy', 'policy.json'),
      path.resolve(process.cwd(), '..', 'policy', 'policy.json'),
      path.resolve(process.cwd(), '..', '..', 'policy', 'policy.json')
    ];

    for (const candidate of candidatePaths) {
      try {
        if (!fs.existsSync(candidate)) {
          console.log(`[PolicyManager] Local policy not found at ${candidate}`);
          continue;
        }
        console.log(`[PolicyManager] Attempting to load local policy from ${candidate}`);
        const raw = fs.readFileSync(candidate, 'utf-8');
        const policy = PolicyParser.parse(JSON.parse(raw));
        store.set('policy', policy);
        store.set('policy-version', policy.version);
        this.cachedPolicy = policy;
        console.log(`[PolicyManager] Loaded local policy fallback from ${candidate}`);
        return policy;
      } catch (error) {
        console.error('[PolicyManager] Failed reading local policy candidate:', candidate, error);
      }
    }

    return null;
  }

}
