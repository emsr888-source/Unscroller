import { app, BrowserWindow, BrowserView, session, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { PolicyManager } from './policy-manager';
import { WebRequestFilter } from './web-request-filter';
import { AuthManager } from './auth-manager';

let mainWindow: BrowserWindow | null = null;
const policyManager = new PolicyManager();
const authManager = new AuthManager();
const TITLEBAR_HEIGHT = 48;
let contentView: BrowserView | null = null;
let activeProviderId: string | null = null;
let insertedCssKey: string | null = null;

const fallbackTargets: Record<string, string> = {
  instagram: 'https://www.instagram.com/direct/inbox/',
  x: 'https://x.com/messages',
  youtube: 'https://m.youtube.com/feed/subscriptions',
  tiktok: 'https://www.tiktok.com/upload',
  facebook: 'https://m.facebook.com/messages/',
};

function updateBrowserViewBounds() {
  if (!mainWindow || !contentView) {
    return;
  }
  const [width, height] = mainWindow.getContentSize();
  contentView.setBounds({
    x: 0,
    y: TITLEBAR_HEIGHT,
    width,
    height: Math.max(0, height - TITLEBAR_HEIGHT),
  });
  contentView.setAutoResize({ width: true, height: true });
}

function ensureBrowserView(): BrowserView | null {
  if (!mainWindow) {
    return null;
  }
  if (!contentView) {
    contentView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: 'persist:main',
      },
    });
    mainWindow.setBrowserView(contentView);
    updateBrowserViewBounds();
  }
  return contentView;
}

async function preparePolicyForProvider(providerId: string) {
  let policy: ReturnType<typeof policyManager.getCachedPolicy>;
  try {
    policy = policyManager.getCachedPolicy();
  } catch (error) {
    console.warn('[Main] Policy cache miss, fetching fresh policy...');
    policy = await policyManager.fetchPolicy();
  }
  if (!policy || !policy.providers || !policy.providers[providerId]) {
    return { policyForProvider: null, domScript: null };
  }

  const providerPolicy = policy.providers[providerId];
  const domScriptPath = path.join(__dirname, '../renderer/domScript.js');
  let domScript = '';

  try {
    domScript = fs.readFileSync(domScriptPath, 'utf-8');
  } catch (error) {
    console.error('[Main] Failed to read domScript.js:', error);
  }

  const policyForProvider = {
    allow: providerPolicy.allow || [],
    hideSelectors: providerPolicy.dom?.hide || [],
    disableAnchorsTo: providerPolicy.dom?.disableAnchorsTo || [],
    start: getProviderStartUrl(providerId),
  };

  return { policyForProvider, domScript };
}

async function loadProviderInBrowserView(providerId: string, targetUrl?: string) {
  const view = ensureBrowserView();
  if (!view) {
    return { success: false };
  }

  activeProviderId = providerId;
  const { policyForProvider, domScript } = await preparePolicyForProvider(providerId);
  const startUrl = targetUrl || policyForProvider?.start || getProviderStartUrl(providerId);

  if (insertedCssKey) {
    try {
      await view.webContents.removeInsertedCSS(insertedCssKey);
    } catch {
      // ignore
    }
    insertedCssKey = null;
  }

  if (providerId !== 'facebook') {
    attachNavigationGuards(view, providerId, startUrl);
  }
  const applyHideCss = async () => {
    if (!view) return;
    if (providerId === 'facebook') return;
    try {
      if (policyForProvider?.hideSelectors?.length) {
        const css = policyForProvider.hideSelectors
          .map(selector => `${selector} { display: none !important; visibility: hidden !important; }`)
          .join('\n');
        insertedCssKey = await view.webContents.insertCSS(css);
      }
    } catch (error) {
      console.error('[Main] Failed to apply CSS for provider', providerId, error);
    }
  };

  const injectPolicy = async () => {
    if (!policyForProvider) {
      return;
    }
    try {
      await applyHideCss();
      if (providerId === 'facebook') {
        return;
      }
      await view.webContents.executeJavaScript(
        `window.__CM_POLICY = ${JSON.stringify(policyForProvider)};`
      );
      if (domScript) {
        await view.webContents.executeJavaScript(domScript);
      }
    } catch (error) {
      console.error('[Main] Failed to inject policy into BrowserView:', error);
    }
  };

  let injectionTimeout: NodeJS.Timeout | null = null;
  const schedulePolicyInjection = () => {
    const delay = providerId === 'instagram' || providerId === 'x' ? 1500 : 500;
    if (injectionTimeout) {
      clearTimeout(injectionTimeout);
    }
    injectionTimeout = setTimeout(() => {
      injectionTimeout = null;
      injectPolicy();
    }, delay);
  };

  view.webContents.removeAllListeners('dom-ready');
  view.webContents.removeAllListeners('did-finish-load');
  view.webContents.removeAllListeners('did-navigate-in-page');

  if (providerId !== 'facebook') {
    view.webContents.on('dom-ready', () => schedulePolicyInjection());
    view.webContents.on('did-finish-load', () => schedulePolicyInjection());
    view.webContents.on('did-navigate-in-page', (_event, url, isMainFrame) => {
      if (!isMainFrame) return;
      const explicitlyBlocked = policyManager.isNavigationBlocked(providerId, url);
      if (explicitlyBlocked) {
        console.log(`[BrowserView] Blocked in-page navigation for ${providerId}: ${url}`);
        view.webContents.stop();
        const fallback = fallbackTargets[providerId] || startUrl;
        view.webContents
          .loadURL(fallback)
          .then(() => schedulePolicyInjection())
          .catch(err => console.error('[BrowserView] Failed to reload fallback URL:', err));
        return;
      }
      schedulePolicyInjection();
    });
  }

  await view.webContents.loadURL(startUrl);
  if (providerId !== 'facebook') {
    schedulePolicyInjection();
  }
  return { success: true };
}

