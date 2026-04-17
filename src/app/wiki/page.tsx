'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, isConfigured } from '@/lib/settings';
import { fetchPages, buildTree, PageNode, PlanePage } from '@/lib/plane-api';
import { WikiSidebar } from '@/components/WikiSidebar';
import { PageViewer } from '@/components/PageViewer';
import { SettingsModal } from '@/components/SettingsModal';

function findNode(nodes: PageNode[], id: string): PageNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

export default function WikiPage() {
  const [pages, setPages] = useState<PageNode[]>([]);
  const [allPages, setAllPages] = useState<PlanePage[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const loadPages = useCallback(async () => {
    const settings = getSettings();
    if (!isConfigured(settings)) {
      setShowSettings(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const flat = await fetchPages(settings.planeBaseUrl, settings.workspaceSlug, settings.apiKey);
      setAllPages(flat);
      const tree = buildTree(flat);
      setPages(tree);

      // Re-sync selected page so it gets fresh children/content
      setSelectedPage(prev => prev ? (findNode(tree, prev.id) ?? null) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleSelectPage = (page: PageNode) => {
    setSelectedPage(page);
  };

  const handlePageUpdated = useCallback(async (selectId?: string) => {
    const settings = getSettings();
    if (!isConfigured(settings)) return;
    try {
      const flat = await fetchPages(settings.planeBaseUrl, settings.workspaceSlug, settings.apiKey);
      setAllPages(flat);
      const tree = buildTree(flat);
      setPages(tree);
      setSelectedPage(prev => {
        if (selectId) return findNode(tree, selectId) ?? prev;
        return prev ? findNode(tree, prev.id) : null;
      });
    } catch {
      // tree stays stale on network failure
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <WikiSidebar
        pages={pages}
        allPages={allPages}
        selectedPageId={selectedPage?.id ?? null}
        loading={loading}
        error={error}
        onSelectPage={handleSelectPage}
        onCreatePage={handlePageUpdated}
        onShowSettings={() => setShowSettings(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <PageViewer
          page={selectedPage}
          allPages={allPages}
          onPageUpdated={handlePageUpdated}
          onPageDeleted={() => {
            setSelectedPage(null);
            loadPages();
          }}
        />
      </main>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setShowSettings(false);
            loadPages();
          }}
        />
      )}
    </div>
  );
}
