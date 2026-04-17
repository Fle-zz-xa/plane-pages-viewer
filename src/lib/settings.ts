export interface WikiSettings {
  apiKey: string;
  workspaceSlug: string;
  planeBaseUrl: string;
}

const DEFAULTS: WikiSettings = {
  apiKey: '',
  workspaceSlug: 'rivetta',
  planeBaseUrl: 'https://plane.rivetta.eu',
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
