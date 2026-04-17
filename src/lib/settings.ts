export interface WikiSettings {
  apiKey: string;
  workspaceSlug: string;
  planeBaseUrl: string;
}

function defaultBaseUrl(): string {
  if (typeof window === 'undefined') return 'https://plane.rivetta.eu';
  // On localhost use direct URL; on any deployed domain use the built-in proxy
  return window.location.hostname === 'localhost' ? 'https://plane.rivetta.eu' : '/plane-api';
}

const DEFAULTS: WikiSettings = {
  apiKey: '',
  workspaceSlug: 'rivetta',
  planeBaseUrl: defaultBaseUrl(),
};

const STORAGE_KEY = 'rivetta-wiki-settings';

export function getSettings(): WikiSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(stored) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings: WikiSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isConfigured(settings: WikiSettings): boolean {
  return !!settings.apiKey && !!settings.workspaceSlug && !!settings.planeBaseUrl;
}
