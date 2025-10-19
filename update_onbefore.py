import re
from pathlib import Path
path = Path('apps/desktop/src/main/web-request-filter.ts')
content = path.read_text()
pattern = re.compile(r"session.webRequest.onBeforeRequest\([\s\S]*?\);\n\n    console.log\('\[WebRequestFilter] Installed'\);", re.MULTILINE)
replacement = """
    session.webRequest.onBeforeRequest((details, callback) => {
      const { url, resourceType } = details;
      const isMain = resourceType === 'mainFrame' || resourceType === 'navigation';

      // YouTube ad hosts
      if (/googleads\.g\.doubleclick\.net/.test(url) ||
          /:\/\/.*\.doubleclick\.net\//.test(url) ||
          /:\/\/.*\.youtube\.com\/pagead\//.test(url) ||
          /:\/\/.*\.youtube\.com\/api\/stats\/ads\//.test(url)) {
        return callback({ cancel: true });
      }

      // Facebook main-frame redirects
      if (isMain && /:\/\/(m|www)\.facebook\.com\/(home\.php|watch(?:\/.*)?|videos(?:\/.*)?|reel(?:s)?(?:\/.*)?|stories(?:\/.*)?|search(?:\/.*)?)$/.test(url)) {
        return callback({ redirectURL: 'https://m.facebook.com/me' });
      }

      // X data APIs must always pass
      if (/:\/\/x\.com\/i\//.test(url) || /:\/\/twitter\.com\/i\//.test(url)) {
        return callback({ cancel: false });
      }

      callback({ cancel: false });
    });

    console.log('[WebRequestFilter] Installed');"""
new_content = pattern.sub(replacement.strip(), content)
path.write_text(new_content)
