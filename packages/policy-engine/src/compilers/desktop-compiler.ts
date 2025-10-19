import { ProviderPolicy, DesktopCompiledRules, DomRules } from '../types';
import { patternToRegExp } from '../utils/patterns';

export class DesktopCompiler {
  /**
   * Compile provider policy to Electron webRequest filters + content scripts
   */
  static compile(providerPolicy: ProviderPolicy, filterMode?: string): DesktopCompiledRules {
    const webRequestFilters = this.buildWebRequestFilters(providerPolicy, filterMode);
    const contentScript = this.buildContentScript(providerPolicy.dom, filterMode);
    const allowPatterns = providerPolicy.allow.map(patternToRegExp);
    const blockPatterns = providerPolicy.block.map(patternToRegExp);

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
  private static buildWebRequestFilters(
    providerPolicy: ProviderPolicy,
    filterMode?: string
  ): Array<{ urls: string[]; types: string[] }> {
    const filters: Array<{ urls: string[]; types: string[] }> = [];

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
  private static buildContentScript(dom?: DomRules, filterMode?: string): string {
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
          console.warn('[CreatorMode] Failed to hide:', selector, e);
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
          console.warn('[CreatorMode] Failed to disable anchors:', path, e);
        }
      });
    },
    
    showBlockNotification(path) {
      const notification = document.createElement('div');
      notification.textContent = 'Creator Mode: This section is blocked';
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
