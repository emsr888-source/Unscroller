// Runs before page scripts. Keep light; no node APIs.
(() => {
  if (!location.hostname.endsWith('facebook.com')) return;

  const stripLocale = (p: string) => p.replace(/^\/[a-z]{2}(?:_[A-Z]{2})?(?=\/|$)/i, '');
  const START = 'https://m.facebook.com/me';
  const allowRx =
    /^\/(?:[a-z]{2}(?:_[A-Z]{2})?\/)?(?:me\/?$|profile\.php(?:\?.*)?$|messages\/t\/.*$|notifications(?:\/.*)?(?:\?.*)?$|settings(?:\/.*)?(?:\?.*)?$|business(?:\/.*)?(?:\?.*)?$|pages\/.*$|composer\/.*$)/i;
  const blockRxs = [
    /^\/(?:[a-z]{2}(?:_[A-Z]{2})?\/)?(?:$|home\.php$|watch(?:\/.*)?|videos?(?:\/.*)?|reels?(?:\/.*)?|stories(?:\/.*)?|search(?:\/.*)?|gaming(?:\/.*)?|games(?:\/.*)?|feeds?(?:\/.*)?|bookmarks?)/i,
    /^\/\?(sk=|ref|refid)=/i,
  ];
  const pq = () => stripLocale(location.pathname.replace(/\/+$/, '') || '/') + (location.search || '');
  const shouldBlock = (p: string) => !allowRx.test(p) && blockRxs.some(r => r.test(p));
  const isLoggedIn = () => document.cookie.includes('c_user=');
  let lastRedirect = 0;

  // Early guard
  try {
    const p = pq();
    if (isLoggedIn() && shouldBlock(p) && Date.now() - lastRedirect > 800) {
      lastRedirect = Date.now();
      location.replace(START);
      return;
    }
  } catch (error) {
    console.warn('[preload] early guard error:', error);
  }

  if (!isLoggedIn()) {
    return;
  }

  // Cosmetic: disable clicks; do NOT remove nodes (prevents React crashes)
  const css = `
    [role="navigation"] a[href="/"],
    a[href^="/watch"], a[href*="/videos"],
    a[href*="/reel"], a[aria-label="Reels"],
    a[href^="/feeds"], a[href^="/gaming"], a[href^="/games"],
    a[href^="/?sk="] { pointer-events:none!important; opacity:.35!important; }
  `;
  const st = document.createElement('style');
  st.setAttribute('data-unscroller', 'fb');
  st.textContent = css;
  document.documentElement.appendChild(st);

  // Click trap (same-site links)
  document.addEventListener(
    'click',
    (e: any) => {
      const a = e.target?.closest?.('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('/')) return;
      if (!isLoggedIn()) return;
      if (shouldBlock(stripLocale(href))) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  // Search form guard
  document.addEventListener(
    'submit',
    (e: any) => {
      const f = e.target as HTMLFormElement;
      if (!isLoggedIn()) return;
      if (f?.action && /facebook\.com\/search/i.test(f.action)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  // SPA guard (debounced)
  let t: any;
  const enforce = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const p = pq();
      if (!isLoggedIn()) return;
      if (shouldBlock(p) && Date.now() - lastRedirect > 800) {
        lastRedirect = Date.now();
        location.replace(START);
      }
    }, 150);
  };
  const wrap = (fn: any) =>
    function (this: any) {
      const r = fn.apply(this, arguments as any);
      enforce();
      return r;
    };
  try {
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener('popstate', enforce, true);
  } catch (error) {
    console.warn('[preload] history guard error:', error);
  }

  // Optional debug overlay
  (window as any).__FB_DEBUG &&
    (() => {
      const box = document.createElement('div');
      box.style.cssText =
        'position:fixed;left:0;right:0;bottom:0;background:#0008;color:#0f0;font:12px monospace;z-index:999999;padding:6px';
      document.body.appendChild(box);
      const show = () => {
        box.textContent = location.pathname + location.search;
      };
      show();
      new MutationObserver(show).observe(document.body, { childList: true, subtree: true });
      window.addEventListener('popstate', show);
    })();
})();

export {};
