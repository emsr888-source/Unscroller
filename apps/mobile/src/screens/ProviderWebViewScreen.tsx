import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  BackHandler,
  ScrollView,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createSafeStorage } from '../lib/safeStorage';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { PolicyService } from '@/services/policy';
import { ProviderId } from '@/types';
import { useAppStore } from '@/store';

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
const PROVIDERS_WITH_VIEW_TOGGLE: ProviderId[] = ['instagram'];
const AUTH_ORIGIN_WHITELIST: Partial<Record<ProviderId, string[]>> = {
  instagram: ['google.com', 'facebook.com', 'appleid.apple.com', 'opera.com'],
  tiktok: ['google.com', 'facebook.com', 'appleid.apple.com', 'tiktok.com', 'instagram.com'],
  x: ['google.com', 'x.com', 'twitter.com'],
  youtube: ['google.com'],
  facebook: ['google.com', 'appleid.apple.com'],
};
const DEFAULT_VIEW_MODES: Record<ProviderId, 'desktop' | 'mobile'> = {
  instagram: 'mobile',
  tiktok: 'desktop',
  facebook: 'desktop',
  youtube: 'mobile', // Force YouTube into mobile layout for a cleaner, focused view
  x: 'desktop',
};

const GOOGLE_FINGERPRINT_SHIM = `
  (function() {
    try {
      var host = (window.location && window.location.hostname ? window.location.hostname : '').toLowerCase();
      if (host.indexOf('google.') === -1 && host.indexOf('gstatic.') === -1 && host !== 'accounts.google.com') {
        return;
      }

      try {
        if (!window.chrome) {
          window.chrome = {};
        }
        if (!window.chrome.runtime) {
          window.chrome.runtime = {};
        }
      } catch (_chromeErr) {}

      try {
        Object.defineProperty(navigator, 'webdriver', {
          get: function() {
            return false;
          }
        });
      } catch (_webdriverErr) {}

      try {
        var originalUA = navigator.userAgent || '';
        if (originalUA && originalUA.indexOf('wv') !== -1) {
          var cleanedUA = originalUA.replace(/\bwv\b/gi, '').replace(/; wv/gi, '').replace(/wv;/gi, '');
          Object.defineProperty(navigator, 'userAgent', {
            get: function() {
              return cleanedUA;
            }
          });
        }
      } catch (_uaErr) {}

      try {
        if (!navigator.languages || navigator.languages.length === 0) {
          Object.defineProperty(navigator, 'languages', {
            get: function() {
              return ['en-US', 'en'];
            }
          });
        }
      } catch (_languagesErr) {}

      try {
        Object.defineProperty(navigator, 'language', {
          get: function() {
            return 'en-US';
          }
        });
      } catch (_languageErr) {}

      try {
        Object.defineProperty(navigator, 'vendor', {
          get: function() {
            return 'Google Inc.';
          }
        });
      } catch (_vendorErr) {}

      try {
        Object.defineProperty(navigator, 'platform', {
          get: function() {
            return 'MacIntel';
          }
        });
      } catch (_platformErr) {}

      try {
        if (typeof navigator.hardwareConcurrency === 'undefined') {
          Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: function() {
              return 8;
            }
          });
        }
      } catch (_hardwareErr) {}

      try {
        if (typeof navigator.deviceMemory === 'undefined') {
          Object.defineProperty(navigator, 'deviceMemory', {
            get: function() {
              return 8;
            }
          });
        }
      } catch (_deviceMemoryErr) {}

      try {
        if (typeof navigator.maxTouchPoints === 'undefined') {
          Object.defineProperty(navigator, 'maxTouchPoints', {
            get: function() {
              return 5;
            }
          });
        }
      } catch (_touchPointsErr) {}

      try {
        if (!navigator.plugins || navigator.plugins.length === 0) {
          var fakePlugin = { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' };
          var pluginArray = {
            length: 1,
            0: fakePlugin,
            item: function(index) {
              return this[index] || null;
            },
            namedItem: function(name) {
              return name === fakePlugin.name ? fakePlugin : null;
            }
          };
          Object.defineProperty(navigator, 'plugins', {
            get: function() {
              return pluginArray;
            }
          });
        }
      } catch (_pluginsErr) {}

      try {
        if (!navigator.mimeTypes || navigator.mimeTypes.length === 0) {
          var fakeMime = { type: 'application/pdf', suffixes: 'pdf', description: '', enabledPlugin: null };
          var mimeArray = {
            length: 1,
            0: fakeMime,
            item: function(index) {
              return this[index] || null;
            },
            namedItem: function(name) {
              return name === fakeMime.type ? fakeMime : null;
            }
          };
          Object.defineProperty(navigator, 'mimeTypes', {
            get: function() {
              return mimeArray;
            }
          });
          try {
            fakeMime.enabledPlugin = (navigator.plugins && navigator.plugins[0]) || null;
          } catch (_mimePluginErr) {}
        }
      } catch (_mimeErr) {}

      try {
        if (navigator.permissions && navigator.permissions.query) {
          var originalQuery = navigator.permissions.query.bind(navigator.permissions);
          navigator.permissions.query = function(parameters) {
            if (parameters && parameters.name === 'notifications') {
              return Promise.resolve({ state: 'denied', onchange: null });
            }
            return originalQuery(parameters);
          };
        }
      } catch (_permissionsErr) {}
    } catch (_fingerprintShimErr) {}
  })();
  true;
`;

const YOUTUBE_DESKTOP_START_URL = 'https://www.youtube.com/feed/library?app=desktop';
const YOUTUBE_MOBILE_START_URL = 'https://m.youtube.com/feed/library';

const YOUTUBE_DESKTOP_ALLOWED_PATHS = new Set<string>([
  '/feed/you',
  '/feed/you/',
  '/upload',
  '/upload/',
  '/post',
  '/post/',
  '/create',
  '/create/',
  '/live_dashboard',
  '/live_dashboard/',
  '/results',
  '/results/',
]);

const YOUTUBE_DESKTOP_ALLOWED_PREFIXES = ['/channel/', '/create', '/results', '/shorts/upload', '/studio', '/signin'];
const TIKTOK_MESSAGES_URL = 'https://m.tiktok.com/messages';
// Use mobile login to avoid blank-screen loops before auth
const TIKTOK_LOGIN_URL = 'https://m.tiktok.com/login';
const TIKTOK_START_URL = TIKTOK_LOGIN_URL;
const TIKTOK_UPLOAD_URL = 'https://m.tiktok.com/upload';
const FACEBOOK_NOTIFICATIONS_URL = 'https://www.facebook.com/notifications/';
const TIKTOK_STUDIO_PATH_PREFIXES = ['/upload', '/studio', '/creator', '/creativecenter', '/content', '/business-suite'];
const TIKTOK_BLOCKED_PATHS = ['/', '/foryou', '/following', '/friends', '/live', '/discover', '/explore', '/search', '/feed'];
const X_LOGIN_URL = 'https://x.com/i/flow/login?redirect_after_login=%2Fmessages';

const sessionStorage = createSafeStorage('provider-session-flags');
const X_SESSION_FLAG_KEY = 'x-session';
const TIKTOK_SESSION_FLAG_KEY = 'tiktok-session';

const getStoredXSessionFlag = () => {
  try {
    return sessionStorage.getString(X_SESSION_FLAG_KEY) === 'true';
  } catch (error) {
    return false;
  }
};

const setStoredXSessionFlag = (value: boolean) => {
  try {
    sessionStorage.set(X_SESSION_FLAG_KEY, value ? 'true' : 'false');
  } catch (error) {
    // Ignore storage errors
  }
};

const getStoredTikTokSessionFlag = () => {
  try {
    return sessionStorage.getString(TIKTOK_SESSION_FLAG_KEY) === 'true';
  } catch (error) {
    return false;
  }
};

const getTikTokStartUrl = () => (getStoredTikTokSessionFlag() ? TIKTOK_MESSAGES_URL : TIKTOK_START_URL);

const safeGetPath = (rawUrl: string): string => {
  try {
    return new URL(rawUrl).pathname || '';
  } catch (error) {
    try {
      return new URL(rawUrl, 'https://unscroller.local').pathname || '';
    } catch (_secondaryError) {
      return '';
    }
  }
};

const isXAuthRoute = (url: string | null | undefined, path?: string | null | undefined): boolean => {
  if (!url && !path) {
    return false;
  }

  if (url && url.startsWith('about:blank')) {
    return true;
  }

  const normalizedPath = (path || '').toLowerCase();
  if (normalizedPath === 'blank' || normalizedPath === '/blank') {
    return true;
  }

  const normalizedUrl = (url || '').toLowerCase();
  const authIndicators = ['/i/flow/', '/i/oauth', '/i/forgot', '/i/verify', '/login', '/signup', '/account/login_verification'];
  return authIndicators.some(indicator => normalizedUrl.includes(indicator) || normalizedPath.includes(indicator));
};

const convertYouTubeWatchToMobile = (rawUrl: string): string | null => {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === 'm.youtube.com') {
      return parsed.href;
    }
    if (parsed.pathname.toLowerCase() !== '/watch') {
      return null;
    }
    const search = parsed.search || '';
    const hash = parsed.hash || '';
    return `https://m.youtube.com/watch${search}${hash}`;
  } catch (error) {
    try {
      const fallback = new URL(rawUrl, 'https://www.youtube.com');
      if (fallback.pathname.toLowerCase() !== '/watch') {
        return null;
      }
      const search = fallback.search || '';
      const hash = fallback.hash || '';
      return `https://m.youtube.com/watch${search}${hash}`;
    } catch (_fallbackError) {
      return null;
    }
  }
};

const isYouTubeBlockedPath = (path: string | null | undefined): boolean => {
  if (!path) {
    return false;
  }

  const normalized = path.toLowerCase();
  const allowedExact = new Set<string>([
    // Only Library and focused content surfaces are allowed
    '/feed/library',
    '/feed/library/',
    '/watch',
    '/watch/',
    '/results',
    '/results/',
  ]);

  if (allowedExact.has(normalized)) {
    return false;
  }

  const blockedPrefixes = [
    '/',
    '/feed',
    '/feed/home',
    '/feed/explore',
    '/feed/channels',
    // Explicitly block Shorts surface
    '/shorts',
  ];

  return blockedPrefixes.some(prefix => {
    if (normalized === prefix || normalized === `${prefix}/`) {
      return true;
    }

    return normalized.startsWith(`${prefix}/`);
  });
};

const isYouTubeDesktopAllowedPath = (path: string | null | undefined): boolean => {
  if (!path) {
    return false;
  }

  const normalized = path.toLowerCase();
  if (YOUTUBE_DESKTOP_ALLOWED_PATHS.has(normalized)) {
    return true;
  }

  return YOUTUBE_DESKTOP_ALLOWED_PREFIXES.some(prefix => normalized.startsWith(prefix));
};

const isTikTokStudioPath = (path: string | null | undefined): boolean => {
  if (!path) {
    return false;
  }

  const normalized = path.toLowerCase();
  return TIKTOK_STUDIO_PATH_PREFIXES.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

const isTikTokBlockedPath = (path: string | null | undefined): boolean => {
  if (path == null) {
    return false;
  }
  const normalized = (path || '').toLowerCase();
  if (TIKTOK_BLOCKED_PATHS.includes(normalized)) {
    return true;
  }
  return TIKTOK_BLOCKED_PATHS.some(blocked => blocked !== '/' && normalized.startsWith(`${blocked}/`));
};

const resolveIntentUrl = (rawUrl: string): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }
  if (!rawUrl.startsWith('intent://')) {
    return null;
  }

  try {
    const fallbackMatch = rawUrl.match(/;S\.browser_fallback_url=([^;]+)/);
    if (fallbackMatch && fallbackMatch[1]) {
      const decoded = decodeURIComponent(fallbackMatch[1]);
      if (decoded) {
        return decoded;
      }
    }

    const body = rawUrl.slice('intent://'.length);
    const intentMarker = '#Intent;';
    const markerIndex = body.indexOf(intentMarker);
    const hostAndPath = markerIndex !== -1 ? body.slice(0, markerIndex) : body;
    const schemeMatch = rawUrl.match(/;scheme=([a-zA-Z][\w+.-]*)/);
    const scheme = schemeMatch && schemeMatch[1] ? schemeMatch[1] : 'https';

    if (hostAndPath) {
      return `${scheme}://${hostAndPath}`;
    }
  } catch (error) {
    console.warn('Failed to resolve intent:// URL', error);
  }

  return null;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderWebView'>;

const PLATFORM = Platform.OS === 'ios' ? 'ios' : 'android';

