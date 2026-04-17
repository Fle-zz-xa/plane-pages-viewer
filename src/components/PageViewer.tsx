'use client';

import { useState } from 'react';
import {
  FileText, FolderOpen, Edit3, Trash2, Save, X, Loader2,
  AlertCircle, Plus, ChevronRight,
} from 'lucide-react';
import { PageNode, PlanePage, updatePage, deletePage } from '@/lib/plane-api';
import { getSettings } from '@/lib/settings';
import { CreatePageModal } from '@/components/CreatePageModal';

interface Props {
  page: PageNode | null;
  allPages: PlanePage[];
  onPageUpdated: () => void;
  onPageDeleted: () => void;
}

export function PageViewer({ page, allPages, onPageUpdated, onPageDeleted }: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEdit = () => {
    if (!page) return;
    setEditName(page.name);
    setEditContent(page.description_html ?? '');
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      await updatePage(planeBaseUrl, workspaceSlug, apiKey, page.id, {
        name: editName.trim(),
        description_html: editContent,
      });
      setEditing(false);
      onPageUpdated();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!page) return;
    setDeleting(true);
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      await deletePage(planeBaseUrl, workspaceSlug, apiKey, page.id);
      setConfirmDelete(false);
      onPageDeleted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verwijderen mislukt');
    } finally {
      setDeleting(false);
    }
  };

  // Empty state
  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-300 select-none">
          <FileText className="w-16 h-16 mx-auto mb-4" strokeWidth={1} />
          <p className="text-base font-medium text-gray-400">Selecteer een pagina</p>
          <p className="text-sm text-gray-300 mt-1">Klik op een pagina in het menu links</p>
        </div>
      </div>
    );
  }

  const isFolder = page.children.length > 0 && !page.description_html?.trim().replace(/<[^>]*>/g, '').trim();
  const updatedAt = page.updated_at ? new Date(page.updated_at).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-gray-500 min-w-0">
            <span className="text-gray-400">Wiki</span>
            {page.parent_id && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate text-gray-500">
                  {allPages.find(p => p.id === page.parent_id)?.name ?? '...'}
                </span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium text-gray-900 truncate">{page.name}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {!editing && (
              <>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Subpagina
                </button>
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Bewerken
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Verwijderen
                </button>
              </>
            )}
            {editing && (
              <>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Annuleren
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {editing ? (
              /* Edit mode */
              <div className="space-y-4">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full text-3xl font-bold text-gray-900 border-0 border-b-2 border-indigo-300 focus:outline-none focus:border-indigo-600 pb-2 bg-transparent transition-colors"
                  placeholder="Paginanaam..."
                />
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Inhoud (HTML)
                  </label>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={20}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-y transition"
                    placeholder="<p>Begin met schrijven...</p>"
                  />
                </div>
                {saveError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {saveError}
                  </div>
                )}
              </div>
            ) : (
              /* View mode */
              <>
                {/* Page header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    {isFolder
                      ? <FolderOpen className="w-6 h-6 text-indigo-500" />
                      : <FileText className="w-6 h-6 text-gray-400" />
                    }
                    <h1 className="text-3xl font-bold text-gray-900">{page.name}</h1>
                  </div>
                  {updatedAt && (
                    <p className="text-sm text-gray-400">Bijgewerkt op {updatedAt}</p>
                  )}
                </div>

                {/* Folder: show child cards */}
                {isFolder && page.children.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Inhoud van deze map
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {page.children.map(child => (
                        <div key={child.id} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group">
                          <div className="flex items-center gap-2">
                            {child.children.length > 0
                              ? <FolderOpen className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                              : <FileText className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                            }
                            <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">
                              {child.name}
                            </span>
                          </div>
                          {child.children.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1 ml-6">
                              {child.children.length} item{child.children.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Page content */}
                {page.description_html && page.description_html.replace(/<[^>]*>/g, '').trim() ? (
                  <div
                    className="prose prose-gray max-w-none prose-headings:font-semibold prose-a:text-indigo-600"
                    dangerouslySetInnerHTML={{ __html: page.description_html }}
                  />
                ) : !isFolder && (
                  <div className="text-center py-16 text-gray-300">
                    <FileText className="w-12 h-12 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-sm text-gray-400">Nog geen inhoud</p>
                    <button
                      onClick={startEdit}
                      className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 underline"
                    >
                      Klik om te beginnen met schrijven
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pagina verwijderen</h3>
                <p className="text-sm text-gray-500">{page.name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Weet je zeker dat je deze pagina wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
              {page.children.length > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Let op: deze pagina heeft {page.children.length} subpagina{page.children.length !== 1 ? "'s" : ''}.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60"
              >
                {deleting ? 'Verwijderen...' : 'Ja, verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create subpage */}
      {showCreate && (
        <CreatePageModal
          allPages={allPages}
          defaultParentId={page.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            onPageUpdated();
          }}
        />
      )}
    </>
  );
}
