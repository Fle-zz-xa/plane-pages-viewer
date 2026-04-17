'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, ChevronRight, Plus, Edit3, Save, X, Trash2,
  Loader2, FileText, MoreHorizontal, AlertCircle, Archive, CheckCircle2,
} from 'lucide-react';
import { PlaneProject, updateProject, deleteProject, fetchProjectPages, createProjectPage, updateProjectPage, deleteProjectPage } from '@/lib/projects-api';
import { PlanePage } from '@/lib/plane-api';
import { parsePhase, getNextPhase, encodePhase, stripPhaseMarker, PHASES, PHASE_ORDER, ProjectPhase } from '@/lib/phase';
import { getSettings } from '@/lib/settings';
import { WikiEditor, WikiEditorRef } from '@/components/WikiEditor';
import { TaskBoard } from '@/components/TaskBoard';

interface Props {
  project: PlaneProject;
  onBack: () => void;
  onProjectUpdated: (updated: PlaneProject) => void;
  onProjectDeleted: () => void;
}

function PhaseTimeline({ current }: { current: ProjectPhase }) {
  const activeIdx = PHASE_ORDER.indexOf(current);
  // Show phases up to marketing (skip archived from the bar)
  const visible = PHASE_ORDER.filter(p => p !== 'archived');

  return (
    <div className="flex items-center gap-0.5">
      {visible.map((phase, idx) => {
        const cfg = PHASES[phase];
        const done = idx < activeIdx;
        const active = idx === activeIdx;
        return (
          <div
            key={phase}
            title={cfg.label}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              active ? cfg.dotClass :
              done ? 'bg-indigo-300' : 'bg-gray-200'
            }`}
          />
        );
      })}
    </div>
  );
}

export function ProjectDetail({ project, onBack, onProjectUpdated, onProjectDeleted }: Props) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'pages'>('tasks');
  const [pages, setPages] = useState<PlanePage[]>([]);
  const [selectedPage, setSelectedPage] = useState<PlanePage | null>(null);
  const [loadingPages, setLoadingPages] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [creatingSection, setCreatingSection] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [advancingPhase, setAdvancingPhase] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const editorRef = useRef<WikiEditorRef>(null);

  const phase = parsePhase(project.description);
  const nextPhase = getNextPhase(phase);
  const phaseCfg = PHASES[phase];

  const loadPages = useCallback(async () => {
    const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
    setLoadingPages(true);
    try {
      const list = await fetchProjectPages(planeBaseUrl, workspaceSlug, apiKey, project.id);
      // Only root pages (no parent)
      const roots = list.filter(p => !p.parent_id).sort((a, b) => a.sort_order - b.sort_order);
      setPages(roots);
      if (!selectedPage && roots.length > 0) setSelectedPage(roots[0]);
    } catch {
      // silently fail — user sees empty state
    } finally {
      setLoadingPages(false);
    }
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleAdvancePhase = async () => {
    if (!nextPhase) return;
    setAdvancingPhase(true);
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      const updated = await updateProject(planeBaseUrl, workspaceSlug, apiKey, project.id, {
        description: encodePhase(nextPhase, stripPhaseMarker(project.description)),
      });
      onProjectUpdated(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fase-overgang mislukt');
    } finally {
      setAdvancingPhase(false);
    }
  };

  const handleArchive = async () => {
    setMenuOpen(false);
    if (!confirm(`"${project.name}" archiveren?`)) return;
    const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
    try {
      const updated = await updateProject(planeBaseUrl, workspaceSlug, apiKey, project.id, {
        description: encodePhase('archived', stripPhaseMarker(project.description)),
      });
      onProjectUpdated(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Archiveren mislukt');
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      await deleteProject(planeBaseUrl, workspaceSlug, apiKey, project.id);
      onProjectDeleted();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verwijderen mislukt');
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = () => {
    if (!selectedPage) return;
    setEditName(selectedPage.name);
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setSaveError(null); };

  const handleSave = async () => {
    if (!selectedPage) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      const updated = await updateProjectPage(
        planeBaseUrl, workspaceSlug, apiKey, project.id, selectedPage.id,
        { name: editName.trim(), description_html: editorRef.current?.getHTML() ?? '' }
      );
      setSelectedPage(updated);
      setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    setCreatingSection(true);
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      const created = await createProjectPage(planeBaseUrl, workspaceSlug, apiKey, project.id, {
        name: newSectionName.trim(),
        is_global: false,
      });
      setPages(prev => [...prev, created]);
      setSelectedPage(created);
      setNewSectionName('');
      setShowNewSection(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Sectie aanmaken mislukt');
    } finally {
      setCreatingSection(false);
    }
  };

  const handleDeleteSection = async (page: PlanePage) => {
    if (!confirm(`Sectie "${page.name}" verwijderen?`)) return;
    const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
    try {
      await deleteProjectPage(planeBaseUrl, workspaceSlug, apiKey, project.id, page.id);
      const remaining = pages.filter(p => p.id !== page.id);
      setPages(remaining);
      if (selectedPage?.id === page.id) setSelectedPage(remaining[0] ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verwijderen mislukt');
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        {/* Project header */}
        <div className="border-b border-gray-100 px-6 py-3 shrink-0">
          <div className="flex items-center gap-4">
            {/* Back */}
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Name + phase */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900 truncate">{project.name}</h1>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${phaseCfg.bgClass} ${phaseCfg.textClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${phaseCfg.dotClass}`} />
                  {phaseCfg.label}
                </span>
              </div>
              <PhaseTimeline current={phase} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {nextPhase && (
                <button
                  onClick={handleAdvancePhase}
                  disabled={advancingPhase}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
                >
                  {advancingPhase
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <ChevronRight className="w-3.5 h-3.5" />
                  }
                  {PHASES[nextPhase].shortLabel}
                </button>
              )}

              {/* More menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                    <button
                      onClick={handleArchive}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Archive className="w-3.5 h-3.5 text-gray-400" />
                      Archiveren
                    </button>
                    <div className="my-1 h-px bg-gray-100" />
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Project verwijderen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body — tabs sidebar + content */}
        <div className="flex-1 flex min-h-0">
          {/* Left sidebar */}
          <div className="w-52 shrink-0 border-r border-gray-100 flex flex-col">
            {/* Tab switcher */}
            <div className="px-3 pt-3 pb-2 space-y-0.5">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === 'tasks' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Taken
              </button>
              <button
                onClick={() => setActiveTab('pages')}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === 'pages' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                Secties
              </button>
            </div>

            <div className="px-3 pb-2"><div className="h-px bg-gray-100" /></div>

            {/* Sections list (only when pages tab active) */}
            {activeTab === 'pages' && (
              <>
                <div className="flex-1 overflow-y-auto px-2">
                  {loadingPages && (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                    </div>
                  )}
                  {!loadingPages && pages.map(page => (
                    <div
                      key={page.id}
                      className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        selectedPage?.id === page.id ? 'bg-indigo-50 text-indigo-800' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => { setSelectedPage(page); setEditing(false); }}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      <span className="flex-1 text-sm truncate">{page.name}</span>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteSection(page); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {!loadingPages && pages.length === 0 && (
                    <p className="text-xs text-gray-400 px-2 py-2">Nog geen secties</p>
                  )}
                </div>
                <div className="p-2 border-t border-gray-100">
                  {showNewSection ? (
                    <div className="space-y-1.5">
                      <input
                        autoFocus
                        type="text"
                        value={newSectionName}
                        onChange={e => setNewSectionName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleCreateSection();
                          if (e.key === 'Escape') { setShowNewSection(false); setNewSectionName(''); }
                        }}
                        placeholder="Sectienaam..."
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <div className="flex gap-1">
                        <button onClick={handleCreateSection} disabled={!newSectionName.trim() || creatingSection} className="flex-1 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                          {creatingSection ? '...' : 'Toevoegen'}
                        </button>
                        <button onClick={() => { setShowNewSection(false); setNewSectionName(''); }} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-md">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowNewSection(true)} className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                      Sectie toevoegen
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Tasks tab — no extra sidebar content needed */}
            {activeTab === 'tasks' && <div className="flex-1" />}
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Tasks view */}
            {activeTab === 'tasks' && <TaskBoard project={project} />}

            {/* Pages view */}
            {activeTab === 'pages' && selectedPage ? (
              <>
                {/* Section toolbar */}
                <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-100 shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    {editing ? (
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="text-sm font-medium text-gray-900 bg-transparent border-b border-indigo-400 focus:outline-none"
                      />
                    ) : selectedPage.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {editing ? (
                      <>
                        <button onClick={cancelEdit} className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">
                          <X className="w-3.5 h-3.5" /> Annuleren
                        </button>
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {saving ? 'Opslaan...' : 'Opslaan'}
                        </button>
                      </>
                    ) : (
                      <button onClick={startEdit} className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> Bewerken
                      </button>
                    )}
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-8">
                    {saveError && (
                      <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {saveError}
                      </div>
                    )}
                    {editing ? (
                      <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                        <WikiEditor ref={editorRef} key={selectedPage.id} content={selectedPage.description_html ?? ''} editable placeholder="Begin met schrijven..." />
                      </div>
                    ) : (
                      <div className="mt-4">
                        {selectedPage.description_html?.replace(/<[^>]*>/g, '').trim() ? (
                          <WikiEditor key={selectedPage.id} content={selectedPage.description_html ?? ''} editable={false} />
                        ) : (
                          <div className="text-center py-20">
                            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" strokeWidth={1} />
                            <p className="text-sm text-gray-400">Nog geen inhoud</p>
                            <button onClick={startEdit} className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 underline">Klik om te beginnen</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-300 select-none">
                  <FileText className="w-12 h-12 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm text-gray-400">
                    {loadingPages ? 'Secties laden...' : 'Selecteer een sectie of maak een nieuwe aan'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete project confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Project verwijderen</h3>
                <p className="text-sm text-gray-500 truncate max-w-[200px]">{project.name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Weet je zeker dat je dit project wilt verwijderen? Dit verwijdert ook alle secties en kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                Annuleren
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-60"
              >
                {deleting ? 'Verwijderen...' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
