"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyParser = void 0;
const types_1 = require("./types");
class PolicyParser {
    /**
     * Parse and validate policy JSON
     */
    static parse(policyJson) {
        try {
            return types_1.PolicySchema.parse(policyJson);
        }
        catch (error) {
            throw new Error(`Invalid policy JSON: ${error}`);
        }
    }
    /**
     * Validate policy JSON without throwing
     */
    static validate(policyJson) {
        const result = types_1.PolicySchema.safeParse(policyJson);
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
    static getVersion(policy) {
        return policy.version;
    }
    /**
     * Get list of provider IDs
     */
    static getProviders(policy) {
        return Object.keys(policy.providers);
    }
}
exports.PolicyParser = PolicyParser;
