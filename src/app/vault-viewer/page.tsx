'use client';

import { useState, useEffect } from 'react';
import { fetchPages, buildTree, PageNode, PlanePage } from '@/lib/plane-api';
import { PageTree } from '@/components/PageTree';
import { FolderTree, Loader2, AlertCircle, FileText } from 'lucide-react';

export default function VaultViewer() {
  const [pages, setPages] = useState<PageNode[]>([]);
  const [selectedPage, setSelectedPage] = useState<PlanePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pages on mount
  useEffect(() => {
    async function loadPages() {
      try {
        setLoading(true);
        const flatPages = await fetchPages('rivetta');
        const tree = buildTree(flatPages);
        setPages(tree);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pages');
      } finally {
        setLoading(false);
      }
    }

    loadPages();
  }, []);

  const handleSelectPage = (page: PageNode) => {
    setSelectedPage(page);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left sidebar - Tree view */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">
              Rivetta Vault
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {pages.length} root pages
          </p>
        </div>

        {/* Tree content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="ml-2 text-sm text-gray-600">Loading pages...</span>
            </div>
          )}

          {error && (
            <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <p className="text-xs text-red-600 mt-2">
                Make sure you're logged in to Plane and have access to the workspace.
              </p>
            </div>
          )}

          {!loading && !error && pages.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              No pages found
            </div>
          )}

          {!loading && !error && pages.length > 0 && (
            <PageTree
              pages={pages}
              selectedPageId={selectedPage?.id || null}
              onSelectPage={handleSelectPage}
            />
          )}
        </div>
      </div>

      {/* Right panel - Page content */}
      <div className="flex-1 flex flex-col">
        {selectedPage ? (
          <>
            {/* Page header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedPage.name}
                </h2>
              </div>
              {selectedPage.updated_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(selectedPage.updated_at).toLocaleDateString('nl-NL')}
                </p>
              )}
            </div>

            {/* Page content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedPage.description_html ? (
                <div 
                  className="prose prose-blue max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPage.description_html }}
                />
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No content</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <FolderTree className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Select a page to view its content</p>
              <p className="text-sm mt-2">
                Click on any page in the tree to display it here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