function attachNavigationGuards(view: BrowserView, providerId: string, fallbackUrl: string) {
  const blockNavigation = (url: string) => {
    if (policyManager.isNavigationAllowed(providerId, url)) {
      return true;
    }

    if (!policyManager.isNavigationBlocked(providerId, url)) {
      return true;
    }

    console.log(`[BrowserView] Blocked navigation for ${providerId}: ${url}`);
    view.webContents.stop();
    if (fallbackUrl) {
      view.webContents.loadURL(fallbackUrl).catch(err => {
        console.error('[BrowserView] Failed to reload fallback URL:', err);
      });
    }
    return false;
  };

  view.webContents.removeAllListeners('will-navigate');
  view.webContents.removeAllListeners('did-start-navigation');

  view.webContents.on('will-navigate', (event, url) => {
    if (!blockNavigation(url)) {
      event.preventDefault();
    }
  });

  view.webContents.on('did-start-navigation', (_event, url, isInPlace, isMainFrame) => {
    if (isMainFrame && !blockNavigation(url)) {
      // already handled by blockNavigation
    }
  });

  view.webContents.setWindowOpenHandler(({ url }) => {
    if (policyManager.isNavigationAllowed(providerId, url)) {
      return { action: 'allow' };
    }
    if (!policyManager.isNavigationBlocked(providerId, url)) {
      return { action: 'allow' };
    }
    return { action: 'deny' };
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    show: false, // Don't show until ready
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  ensureBrowserView();

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      updateBrowserViewBounds();
    }
  });

  // Open dev tools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('resize', () => {
    updateBrowserViewBounds();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    contentView = null;
  });
}

async function setupPolicyEnforcement() {
  try {
    // Fetch and cache policy (non-blocking)
    await policyManager.fetchPolicy();
    console.log('[Main] Policy loaded successfully');
  } catch (error) {
    console.warn('[Main] Could not fetch policy, will use cached or default:', error instanceof Error ? error.message : String(error));
  }

  // Set up web request filtering
  const filter = new WebRequestFilter(policyManager);
  filter.install(session.defaultSession);
}

// IPC Handlers
ipcMain.handle('policy:getForProvider', async (event, providerId: string) => {
  try {
    return await preparePolicyForProvider(providerId);
  } catch (error) {
    console.error('[Main] Error in policy:getForProvider:', error);
    return { policyForProvider: null, domScript: null };
  }
});

ipcMain.handle('browserview:openProvider', async (_event, providerId: string) => {
  try {
    return await loadProviderInBrowserView(providerId);
  } catch (error) {
    console.error('[Main] Failed to open provider in BrowserView:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('browserview:navigate', async (_event, action: 'back' | 'forward' | 'reload') => {
  if (!contentView) {
    return { success: false };
  }

  try {
    switch (action) {
      case 'back':
        if (contentView.webContents.canGoBack()) {
          contentView.webContents.goBack();
        }
        break;
      case 'forward':
        if (contentView.webContents.canGoForward()) {
          contentView.webContents.goForward();
        }
        break;
      case 'reload':
        contentView.webContents.reload();
        break;
    }
    return { success: true };
  } catch (error) {
    console.error('[Main] BrowserView navigation failed:', error);
    return { success: false };
  }
});

function getProviderStartUrl(providerId: string): string {
  const urls: Record<string, string> = {
    instagram: 'https://www.instagram.com/direct/inbox/',
    x: 'https://x.com/messages',
    youtube: 'https://m.youtube.com/feed/subscriptions',
    tiktok: 'https://www.tiktok.com/upload',
    facebook: 'https://m.facebook.com/messages/',
  };
  return urls[providerId] || '/';
}

// Add GPU and hardware acceleration flags to prevent crashes
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-gpu-process-crash-limit');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-features', 'TranslateUI');
app.commandLine.appendSwitch('--disable-ipc-flooding-protection');

app.whenReady().then(async () => {
  // Create window first (don't wait for policy)
  await createWindow();
  
  // Load policy in background
  setupPolicyEnforcement().catch(err => {
    console.error('[Main] Policy enforcement setup failed:', err);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle auth and subscription via IPC in auth-manager
