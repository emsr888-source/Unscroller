"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidCompiler = void 0;
const patterns_1 = require("../utils/patterns");
class AndroidCompiler {
    /**
     * Compile provider policy to Android WebView rules
     */
    static compile(providerPolicy, filterMode) {
        const blockUrls = [...providerPolicy.block];
        // Add filter mode URLs
        if (providerPolicy.filterModes && filterMode) {
            const mode = providerPolicy.filterModes[filterMode];
            if (mode?.blockUrls) {
                blockUrls.push(...mode.blockUrls);
            }
        }
        const domScript = this.buildDOMScript(providerPolicy.dom, filterMode);
        const allowPatterns = providerPolicy.allow.map(patterns_1.patternToRegExp);
        const blockPatterns = providerPolicy.block.map(patterns_1.patternToRegExp);
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
    static buildDOMScript(dom, filterMode) {
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
      this.disabledAnchors.forEach(path => {
        try {
          document.querySelectorAll(\`a[href^="\${path}"]\`).forEach(el => {
            el.addEventListener('click', e => {
              e.preventDefault();
              e.stopPropagation();
              if (window.Unscroller) {
                window.Unscroller.onBlockedNavigation(path);
              }
            }, true);
          });
        } catch (e) {
          console.warn('[CM] Failed to disable anchors:', path, e);
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
exports.AndroidCompiler = AndroidCompiler;
