import { ProviderPolicy, IOSCompiledRules, DomRules } from '../types';
import { patternToRegExp } from '../utils/patterns';

export class IOSCompiler {
  /**
   * Compile provider policy to iOS WKContentRuleList + WKUserScript
   */
  static compile(providerPolicy: ProviderPolicy, filterMode?: string): IOSCompiledRules {
    const contentRules = this.buildContentRules(providerPolicy, filterMode);
    const userScript = this.buildUserScript(providerPolicy.dom, filterMode);
    const allowPatterns = providerPolicy.allow.map(patternToRegExp);
    const blockPatterns = providerPolicy.block.map(patternToRegExp);

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
  private static buildContentRules(providerPolicy: ProviderPolicy, filterMode?: string): any[] {
    const rules: any[] = [];

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
  private static buildUserScript(dom?: DomRules, filterMode?: string): string {
    let script = `
(function() {
  'use strict';
  
  // Creator Mode Policy Enforcement
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
            alert('This section is blocked by Creator Mode');
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
  private static convertToURLFilter(pattern: string): string {
    // Escape special regex chars for WKContentRuleList
    // WKContentRuleList uses a simpler pattern syntax
    return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
