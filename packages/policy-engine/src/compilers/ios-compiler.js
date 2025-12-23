"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOSCompiler = void 0;
const patterns_1 = require("../utils/patterns");
class IOSCompiler {
    /**
     * Compile provider policy to iOS WKContentRuleList + WKUserScript
     */
    static compile(providerPolicy, filterMode) {
        const contentRules = this.buildContentRules(providerPolicy, filterMode);
        const userScript = this.buildUserScript(providerPolicy.dom, filterMode);
        const allowPatterns = providerPolicy.allow.map(patterns_1.patternToRegExp);
        const blockPatterns = providerPolicy.block.map(patterns_1.patternToRegExp);
        return {
            contentRules: JSON.stringify(contentRules),
            userScript,
            allowPatterns,
            blockPatterns,
            startURL: providerPolicy.start,
        };
    }
    /**
     * Build WKContentRuleList JSON
     */
    static buildContentRules(providerPolicy, filterMode) {
        const rules = [];
        // Block patterns
        providerPolicy.block.forEach((pattern, index) => {
            rules.push({
                trigger: {
                    'url-filter': this.convertToURLFilter(pattern),
                    'if-domain': [new URL(providerPolicy.start).hostname],
                },
                action: {
                    type: 'block',
                },
            });
        });
        // Filter mode URLs (e.g., YouTube ads)
        if (providerPolicy.filterModes && filterMode) {
            const mode = providerPolicy.filterModes[filterMode];
            if (mode?.blockUrls) {
                mode.blockUrls.forEach(url => {
                    rules.push({
                        trigger: {
                            'url-filter': this.convertToURLFilter(url),
                        },
                        action: {
                            type: 'block',
                        },
                    });
                });
            }
        }
        return rules;
    }
    /**
     * Build WKUserScript JavaScript
     */
    static buildUserScript(dom, filterMode) {
        let script = `
(function() {
  'use strict';
  
  // Unscroller Policy Enforcement
  const CM = {
    hideSelectors: ${JSON.stringify(dom?.hide || [])},
    disabledAnchors: ${JSON.stringify(dom?.disableAnchorsTo || [])},
    
    init() {
      this.hideElements();
      this.disableAnchors();
      this.observeMutations();
      ${dom?.script || ''}
    },
    
    hideElements() {
      this.hideSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.style.display = 'none';
          el.setAttribute('data-cm-hidden', 'true');
        });
      });
    },
    
    disableAnchors() {
      this.disabledAnchors.forEach(path => {
        document.querySelectorAll(\`a[href^="\${path}"]\`).forEach(el => {
          el.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            alert('This section is blocked by Unscroller');
          }, true);
        });
      });
    },
    
    observeMutations() {
      const observer = new MutationObserver(() => {
        this.hideElements();
        this.disableAnchors();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CM.init());
  } else {
    CM.init();
  }
})();
`;
        return script;
    }
    /**
     * Convert regex pattern to WKContentRuleList url-filter
     */
    static convertToURLFilter(pattern) {
        // Escape special regex chars for WKContentRuleList
        // WKContentRuleList uses a simpler pattern syntax
        return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
exports.IOSCompiler = IOSCompiler;
