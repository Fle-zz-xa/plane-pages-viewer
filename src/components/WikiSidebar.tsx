'use client';

import { useState, useMemo } from 'react';
import { Search, Settings, Plus, BookOpen, Loader2, AlertCircle, X } from 'lucide-react';
import { PageNode, PlanePage } from '@/lib/plane-api';
import { PageTree } from '@/components/PageTree';
import { CreatePageModal } from '@/components/CreatePageModal';

interface Props {
  pages: PageNode[];
  allPages: PlanePage[];
  selectedPageId: string | null;
  loading: boolean;
  error: string | null;
  onSelectPage: (page: PageNode) => void;
  onCreatePage: () => void;
  onShowSettings: () => void;
}

export function WikiSidebar({
  pages,
  allPages,
  selectedPageId,
  loading,
  error,
  onSelectPage,
  onCreatePage,
  onShowSettings,
}: Props) {
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return pages;
    const q = query.toLowerCase();
    const match = (nodes: PageNode[]): PageNode[] =>
      nodes.flatMap(n => {
        const childMatches = match(n.children);
        if (n.name.toLowerCase().includes(q) || childMatches.length > 0) {
          return [{ ...n, children: childMatches }];
        }
        return [];
      });
    return match(pages);
  }, [pages, query]);

  const totalCount = allPages.length;

  return (
    <>
      <aside className="w-72 flex flex-col bg-white border-r border-gray-200 shrink-0">
        {/* Brand header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">Rivetta Wiki</h1>
                <p className="text-[11px] text-gray-400 leading-tight">
                  {loading ? 'Laden...' : `${totalCount} pagina${totalCount !== 1 ? "'s" : ''}`}
                </p>
              </div>
            </div>
            <button
              onClick={onShowSettings}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Instellingen"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Zoek pagina's..."
              className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="px-3 pb-2">
          <div className="h-px bg-gray-100" />
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Laden...</span>
            </div>
          )}

          {error && (
            <div className="mx-3 my-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Fout</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                  <button
                    onClick={onShowSettings}
                    className="mt-2 text-xs text-red-700 underline hover:text-red-900"
                  >
                    Instellingen controleren
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">
                {query ? 'Geen resultaten gevonden' : 'Nog geen paginas'}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <PageTree
              pages={filtered}
              selectedPageId={selectedPageId}
              onSelectPage={onSelectPage}
              allPages={allPages}
              onRefresh={onCreatePage}
            />
          )}
        </div>

        {/* New page button */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe pagina
          </button>
        </div>
      </aside>

      {showCreate && (
        <CreatePageModal
          allPages={allPages}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            onCreatePage();
          }}
        />
      )}
    </>
  );
}
