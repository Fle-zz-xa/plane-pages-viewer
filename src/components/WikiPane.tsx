'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Loader2, AlertCircle, X } from 'lucide-react';
import { PlanePage, PageNode, buildTree } from '@/lib/plane-api';
import { WikiApi } from '@/lib/wiki-api';
import { PageTree } from '@/components/PageTree';
import { PageViewer } from '@/components/PageViewer';
import { CreatePageModal } from '@/components/CreatePageModal';

function findNode(nodes: PageNode[], id: string): PageNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

interface Props {
  api: WikiApi;
}

export function WikiPane({ api }: Props) {
  const [pages, setPages] = useState<PageNode[]>([]);
  const [allPages, setAllPages] = useState<PlanePage[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async (selectId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const flat = await api.fetch();
      setAllPages(flat);
      const tree = buildTree(flat);
      setPages(tree);
      setSelectedPage(prev => {
        if (selectId) return findNode(tree, selectId) ?? prev;
        return prev ? findNode(tree, prev.id) : null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

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

  return (
    <div className="flex flex-1 min-h-0 min-w-0">
      {/* Sidebar */}
      <div className="w-60 shrink-0 border-r border-gray-100 flex flex-col bg-white">
        {/* Search */}
        <div className="px-3 py-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Zoeken..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 transition"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="mx-3 mb-2 h-px bg-gray-100" />

        {/* Tree */}
        <div className="flex-1 overflow-y-auto px-1 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Laden...</span>
            </div>
          )}

          {error && (
            <div className="mx-2 my-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              {query ? 'Geen resultaten' : 'Nog geen pagina\'s'}
            </p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <PageTree
              pages={filtered}
              selectedPageId={selectedPage?.id ?? null}
              onSelectPage={setSelectedPage}
              allPages={allPages}
              onRefresh={load}
              api={api}
            />
          )}
        </div>

        {/* New page button */}
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Nieuwe pagina
          </button>
        </div>
      </div>

      {/* Viewer */}
      <PageViewer
        page={selectedPage}
        allPages={allPages}
        onPageUpdated={load}
        onPageDeleted={() => { setSelectedPage(null); load(); }}
        api={api}
      />

      {showCreate && (
        <CreatePageModal
          allPages={allPages}
          createFn={api.create}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); load(id); }}
        />
      )}
    </div>
  );
}
