// Desktop renderer app (BrowserView-based)
declare const creatorMode: any;

type Provider = { id: string; name: string; icon: string };

const providers: Provider[] = [
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'x', name: 'X', icon: '𝕏' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'facebook', name: 'Facebook', icon: '👤' },
];

let activeProvider: string | null = null;
const providerButtons: Record<string, HTMLButtonElement> = {};

function renderTopBar(): void {
  const topBar = document.getElementById('top-bar');
  if (!topBar) return;

  const providerMarkup = providers
    .map(
      provider => `
        <button class="provider-tab" data-provider="${provider.id}" title="${provider.name}">
          ${provider.icon}
        </button>
      `.trim()
    )
    .join('');

  topBar.innerHTML = `
    <div class="navigation-controls">
      <button data-nav="back" title="Back">←</button>
      <button data-nav="forward" title="Forward">→</button>
      <button data-nav="reload" title="Reload">↻</button>
    </div>
    <div class="provider-tabs">
      ${providerMarkup}
    </div>
  `;

  topBar.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.nav as 'back' | 'forward' | 'reload';
      creatorMode.browserView.navigate(action);
    });
  });

  providers.forEach(provider => {
    const button = topBar.querySelector<HTMLButtonElement>(`[data-provider="${provider.id}"]`);
    if (button) {
      providerButtons[provider.id] = button;
      button.addEventListener('click', () => openProvider(provider.id));
    }
  });
}

function highlightActiveProvider(): void {
  Object.entries(providerButtons).forEach(([id, button]) => {
    if (id === activeProvider) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

async function openProvider(providerId: string): Promise<void> {
  activeProvider = providerId;
  highlightActiveProvider();
  try {
    await creatorMode.browserView.openProvider(providerId);
    const welcome = document.querySelector('.welcome');
    if (welcome) {
      welcome.remove();
    }
  } catch (error) {
    console.error('[Renderer] Failed to open provider', providerId, error);
  }
}

function init(): void {
  renderTopBar();
  highlightActiveProvider();
  if (!activeProvider && providers.length > 0) {
    openProvider(providers[0].id);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