export default function ProviderWebViewScreen({ route, navigation }: Props) {
  const { providerId } = route.params;
  const webViewRef = useRef<WebView>(null);
  const youTubeRedirectTrackerRef = useRef<{ count: number; lastRedirect: number }>({
    count: 0,
    lastRedirect: 0,
  });
  const insets = useSafeAreaInsets();
  const { width: deviceWidth } = useWindowDimensions();
  const [activeProvider, setActiveProvider] = useState<ProviderId>(providerId);
  const [providerRules, setProviderRules] = useState(() => {
    const rules = PolicyService.getProviderRules(providerId, PLATFORM);
    if (providerId === 'tiktok') {
      const startURL = getTikTokStartUrl();
      return {
        ...rules,
        startURL,
      };
    }
    if (providerId === 'facebook') {
      return {
        ...rules,
        startURL: FACEBOOK_NOTIFICATIONS_URL,
      };
    }
    if (providerId === 'youtube') {
      return {
        ...rules,
        // Start from the Library feed in mobile layout
        startURL: 'https://m.youtube.com/feed/library',
      };
    }
    return rules;
  });
  const [sourceUri, setSourceUri] = useState(() => {
    if (providerId === 'x' && !getStoredXSessionFlag()) {
      return X_LOGIN_URL;
    }
    return providerRules.startURL;
  });
  const [providerViewModes, setProviderViewModes] = useState<Record<ProviderId, 'desktop' | 'mobile'>>({
    ...DEFAULT_VIEW_MODES,
  });
  const [providerCurrentUrls, setProviderCurrentUrls] = useState<Record<ProviderId, string | null>>({
    instagram: providerId === 'instagram' ? providerRules.startURL : null,
    tiktok: providerId === 'tiktok' ? providerRules.startURL : null,
    facebook: providerId === 'facebook' ? providerRules.startURL : null,
    youtube: providerId === 'youtube' ? providerRules.startURL : null,
    x: null,
  });
  const [xSessionDetected, setXSessionDetected] = useState(() => (providerId === 'x' ? getStoredXSessionFlag() : false));
  const xLoginAttemptRef = useRef<{ firstSeen: number | null; lastUrl: string | null; attempts: number }>(
    {
      firstSeen: null,
      lastUrl: null,
      attempts: 0,
    }
  );
  const policyBypassEnabled = useAppStore(state => state.policyBypassEnabled);
  const [canWebViewGoBack, setCanWebViewGoBack] = useState(false);
  const hasTikTokTokenRef = useRef(false);
  const tiktokTokenDetectedAtRef = useRef<number | null>(null);
  const [guardDisclosureVisible, setGuardDisclosureVisible] = useState(true);

  const youtubeViewMode = providerViewModes.youtube ?? DEFAULT_VIEW_MODES.youtube;
  const activeViewMode = providerViewModes[activeProvider] ?? 'desktop';
  const currentTikTokUrl = providerCurrentUrls.tiktok ?? sourceUri;
  const isTikTokStudio = useMemo(() => {
    if (activeProvider !== 'tiktok') {
      return false;
    }

    const path = safeGetPath(currentTikTokUrl || '');
    return isTikTokStudioPath(path);
  }, [activeProvider, currentTikTokUrl]);

  const horizontalCanvasWidth = useMemo(() => {
    if (isTikTokStudio) {
      return Math.max(deviceWidth, 1280);
    }

    return deviceWidth;
  }, [deviceWidth, isTikTokStudio]);

  const enableHorizontalScroll = activeProvider === 'tiktok' && isTikTokStudio && horizontalCanvasWidth > deviceWidth;

  const shouldForceInstagramMobileForPath = useCallback((path: string) => {
    if (!path) {
      return false;
    }
    const normalized = path.toLowerCase();
    if (normalized === '/accounts' || normalized === '/accounts/' || normalized === '/accounts/edit/' || normalized === '/accounts/edit') {
      return true;
    }
    if (normalized.startsWith('/accounts/')) {
      return true;
    }
    if (normalized.startsWith('/settings')) {
      return true;
    }
    if (normalized.startsWith('/profile')) {
      return true;
    }
    if (normalized.endsWith('/edit') || normalized.endsWith('/edit/')) {
      return true;
    }
    return false;
  }, []);

  // X redirect helper removed; X now uses relaxed navigation with logging only.

  const isAuthWhitelisted = useCallback(
    (url: string) => {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const whitelist = AUTH_ORIGIN_WHITELIST[activeProvider];
        if (!whitelist) {
          return false;
        }

        return whitelist.some(allowedHost => {
          const normalized = allowedHost.toLowerCase();
          if (host === normalized) {
            return true;
          }
          return normalized.startsWith('.')
            ? host.endsWith(normalized)
            : host === normalized || host.endsWith(`.${normalized}`);
        });
      } catch (error) {
        return false;
      }
    },
    [activeProvider]
  );

  const globalWebViewEnhancements = useMemo(
    () => {
      if (policyBypassEnabled || activeProvider === 'tiktok') {
        return '';
      }

      return `
      (function() {
        try {
          // Comprehensive WebView masking for Google OAuth
          if (!window.__unscrollerWebViewMasked) {
            window.__unscrollerWebViewMasked = true;
            
            // Save original ReactNativeWebView for our use
            var originalRNWV = window.ReactNativeWebView;
            window.__unscrollerRNWV = originalRNWV;

            // Delete ReactNativeWebView from external detection
            delete window.ReactNativeWebView;

            // Prevent it from being re-added, but allow our code to access it
            try {
              var rnwDescriptor = Object.getOwnPropertyDescriptor(window, 'ReactNativeWebView');
              if (!rnwDescriptor || rnwDescriptor.configurable !== false) {
                Object.defineProperty(window, 'ReactNativeWebView', {
                  get: function() {
                    // Only hide it from Google domains
                    if (window.location.hostname.includes('google.com') ||
                        window.location.hostname.includes('gstatic.com')) {
                      return undefined;
                    }
                    return originalRNWV;
                  },
                  set: function() {},
                  configurable: false,
                  enumerable: false
                });
              }
            } catch (rnwvDefineErr) {
              console.warn('ReactNativeWebView mask failed', rnwvDefineErr);
            }

            try {
              var __cmHost = (window.location.hostname || '').toLowerCase();
              if ((__cmHost.indexOf('x.com') !== -1 || __cmHost.indexOf('twitter.com') !== -1) && !window.__cmXSessionMonitor) {
                window.__cmXSessionMonitor = true;
                var __cmLastState = null;

                var __cmPostSessionState = function(loggedIn) {
                  try {
                    window.__cm_x_loggedIn = !!loggedIn;
                    if (typeof window.__cmActivateXGuard === 'function') {
                      try {
                        window.__cmActivateXGuard(loggedIn);
                      } catch (_guardErr) {}
                    }

                    var __cmBridge = window.__unscrollerRNWV || originalRNWV || window.ReactNativeWebView;
                    if (__cmBridge && typeof __cmBridge.postMessage === 'function') {
                      __cmBridge.postMessage(
                        JSON.stringify({
                          type: '__cm_x_session',
                          loggedIn: !!loggedIn,
                          timestamp: Date.now(),
                        })
                      );
                    }
                  } catch (postErr) {
                    console.warn('[Unscroller][x] session post failed', postErr);
                  }
                };

                var __cmComputeSessionState = function() {
                  var loggedIn = false;
                  try {
                    loggedIn =
                      typeof document !== 'undefined' &&
                      document.cookie &&
                      document.cookie.indexOf('auth_token=') !== -1;
                  } catch (_cookieErr) {
                    loggedIn = window.__cm_x_loggedIn === true;
                  }

                  if (!loggedIn) {
                    try {
                      loggedIn =
                        typeof localStorage !== 'undefined' && !!localStorage.getItem('auth_token');
                    } catch (_storageErr) {
                      loggedIn = loggedIn || window.__cm_x_loggedIn === true;
                    }
                  }

                  if (__cmLastState === loggedIn) {
                    return;
                  }

                  __cmLastState = loggedIn;
                  __cmPostSessionState(loggedIn);
                };

                __cmComputeSessionState();
                setInterval(__cmComputeSessionState, 1500);
                document.addEventListener('visibilitychange', __cmComputeSessionState, true);
              }
            } catch (_cmSessionError) {}

            // Mask common WebView detection properties
            try {
              // Remove _ReactNativeWebView marker
              delete window._ReactNativeWebView;

              // Modify navigator to look more like a real browser
              if (navigator.userAgent.includes('wv')) {
                Object.defineProperty(navigator, 'userAgent', {
                  get: function() {
                    return navigator.userAgent.replace(/wv/g, '');
                  }
                });
              }
            } catch(e) {
              // Some properties might not be configurable
            }
          }

          function stripWatchPage() {
            try {
              var path = normalize(location.href);
              if (path !== '/watch') {
                return;
              }
              var body = document.body;
              if (!body) {
                return;
              }

              var player = document.querySelector('#player, #player-container, ytm-player, ytm-watch-flexy #player');

              var children = Array.prototype.slice.call(body.children || []);
              for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (!player) {
                  // If we cannot find the player, avoid nuking the entire page
                  continue;
                }
                if (child === player || (child.contains && child.contains(player))) {
                  continue;
                }
                suppressNode(child);
              }
            } catch (_) {}
          }
          
          if (!window.__unscrollerPatchedWindowOpen) {
            window.__unscrollerPatchedWindowOpen = true;
            var activeProvider = '${activeProvider}';
            if (activeProvider === 'tiktok') {
              window.open = function(url, target, features) {
                var href = typeof url === 'string' ? url : '';
                try {
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: '__cm_open_window',
                      url: href,
                      target: target || '',
                      features: features || ''
                    }));
                  }
                } catch (error) {
                  console.warn('TikTok window.open override failed', error);
                }

                if (href && typeof href === 'string') {
                  try {
                    window.location.assign(href);
                  } catch (assignError) {
                    try {
                      window.location.href = href;
                    } catch (hrefError) {
                      console.warn('TikTok window.open navigation failed', hrefError);
                    }
                  }
                }

                return window;
              };

              function __cmHandleAnchorClick(event) {
                try {
                  var node = event.target;
                  while (node && node.tagName && node.tagName.toLowerCase() !== 'a') {
                    node = node.parentElement;
                  }
                  if (!node || node.__cmHandledAnchor) {
                    return;
                  }
                  node.__cmHandledAnchor = true;
                  var href = node.getAttribute('href');
                  var targetAttr = (node.getAttribute('target') || '').toLowerCase();
                  if (!href || href === '#' || href.indexOf('javascript:') === 0) {
                    return;
                  }
                  if (targetAttr && targetAttr !== '_self' && targetAttr !== '_top' && targetAttr !== '_parent') {
                    event.preventDefault();
                    event.stopPropagation();
                    try {
                      window.open(href, targetAttr, '');
                    } catch (anchorError) {
                      console.warn('TikTok anchor override failed', anchorError);
                    }
                    return;
                  }

                  if (targetAttr === '_self' || !targetAttr) {
                    try {
                      window.location.assign(href);
                    } catch (selfAssignError) {
                      try {
                        window.location.href = href;
                      } catch (selfHrefError) {
                        console.warn('TikTok anchor self navigation failed', selfHrefError);
                      }
                    }
                  }
                } catch (clickError) {
                  console.warn('TikTok anchor normalization failed', clickError);
                }
              }

              document.addEventListener('click', __cmHandleAnchorClick, true);
              document.addEventListener('auxclick', __cmHandleAnchorClick, true);
            } else {
              var FORCE_SAME_WINDOW_PATTERNS = [
                'accounts.google.',
                '.google.com',
                '.googleusercontent.com',
                'facebook.com',
                'appleid.apple.com',
                'login.live.com',
                'auth0.com',
                'instagram.com',
                'tiktok.com',
                'twitter.com',
                'x.com',
                'linkedin.com'
              ];

              function shouldForceSameWindow(url) {
                if (!url || typeof url !== 'string') {
                  return false;
                }
                var value = url.toLowerCase();
                for (var i = 0; i < FORCE_SAME_WINDOW_PATTERNS.length; i++) {
                  if (value.indexOf(FORCE_SAME_WINDOW_PATTERNS[i]) !== -1) {
                    return true;
                  }
                }
                return false;
              }

              try {
                if (typeof Object.defineProperty === 'function') {
                  Object.defineProperty(window, '__cmOpener', {
                    configurable: true,
                    writable: true,
                    value: window,
                  });

                  Object.defineProperty(window, 'opener', {
                    configurable: true,
                    get: function() {
                      return window.__cmOpener || window;
                    },
                    set: function(value) {
                      window.__cmOpener = value;
                    },
                  });
                }
              } catch (openerError) {
                console.warn('Failed to patch window.opener', openerError);
              }
              if (!window.__cmOpener) {
                window.__cmOpener = window;
              }

              window.open = function(url, target, features) {
                try {
                  var lowerUrl = typeof url === 'string' ? url.toLowerCase() : '';
                  if (typeof url === 'string' && url.length) {
                    var sanitizedTarget = (target || '').toLowerCase();
                    var forceSameWindow = shouldForceSameWindow(lowerUrl);
                    if (sanitizedTarget && sanitizedTarget !== '_self' && sanitizedTarget !== '_top' && sanitizedTarget !== '_parent') {
                      sanitizedTarget = '_self';
                    }
                    if (forceSameWindow || sanitizedTarget === '_self' || !sanitizedTarget) {
                      try {
                        window.__cmOpener = window;
                        window.location.assign(url);
                      } catch (assignError) {
                        try {
                          window.location.replace(url);
                        } catch (replaceError) {
                          console.warn('window.open fallback navigation failed', replaceError);
                        }
                      }
                      return window;
                    }

                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      try {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: '__cm_open_window',
                          url: url,
                          target: sanitizedTarget,
                          features: features || ''
                        }));
                      } catch (postError) {
                        console.warn('window.open postMessage failed', postError);
                      }
                    }
                  }
                } catch (error) {
                  console.warn('window.open override failed', error);
                }
                return window;
              };
            }
          }
        } catch (error) {
          console.warn('Global WebView enhancements failed', error);
        }
      })();
      true;
    `;
  }, [activeProvider, policyBypassEnabled]);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBackPress = () => {
        if (canWebViewGoBack) {
          webViewRef.current?.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
      return () => {
        subscription.remove();
      };
    }, [canWebViewGoBack])
  );

  const handleHomePress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const baseInjectedJavaScript = useMemo(() => {
    if (policyBypassEnabled || activeProvider === 'tiktok') {
      return undefined;
    }
    return Platform.OS === 'android' ? providerRules.domScript : providerRules.userScript;
  }, [activeProvider, policyBypassEnabled, providerRules.domScript, providerRules.userScript]);

  const instagramEnhancements = useMemo(() => {
    if (policyBypassEnabled || activeProvider !== 'instagram') {
      return '';
    }

    return `
      (function() {
        try {
          var PROFILE_PATH = '/accounts/edit/';
          var ALLOW_ROOT = false;
          var DESKTOP_ALLOWED = ['/direct/inbox', '/direct/inbox/'];
          if (typeof window !== 'undefined') {
            var hash = window.location && window.location.hash ? window.location.hash : '';
            if (hash && hash.indexOf('cm_allow_root=1') !== -1) {
              window.__CM_ALLOW_ROOT = true;
            } else if (hash && hash.indexOf('cm_allow_root=0') !== -1) {
              window.__CM_ALLOW_ROOT = false;
            }
          }
          if (window.__CM_ALLOW_ROOT) {
            ALLOW_ROOT = true;
          }

          function redirectToProfile() {
            try {
              if (window.location.pathname !== PROFILE_PATH) {
                window.location.replace(PROFILE_PATH);
              }
            } catch (redirectError) {
              console.warn('Instagram redirect failed', redirectError);
            }
          }

          function ensureAllowedPath() {
            if (ALLOW_ROOT) {
              var normalized = window.location.pathname.toLowerCase();
              for (var i = 0; i < DESKTOP_ALLOWED.length; i++) {
                if (normalized === DESKTOP_ALLOWED[i]) {
                  return false;
                }
              }
            }
            if (window.location.pathname === '/' || window.location.pathname === '') {
              redirectToProfile();
              return true;
            }
            return false;
          }

          function ensureVisible(node) {
            if (!node || !node.style) {
              return;
            }
            if (node.dataset && node.dataset.cmSuppressed === 'true') {
              return;
            }
            if (node.removeAttribute) {
              node.removeAttribute('aria-hidden');
              node.removeAttribute('hidden');
              if (node.getAttribute && node.getAttribute('data-cm-hidden') === 'true') {
                node.removeAttribute('data-cm-hidden');
              }
            }

            node.style.setProperty('display', 'flex', 'important');
            node.style.setProperty('visibility', 'visible', 'important');
            node.style.setProperty('opacity', '1', 'important');
            node.style.setProperty('pointer-events', 'auto', 'important');
          }

          function markSuppressed(node) {
            if (!node || !node.style) {
              return;
            }
            node.style.setProperty('display', 'none', 'important');
            node.style.setProperty('visibility', 'hidden', 'important');
            node.style.setProperty('opacity', '0', 'important');
            node.style.setProperty('pointer-events', 'none', 'important');
            if (node.dataset) {
              node.dataset.cmSuppressed = 'true';
            }
            if (node.setAttribute) {
              node.setAttribute('aria-hidden', 'true');
            }
          }

          function shouldSuppressNavItem(node) {
            if (!node) {
              return false;
            }
            var target = node;
            if (node.tagName !== 'A' && node.tagName !== 'BUTTON') {
              target = node.querySelector('a, button');
            }
            if (!target) {
              return false;
            }
            var href = (target.getAttribute('href') || '').toLowerCase();
            var aria = (target.getAttribute('aria-label') || '').toLowerCase();
            if (href === '/' || href.indexOf('/explore') === 0 || href.indexOf('/search') === 0) {
              return true;
            }
            if (href.indexOf('/reels') === 0 || href.indexOf('/reel') === 0 || href.indexOf('/video') === 0 || href.indexOf('/tv') === 0) {
              return true;
            }
            if (aria.indexOf('home') !== -1 || aria.indexOf('search') !== -1) {
              return true;
            }
            if (aria.indexOf('video') !== -1 || aria.indexOf('reel') !== -1 || aria.indexOf('watch') !== -1) {
              return true;
            }
            return false;
          }

          var SUPPRESS_SELECTORS = [
            'a[href="/"]',
            'a[href="/explore/"]',
            'a[href^="/explore"]',
            'a[href^="/search"]',
            'a[href^="/reels"]',
            'a[href^="/reel"]',
            'a[href^="/video"]',
            'a[href^="/tv"]',
            '[aria-label="Home"]',
            '[aria-label="home"]',
            '[aria-label="Search"]',
            '[aria-label="search"]',
            '[aria-label="Video"]',
            '[aria-label="Reels"]',
            '[aria-label*="Video"]',
            '[aria-label*="Reels"]',
            '[aria-label*="Home"]',
            '[aria-label*="home"]',
            '[aria-label*="Search"]',
            '[aria-label*="search"]'
          ];

          function hideGlobalNavTargets() {
            var hits = [];
            SUPPRESS_SELECTORS.forEach(function(selector) {
              Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function(node) {
                var container = node.closest('nav[role="navigation"], div[role="navigation"]');
                var target = node.closest('li') || node;
                hits.push({
                  selector: selector,
                  text: target.innerText || node.innerText,
                  aria: (node.getAttribute && node.getAttribute('aria-label')) || (target.getAttribute && target.getAttribute('aria-label')),
                  href: (node.getAttribute && node.getAttribute('href')) || (target.getAttribute && target.getAttribute('href')),
                });
                markSuppressed(target);
                if (container && container !== target) {
                  Array.prototype.slice
                    .call(container.querySelectorAll('a, button, li'))
                    .forEach(function(child) {
                      if (child === target) {
                        return;
                      }
                      if (shouldSuppressNavItem(child)) {
                        markSuppressed(child);
                      }
                    });
                }
              });
            });
            return hits;
          }

          function restoreBottomNav() {
            try {
              var nav = document.querySelector('nav[role="navigation"]') || document.querySelector('div[role="navigation"]');

              if (!nav) {
                var globalHits = hideGlobalNavTargets();
                if (window.ReactNativeWebView) {
                  try {
                    window.ReactNativeWebView.postMessage(
                      JSON.stringify({
                        type: '__cm_instagram_nav_fallback',
                        hits: globalHits,
                        timestamp: Date.now(),
                      })
                    );
                  } catch (fallbackError) {
                    console.warn('Instagram nav fallback failed', fallbackError);
                  }
                }
                return;
              }

              ensureVisible(nav);
              ensureVisible(nav.parentElement);

              var suppressed = [];
              var restored = [];

              Array.prototype.slice.call(nav.querySelectorAll('li')).forEach(function(item) {
                if (shouldSuppressNavItem(item)) {
                  markSuppressed(item);
                  var inner = item.querySelector('a, button, div, span');
                  if (inner) {
                    markSuppressed(inner);
                  }
                  suppressed.push({
                    text: item.innerText,
                    href: item.querySelector('a') ? item.querySelector('a').getAttribute('href') : null,
                    aria: item.getAttribute('aria-label') || (item.querySelector('a') && item.querySelector('a').getAttribute('aria-label')),
                  });
                  return;
                }
                if (item.dataset && item.dataset.cmSuppressed === 'true') {
                  delete item.dataset.cmSuppressed;
                  if (item.removeAttribute) {
                    item.removeAttribute('aria-hidden');
                  }
                }
                ensureVisible(item);
                Array.prototype.slice
                  .call(item.querySelectorAll('a, button, [role="menuitem"], [role="tab"], div, span'))
                  .forEach(function(node) {
                    if (node.dataset && node.dataset.cmSuppressed === 'true') {
                      delete node.dataset.cmSuppressed;
                      if (node.removeAttribute) {
                        node.removeAttribute('aria-hidden');
                      }
                    }
                    ensureVisible(node);
                  });
                restored.push({
                  text: item.innerText,
                  href: item.querySelector('a') ? item.querySelector('a').getAttribute('href') : null,
                  aria: item.getAttribute('aria-label') || (item.querySelector('a') && item.querySelector('a').getAttribute('aria-label')),
                });
              });

              Array.prototype.slice
                .call(
                  document.querySelectorAll(
                    '[data-testid="new-post-button"], [data-testid="PlusCircleIcon"], [aria-label*="New post"], [aria-label*="Professional dashboard"]'
                  )
                )
                .forEach(function(node) {
                  ensureVisible(node);
                });

              var globalSuppressed = hideGlobalNavTargets();

              if (window.ReactNativeWebView) {
                try {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                      type: '__cm_instagram_nav',
                      suppressed: suppressed,
                      restored: restored,
                      globalSuppressed: globalSuppressed,
                      timestamp: Date.now(),
                    })
                  );
                } catch (debugError) {
                  console.warn('Instagram nav debug failed', debugError);
                }
              }
            } catch (navError) {
              console.warn('Instagram nav restore failed', navError);
            }
          }

          function attachBackButtonGuards() {
            try {
              var selectors = ['[aria-label="Back"]', '[data-testid="back-button"]', 'button[aria-label="Back"]'];
              selectors.forEach(function(selector) {
                Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function(node) {
                  if (node.__unscrollerBackGuard) {
                    return;
                  }
                  node.__unscrollerBackGuard = true;
                  node.addEventListener(
                    'click',
                    function(event) {
                      try {
                        event.preventDefault();
                        event.stopPropagation();
                      } catch (_) {}
                      redirectToProfile();
                    },
                    true
                  );
                });
              });
            } catch (backError) {
              console.warn('Instagram back guard failed', backError);
            }
          }

          ensureAllowedPath();
          restoreBottomNav();
          attachBackButtonGuards();

          function wrapHistoryMethod(methodName) {
            var original = history[methodName];
            if (typeof original !== 'function') {
              return;
            }
            history[methodName] = function() {
              var result = original.apply(this, arguments);
              try {
                ensureAllowedPath();
                restoreBottomNav();
                attachBackButtonGuards();
              } catch (historyError) {
                console.warn('Instagram navigation guard failed', historyError);
              }
              return result;
            };
          }

          wrapHistoryMethod('pushState');
          wrapHistoryMethod('replaceState');

          var passiveOptions = { passive: true };
          window.addEventListener('popstate', function() {
            ensureAllowedPath();
            restoreBottomNav();
            attachBackButtonGuards();
          }, passiveOptions);
          window.addEventListener('resize', function() {
            restoreBottomNav();
            attachBackButtonGuards();
          }, passiveOptions);
          window.addEventListener('orientationchange', function() {
            restoreBottomNav();
            attachBackButtonGuards();
          }, passiveOptions);

          var MutationObserverCtor = window.MutationObserver || window.WebKitMutationObserver;
          if (MutationObserverCtor) {
            var observer = new MutationObserverCtor(function() {
              try {
                restoreBottomNav();
                attachBackButtonGuards();
              } catch (observerError) {
                console.warn('Instagram observer guard failed', observerError);
              }
            });
            observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
          }

          if (ensureAllowedPath()) {
            restoreBottomNav();
            attachBackButtonGuards();
          }
          restoreBottomNav();
        } catch (error) {
          console.warn('Instagram guard failed', error);
        }
      })();
      true;
    `;
  }, [activeProvider]);

  const youtubeEnhancements = useMemo(() => {
    if (activeProvider !== 'youtube') {
      return '';
    }

    return `
      (function() {
        try {
          if (window.__cm_youtube_guard) {
            return;
          }
          window.__cm_youtube_guard = true;

          var START_DESKTOP = 'https://www.youtube.com/feed/library?app=desktop';
          var START_MOBILE = 'https://m.youtube.com/feed/library';
          var BLOCK_STATIC = ['/', '/feed/home', '/feed/explore', '/feed/subscriptions', '/feed/you'];
          var BLOCK_PREFIX = ['/shorts'];
          var ALLOWED_PREFIX = ['/feed/library', '/watch', '/results'];

          function getStartUrl() {
            return location.hostname === 'm.youtube.com' ? START_MOBILE : START_DESKTOP;
          }

          function normalize(input) {
            try {
              var url = input ? new URL(input, location.origin) : location;
              return url.pathname.toLowerCase();
            } catch (error) {
              return '';
            }
          }

          function isAllowed(path) {
            var normalized = normalize(path);
            if (!normalized) {
              return false;
            }
            for (var i = 0; i < ALLOWED_PREFIX.length; i++) {
              var prefix = ALLOWED_PREFIX[i];
              if (normalized === prefix || normalized.indexOf(prefix + '/') === 0) {
                return true;
              }
            }
            return false;
          }

          function isBlocked(input) {
            var normalized = normalize(input);
            if (!normalized) {
              return true;
            }
            if (isAllowed(normalized)) {
              return false;
            }
            for (var i = 0; i < BLOCK_STATIC.length; i++) {
              if (normalized === BLOCK_STATIC[i]) {
                return true;
              }
            }
            for (var k = 0; k < BLOCK_PREFIX.length; k++) {
              if (normalized.indexOf(BLOCK_PREFIX[k]) === 0) {
                return true;
              }
            }
            return false;
          }

          function redirectHome() {
            var target = getStartUrl();
            if (location.href.indexOf(target) !== 0) {
              location.replace(target);
            }
          }

          function enforceRoute() {
            if (isBlocked(location.href)) {
              redirectHome();
              return true;
            }
            return false;
          }

          var HIDE_SELECTORS = [
            '#related',
            '#related *',
            '#secondary',
            '#secondary *',
            '#footer',
            '#footer-inner',
            'ytd-watch-next-secondary-results-renderer',
            'ytd-watch-next-secondary-results-renderer *',
            'ytd-compact-autoplay-renderer',
            'ytd-compact-autoplay-renderer *',
            'ytd-promoted-video-renderer',
            'ytd-promoted-video-renderer *',
            'ytd-display-ad-renderer',
            'ytd-display-ad-renderer *',
            'ytd-player-ads-renderer',
            'ytd-player-ads-renderer *',
            '#player-ads',
            '#player-ads *',
            '#player-ads-container',
            '#player-ads-container *',
            '.video-ads',
            '.video-ads *',
            'ytd-rich-section-renderer[is-shorts]',
            'ytd-rich-section-renderer[section-identifier="shorts_shelf"]',
            'ytd-item-section-renderer:has(ytd-reel-shelf-renderer)',
            'ytd-shorts-shelf-renderer',
            'ytd-reel-shelf-surface-renderer',
            'ytd-rich-section-renderer:has(ytd-shorts-shelf-renderer)',
            'ytd-item-section-renderer:has(ytd-shorts-shelf-renderer)',
            'ytd-rich-grid-slim-media[is-short]',
            'ytd-shelf-renderer[is-shorts-shelf]',
            'ytd-item-section-renderer:has(a[href^="/shorts"])',
            'ytd-rich-item-renderer:has(a[href^="/shorts"])',
            'ytd-rich-item-renderer[is-shorts-rich-item]',
            'ytd-rich-grid-media:has(a[href*="/shorts"])',
            'ytd-grid-video-renderer:has(a[href*="/shorts"])',
            'ytd-video-renderer[is-short]',
            'ytd-video-renderer:has(a[href*="/shorts"])',
            'ytd-compact-video-renderer:has(a[href*="/shorts"])',
            'ytd-two-column-browse-results-renderer:has(ytd-reel-shelf-renderer)',
            'ytd-two-column-browse-results-renderer:has(ytd-rich-section-renderer[section-identifier="shorts_shelf"])',
            'ytd-section-list-renderer:has(ytd-reel-shelf-renderer)',
            'ytd-rich-grid-row:has(ytd-rich-grid-slim-media)',
            'yt-chip-cloud-chip-renderer',
            'yt-chip-cloud-chip-renderer *',
            'ytd-feed-filter-chip-bar-renderer',
            'ytd-feed-filter-chip-bar-renderer *',
            'ytd-feed-filter-chip-renderer',
            'ytd-feed-filter-chip-renderer *',
            'ytm-watch-next-secondary-results-renderer',
            'ytm-watch-next-secondary-results-renderer *',
            'ytm-single-column-watch-next-results-renderer',
            'ytm-single-column-watch-next-results-renderer *',
            'ytm-compact-video-renderer',
            'ytm-compact-video-renderer *',
            'ytd-reel-shelf-renderer',
            'ytd-reel-shelf-renderer *',
            'ytd-reel-shelf-renderer + ytd-item-section-renderer',
            'ytd-display-ad-renderer',
            'ytd-display-ad-renderer *',
            'ytm-promoted-sparkles-text-search-renderer',
            'ytm-promoted-sparkles-text-search-renderer *',
            'ytm-promoted-sparkles-web-renderer',
            'ytm-promoted-sparkles-web-renderer *',
            'ytm-shorts-shelf-renderer',
            'ytm-browse-feed-shorts-renderer',
            'ytm-reel-item-renderer',
            'ytm-chip-cloud-chip-renderer',
            'ytm-chip-cloud-chip-renderer *',
            'ytm-chip-cloud-renderer',
            'ytm-rich-item-renderer:has(a[href*="/shorts"])',
            'ytm-video-renderer:has(a[href*="/shorts"])',
            'ytm-compact-video-renderer:has(a[href*="/shorts"])',
            'ytm-shelf-renderer:has(a[href*="/shorts"])',
            'ytm-rich-section-renderer:has(ytm-reel-shelf-renderer)',
            'ytm-rich-section-renderer:has(ytm-reel-item-renderer)',
            'ytm-rich-shelf-renderer:has(ytm-reel-item-renderer)',
            'ytm-rich-shelf-renderer:has(a[href*="/shorts"])',
            'ytm-section-list-renderer:has(ytm-reel-shelf-renderer)',
            'ytm-section-list-renderer:has(ytm-reel-item-renderer)',
            'ytm-item-section-renderer:has(ytm-reel-item-renderer)',
            'ytm-feed-filter-chip-bar-renderer',
            'ytm-feed-filter-chip-bar-renderer *',
            'ytm-feed-filter-chip-renderer',
            'ytm-feed-filter-chip-renderer *',
            'ytm-pivot-bar-renderer',
            'ytm-pivot-bar-renderer *',
            'ytm-browse-feed-pivot-bar-renderer',
            'ytm-browse-feed-pivot-bar-renderer *',
            'ytm-browse-feed-tabs-renderer',
            'ytm-browse-feed-tabs-renderer *',
            'tp-yt-app-bottom-navigation-item-renderer',
            'tp-yt-app-bottom-navigation-item-renderer *',
            'a[href*="/shorts"]',
            'ytm-watch-next-feed-renderer',
            'ytm-watch-next-feed-renderer *',
            'ytm-watch-card-rich-renderer',
            'ytm-watch-card-rich-renderer *',
            'ytm-watch-card-renderer',
            'ytm-watch-card-renderer *',
            'ytm-watch-card-section-renderer',
            'ytm-watch-card-section-renderer *',
            'ytm-watch-next-section-renderer',
            'ytm-watch-next-section-renderer *',
            'ytm-video-with-context-renderer',
            'ytm-video-with-context-renderer *',
            'ytm-section-list-renderer',
            'ytm-section-list-renderer *',
            'ytm-item-section-renderer',
            'ytm-item-section-renderer *',
            'ytm-related-video-renderer',
            'ytm-related-video-renderer *',
            'ytm-watch-metadata',
            'ytm-watch-metadata *',
            '#below',
            '#below *',
            '#comments',
            '#comments *',
            '#comment-teaser',
            '#comment-teaser *',
            '#columns #secondary',
            '#columns #secondary *',
            'ytm-comment-section-renderer',
            'ytm-comment-section-renderer *',
            'ytm-comments-entry-point-header-renderer',
            'ytm-comments-entry-point-header-renderer *',
            'ytm-comments-view-more-button-renderer',
            'ytm-comments-view-more-button-renderer *',
            '#items ytd-guide-entry-renderer:has(a[title="Home"])',
            '#items ytd-guide-entry-renderer:has(a[title="Shorts"])',
            '#items ytd-guide-entry-renderer:has(a[title="Subscriptions"])',
            '#sections ytd-guide-section-renderer ytd-guide-entry-renderer:has(a[title="Home"])',
            '#sections ytd-guide-section-renderer ytd-guide-entry-renderer:has(a[title="Shorts"])',
            '#sections ytd-guide-section-renderer ytd-guide-entry-renderer:has(a[title="Subscriptions"])',
            'ytd-mini-guide-entry-renderer:has(a[title="Home"])',
            'ytd-mini-guide-entry-renderer:has(a[title="Shorts"])',
            'ytd-mini-guide-entry-renderer:has(a[title="Subscriptions"])',
            'ytm-guide-entry-renderer:has(a[href="/"], a[href="/feed/subscriptions"])',
            'ytm-pivot-bar-item-renderer:has([title="Home"],[title="Shorts"],[title="Subscriptions"])',
            'ytd-guide-entry-renderer a[href="/"]',
            'ytd-guide-entry-renderer a[href="/feed/subscriptions"]',
            'ytd-guide-entry-renderer a[href="/shorts"]',
            'a[title="Home"]',
            'a[title="Shorts"]',
            'a[title="Subscriptions"]'
          ];

          function suppressNode(node) {
            if (!node || node.__cmSuppressed) {
              return;
            }
            node.__cmSuppressed = true;
            if (node.style) {
              node.style.setProperty('display', 'none', 'important');
              node.style.setProperty('visibility', 'hidden', 'important');
              node.style.setProperty('opacity', '0', 'important');
              node.style.setProperty('pointer-events', 'none', 'important');
            }
            try {
              node.setAttribute('hidden', 'true');
              node.setAttribute('aria-hidden', 'true');
            } catch (_) {}
          }

          function unsuppressNode(node) {
            if (!node) {
              return;
            }
            node.__cmSuppressed = false;
            if (node.style) {
              node.style.removeProperty('display');
              node.style.removeProperty('visibility');
              node.style.removeProperty('opacity');
              node.style.removeProperty('pointer-events');
            }
            node.removeAttribute('hidden');
            node.removeAttribute('aria-hidden');
          }

          var SHORT_CONTAINER_SELECTORS = [
            'ytd-rich-item-renderer',
            'ytd-rich-grid-media',
            'ytd-rich-grid-row',
            'ytd-reel-shelf-renderer',
            'ytd-shorts-shelf-renderer',
            'ytd-reel-shelf-surface-renderer',
            'ytd-item-section-renderer',
            'ytd-shelf-renderer',
            'ytd-grid-video-renderer',
            'ytd-video-renderer',
            'ytd-compact-video-renderer',
            'ytm-rich-item-renderer',
            'ytm-rich-shelf-renderer',
            'ytm-reel-item-renderer',
            'ytm-browse-feed-item-renderer',
            'ytm-browse-feed-shelf-renderer',
            'ytm-browse-feed-shorts-renderer',
            'ytm-section-list-renderer',
            'ytm-item-section-renderer',
            'ytm-video-renderer',
            'ytm-compact-video-renderer',
            'ytm-watch-next-section-renderer',
            'ytm-watch-next-feed-renderer',
            'ytm-watch-card-renderer',
            'ytm-watch-card-rich-renderer',
            'ytd-two-column-browse-results-renderer',
            'ytd-section-list-renderer'
          ];
          var SHORT_CONTAINER_SELECTOR = SHORT_CONTAINER_SELECTORS.join(', ');

          function hideNodes(selectors, scope) {
            var root = scope || document;
            for (var i = 0; i < selectors.length; i++) {
              var nodes = root.querySelectorAll(selectors[i]);
              for (var j = 0; j < nodes.length; j++) {
                var node = nodes[j];
                suppressNode(node);
              }
            }
          }

          function stripShortLinks(scope) {
            var root = scope || document;
            var anchors = root.querySelectorAll('a[href*="/shorts"]');
            for (var i = 0; i < anchors.length; i++) {
              var anchor = anchors[i];
              try {
                anchor.removeAttribute('href');
              } catch (_) {}
              if (anchor.style) {
                anchor.style.pointerEvents = 'none';
              }
              suppressNode(anchor);
              if (anchor.closest) {
                var container = null;
                try {
                  container = anchor.closest(SHORT_CONTAINER_SELECTOR);
                } catch (_) {
                  container = null;
                }
                if (container) {
                  suppressNode(container);
                }
              }
            }
          }

          function stripShortSections(scope) {
            var root = scope || document;
            var selectors = [
              'a[href*="/shorts"]',
              '[is-short]',
              '[is-shorts]',
              '[data-is-shorts]',
              '[data-short-video]',
              'button[aria-label*="Shorts"]',
              'a[aria-label*="Shorts"]',
              'a[title="Shorts"]',
              'ytm-reel-item-renderer',
              'ytm-shorts-shelf-renderer',
              'ytm-browse-feed-shorts-renderer',
              'ytd-reel-shelf-renderer',
              'ytd-shorts-shelf-renderer'
            ];
            for (var s = 0; s < selectors.length; s++) {
              var list = [];
              try {
                list = root.querySelectorAll(selectors[s]);
              } catch (_) {
                list = [];
              }
              for (var n = 0; n < list.length; n++) {
                var node = list[n];
                if (!node) {
                  continue;
                }
                if (node.removeAttribute) {
                  try {
                    node.removeAttribute('href');
                  } catch (_) {}
                }
                if (node.style) {
                  node.style.pointerEvents = 'none';
                }
                var container;
                try {
                  container = node.closest ? node.closest(SHORT_CONTAINER_SELECTOR) : null;
                } catch (_) {
                  container = null;
                }
                suppressNode(container || node);
              }
            }
          }

          function guardShortClicks() {
            function handle(event) {
              try {
                var node = event.target;
                while (node && node.nodeType === 1) {
                  if (node.tagName && node.tagName.toLowerCase() === 'a') {
                    var href = node.getAttribute('href') || '';
                    if (href.indexOf('/shorts') !== -1) {
                      event.preventDefault();
                      event.stopPropagation();
                      suppressNode(node);
                      if (node.closest) {
                        var container = null;
                        try {
                          container = node.closest(SHORT_CONTAINER_SELECTOR);
                        } catch (_) {
                          container = null;
                        }
                        if (container) {
                          suppressNode(container);
                        }
                      }
                      return;
                    }
                  }
                  node = node.parentElement;
                }
              } catch (_) {}
            }

            var passive = { passive: false, capture: true };
            try {
              document.addEventListener('click', handle, passive);
              document.addEventListener('touchstart', handle, passive);
            } catch (_) {
              document.addEventListener('click', handle, true);
              document.addEventListener('touchstart', handle, true);
            }
          }

          function injectStyle() {
            if (document.getElementById('cm-yt-hide-style')) {
              return;
            }
            var style = document.createElement('style');
            style.id = 'cm-yt-hide-style';
            var baseSelectors = HIDE_SELECTORS.join(',\n');
            var overlaySelectors = ['.ytp-ce-element', '.ytp-ce-element *', '.ytp-ce-covering-overlay', '.ytp-ce-covering-overlay *', '.ytp-pause-overlay', '.ytp-pause-overlay *', '.ytp-endscreen-content', '.ytp-endscreen-content *', '.ytp-ad-module', '.ytp-ad-module *', '.ytp-autonav-endscreen-upnext-button', '.ytp-autonav-endscreen-next-button', '.ytp-paid-content-overlay', '.ytp-paid-content-overlay *', '.ytp-suggested-action-badge', '.ytp-suggested-action-badge *', '.ytp-ad-skip-button', '.ytp-ad-skip-button *', '.ytp-ad-overlay-container', '.ytp-ad-overlay-container *'];
            var suppressionCss = '';
            if (baseSelectors.length) {
              suppressionCss += baseSelectors + ' { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
';
            }
            if (overlaySelectors.length) {
              suppressionCss += overlaySelectors.join(',\n') + ' { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
';
            }
            suppressionCss += 'ytm-watch-flexy, body, html { background-color: #000 !important; }
ytm-watch-flexy #player, ytm-watch-flexy #player-container, ytm-watch-flexy #player-theater-container { margin: 0 !important; }
';
            style.textContent = suppressionCss;
            (document.head || document.documentElement || document.body).appendChild(style);
          }

          function disableNavInteractions(scope) {
            var root = scope || document;
            var navButtons = root.querySelectorAll('tp-yt-app-bottom-navigation-item-renderer, ytm-pivot-bar-item-renderer, ytm-browse-feed-pivot-bar-renderer tp-yt-paper-tab, ytm-browse-feed-tabs-renderer tp-yt-paper-tab');
            for (var i = 0; i < navButtons.length; i++) {
              var node = navButtons[i];
              if (!node) {
                continue;
              }
              if (node.style) {
                node.style.pointerEvents = 'none';
                node.style.display = 'none';
              }
              node.setAttribute('aria-hidden', 'true');
            }
          }

          function handleNavigation(scope) {
            injectStyle();
            enforceRoute();
            hideNodes(HIDE_SELECTORS, scope);
            stripShortLinks(scope);
            stripShortSections(scope);
            stripWatchPage();
            disableNavInteractions(scope);
          }

          function stripWatchPage() {
            try {
              if (normalize(location.href) !== '/watch') {
                return;
              }

              var keepSelectors = [
                '#player',
                '#player-container',
                '#player-theater-container',
                'ytm-player',
                'ytm-watch-flexy #player',
                '#description',
                '#description-inner',
                '#structured-description',
                'ytm-watch-description',
                'ytm-description-view-component',
                'ytm-rich-text-viewer',
                'ytm-watch-metadata'
              ];

              var keepNodes = [];
              for (var i = 0; i < keepSelectors.length; i++) {
                var matches;
                try {
                  matches = document.querySelectorAll(keepSelectors[i]);
                } catch (_) {
                  matches = [];
                }
                for (var m = 0; m < matches.length; m++) {
                  keepNodes.push(matches[m]);
                }
              }

              for (var k = 0; k < keepNodes.length; k++) {
                unsuppressNode(keepNodes[k]);
              }

              function shouldKeep(node) {
                if (!node) {
                  return false;
                }
                for (var a = 0; a < keepNodes.length; a++) {
                  var keep = keepNodes[a];
                  if (!keep) {
                    continue;
                  }
                  if (keep === node) {
                    return true;
                  }
                  if (keep.contains && keep.contains(node)) {
                    return true;
                  }
                  if (node.contains && node.contains(keep)) {
                    return true;
                  }
                }
                return false;
              }

              var body = document.body;
              if (!body) {
                return;
              }

              var children = Array.prototype.slice.call(body.children || []);
              for (var c = 0; c < children.length; c++) {
                var child = children[c];
                if (!shouldKeep(child)) {
                  suppressNode(child);
                } else {
                  unsuppressNode(child);
                }
              }
            } catch (_) {}
          }

          document.addEventListener('click', function(event) {
            try {
              var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
              if (!anchor) {
                return;
              }
              var href = anchor.getAttribute('href') || '';
              if (isBlocked(href)) {
                event.preventDefault();
                event.stopPropagation();
                redirectHome();
              }
            } catch (error) {
              console.warn('[CM][yt] click intercept failed', error);
            }
          }, true);

          handleNavigation();

          var observer;
          try {
            var MutationObserverCtor = window.MutationObserver || window.WebKitMutationObserver;
            if (MutationObserverCtor) {
              observer = new MutationObserverCtor(function() {
                for (var i = 0; i < mutations.length; i++) {
                  var mutation = mutations[i];
                  if (mutation.addedNodes && mutation.addedNodes.length) {
                    handleNavigation(mutation.target);
                  }
                }
                handleNavigation();
              });
              observer.observe(document.documentElement || document.body, { subtree: true, childList: true });
            }
          } catch (observerError) {
            console.warn('[CM][yt] observer failed', observerError);
          }

          var debounced = false;
          function schedule() {
            if (debounced) {
              return;
            }
            debounced = true;
            setTimeout(function() {
              debounced = false;
              handleNavigation();
            }, 140);
          }

          window.addEventListener('yt-navigate-start', schedule, true);
          window.addEventListener('yt-navigate-finish', schedule, true);
          window.addEventListener('yt-page-data-updated', schedule, true);
          window.addEventListener('popstate', schedule, true);
          window.addEventListener('load', schedule, true);
          document.addEventListener('DOMContentLoaded', schedule, true);

          var bootTicks = 0;
          var bootTimer = setInterval(function() {
            handleNavigation();
            stripWatchPage();
            bootTicks += 1;
            if (bootTicks > 40) {
              clearInterval(bootTimer);
            }
          }, 120);
        } catch (error) {
          console.warn('[CM][yt] guard failed', error);
        }
      })();
      true;
    `;
  }, [activeProvider]);

  const facebookEnhancements = useMemo(() => {
    if (activeProvider !== 'facebook') {
      return '';
    }

    const startUrl = providerRules.startURL || FACEBOOK_NOTIFICATIONS_URL;
    let startPath = '/';
    try {
      startPath = new URL(startUrl).pathname || '/';
    } catch (_) {
      // ignore
    }

    const blockedPaths = [
      '/home.php',
      '/home.php/',
      '/watch',
      '/watch/',
      '/watch/feed',
      '/watch/live',
      '/watch/saved',
      '/reels',
      '/reels/',
      '/stories',
      '/stories/',
      '/videos',
      '/videos/',
      '/gaming',
      '/gaming/'
    ];

    const openAppTextMatches = ['open app', 'open facebook', 'use app', 'download app', 'open in app'];
    const navTextMatches = ['home', 'video', 'videos', 'watch', 'reels'];

    return `
      (function() {
        try {
          if (window.__cm_facebook_guard) {
            return;
          }
          window.__cm_facebook_guard = true;

          var START_URL = ${JSON.stringify(startUrl)};
          var START_PATH = ${JSON.stringify(startPath)};
          var BLOCKED_PATHS = ${JSON.stringify(blockedPaths)};
          var OPEN_APP_TEXT = ${JSON.stringify(openAppTextMatches)};
          var NAV_TEXT_MATCHES = ${JSON.stringify(navTextMatches)};
          var lastRedirectAt = 0;

          function normalize(input) {
            try {
              return new URL(input, window.location.origin).pathname.toLowerCase();
            } catch (_error) {
              if (!input) {
                return '';
              }
              try {
                var anchor = document.createElement('a');
                anchor.href = input;
                return (anchor.pathname || '').toLowerCase();
              } catch (_ignored) {
                try {
                  return (String(input).split('?')[0] || '').toLowerCase();
                } catch (_stringError) {
                  return '';
                }
              }
            }
          }

          function isBlockedPath(path) {
            var normalized = normalize(path);
            if (!normalized) {
              return false;
            }
            if (normalized === START_PATH || normalized.indexOf(START_PATH + '/') === 0) {
              return false;
            }
            for (var i = 0; i < BLOCKED_PATHS.length; i++) {
              var candidate = BLOCKED_PATHS[i];
              if (!candidate) {
                continue;
              }
              if (normalized === candidate || normalized.indexOf(candidate + '/') === 0) {
                return true;
              }
            }
            if (START_PATH !== '/' && normalized === '/') {
              return true;
            }
            return false;
          }

          function hideNode(node) {
            if (!node || node.__cmSuppressed) {
              return;
            }
            node.__cmSuppressed = true;
            try {
              node.style.display = 'none';
              node.style.visibility = 'hidden';
              node.style.opacity = '0';
              node.style.pointerEvents = 'none';
              node.setAttribute('aria-hidden', 'true');
            } catch (_) {}
          }

          function matchesText(node, patterns) {
            if (!node || !patterns || !patterns.length) {
              return false;
            }
            var text = '';
            try {
              text = (node.innerText || node.textContent || '').toLowerCase();
            } catch (_) {
              text = '';
            }
            if (!text) {
              return false;
            }
            for (var i = 0; i < patterns.length; i++) {
              if (text.indexOf(patterns[i]) !== -1) {
                return true;
              }
            }
            return false;
          }

          function hideOpenAppElements() {
            var selectors = [
              '[data-testid="open-in-app-banner"]',
              '[data-testid="open_app_banner"]',
              'a[href^="fb://"]',
              'a[href*="open_app"]',
              'a[href*="app_install"]',
              'div[data-sigil*="open-app"]',
              'div[data-testid*="app_banner"]',
              'div[role="presentation"] a[href^="fb://"]',
              'div[role="button"][data-lynx-mode="asynclazy"]'
            ];

            for (var i = 0; i < selectors.length; i++) {
              try {
                var nodes = document.querySelectorAll(selectors[i]);
                for (var j = 0; j < nodes.length; j++) {
                  hideNode(nodes[j]);
                }
              } catch (_) {}
            }

            var candidates = document.querySelectorAll('a, button, div[role="button"], span');
            for (var k = 0; k < candidates.length; k++) {
              var candidate = candidates[k];
              if (matchesText(candidate, OPEN_APP_TEXT)) {
                hideNode(candidate);
                var parent = candidate.parentElement;
                if (parent && parent !== candidate) {
                  hideNode(parent);
                }
              }
            }
          }

          function hideBlockedNavigation() {
            var nodes = document.querySelectorAll('a[href], div[role="link"], div[role="button"]');
            for (var i = 0; i < nodes.length; i++) {
              var node = nodes[i];
              var href = '';
              try {
                href = node.getAttribute('href') || '';
              } catch (_) {
                href = '';
              }
              var shouldSuppress = false;
              if (href) {
                var normalizedHref = normalize(href);
                if (isBlockedPath(normalizedHref)) {
                  shouldSuppress = true;
                } else {
                  var lowerHref = href.toLowerCase();
                  if (lowerHref.indexOf('/watch') !== -1 || lowerHref.indexOf('/videos') !== -1 || lowerHref.indexOf('/home.php') !== -1) {
                    shouldSuppress = true;
                  }
                }
              }
              if (!shouldSuppress && matchesText(node, NAV_TEXT_MATCHES)) {
                shouldSuppress = true;
              }
              if (shouldSuppress) {
                hideNode(node);
                var parent = node.parentElement;
                if (parent && parent !== node) {
                  hideNode(parent);
                }
              }
            }
          }

          function enforceAllowedLocation() {
            if (!isBlockedPath(window.location.href)) {
              return false;
            }
            var now = Date.now();
            if (now - lastRedirectAt < 500) {
              return true;
            }
            lastRedirectAt = now;
            try {
              window.location.replace(START_URL);
            } catch (_replaceError) {
              window.location.href = START_URL;
            }
            return true;
          }

          function patchHistory(method) {
            var original = history[method];
            if (typeof original !== 'function') {
              return;
            }
            history[method] = function() {
              var result = original.apply(this, arguments);
              try {
                setTimeout(function() {
                  enforceAllowedLocation();
                  hideOpenAppElements();
                  hideBlockedNavigation();
                }, 0);
              } catch (_) {}
              return result;
            };
          }

          patchHistory('pushState');
          patchHistory('replaceState');

          window.addEventListener('popstate', function() {
            enforceAllowedLocation();
            hideOpenAppElements();
            hideBlockedNavigation();
          }, true);

          if (typeof MutationObserver === 'function') {
            var observer = new MutationObserver(function() {
              hideOpenAppElements();
              hideBlockedNavigation();
              enforceAllowedLocation();
            });
            observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
          }

          hideOpenAppElements();
          hideBlockedNavigation();
          enforceAllowedLocation();
        } catch (error) {
          console.warn('Facebook guard failed', error);
        }
      })();
      true;
    `;
  }, [activeProvider, providerRules.startURL, policyBypassEnabled]);

  const xEnhancements = useMemo(() => {
    if (policyBypassEnabled || activeProvider !== 'x') {
      return '';
    }

    const startUrl = providerRules.startURL || 'https://x.com/messages';
    let startPath = '/messages';
    try {
      startPath = new URL(startUrl).pathname || '/messages';
    } catch (_) {
      // ignore
    }

    const blockedPaths = [
      '/',
      '/home',
      '/feed',
      '/explore',
      '/communities',
      '/communities/discover',
      '/lists',
      '/lists/suggested',
      '/lists/discover',
      '/i/communities',
      '/i/communities/',
      '/i/communities/communities-home',
      '/i/communities/home',
      '/i/communities/discover',
      '/i/lists',
      '/i/lists/',
      '/i/lists/list-suggestions',
      '/i/lists/list-picker',
      '/i/lists/discover',
      '/bookmarks',
      '/i/bookmarks',
    ];

    return `
      (function() {
        try {
          if (window.__cm_x_guard) {
            return;
          }
          window.__cm_x_guard = true;

          var START_URL = ${JSON.stringify(startUrl)};
          var START_PATH = ${JSON.stringify(startPath)};
          var BLOCKED = ${JSON.stringify(blockedPaths)};

          var guardEnabled = window.__cm_x_loggedIn === true;

          window.__cmActivateXGuard = function(enabled) {
            guardEnabled = !!enabled;
            if (!guardEnabled) {
              return;
            }
            try {
              guardCurrentLocation();
              hideBlockedElements();
            } catch (_activateErr) {}
          };

          function normalize(input) {
            try {
              return new URL(input, window.location.origin).pathname.toLowerCase();
            } catch (error) {
              return (input || '').toLowerCase();
            }
          }

          function isBlockedPath(path) {
            var normalized = normalize(path);
            if (!normalized || normalized === '/' || normalized === '') {
              return true;
            }
            if (normalized === START_PATH || normalized.indexOf(START_PATH + '/') === 0) {
              return false;
            }
            for (var i = 0; i < BLOCKED.length; i++) {
              var candidate = BLOCKED[i];
              if (candidate === '/') {
                if (normalized === '/' || normalized === '') {
                  return true;
                }
                continue;
              }
              if (normalized === candidate || normalized.indexOf(candidate + '/') === 0) {
                return true;
              }
            }
            return false;
          }

          function markSuppressed(node) {
            if (!node || node.dataset && node.dataset.cmSuppressed === 'true') {
              return;
            }
            node.style.display = 'none';
            node.style.visibility = 'hidden';
            node.style.pointerEvents = 'none';
            node.style.opacity = '0';
            node.setAttribute('aria-hidden', 'true');
            if (node.dataset) {
              node.dataset.cmSuppressed = 'true';
            }
          }

          function redirectToMessages() {
            if (!guardEnabled) {
              return;
            }
            if (window.location.pathname !== START_PATH) {
              window.location.replace(START_URL);
            }
          }

          function guardCurrentLocation() {
            if (!guardEnabled) {
              return false;
            }
            if (isBlockedPath(window.location.pathname)) {
              redirectToMessages();
              return true;
            }
            return false;
          }

          var KEYWORDS = ['communities', 'community', 'lists', 'list suggestions', 'suggested lists'];

          function nodeMatchesKeywords(node) {
            if (!node) {
              return false;
            }
            var text = (node.textContent || '').toLowerCase();
            var aria = (node.getAttribute && node.getAttribute('aria-label')) || '';
            var testid = (node.getAttribute && node.getAttribute('data-testid')) || '';
            var href = (node.getAttribute && node.getAttribute('href')) || '';
            var combined = [text, aria, testid, href].join(' ').toLowerCase();
            for (var i = 0; i < KEYWORDS.length; i++) {
              if (combined.indexOf(KEYWORDS[i]) !== -1) {
                return true;
              }
            }
            return false;
          }

          function findActionNode(start) {
            var node = start;
            while (node) {
              if (nodeMatchesKeywords(node)) {
                return node;
              }
              if (node.tagName === 'A' || node.tagName === 'BUTTON') {
                return node;
              }
              var role = node.getAttribute && node.getAttribute('role');
              if (role === 'menuitem' || role === 'option' || role === 'link') {
                return node;
              }
              node = node.parentElement;
            }
            return null;
          }

          function handleBlockedEvent(event) {
            if (!guardEnabled) {
              return;
            }
            if (event) {
              try {
                event.preventDefault();
                event.stopPropagation();
              } catch (_) {}
            }
            redirectToMessages();
          }

          document.addEventListener('click', function(event) {
            if (!guardEnabled) {
              return;
            }
            try {
              var node = findActionNode(event.target);
              if (!node || !node.getAttribute) {
                return;
              }
              var href = node.getAttribute('href');
              if ((href && isBlockedPath(href)) || nodeMatchesKeywords(node)) {
                markSuppressed(node);
                var wrapper = node.closest && node.closest('a, button, li, div');
                if (wrapper) {
                  markSuppressed(wrapper);
                }
                handleBlockedEvent(event);
              }
            } catch (clickError) {
              console.warn('X link guard failed', clickError);
            }
          }, true);

          document.addEventListener('keydown', function(event) {
            if (!guardEnabled) {
              return;
            }
            try {
              if (!event) {
                return;
              }
              if (event.key !== 'Enter' && event.key !== ' ') {
                return;
              }
              var node = findActionNode(event.target);
              if (!node) {
                return;
              }
              var href = node.getAttribute && node.getAttribute('href');
              if ((href && isBlockedPath(href)) || nodeMatchesKeywords(node)) {
                markSuppressed(node);
                var wrapper = node.closest && node.closest('a, button, li, div');
                if (wrapper) {
                  markSuppressed(wrapper);
                }
                handleBlockedEvent(event);
              }
            } catch (keyError) {
              console.warn('X key guard failed', keyError);
            }
          }, true);

          function hideBlockedElements() {
            try {
              var selectors = [
                '[data-testid="AppTabBar_Communities_Link"]',
                '[data-testid="AppTabBar_Lists_Link"]',
                '[data-testid="AppTabBar_Communities_Tab"]',
                '[data-testid="AppTabBar_Lists_Tab"]',
                '[data-testid="communities-nav-item"]',
                '[data-testid="lists-nav-item"]',
                'a[href^="/communities"]',
                'a[href^="/lists"]',
                'a[href^="/i/communities"]',
                'a[href^="/i/lists"]',
                '[aria-label="Communities"]',
                '[aria-label="Lists"]',
                '[role="menuitem"][href*="/communities"]',
                '[role="menuitem"][href*="/lists"]'
              ];
              selectors.forEach(function(selector) {
                Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function(node) {
                  markSuppressed(node);
                  var parent = node.closest && node.closest('a, button, li, div');
                  if (parent && parent !== node) {
                    markSuppressed(parent);
                  }
                });
              });

              Array.prototype.slice.call(document.querySelectorAll('[role="menuitem"], [data-testid], a, button')).forEach(function(node) {
                if (nodeMatchesKeywords(node)) {
                  markSuppressed(node);
                  var parent = node.closest && node.closest('a, button, li, div');
                  if (parent && parent !== node) {
                    markSuppressed(parent);
                  }
                }
              });
            } catch (hideError) {
              console.warn('X hide guard failed', hideError);
            }
          }

          function patchHistory(method) {
            var original = history[method];
            if (typeof original !== 'function') {
              return;
            }
            history[method] = function() {
              var result = original.apply(this, arguments);
              setTimeout(function() {
                guardCurrentLocation();
                hideBlockedElements();
              }, 0);
              return result;
            };
          }

          patchHistory('pushState');
          patchHistory('replaceState');

          window.addEventListener('popstate', function() {
            guardCurrentLocation();
            hideBlockedElements();
          });

          var observer = new MutationObserver(function() {
            hideBlockedElements();
            guardCurrentLocation();
          });
          observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

          hideBlockedElements();
          guardCurrentLocation();
        } catch (error) {
          console.warn('X guard failed', error);
        }
      })();
      true;
    `;
  }, [activeProvider, policyBypassEnabled, providerRules.startURL]);

  const currentXUrl = providerCurrentUrls.x ?? (activeProvider === 'x' ? sourceUri : null);
  const currentXPath = useMemo(() => {
    if (activeProvider !== 'x') {
      return null;
    }
    return safeGetPath(currentXUrl || '');
  }, [activeProvider, currentXUrl]);

  const isXAuthPage = useMemo(() => {
    if (activeProvider !== 'x') {
      return false;
    }
    return isXAuthRoute(currentXUrl, currentXPath);
  }, [activeProvider, currentXUrl, currentXPath]);

  const tiktokEnhancements = useMemo(() => {
    if (activeProvider !== 'tiktok') {
      return '';
    }

    return `
      (function() {
        try {
          var BLOCKED = ['/foryou', '/following', '/friends', '/live', '/explore', '/discover'];
          var REDIRECT = '${TIKTOK_UPLOAD_URL}';

          function normalize(input) {
            try {
              return new URL(input, window.location.origin).pathname.toLowerCase();
            } catch (_) {
              return (input || '').toLowerCase();
            }
          }

          function isBlocked(href) {
            var path = normalize(href);
            if (!path) return false;
            for (var i = 0; i < BLOCKED.length; i++) {
              var needle = BLOCKED[i];
              if (path === needle || path.indexOf(needle + '/') === 0) {
                return true;
              }
            }
            return false;
          }

          function hideNav() {
            var selectors = [
              "a[href='/foryou']",
              "a[href^='/foryou']",
              "a[href='/explore']",
              "a[href^='/explore']",
              "a[href='/following']",
              "a[href^='/following']",
              "a[href='/friends']",
              "a[href^='/friends']",
              "a[href='/live']",
              "a[href^='/live']",
              "[aria-label*='For You']",
              "[aria-label*='Explore']",
              "[aria-label*='Following']",
              "[aria-label*='Friends']",
              "[aria-label*='Live']"
            ];
            selectors.forEach(function(selector) {
              try {
                document.querySelectorAll(selector).forEach(function(el) {
                  el.style.display = 'none';
                  el.style.visibility = 'hidden';
                  el.style.opacity = '0';
                  el.style.pointerEvents = 'none';
                  el.setAttribute('aria-hidden', 'true');
                });
              } catch (_) {}
            });
          }

          function guardAnchors() {
            try {
              document.querySelectorAll('a[href]').forEach(function(a) {
                var href = a.getAttribute('href') || '';
                if (isBlocked(href)) {
                  if (!a.__cmGuarded) {
                    a.__cmGuarded = true;
                    a.addEventListener(
                      'click',
                      function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          window.location.href = REDIRECT;
                        } catch (_) {
                          try {
                            window.location.replace(REDIRECT);
                          } catch (_) {}
                        }
                      },
                      true
                    );
                  }
                  a.style.display = 'none';
                }
              });
            } catch (_) {}
          }

          function guardLocation() {
            try {
              if (isBlocked(window.location.pathname)) {
                if (window.location.href !== REDIRECT) {
                  window.location.replace(REDIRECT);
                }
              }
            } catch (_) {}
          }

          var observer = new MutationObserver(function() {
            hideNav();
            guardAnchors();
            guardLocation();
          });
          if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
          }

          hideNav();
          guardAnchors();
          guardLocation();
        } catch (err) {
          console.warn('TikTok guard failed', err);
        }
      })();
      true;
    `;
  }, [activeProvider]);

  const injectedJavaScript = useMemo(() => {
    if (policyBypassEnabled) {
      return [GOOGLE_FINGERPRINT_SHIM].join('\n');
    }

    if (activeProvider === 'tiktok') {
      return [tiktokEnhancements].filter(Boolean).join('\\n');
    }

    const scripts = [globalWebViewEnhancements, GOOGLE_FINGERPRINT_SHIM];
    const suppressBaseScript = activeProvider === 'youtube' && youtubeViewMode === 'desktop';
    const skipForXAuth = activeProvider === 'x' && isXAuthPage;

    if (baseInjectedJavaScript && !suppressBaseScript && !skipForXAuth) {
      scripts.push(baseInjectedJavaScript);
    }
    if (instagramEnhancements) {
      scripts.push(instagramEnhancements);
    }
    if (facebookEnhancements) {
      scripts.push(facebookEnhancements);
    }
    if (youtubeEnhancements) {
      scripts.push(youtubeEnhancements);
    }
    if (xEnhancements && !(activeProvider === 'x' && isXAuthPage)) {
      scripts.push(xEnhancements);
    }
    return scripts.filter(Boolean).join('\n');
  }, [
    activeProvider,
    baseInjectedJavaScript,
    facebookEnhancements,
    globalWebViewEnhancements,
    instagramEnhancements,
    tiktokEnhancements,
    xEnhancements,
    youtubeEnhancements,
    youtubeViewMode,
    isXAuthPage,
    policyBypassEnabled,
  ]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);
        if (!payload || typeof payload !== 'object') {
          return;
        }
        if (payload.type === '__cm_x_session') {
          console.log('[X][sessionMessage]', payload);
          const loggedIn = Boolean(payload.loggedIn);
          setXSessionDetected(loggedIn);
          setStoredXSessionFlag(loggedIn);
          return;
        }
        if (payload.type === '__cm_tiktok_storage') {
          console.log('[TikTok][storage]', payload);
          return;
        }
        if (payload.type === '__cm_tiktok_storage_error') {
          console.warn('[TikTok][storage][error]', payload.message);
          return;
        }
        if (payload.type === '__cm_open_window') {
          console.log('[WebView][openWindow]', payload);
          if (payload.url && typeof payload.url === 'string') {
            try {
              let targetUrl = payload.url;
              if (/^intent:/i.test(targetUrl)) {
                const fallback = resolveIntentUrl(targetUrl);
                if (fallback) {
                  targetUrl = fallback;
                }
              }
              if (/^https?:/i.test(targetUrl)) {
                setSourceUri(targetUrl);
                setProviderCurrentUrls(prev => ({
                  ...prev,
                  [activeProvider]: targetUrl,
                }));
              }
            } catch (err) {
              console.warn('[WebView][openWindow][failed]', err);
            }
          }
          return;
        }
        if (payload.type === '__cm_instagram_nav') {
          console.log('[Instagram nav debug]', payload.items);
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    },
    [activeProvider, setProviderCurrentUrls, setSourceUri]
  );

  const navigateToProviderStart = useCallback(() => {
    if (policyBypassEnabled) {
      return;
    }

    let startUrl = providerRules.startURL;
    if (activeProvider === 'tiktok') {
      startUrl = getTikTokStartUrl();
    } else if (activeProvider === 'youtube') {
      startUrl = youtubeViewMode === 'mobile' ? YOUTUBE_MOBILE_START_URL : YOUTUBE_DESKTOP_START_URL;
    } else if (activeProvider === 'x' && !xSessionDetected) {
      startUrl = X_LOGIN_URL;
    }
    if (!startUrl) {
      return;
    }
    setSourceUri((prev: string) => (prev === startUrl ? prev : startUrl));
    setProviderCurrentUrls((prev: Record<ProviderId, string | null>) => ({
      ...prev,
      [activeProvider]: startUrl,
    }));

    const serializedStart = JSON.stringify(startUrl);
    webViewRef.current?.injectJavaScript(`
      (function() {
        try {
          if (window.location.href !== ${serializedStart}) {
            window.location.href = ${serializedStart};
          }
        } catch (error) {
          try {
            window.location.replace(${serializedStart});
          } catch (_) {}
        }
      })();
    `);
  }, [activeProvider, policyBypassEnabled, providerRules.startURL, xSessionDetected, youtubeViewMode]);

  useEffect(() => {
    const nextRules = PolicyService.getProviderRules(providerId, PLATFORM);
    const normalizedRules =
      providerId === 'tiktok'
        ? {
            ...nextRules,
            startURL: getTikTokStartUrl(),
          }
        : providerId === 'facebook'
        ? {
            ...nextRules,
            startURL: FACEBOOK_NOTIFICATIONS_URL,
          }
        : providerId === 'youtube'
        ? {
            ...nextRules,
            startURL: YOUTUBE_DESKTOP_START_URL,
          }
        : nextRules;

    setActiveProvider(providerId);
    setProviderRules(normalizedRules);
    setSourceUri(normalizedRules.startURL);
    setProviderCurrentUrls({
      instagram: providerId === 'instagram' ? normalizedRules.startURL : null,
      tiktok: providerId === 'tiktok' ? normalizedRules.startURL : null,
      facebook: providerId === 'facebook' ? normalizedRules.startURL : null,
      youtube: providerId === 'youtube' ? normalizedRules.startURL : null,
      x: null,
    });
    setProviderViewModes(prev => ({
      ...prev,
      [providerId]:
        providerId === 'facebook'
          ? 'desktop'
          : providerId === 'youtube'
          ? 'mobile'
          : prev[providerId] ?? DEFAULT_VIEW_MODES[providerId],
    }));
    hasTikTokTokenRef.current = false;
    tiktokTokenDetectedAtRef.current = null;
  }, [providerId]);

  useEffect(() => {
    return () => {};
  }, []);

  const userAgent = useMemo(() => {
    let ua: string;

    if (activeProvider === 'youtube') {
      // Always use mobile UA for YouTube to avoid desktop/mobile hybrid layout
      ua = MOBILE_USER_AGENT;
    } else if (activeProvider === 'tiktok') {
      // Use desktop UA for TikTok to avoid mobile WebView blanking
      ua = DESKTOP_USER_AGENT;
    } else if (PROVIDERS_WITH_VIEW_TOGGLE.includes(activeProvider)) {
      ua = activeViewMode === 'desktop' ? DESKTOP_USER_AGENT : MOBILE_USER_AGENT;
    } else if (activeProvider === 'facebook') {
      ua = DESKTOP_USER_AGENT;
    } else if (activeProvider === 'x') {
      ua = DESKTOP_USER_AGENT;
    } else {
      ua = MOBILE_USER_AGENT;
    }

    if (activeProvider === 'youtube') {
      console.log('[YouTube][userAgent]', {
        provider: activeProvider,
        viewMode: youtubeViewMode,
        userAgent: ua,
      });
    }

    return ua;
  }, [activeProvider, activeViewMode, youtubeViewMode]);

  // For X, avoid aggressive auto-redirects which can cause login loops or account lockouts.
  useEffect(() => {
    return;
  }, [activeProvider, isXAuthPage, navigateToProviderStart, policyBypassEnabled, xSessionDetected]);

  const handleNavigationStateChange = (navState: { url: string; canGoBack?: boolean }) => {
    setCanWebViewGoBack(Boolean(navState.canGoBack));
    const path = safeGetPath(navState.url);
    let isXAuthNavigation = false;

    if (policyBypassEnabled) {
      setProviderCurrentUrls(prev => ({
        ...prev,
        [activeProvider]: navState.url,
      }));
      if (activeProvider === 'x') {
        setProviderCurrentUrls(prev => ({
          ...prev,
          x: navState.url,
        }));
      }
      return;
    }

    if (activeProvider === 'instagram') {
      const normalized = (path || '').toLowerCase();

      if ((normalized === '/' || normalized === '') && activeViewMode !== 'desktop') {
        navigateToProviderStart();
        return;
      }

      const desktopBypass = normalized === '/' || normalized === '' || normalized === '/direct/inbox' || normalized === '/direct/inbox/';

      if (activeViewMode === 'desktop' && !desktopBypass && shouldForceInstagramMobileForPath(path)) {
        setProviderViewModes(prev => ({
          ...prev,
          instagram: 'mobile',
        }));
        setProviderCurrentUrls(prev => ({
          ...prev,
          instagram: navState.url,
        }));
        setSourceUri(navState.url);
        return;
      }
    }

    if (activeProvider === 'x') {
      if (!xLoginAttemptRef.current.firstSeen) {
        xLoginAttemptRef.current.firstSeen = Date.now();
      }
      xLoginAttemptRef.current.lastUrl = navState.url;
      xLoginAttemptRef.current.attempts += 1;

      console.log('[X][navChange]', {
        url: navState.url,
        path,
        provider: activeProvider,
        policyBypassEnabled,
        xSessionDetected,
        attempts: xLoginAttemptRef.current.attempts,
        firstSeen: xLoginAttemptRef.current.firstSeen,
      });

      isXAuthNavigation = isXAuthRoute(navState.url, path);
      setProviderCurrentUrls(prev => ({
        ...prev,
        x: navState.url,
      }));

      // Allow X to handle its own navigation; we track state but avoid redirecting.
      if (isXAuthNavigation) {
        return;
      }
    }

    if (activeProvider === 'youtube') {
      const isWatchPath = path && path.toLowerCase() === '/watch';

      // Normalize desktop YouTube URLs to mobile host to avoid desktop layout / double sidebar
      try {
        const parsed = new URL(navState.url);
        const host = parsed.hostname.toLowerCase();
        const searchParams = parsed.searchParams;
        const isDesktopParam = searchParams.get('app') === 'desktop';

        if (host === 'www.youtube.com' && (isDesktopParam || youtubeViewMode === 'desktop')) {
          searchParams.delete('app');
          parsed.hostname = 'm.youtube.com';
          const mobileUrl = parsed.toString();

          if (mobileUrl !== navState.url) {
            console.log('[YouTube][navChange][normalizeToMobile]', {
              from: navState.url,
              to: mobileUrl,
              path,
              viewMode: youtubeViewMode,
            });

            setProviderViewModes(prev => ({
              ...prev,
              youtube: 'mobile',
            }));
            setProviderCurrentUrls(prev => ({
              ...prev,
              youtube: mobileUrl,
            }));
            setSourceUri(mobileUrl);

            const serializedMobile = JSON.stringify(mobileUrl);
            webViewRef.current?.injectJavaScript(`
              (function() {
                try {
                  if (window.location.href !== ${serializedMobile}) {
                    window.location.href = ${serializedMobile};
                  }
                } catch (error) {
                  try {
                    window.location.replace(${serializedMobile});
                  } catch (_) {}
                }
              })();
            `);

            return;
          }
        }
      } catch (_ytNormalizeError) {
        console.warn('[YouTube][navChange][normalizeToMobile][error]', _ytNormalizeError);
      }

      if (youtubeViewMode === 'desktop' && isWatchPath) {
        const mobileWatchUrl = convertYouTubeWatchToMobile(navState.url);
        if (mobileWatchUrl) {
          setProviderViewModes(prev => ({
            ...prev,
            youtube: 'mobile',
          }));
          setProviderCurrentUrls(prev => ({
            ...prev,
            youtube: mobileWatchUrl,
          }));
          setSourceUri(mobileWatchUrl);
          const serializedMobile = JSON.stringify(mobileWatchUrl);
          webViewRef.current?.injectJavaScript(`
            (function() {
              try {
                if (window.location.href !== ${serializedMobile}) {
                  window.location.href = ${serializedMobile};
                }
              } catch (error) {
                try {
                  window.location.replace(${serializedMobile});
                } catch (_) {}
              }
            })();
          `);
          return;
        }
      }

      if (isYouTubeBlockedPath(path)) {
        console.log('[YouTube][navChange][blocked]', {
          url: navState.url,
          path,
          viewMode: youtubeViewMode,
          provider: activeProvider,
        });

        const tracker = youTubeRedirectTrackerRef.current;
        const now = Date.now();
        if (tracker.count < 3 || now - tracker.lastRedirect > 4000) {
          tracker.count += 1;
          tracker.lastRedirect = now;
          navigateToProviderStart();
        }
        return;
      }

      console.log('[YouTube][navChange][allowed]', {
        url: navState.url,
        path,
        viewMode: youtubeViewMode,
        provider: activeProvider,
      });

      const tracker = youTubeRedirectTrackerRef.current;
      tracker.count = 0;
      tracker.lastRedirect = 0;
      if (youtubeViewMode === 'desktop' && !isYouTubeDesktopAllowedPath(path)) {
        navigateToProviderStart();
        return;
      }
    }

    if (activeProvider === 'tiktok') {
      if (isTikTokBlockedPath(path)) {
        console.log('[TikTok][navChange][blocked]', { url: navState.url, path });
        setSourceUri(TIKTOK_UPLOAD_URL);
        setProviderCurrentUrls(prev => ({
          ...prev,
          tiktok: TIKTOK_UPLOAD_URL,
        }));
        return;
      }

      setProviderCurrentUrls(prev => ({
        ...prev,
        tiktok: navState.url,
      }));
      setSourceUri(navState.url);
      return;
    }

    // Check if navigation is allowed
    if (
      activeProvider !== 'x' &&
      !isXAuthNavigation &&
      !isAuthWhitelisted(navState.url) &&
      !PolicyService.isNavigationAllowed(activeProvider, navState.url, PLATFORM)
    ) {
      if (activeProvider === 'instagram') {
        const target = safeGetPath(navState.url);
        if (target === '/' || target === '') {
          navigateToProviderStart();
          return;
        }
      }

      webViewRef.current?.injectJavaScript(`
        window.location.href = '${providerRules.startURL}';
      `);

      // Silently redirect without showing alert
    }

    if (activeProvider === 'youtube') {
      setProviderCurrentUrls(prev => ({
        ...prev,
        youtube: navState.url,
      }));
    } else if (PROVIDERS_WITH_VIEW_TOGGLE.includes(activeProvider)) {
      setProviderCurrentUrls(prev => ({
        ...prev,
        [activeProvider]: navState.url,
      }));
    }
  };

  const handleShouldStartLoadWithRequest = (request: { url: string }) => {
    const url = request.url;
    if (!url) {
      return false;
    }

    if (policyBypassEnabled) {
      return true;
    }

    if (activeProvider === 'youtube') {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        // Block common ad / tracking hosts used by YouTube
        if (
          host.includes('googlesyndication.com') ||
          host.includes('doubleclick.net') ||
          host.includes('googleadservices.com')
        ) {
          console.log('[YouTube][shouldStart][adBlocked]', { url, host });
          return false;
        }
      } catch (_) {
        // If URL parsing fails, fall through to normal handling
      }
    }

    if (url.startsWith('intent://')) {
      const fallback = resolveIntentUrl(url);
      if (fallback) {
        console.log('[WebView][intent]', { original: url, fallback });
        webViewRef.current?.injectJavaScript(`
          (function() {
            try {
              window.location.href = ${JSON.stringify(fallback)};
            } catch (error) {
              try {
                window.location.replace(${JSON.stringify(fallback)});
              } catch (replaceError) {
                console.warn('Failed to follow intent fallback', replaceError);
              }
            }
          })();
        `);
      }
      return false;
    }

    const path = safeGetPath(url);
    const isXAuthRequest = activeProvider === 'x' && isXAuthRoute(url, path);

    if (activeProvider === 'instagram') {
      const normalized = (path || '').toLowerCase();

      if ((normalized === '/' || normalized === '') && activeViewMode !== 'desktop') {
        navigateToProviderStart();
        return false;
      }
    }

    if (activeProvider === 'x') {
      // Let X handle its own navigation when guards are on; avoid blocking or redirecting
      console.log('[X][shouldStart]', {
        url,
        path,
        isXAuthRequest,
        provider: activeProvider,
        policyBypassEnabled,
        timestamp: Date.now(),
      });
      return true;
    }

    if (isXAuthRequest) {
      console.log('[X][auth][allow-route]', {
        url,
        path,
        provider: activeProvider,
        policyBypassEnabled,
        timestamp: Date.now(),
      });
      return true;
    }

    if (activeProvider === 'tiktok') {
      if (path === 'blank' || url.startsWith('about:')) {
        console.log('[TikTok][shouldStart][aboutBlank->upload]', { url, path, redirect: TIKTOK_UPLOAD_URL });
        setSourceUri(TIKTOK_UPLOAD_URL);
        setProviderCurrentUrls(prev => ({
          ...prev,
          tiktok: TIKTOK_UPLOAD_URL,
        }));
        return false;
      }

      if (isTikTokBlockedPath(path)) {
        console.log('[TikTok][shouldStart][blocked-path]', { url, path, redirect: TIKTOK_UPLOAD_URL });
        setSourceUri(TIKTOK_UPLOAD_URL);
        setProviderCurrentUrls(prev => ({
          ...prev,
          tiktok: TIKTOK_UPLOAD_URL,
        }));
        return false;
      }

      console.log('[TikTok][shouldStart][allowed]', { url, path });
      return true;
    }

    if (activeProvider === 'youtube') {
      if (isYouTubeBlockedPath(path)) {
        console.log('[YouTube][shouldStart][blocked]', {
          url,
          path,
        });
        return true;
      }

      console.log('[YouTube][shouldStart]', {
        url,
        path,
      });
    }

    if (isAuthWhitelisted(url)) {
      return true;
    }

    const isAllowed = PolicyService.isNavigationAllowed(activeProvider, url, PLATFORM);

    if (!isAllowed) {
      if (activeProvider === 'instagram') {
        if (path === '/' || path === '') {
          navigateToProviderStart();
          return false;
        }
      }

      // Silently block without showing alert
    }

    return isAllowed;
  };

  const showViewToggle = false;
  const viewToggleLabel = 'View';

  const isInstagram = activeProvider === 'instagram';
  const instagramIsDesktop = isInstagram && activeViewMode === 'desktop';
  const handleToggleViewMode = useCallback(() => {
    if (!PROVIDERS_WITH_VIEW_TOGGLE.includes(activeProvider)) {
      return;
    }

    const nextMode = activeViewMode === 'desktop' ? 'mobile' : 'desktop';
    const currentUrl = providerCurrentUrls[activeProvider] &&
      PolicyService.isNavigationAllowed(activeProvider, providerCurrentUrls[activeProvider] as string, PLATFORM)
        ? (providerCurrentUrls[activeProvider] as string)
        : providerRules.startURL;

    setProviderViewModes(prev => ({
      ...prev,
      [activeProvider]: nextMode,
    }));
    setProviderCurrentUrls(prev => ({
      ...prev,
      [activeProvider]: currentUrl,
    }));
    setSourceUri(currentUrl);
  }, [activeProvider, activeViewMode, navigateToProviderStart, providerCurrentUrls, providerRules.startURL]);

  const handleInstagramPostButtonPress = useCallback(() => {
    if (!isInstagram) {
      return;
    }

    if (!instagramIsDesktop) {
      const desktopUrl = 'https://www.instagram.com/direct/inbox/';
      setProviderViewModes(prev => ({
        ...prev,
        instagram: 'desktop',
      }));
      setProviderCurrentUrls(prev => ({
        ...prev,
        instagram: desktopUrl,
      }));
      const desktopWithFlag = desktopUrl.includes('#') ? `${desktopUrl}&cm_allow_root=1` : `${desktopUrl}#cm_allow_root=1`;
      setSourceUri(desktopWithFlag);
      return;
    }

    const mobileUrl = providerRules.startURL;
    setProviderViewModes(prev => ({
      ...prev,
      instagram: 'mobile',
    }));
    setProviderCurrentUrls(prev => ({
      ...prev,
      instagram: mobileUrl,
    }));
    const mobileWithFlag = mobileUrl.includes('#') ? `${mobileUrl}&cm_allow_root=0` : `${mobileUrl}#cm_allow_root=0`;
    setSourceUri(mobileWithFlag);
  }, [isInstagram, instagramIsDesktop, providerRules.startURL]);

  const instagramPostButtonLabel = instagramIsDesktop ? 'Mobile View' : 'Post';

  useEffect(() => {
    setGuardDisclosureVisible(true);
  }, [activeProvider]);

  const topInset = insets.top > 0 ? insets.top : Platform.OS === 'ios' ? 20 : 12;
  const navBarHeight = 18;
  const webViewPaddingTop = topInset + navBarHeight;
  const disclosureTop = topInset + navBarHeight + 8;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={[styles.navBar, { top: topInset }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleHomePress}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {showViewToggle && (
          <TouchableOpacity
            style={styles.viewToggleButton}
            onPress={handleToggleViewMode}
            accessibilityRole="button"
            accessibilityLabel={activeViewMode === 'desktop' ? 'Switch to mobile layout' : 'Switch to desktop layout'}
            activeOpacity={0.7}
          >
            <Text style={styles.viewToggleText}>{viewToggleLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {guardDisclosureVisible && (
        <View pointerEvents="box-none" style={[styles.disclosureContainer, { top: disclosureTop }]}> 
          <View style={styles.disclosureCard}>
            <Text style={styles.disclosureTitle}>Focus mode is on</Text>
            <Text style={styles.disclosureText}>We hide feeds and promos so only your tools, messages, and profile stay open.</Text>
            <View style={styles.disclosureActions}>
              <TouchableOpacity
                style={[styles.disclosureButton, styles.disclosurePrimary]}
                onPress={() => setGuardDisclosureVisible(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.disclosurePrimaryText}>Got it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.disclosureButton, styles.disclosureSecondary]}
                onPress={() => {
                  setGuardDisclosureVisible(false);
                  navigation.navigate('Disclosures');
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.disclosureSecondaryText}>Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {isInstagram && (
        <View
          pointerEvents="box-none"
          style={[styles.bottomButtonRow, { bottom: Math.max(insets.bottom, 16) }]}
        >
          <TouchableOpacity
            style={styles.overlayButton}
            onPress={handleInstagramPostButtonPress}
            accessibilityRole="button"
            accessibilityLabel={instagramIsDesktop ? 'Switch Instagram to mobile layout' : 'Switch Instagram to desktop layout'}
            activeOpacity={0.9}
          >
            <Text style={styles.overlayButtonText}>{instagramPostButtonLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        horizontal
        style={[styles.horizontalScroll, { paddingTop: webViewPaddingTop }]}
        contentContainerStyle={[styles.horizontalScrollContent, { width: horizontalCanvasWidth }]}
        showsHorizontalScrollIndicator={enableHorizontalScroll}
        bounces={false}
        scrollEnabled={enableHorizontalScroll}
      >
        <WebView
          ref={webViewRef}
          key={`${activeProvider}-${providerViewModes[activeProvider] ?? 'default'}`}
          source={{ uri: sourceUri }}
          style={[styles.webview, enableHorizontalScroll ? { width: horizontalCanvasWidth } : null]}
          injectedJavaScriptBeforeContentLoaded={activeProvider === 'tiktok' ? undefined : globalWebViewEnhancements}
          injectedJavaScript={activeProvider === 'tiktok' ? undefined : injectedJavaScript}
          originWhitelist={['*']}
          mixedContentMode="always"
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onMessage={handleWebViewMessage}
          userAgent={userAgent}
          javaScriptCanOpenWindowsAutomatically
          allowsFullscreenVideo
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          setSupportMultipleWindows={true}
        />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  disclosureContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 18,
  },
  disclosureCard: {
    backgroundColor: 'rgba(6, 6, 12, 0.92)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  disclosureTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  disclosureText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  disclosureActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  disclosureButton: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 78,
    alignItems: 'center',
  },
  disclosurePrimary: {
    backgroundColor: 'rgba(92, 72, 255, 0.9)',
  },
  disclosureSecondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'transparent',
  },
  disclosurePrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  disclosureSecondaryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  navBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    zIndex: 20,
  },
  backButton: {
    paddingVertical: 2,
    paddingRight: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '400',
  },
  viewToggleButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  viewToggleText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.2,
  },
  bottomButtonRow: {
    position: 'absolute',
    left: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 12,
  },
  youtubeButtonRow: {
    left: undefined,
    right: 12,
  },
  overlayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  overlayButtonSecondary: {
    marginLeft: 10,
  },
  overlayButtonText: {
    color: '#fff',
    fontSize: 11,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  horizontalScroll: {
    flex: 1,
  },
  horizontalScrollContent: {
    flexGrow: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
