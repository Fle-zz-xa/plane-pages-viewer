'use client';

import { useState } from 'react';
import { X, Package } from 'lucide-react';
import { createProject, createProjectPage, generateIdentifier } from '@/lib/projects-api';
import { encodePhase, ProjectPhase, PHASES } from '@/lib/phase';
import { getSettings } from '@/lib/settings';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateProjectModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phase, setPhase] = useState<ProjectPhase>('vault');
  const [description, setDescription] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templatePages = phase === 'vault'
    ? ['Brief']
    : ['Brief', 'Design', 'Materialen', 'Technisch', 'Productie', 'Marketing & Sales'];

  const handleNameChange = (value: string) => {
    setName(value);
    if (!identifier || identifier === generateIdentifier(name)) {
      setIdentifier(generateIdentifier(value));
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !identifier.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      const project = await createProject(planeBaseUrl, workspaceSlug, apiKey, {
        name: name.trim(),
        identifier: identifier.trim().toUpperCase().slice(0, 12),
        description: encodePhase(phase, description),
        network: 0,
      });

      if (useTemplate) {
        await Promise.all(
          templatePages.map((pageName, idx) =>
            createProjectPage(planeBaseUrl, workspaceSlug, apiKey, project.id, {
              name: pageName,
              parent_id: null,
              is_global: false,
              description_html: '<p></p>',
              sort_order: (idx + 1) * 10000,
            })
          )
        );
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aanmaken mislukt');
    } finally {
      setSaving(false);
    }
  };

  const startPhases: { value: ProjectPhase; label: string }[] = [
    { value: 'vault', label: '💡 Vault — nog een idee' },
    { value: 'design_s1', label: '📐 Direct starten met Sample 1' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Nieuw project</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Projectnaam</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="bijv. Dames Jas 2026 v2"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Identifier */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Identifier <span className="text-gray-400 font-normal">(unieke code, max 12 tekens)</span>
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
              placeholder="bijv. DJ26V2"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Starting phase */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Startfase</label>
            <div className="space-y-2">
              {startPhases.map(opt => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="phase"
                    value={opt.value}
                    checked={phase === opt.value}
                    onChange={() => setPhase(opt.value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Template */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={e => setUseTemplate(e.target.checked)}
                className="accent-indigo-600 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Standaard pagina's aanmaken</span>
            </label>
            {useTemplate && (
              <div className="ml-7 flex flex-wrap gap-1.5">
                {templatePages.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-md font-medium">{p}</span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Korte beschrijving <span className="text-gray-400 font-normal">(optioneel)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Waar gaat dit project over?"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Annuleren
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !identifier.trim() || saving}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Aanmaken...' : 'Project aanmaken'}
          </button>
        </div>
      </div>
    </div>
  );
}
