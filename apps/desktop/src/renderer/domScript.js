(() => {
  try {
    const POL = window.__CM_POLICY || {};
    const ALLOW = (POL.allow || []).map(p => new RegExp(p));
    const BLOCK = (POL.block || []).map(p => new RegExp(p));
    const pathQuery = location.pathname + (location.search || '');
    if (BLOCK.some(rx => rx.test(pathQuery)) && !ALLOW.some(rx => rx.test(pathQuery))) {
      location.replace(POL.start);
    }
  } catch (error) {
    console.warn('[CreatorMode] Doc-start guard failed:', error);
  }
})();

(() => {
  const POL = window.__CM_POLICY || {};
  const toRx = (arr = []) => arr.map(pattern => new RegExp(pattern));
  const ALLOW = toRx(POL.allow || []);
  const BLOCK = toRx(POL.block || []);
  let redirecting = false;
  let debounceTimer;

  const isAllowed = path => ALLOW.some(rx => rx.test(path));
  const isBlocked = path => BLOCK.some(rx => rx.test(path));
  const currentPQ = () => location.pathname + (location.search || '');

  const enforce = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const pq = currentPQ();
      if (!redirecting && isBlocked(pq) && !isAllowed(pq)) {
        redirecting = true;
        const target = POL.start || '/';
        location.replace(target);
        setTimeout(() => {
          redirecting = false;
        }, 800);
      }
    }, 200);
  };

  const applyCssHide = () => {
    const selectors = (POL.dom && POL.dom.hide) || [];
    if (!selectors.length) return;
    if (!document.querySelector('style[data-cm-hide]')) {
      const style = document.createElement('style');
      style.setAttribute('data-cm-hide', '1');
      style.textContent = selectors.map(s => `${s}{display:none!important}`).join('\n');
      document.documentElement.appendChild(style);
    }
  };

  const disableAnchors = (root = document) => {
    const list = (POL.dom && POL.dom.disableAnchorsTo) || [];
    if (!list.length) return;
    const rxs = toRx(list);
    root.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (rxs.some(rx => rx.test(href))) {
        link.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
        }, true);
        link.title = 'Blocked by Focused';
      }
    });
  };

  const spaGuards = () => {
    const wrap = fn => function(...args) {
      const result = fn.apply(this, args);
      enforce();
      disableAnchors();
      return result;
    };

    try {
      history.pushState = wrap(history.pushState);
      history.replaceState = wrap(history.replaceState);
      window.addEventListener('popstate', enforce, true);
    } catch (error) {
      console.warn('[CreatorMode] Failed to patch history API:', error);
    }

    new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            disableAnchors(node);
          }
        });
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  };

  if (window.__CM_DEBUG) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#0008;color:#0f0;font:12px/1.3 monospace;z-index:999999;padding:6px';
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(overlay);
      const update = () => {
        overlay.textContent = currentPQ();
      };
      update();
      window.addEventListener('popstate', update);
      new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
    });
  }

  try {
    applyCssHide();
    disableAnchors();
    spaGuards();
    enforce();
  } catch (error) {
    console.error('[CreatorMode] DOM guard error:', error);
  }
})();
