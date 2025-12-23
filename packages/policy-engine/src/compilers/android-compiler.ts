import { ProviderPolicy, AndroidCompiledRules, DomRules } from '../types';
import { patternToRegExp } from '../utils/patterns';

export class AndroidCompiler {
  /**
   * Compile provider policy to Android WebView rules
   */
  static compile(providerPolicy: ProviderPolicy, filterMode?: string): AndroidCompiledRules {
    const blockUrls = [...providerPolicy.block];

    // Add filter mode URLs
    if (providerPolicy.filterModes && filterMode) {
      const mode = providerPolicy.filterModes[filterMode];
      if (mode?.blockUrls) {
        blockUrls.push(...mode.blockUrls);
      }
    }

    const domScript = this.buildDOMScript(providerPolicy.dom, filterMode);
    const allowPatterns = providerPolicy.allow.map(patternToRegExp);
    const blockPatterns = providerPolicy.block.map(patternToRegExp);

    return {
      blockUrls,
      allowPatterns,
      blockPatterns,
      domScript,
      startURL: providerPolicy.start,
    };
  }

  /**
   * Build JavaScript for DOM manipulation
   */
  private static buildDOMScript(dom?: DomRules, filterMode?: string): string {
    return `
(function() {
  'use strict';
  
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
        try {
          document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
            el.setAttribute('data-cm-hidden', 'true');
          });
        } catch (e) {
          console.warn('[CM] Failed to hide:', selector, e);
        }
      });
    },
    
    disableAnchors() {
      const toSelector = (value: unknown): string | null => {
        if (typeof value !== 'string') {
          return null;
        }

        const trimmed = value.trim();
        if (!trimmed) {
          return null;
        }

        if (trimmed === '/' || trimmed === '#') {
          return "a[href='" + trimmed + "']";
        }

        if (trimmed.endsWith('*')) {
          const base = trimmed.slice(0, -1).trim();
          return base ? "a[href^='" + base + "']" : null;
        }

        return "a[href^='" + trimmed + "']";
      };

      this.disabledAnchors.forEach(entry => {
        try {
          const selector = toSelector(entry);
          if (!selector) {
            return;
          }

          document.querySelectorAll(selector).forEach(el => {
            el.addEventListener(
              'click',
              e => {
                e.preventDefault();
                e.stopPropagation();
                if (window.Unscroller) {
                  window.Unscroller.onBlockedNavigation(String(entry));
                }
              },
              true
            );
          });
        } catch (e) {
          console.warn('[CM] Failed to disable anchors:', entry, e);
        }
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
  }
}
