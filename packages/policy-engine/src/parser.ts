import { Policy, PolicySchema } from './types';

export class PolicyParser {
  /**
   * Parse and validate policy JSON
   */
  static parse(policyJson: unknown): Policy {
    try {
      return PolicySchema.parse(policyJson);
    } catch (error) {
      throw new Error(`Invalid policy JSON: ${error}`);
    }
  }

  /**
   * Validate policy JSON without throwing
   */
  static validate(policyJson: unknown): { valid: boolean; errors?: string[] } {
    const result = PolicySchema.safeParse(policyJson);
    if (result.success) {
      return { valid: true };
    }
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }

  /**
   * Get policy version
   */
  static getVersion(policy: Policy): string {
    return policy.version;
  }

  /**
   * Get list of provider IDs
   */
  static getProviders(policy: Policy): string[] {
    return Object.keys(policy.providers);
  }
}
