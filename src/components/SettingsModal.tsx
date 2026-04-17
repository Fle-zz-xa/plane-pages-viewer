'use client';

import { useState } from 'react';
import { Settings, X, Key, Globe, Building2, Eye, EyeOff, CheckCircle2, Zap } from 'lucide-react';
import { getSettings, saveSettings, WikiSettings } from '@/lib/settings';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export function SettingsModal({ onClose, onSaved }: Props) {
  const current = getSettings();
  const [form, setForm] = useState<WikiSettings>(current);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    saveSettings(form);
    setSaving(false);
    onSaved();
  };

  const isValid = form.apiKey.trim() && form.workspaceSlug.trim() && form.planeBaseUrl.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Instellingen</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Plane URL */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Globe className="w-4 h-4 text-gray-400" />
              Plane URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.planeBaseUrl}
                onChange={e => setForm(f => ({ ...f, planeBaseUrl: e.target.value }))}
                placeholder="https://plane.rivetta.eu"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono"
              />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, planeBaseUrl: '/plane-api' }))}
                title="Gebruik ingebouwde proxy (aanbevolen voor live)"
                className={`px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
                  form.planeBaseUrl === '/plane-api'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {form.planeBaseUrl === '/plane-api'
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <Zap className="w-4 h-4" />
                }
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {form.planeBaseUrl === '/plane-api'
                ? '⚡ Proxy actief — werkt op de live Cloudflare deploy zonder CORS-configuratie'
                : 'Gebruik ⚡ voor de live deploy, of vul de directe URL in voor lokale ontwikkeling'
              }
            </p>
          </div>

          {/* Workspace slug */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Building2 className="w-4 h-4 text-gray-400" />
              Workspace slug
            </label>
            <input
              type="text"
              value={form.workspaceSlug}
              onChange={e => setForm(f => ({ ...f, workspaceSlug: e.target.value }))}
              placeholder="rivetta"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400">
              Vind je slug in Plane via Instellingen → Workspace
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Key className="w-4 h-4 text-gray-400" />
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder="plane_api_..."
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Plane → Profiel → API tokens → Nieuw token
            </p>
          </div>

          {/* Info box */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
            <p className="text-xs text-indigo-700">
              <strong>Live deploy:</strong> gebruik <code className="bg-indigo-100 px-1 rounded font-mono">/plane-api</code> als URL — de ingebouwde Cloudflare proxy regelt de verbinding met plane.rivetta.eu.
              <br /><strong>Lokaal:</strong> vul de directe URL in en zorg voor CORS of gebruik <code className="bg-indigo-100 px-1 rounded font-mono">wrangler pages dev</code>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
