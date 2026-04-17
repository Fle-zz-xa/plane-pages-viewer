'use client';

import { useState } from 'react';
import { ArrowRight, X, CheckCircle2, Circle, Megaphone, AlertCircle } from 'lucide-react';
import { PlaneProject } from '@/lib/projects-api';

const CHECKLIST_ITEMS = [
  { id: 'productie', label: 'Productieopdracht goedgekeurd & bevestigd' },
  { id: 'fotos', label: 'Productfoto\'s en media gereed' },
  { id: 'maten', label: 'Maatspecificaties en pasvorm definitief' },
  { id: 'ce', label: 'CE-certificering en veiligheidslabels in orde' },
  { id: 'prijs', label: 'Verkoopprijs en marges vastgesteld' },
];

interface Props {
  project: PlaneProject;
  onConfirm: (briefing: string, checkedItems: string[]) => Promise<void>;
  onCancel: () => void;
}

export function HandoffModal({ project, onConfirm, onCancel }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.id, false]))
  );
  const [briefing, setBriefing] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = CHECKLIST_ITEMS.every(i => checked[i.id]);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const checkedItems = CHECKLIST_ITEMS.filter(i => checked[i.id]).map(i => i.label);
      await onConfirm(briefing, checkedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Handover mislukt');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-pink-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">⚙️</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-pink-600" />
                </div>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Handover naar Marketing & Sales</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{project.name}</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">Bevestig dat alles gereed is</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                allChecked ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {checkedCount}/{CHECKLIST_ITEMS.length}
              </span>
            </div>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    checked[item.id]
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {checked[item.id]
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                  }
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Briefing */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Handover briefing voor Marketing & Sales
              <span className="text-gray-400 font-normal ml-1">(optioneel)</span>
            </label>
            <textarea
              value={briefing}
              onChange={e => setBriefing(e.target.value)}
              rows={4}
              placeholder="Beschrijf de kernpunten voor Marketing: positionering, doelgroep, USP's, campagne-ideeën, releasewindow..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Dit wordt opgeslagen als "Handover briefing" in de projectpagina's.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Annuleren
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allChecked || saving}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span>Handover verwerken...</span>
            ) : (
              <>
                <Megaphone className="w-4 h-4" />
                Handover bevestigen
                {!allChecked && (
                  <span className="text-green-200 text-xs">— vink alles af</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
