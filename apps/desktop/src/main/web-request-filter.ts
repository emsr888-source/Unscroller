import { Session } from 'electron';

const isMainFrame = (details: { resourceType?: string }) =>
  details.resourceType === 'mainFrame' || details.resourceType === 'navigation';

const getPathAndSearch = (url: string): string => {
  try {
    const parsed = new URL(url);
    return (parsed.pathname || '/') + (parsed.search || '');
  } catch {
    return '/';
  }
};

const FACEBOOK_START_URL = 'https://www.facebook.com/notifications/';

const fbAllowed = (url: string) =>
  /^\/(?:[a-z]{2}(?:_[A-Z]{2})?\/)?(?:notifications(?:\/.*)?|messages\/t\/|profile\.php(?:\?.*)?$|settings(?:\/.*)?|business(?:\/.*)?|pages\/.*|composer\/.*|me\/?$)/i.test(
    getPathAndSearch(url)
  );

const fbBlocked = (url: string) => {
  const p = getPathAndSearch(url);
  return (
    /^\/(?:[a-z]{2}(?:_[A-Z]{2})?\/)?(?:$|home\.php$|watch(?:\/.*)?|videos?(?:\/.*)?|reels?(?:\/.*)?|stories(?:\/.*)?|gaming(?:\/.*)?|games(?:\/.*)?|feeds?(?:\/.*)?|bookmarks?)/i.test(
      p
    ) || /^\/\?(sk=|ref|refid)=/i.test(p)
  );
};

export class WebRequestFilter {
  install(session: Session) {
    session.webRequest.onBeforeRequest((details, callback) => {
      const { url } = details;

      if (/https?:\/\/x\.com\/i\//i.test(url)) {
        return callback({ cancel: false });
      }

      if (isMainFrame(details)) {
        try {
          const parsed = new URL(url);
          if (/facebook\.com$/i.test(parsed.hostname)) {
            if (fbBlocked(url) && !fbAllowed(url)) {
              return callback({ redirectURL: FACEBOOK_START_URL });
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      if (
        /googleads\.g\.doubleclick\.net/i.test(url) ||
        /:\/\/.*\.doubleclick\.net\//i.test(url) ||
        /:\/\/.*\.youtube\.com\/pagead\//i.test(url) ||
        /:\/\/.*\.youtube\.com\/api\/stats\/ads\//i.test(url)
      ) {
        return callback({ cancel: true });
      }

      callback({ cancel: false });
    });

    console.log('[WebRequestFilter] Installed');
  }
}
