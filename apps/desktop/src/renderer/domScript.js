(() => {
  const POL = window.__CM_POLICY || {};

  const escapeRegex = pattern => pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
  const patternToRegex = pattern => {
    const trimmed = (pattern || '').trim();
    if (!trimmed) {
      return /^$/;
    }

    try {
      return new RegExp(trimmed);
    } catch (error) {
      // fall through to glob conversion
    }

    const hasScheme = trimmed.includes('://');
    const startsWithSlash = trimmed.startsWith('/');
    let escaped = escapeRegex(trimmed).replace(/\*/g, '.*');

    if (startsWithSlash) {
      if (!trimmed.endsWith('*')) {
        escaped = `${escaped}(?:\\/)?`;
      }
      escaped = `^${escaped}(?:[?#].*)?$`;
    } else if (hasScheme) {
      escaped = `^${escaped}${trimmed.endsWith('*') ? '' : '(?:[?#].*)?'}$`;
    } else {
      escaped = `^${escaped}${trimmed.endsWith('*') ? '' : '$'}`;
    }

    try {
      return new RegExp(escaped);
    } catch (error) {
      console.warn('[Unscroller] Failed to convert pattern to regex:', pattern, error);
      return new RegExp(escapeRegex(trimmed));
    }
  };

  const rxAll = (arr = []) => arr.map(patternToRegex);

  // ---- Global helpers ----
  const ALLOW = rxAll(POL.allow || []);
  const BLOCK = rxAll(POL.block || []);
  const pq = () => location.pathname + (location.search || '');
  const isAllowed = p => ALLOW.some(r => r.test(p));
  const isBlocked = p => BLOCK.some(r => r.test(p));
  let redirecting = false;
  const enforce = (delay = 150) => {
    clearTimeout(enforce.t);
    enforce.t = setTimeout(() => {
      const p = pq();
      if (!redirecting && isBlocked(p) && !isAllowed(p)) {
        redirecting = true;
        location.replace(POL.start);
        setTimeout(() => (redirecting = false), 800);
      }
    }, delay);
  };

  // ---- X: remove Lists/Communities & block SPA nav ----
  function xGuards() {
    if (!location.hostname.endsWith('x.com')) return;
    const kill = () => {
      document
        .querySelectorAll(
          "a[href='/lists'], a[href='/communities'], a[href='/i/bookmarks'], [data-testid='AppTabBar_Bookmarks_Link'], [data-testid='AppTabBar_Bookmarks_Tab'], [data-testid='AppTabBar_Bookmarks_Entry']"
        )
        .forEach(a => {
          a.remove();
        });
    };
    kill();
    new MutationObserver(kill).observe(document.body, { subtree: true, childList: true });
  }

  // ---- TikTok Studio: remove “Back to TikTok”, stop popups, force same-tab ----
  function ttGuards() {
    if (!location.hostname.endsWith('tiktok.com')) return;
    // 1) Nuke "Back to TikTok"
    const blockSelectors = [
      "a[href='/']",
      "a[href='/home']",
      "a[href='/foryou']",
      "a[href='/discover']",
      "a[href='/following']",
      "a[href='/messages']",
      "a[href='/notifications']",
      "a[href='/inbox']",
      "a[href*='/inspiration']",
      "[data-e2e='nav-home']",
      "[data-e2e='nav-foryou']",
      "[data-e2e='nav-following']",
      "[data-e2e='nav-inbox']",
      "[data-e2e*='inspiration']",
      "[aria-label*='For You']",
      "[aria-label*='Home']",
      "[aria-label*='Following']",
      "[aria-label*='Inbox']",
      "[aria-label*='Inspiration']"
    ];
    const zapBack = () => {
      document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href') || '';
        const txt = (a.textContent || '').trim();
        if (/^https?:\/\/(www\.)?tiktok\.com\/?$/.test(href) || /^Back to TikTok$/i.test(txt)) {
          a.remove();
        }
      });
      if (blockSelectors.length) {
        document.querySelectorAll(blockSelectors.join(',')).forEach(node => {
          if (node && node.parentElement) {
            node.remove();
          }
        });
      }
    };
    const enforceStudioOnly = () => {
      if (/inspiration/i.test(location.pathname)) {
        if (POL.start && location.href !== POL.start) {
          location.replace(POL.start);
        }
      }
    };

    zapBack();
    enforceStudioOnly();
    new MutationObserver(() => {
      zapBack();
      enforceStudioOnly();
    }).observe(document.body, { subtree: true, childList: true });
    window.addEventListener('popstate', enforceStudioOnly, true);

    // 2) Kill popups/new tabs but allow auth providers
    try {
      const originalOpen = window.open.bind(window);
      const ALLOW_POPUP = /(facebook|accounts\.google|appleid\.apple)\.com/i;
      window.open = function (url, name, specs) {
        if (!url || ALLOW_POPUP.test(url)) {
          return originalOpen(url, name, specs);
        }
        return null;
      };
    } catch {}
    document.addEventListener(
      'click',
      e => {
        const anchor = e.target.closest('a[href]');
        if (anchor) {
          const href = anchor.getAttribute('href') || '';
          if (
            /^\/(?:|home|foryou|discover|following|messages|notifications|inbox|creator-center\/inspiration|studio\/inspiration)/i.test(
              href
            )
          ) {
            e.preventDefault();
            e.stopPropagation();
            if (POL.start) {
              location.replace(POL.start);
            }
            return;
          }
          anchor.removeAttribute('target');
          anchor.setAttribute('rel', 'noopener');
        }
      },
      true
    );
  }

  // ---- YouTube: redirect home to Studio channel ----
  function ytGuards() {
    if (!/youtube\.com$/.test(location.hostname)) return;
    let redirecting = false;
    const blockedSubs = new Set(['/feed/subscriptions', '/feed/subscriptions/']);

    const toAbsolute = href => {
      try {
        return new URL(href, location.origin).href;
      } catch {
        return null;
      }
    };

    const getChannelFromConfig = () => {
      try {
        if (window.ytcfg && typeof window.ytcfg.get === 'function') {
          const canonical = window.ytcfg.get('CANONICAL_BASE_URL');
          if (canonical) {
            const absolute = toAbsolute(canonical);
            if (absolute) {
              return absolute;
            }
          }
          const channelId = window.ytcfg.get('CHANNEL_ID');
          if (channelId) {
            return `${location.origin}/channel/${channelId}`;
          }
        }
      } catch (error) {
        console.warn('[Unscroller] Failed to read YouTube config', error);
      }
      return null;
    };

    const findChannelAnchor = () => {
      const selectors = [
        "a[href^='/channel/'][title]",
        "a[href*='channel/'][aria-label*='Your channel']",
        "a[title='Your channel']",
        "a[href^='/@'][title]",
        "a[href^='https://www.youtube.com/channel/']",
        "a[href^='https://studio.youtube.com/channel/']"
      ];
      for (const selector of selectors) {
        const anchor = document.querySelector(selector);
        if (anchor && anchor.href) {
          const href = toAbsolute(anchor.href);
          if (href) {
            return href;
          }
        }
      }
      return null;
    };

    const resolveChannelTarget = () => findChannelAnchor() || getChannelFromConfig() || `${location.origin}/feed/library`;

    const stripSubscriptions = () => {
      const selectors = [
        "a[href='/feed/subscriptions']",
        "ytd-guide-entry-renderer:has(a[href='/feed/subscriptions'])",
        "ytd-mini-guide-entry-renderer:has(a[href='/feed/subscriptions'])",
        "ytm-guide-entry-renderer:has(a[href='/feed/subscriptions'])",
        "yt-chip-cloud-chip-renderer:has(a[href='/feed/subscriptions'])",
        "ytd-guide-entry-renderer [title='Subscriptions']",
        "ytd-mini-guide-entry-renderer [title='Subscriptions']"
      ];
      try {
        document.querySelectorAll(selectors.join(',')).forEach(node => node.remove());
      } catch (err) {
        console.warn('[Unscroller][yt] failed to strip subscriptions', err);
      }
    };

    const ensureNotSubscriptions = () => {
      const path = (location.pathname || '').toLowerCase();
      if (!blockedSubs.has(path)) {
        return false;
      }
      const target = resolveChannelTarget();
      if (target && location.href !== target) {
        redirecting = true;
        location.replace(target);
        setTimeout(() => {
          redirecting = false;
        }, 1000);
        return true;
      }
      return false;
    };

    const redirectHome = () => {
      if (redirecting) {
        return;
      }
      const path = location.pathname || '';
      if (ensureNotSubscriptions()) {
        return;
      }
      if (path === '/' || path === '') {
        const target = resolveChannelTarget();
        if (target && location.href !== target) {
          redirecting = true;
          location.replace(target);
          setTimeout(() => {
            redirecting = false;
          }, 1000);
        }
      }
    };

    redirectHome();
    stripSubscriptions();

    const observer = new MutationObserver(() => {
      redirectHome();
      stripSubscriptions();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('popstate', () => {
      redirectHome();
      stripSubscriptions();
    }, true);
  }

  // ---- Facebook: hide top icons + menu items; re-check on SPA nav ----
  function fbGuards() {
    if (!/facebook\.com$/.test(location.hostname)) return;

    const BLOCK_RX = new RegExp(
      String.raw`^\/(?:[a-z]{2}(?:_[A-Z]{2})?\/)?(?:(?:$)|home\.php$|(watch|videos?|reels?|stories|search|gaming|games|feeds|bookmark|bookmarks)(?:\/.*)?|)$`
    );
    const BLOCK_QS = /^\/\?(sk=.*|ref.*|refid=.*)$/;
    const ALLOW_RX = new RegExp(
      String.raw`^\/(?:[a-z]{2}(?:_[A-Z]{2})?\/)?(?:me\/?$|profile\.php.*|pages\/.*|composer\/.*|messages\/t\/.*|notifications(?:\/.*)?|settings(?:\/.*)?|business(?:\/.*)?)$`
    );
    const START = 'https://m.facebook.com/me';

    const pq = () => location.pathname + (location.search || '');
    const bad = value => {
      const path = value.split('?')[0];
      return (BLOCK_RX.test(path) || BLOCK_QS.test(value)) && !ALLOW_RX.test(value);
    };

    if (bad(pq())) {
      location.replace(START);
      return;
    }

    document.addEventListener(
      'click',
      event => {
        const anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
        if (!anchor) return;
        const href = anchor.getAttribute('href') || '';
        if (!href.startsWith('/')) return;
        if (bad(href)) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    const SELECTORS = [
      "[role='navigation'] a[href='/']",
      "a[aria-label='Home']",
      "a[aria-label='Watch']",
      "a[href^='/watch']",
      "a[href*='/videos']",
      "a[aria-label='Reels']",
      "a[href*='/reel']",
      "a[href^='/?sk=']",
      "a[href^='/feeds']",
      "a[href^='/gaming']",
      "a[href^='/games']",
      "[role='menu'] a[href*='/watch']",
      "[role='menu'] a[href*='/videos']",
      "[role='menu'] a[href*='/reel']",
      "[role='menu'] a[href^='/feeds']",
      "[role='menu'] a[href^='/gaming']",
      "[role='menu'] a[href^='/games']",
      "[role='feed']"
    ];

    const purge = () => {
      document.querySelectorAll(SELECTORS.join(',')).forEach(node => node.remove());
    };

    purge();

    let timer;
    const enforce = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const current = pq();
        if (bad(current)) {
          location.replace(START);
          return;
        }
        purge();
      }, 120);
    };

    const wrap = fn =>
      function (...args) {
        const result = fn.apply(this, args);
        enforce();
        return result;
      };

    try {
      history.pushState = wrap(history.pushState);
      history.replaceState = wrap(history.replaceState);
      window.addEventListener('popstate', enforce, true);
    } catch {}

    new MutationObserver(() => {
      purge();
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  // ---- Bootstrapping / SPA hooks ----
  (function spa() {
    const wrap = fn =>
      function (...args) {
        const r = fn.apply(this, args);
        enforce();
        return r;
      };
    try {
      history.pushState = wrap(history.pushState);
      history.replaceState = wrap(history.replaceState);
      window.addEventListener('popstate', () => enforce(), true);
    } catch {}
  })();

  enforce(0);
  xGuards();
  ttGuards();
  ytGuards();
  fbGuards();
})();
