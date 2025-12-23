"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicySchema = exports.ProviderPolicySchema = exports.QuickActionsSchema = exports.FilterModeSchema = exports.DomRulesSchema = void 0;
const zod_1 = require("zod");
// Zod schemas for validation
exports.DomRulesSchema = zod_1.z.object({
    hide: zod_1.z.array(zod_1.z.string()).optional(),
    disableAnchorsTo: zod_1.z.array(zod_1.z.string()).optional(),
    script: zod_1.z.string().optional(),
});
exports.FilterModeSchema = zod_1.z.object({
    blockUrls: zod_1.z.array(zod_1.z.string()).optional(),
    hideSelectors: zod_1.z.array(zod_1.z.string()).optional(),
    scriptlets: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.QuickActionsSchema = zod_1.z.object({
    dm: zod_1.z.string().optional(),
    compose: zod_1.z.string().optional(),
    profile: zod_1.z.string().optional(),
    notifications: zod_1.z.string().optional(),
});
exports.ProviderPolicySchema = zod_1.z.object({
    start: zod_1.z.string().url(),
    allow: zod_1.z.array(zod_1.z.string()),
    block: zod_1.z.array(zod_1.z.string()),
    dom: exports.DomRulesSchema.optional(),
    filterModes: zod_1.z.record(exports.FilterModeSchema).optional(),
    quick: exports.QuickActionsSchema.optional(),
});
exports.PolicySchema = zod_1.z.object({
    version: zod_1.z.string(),
    youtubeFilterMode: zod_1.z.enum(['safe', 'aggressive']).optional(),
    providers: zod_1.z.record(exports.ProviderPolicySchema),
});
