"use strict";
/**
 * Utilities for converting policy patterns (glob/regex) into RegExp instances.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.patternToRegExp = patternToRegExp;
exports.buildNavigationTargets = buildNavigationTargets;
/**
 * Determine whether a pattern string already looks like a raw regular expression.
 * We treat patterns that contain common regex tokens as regexes instead of globs.
 */
function looksLikeRegex(pattern) {
    const trimmed = pattern.trim();
    if (!trimmed)
        return false;
    // Starts with ^ or ends with $ usually indicates regex intent
    if (trimmed.startsWith('^') || trimmed.endsWith('$')) {
        return true;
    }
    // Explicit regex tokens or escaping sequences
    return /\\|\(|\)|\[|\]|\{|\}|\||\.\*/.test(trimmed);
}
/**
 * Convert a policy pattern into a RegExp.
 * Supports both glob-style patterns and explicit regex patterns.
 */
function patternToRegExp(pattern) {
    const trimmed = pattern.trim();
    if (!trimmed) {
        return new RegExp('^$');
    }
    if (looksLikeRegex(trimmed)) {
        try {
            return new RegExp(trimmed);
        }
        catch {
            // Fall through to glob conversion if the regex is invalid
        }
    }
    const escaped = trimmed
        .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
        .replace(/\*/g, '.*');
    const hasScheme = trimmed.includes('://');
    const startsWithSlash = trimmed.startsWith('/');
    let finalPattern = escaped;
    if (startsWithSlash) {
        // Allow optional trailing slash and query/hash when matching path-only patterns
        if (!trimmed.endsWith('*')) {
            finalPattern = `${finalPattern}(?:\\/)?`;
        }
        finalPattern = `^${finalPattern}(?:[?#].*)?$`;
    }
    else if (hasScheme) {
        finalPattern = `^${finalPattern}${trimmed.endsWith('*') ? '' : '(?:[?#].*)?'}$`;
    }
    else {
        // Fallback: partial match for host/path fragments
        finalPattern = trimmed.endsWith('*') ? `^${finalPattern}$` : finalPattern;
    }
    return new RegExp(finalPattern);
}
/**
 * Build a list of target strings that should be evaluated against allow/block regex patterns.
 * This makes it easier to match both full URLs and their path components.
 */
function buildNavigationTargets(url) {
    const targets = [url];
    try {
        const parsed = new URL(url);
        const pathnameWithQuery = `${parsed.pathname}${parsed.search}`;
        targets.push(parsed.origin + parsed.pathname);
        targets.push(parsed.pathname);
        targets.push(pathnameWithQuery);
        targets.push(parsed.hostname);
    }
    catch {
        // Ignore URL parsing errors and fall back to the raw URL
    }
    return Array.from(new Set(targets));
}
