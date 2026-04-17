'use client';

import { useState } from 'react';
import { X, FilePlus, FolderPlus } from 'lucide-react';
import { PlanePage } from '@/lib/plane-api';
import { WikiApi } from '@/lib/wiki-api';

interface Props {
  allPages: PlanePage[];
  defaultParentId?: string | null;
  createFn: WikiApi['create'];
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function CreatePageModal({ allPages, defaultParentId, createFn, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>(defaultParentId ?? '');
  const [isFolder, setIsFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createFn({
        name: name.trim(),
        parent_id: parentId || null,
        description_html: isFolder ? '' : '<p></p>',
      });
      onCreated(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aanmaken mislukt');
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = allPages.filter(p => p.id !== parentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {isFolder ? <FolderPlus className="w-5 h-5 text-indigo-600" /> : <FilePlus className="w-5 h-5 text-indigo-600" />}
            <h2 className="text-lg font-semibold text-gray-900">{isFolder ? 'Nieuwe map' : 'Nieuwe pagina'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setIsFolder(false)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all ${
                !isFolder ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FilePlus className="w-4 h-4" /> Pagina
            </button>
            <button
              onClick={() => setIsFolder(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all ${
                isFolder ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FolderPlus className="w-4 h-4" /> Map
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{isFolder ? 'Mapnaam' : 'Paginanaam'}</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={isFolder ? 'bijv. HR & People' : 'bijv. Onboarding Guide'}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Bovenliggende map <span className="text-gray-400 font-normal">(optioneel)</span>
            </label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
            >
              <option value="">— Root (geen bovenliggende map) —</option>
              {parentOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Annuleren
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || saving}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Aanmaken...' : isFolder ? 'Map aanmaken' : 'Pagina aanmaken'}
          </button>
        </div>
      </div>
    </div>
  );
}
