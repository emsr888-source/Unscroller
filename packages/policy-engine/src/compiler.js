"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyCompiler = void 0;
const ios_compiler_1 = require("./compilers/ios-compiler");
const android_compiler_1 = require("./compilers/android-compiler");
const desktop_compiler_1 = require("./compilers/desktop-compiler");
const patterns_1 = require("./utils/patterns");
class PolicyCompiler {
    /**
     * Compile full policy for all platforms
     */
    static compileAll(policy) {
        const compiled = {
            version: policy.version,
            providers: {},
        };
        for (const [providerId, providerPolicy] of Object.entries(policy.providers)) {
            // Determine filter mode (YouTube-specific)
            const filterMode = providerId === 'youtube' ? policy.youtubeFilterMode : undefined;
            compiled.providers[providerId] = {
                ios: ios_compiler_1.IOSCompiler.compile(providerPolicy, filterMode),
                android: android_compiler_1.AndroidCompiler.compile(providerPolicy, filterMode),
                desktop: desktop_compiler_1.DesktopCompiler.compile(providerPolicy, filterMode),
                quick: providerPolicy.quick || {},
            };
        }
        return compiled;
    }
    /**
     * Compile policy for specific platform
     */
    static compile(policy, platform, providerId) {
        if (providerId) {
            const providerPolicy = policy.providers[providerId];
            if (!providerPolicy) {
                throw new Error(`Provider ${providerId} not found in policy`);
            }
            const filterMode = providerId === 'youtube' ? policy.youtubeFilterMode : undefined;
            switch (platform) {
                case 'ios':
                    return ios_compiler_1.IOSCompiler.compile(providerPolicy, filterMode);
                case 'android':
                    return android_compiler_1.AndroidCompiler.compile(providerPolicy, filterMode);
                case 'desktop':
                    return desktop_compiler_1.DesktopCompiler.compile(providerPolicy, filterMode);
            }
        }
        // Compile all providers for the platform
        return this.compileAll(policy);
    }
    /**
     * Check if navigation is allowed
     * Allow patterns are checked FIRST to ensure necessary resources load
     */
    static isNavigationAllowed(url, allowPatterns, blockPatterns) {
        const targets = (0, patterns_1.buildNavigationTargets)(url);
        // Allow patterns take precedence
        for (const pattern of allowPatterns) {
            if (targets.some(target => pattern.test(target))) {
                return true;
            }
        }
        // Explicitly blocked paths/URLs
        for (const pattern of blockPatterns) {
            if (targets.some(target => pattern.test(target))) {
                return false;
            }
        }
        // Default fail-closed behaviour
        return false;
    }
    /**
     * Check if a sub-resource request should be allowed.
     * Only block when it explicitly matches a blocked pattern.
     */
    static isResourceAllowed(url, blockPatterns) {
        const targets = (0, patterns_1.buildNavigationTargets)(url);
        for (const pattern of blockPatterns) {
            if (targets.some(target => pattern.test(target))) {
                return false;
            }
        }
        return true;
    }
    static isExplicitlyBlocked(url, blockPatterns) {
        const targets = (0, patterns_1.buildNavigationTargets)(url);
        return blockPatterns.some(pattern => targets.some(target => pattern.test(target)));
    }
    /**
     * Get nearest allowed route
     */
    static getNearestAllowedRoute(url, allowPatterns, startURL) {
        // For now, just return start URL
        // Could implement smarter logic to find closest allowed route
        return startURL;
    }
}
exports.PolicyCompiler = PolicyCompiler;
