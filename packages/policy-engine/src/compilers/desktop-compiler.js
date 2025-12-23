"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesktopCompiler = void 0;
const patterns_1 = require("../utils/patterns");
class DesktopCompiler {
    /**
     * Compile provider policy to Electron webRequest filters + content scripts
     */
    static compile(providerPolicy, filterMode) {
        const webRequestFilters = this.buildWebRequestFilters(providerPolicy, filterMode);
        const contentScript = this.buildContentScript(providerPolicy.dom, filterMode);
        const allowPatterns = providerPolicy.allow.map(patterns_1.patternToRegExp);
        const blockPatterns = providerPolicy.block.map(patterns_1.patternToRegExp);
        return {
            webRequestFilters,
            contentScript,
            allowPatterns,
            blockPatterns,
            startURL: providerPolicy.start,
        };
    }
    /**
     * Build Electron webRequest filters
     */
    static buildWebRequestFilters(providerPolicy, filterMode) {
        const filters = [];
        // Block URL patterns
        const blockUrls = [...providerPolicy.block];
        // Add filter mode URLs
        if (providerPolicy.filterModes && filterMode) {
            const mode = providerPolicy.filterModes[filterMode];
            if (mode?.blockUrls) {
                blockUrls.push(...mode.blockUrls);
            }
        }
        if (blockUrls.length > 0) {
            filters.push({
                urls: blockUrls.map(pattern => {
                    // Convert pattern to Electron URL filter format
                    if (pattern.startsWith('http')) {
                        return pattern;
                    }
                    const baseUrl = new URL(providerPolicy.start);
                    return `${baseUrl.protocol}//${baseUrl.hostname}${pattern}`;
                }),
                types: ['mainFrame', 'subFrame', 'xmlhttprequest', 'script', 'image', 'media'],
            });
        }
        return filters;
    }
    /**
     * Build content script for DOM manipulation
     */
    static buildContentScript(dom, filterMode) {
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
      this.injectCustomScript();
    },
    
    hideElements() {
      this.hideSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
            el.setAttribute('data-cm-hidden', 'true');
          });
        } catch (e) {
          console.warn('[Unscroller] Failed to hide:', selector, e);
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
              this.showBlockNotification(path);
            }, true);
          });
        } catch (e) {
          console.warn('[Unscroller] Failed to disable anchors:', path, e);
        }
      });
    },
    
    showBlockNotification(path) {
      const notification = document.createElement('div');
      notification.textContent = 'Unscroller: This section is blocked';
      notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a1a;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      \`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    },
    
    observeMutations() {
      const observer = new MutationObserver(() => {
        this.hideElements();
        this.disableAnchors();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    },
    
    injectCustomScript() {
      ${dom?.script || ''}
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
exports.DesktopCompiler = DesktopCompiler;
