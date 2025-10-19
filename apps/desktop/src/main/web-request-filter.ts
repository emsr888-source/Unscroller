import { Session } from 'electron';
import { PolicyManager } from './policy-manager';

export class WebRequestFilter {
  constructor(private policyManager: PolicyManager) {}

  install(session: Session) {
    // Intercept navigation requests

    session.webRequest.onBeforeRequest((details, callback) => {
      const { url, resourceType } = details;
      const isMain = resourceType === 'mainFrame';

      // Never block X data APIs
      if (/https?:\/\/x\.com\/i\//.test(url) || /https?:\/\/twitter\.com\/i\//.test(url)) {
        return callback({ cancel: false });
      }

      // X Communities surfaces
      if (isMain && /https?:\/\/x\.com\/(communities(\/.*)?|i\/communities(\/.*)?)/.test(url)) {
        return callback({ redirectURL: 'https://x.com/messages' });
      }

      // Facebook disallowed surfaces
      if (isMain && /https?:\/\/(m|www)\.facebook\.com\/(home\.php(?:\?.*)?$|\?(?:sk=h_\w+|ref(?:src)?=.*|refid=.*)$|watch(?:\/.*|\?.*)?$|videos?(?:\/.*|\?.*)?$|reel(?:s)?(?:\/.*|\?.*)?$|stories(?:\/.*|\?.*)?$|search(?:\/.*|\?.*)?$)/.test(url)) {
        return callback({ redirectURL: 'https://m.facebook.com/me' });
      }

      // YouTube Safe mode ad hosts
      if (/googleads\.g\.doubleclick\.net/.test(url) ||
          /:\/\/.*\.doubleclick\.net\//.test(url) ||
          /:\/\/.*\.youtube\.com\/pagead\//.test(url) ||
          /:\/\/.*\.youtube\.com\/api\/stats\/ads\//.test(url)) {
        return callback({ cancel: true });
      }

      callback({ cancel: false });
    });

    console.log('[WebRequestFilter] Installed');

  }

  private getProviderIdFromUrl(url: string): string | null {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('x.com') || url.includes('twitter.com')) return 'x';
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('facebook.com')) return 'facebook';
    return null;
  }
}
