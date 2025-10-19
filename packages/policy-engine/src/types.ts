import { z } from 'zod';

// Zod schemas for validation
export const DomRulesSchema = z.object({
  hide: z.array(z.string()).optional(),
  disableAnchorsTo: z.array(z.string()).optional(),
  script: z.string().optional(),
});

export const FilterModeSchema = z.object({
  blockUrls: z.array(z.string()).optional(),
  hideSelectors: z.array(z.string()).optional(),
  scriptlets: z.array(z.string()).optional(),
});

export const QuickActionsSchema = z.object({
  dm: z.string().optional(),
  compose: z.string().optional(),
  profile: z.string().optional(),
  notifications: z.string().optional(),
});

export const ProviderPolicySchema = z.object({
  start: z.string().url(),
  allow: z.array(z.string()),
  block: z.array(z.string()),
  dom: DomRulesSchema.optional(),
  filterModes: z.record(FilterModeSchema).optional(),
  quick: QuickActionsSchema.optional(),
});

export const PolicySchema = z.object({
  version: z.string(),
  youtubeFilterMode: z.enum(['safe', 'aggressive']).optional(),
  providers: z.record(ProviderPolicySchema),
});

// TypeScript types
export type DomRules = z.infer<typeof DomRulesSchema>;
export type FilterMode = z.infer<typeof FilterModeSchema>;
export type QuickActions = z.infer<typeof QuickActionsSchema>;
export type ProviderPolicy = z.infer<typeof ProviderPolicySchema>;
export type Policy = z.infer<typeof PolicySchema>;

// Platform-specific compiled rules
export interface IOSCompiledRules {
  contentRules: string; // WKContentRuleList JSON
  userScript: string; // JavaScript for WKUserScript
  allowPatterns: RegExp[];
  blockPatterns: RegExp[];
  startURL: string;
}

export interface AndroidCompiledRules {
  blockUrls: string[];
  allowPatterns: RegExp[];
  blockPatterns: RegExp[];
  domScript: string;
  startURL: string;
}

export interface DesktopCompiledRules {
  webRequestFilters: Array<{
    urls: string[];
    types: string[];
  }>;
  contentScript: string;
  allowPatterns: RegExp[];
  blockPatterns: RegExp[];
  startURL: string;
}

export interface CompiledPolicy {
  version: string;
  providers: {
    [key: string]: {
      ios: IOSCompiledRules;
      android: AndroidCompiledRules;
      desktop: DesktopCompiledRules;
      quick: QuickActions;
    };
  };
}

export type Platform = 'ios' | 'android' | 'desktop';
