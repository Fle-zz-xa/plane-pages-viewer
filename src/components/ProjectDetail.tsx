'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeft, ChevronRight, Trash2, Loader2,
  FileText, MoreHorizontal, Archive, CheckCircle2,
} from 'lucide-react';
import { PlaneProject, updateProject, deleteProject } from '@/lib/projects-api';
import { parsePhase, getNextPhase, encodePhase, stripPhaseMarker, PHASES, PHASE_ORDER, ProjectPhase } from '@/lib/phase';
import { getSettings } from '@/lib/settings';
import { makeProjectWikiApi } from '@/lib/wiki-api';
import { WikiPane } from '@/components/WikiPane';
import { TaskBoard } from '@/components/TaskBoard';

interface Props {
  project: PlaneProject;
  onBack: () => void;
  onProjectUpdated: (updated: PlaneProject) => void;
  onProjectDeleted: () => void;
}

function PhaseTimeline({ current }: { current: ProjectPhase }) {
  const activeIdx = PHASE_ORDER.indexOf(current);
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
              active ? cfg.dotClass : done ? 'bg-indigo-300' : 'bg-gray-200'
            }`}
          />
        );
      })}
    </div>
  );
}

export function ProjectDetail({ project, onBack, onProjectUpdated, onProjectDeleted }: Props) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'pages'>('tasks');
  const [advancingPhase, setAdvancingPhase] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const phase = parsePhase(project.description);
  const nextPhase = getNextPhase(phase);
  const phaseCfg = PHASES[phase];

  // Stable api object — only recreated when project changes
  const wikiApi = useMemo(() => makeProjectWikiApi(project.id), [project.id]);

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

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        {/* Project header */}
        <div className="border-b border-gray-100 px-6 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>

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

            <div className="flex items-center gap-2 shrink-0">
              {nextPhase && (
                <button
                  onClick={handleAdvancePhase}
                  disabled={advancingPhase}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
                >
                  {advancingPhase ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  {PHASES[nextPhase].shortLabel}
                </button>
              )}

              <div className="relative">
                <button onClick={() => setMenuOpen(v => !v)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
                    <button onClick={handleArchive} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Archive className="w-3.5 h-3.5 text-gray-400" /> Archiveren
                    </button>
                    <div className="my-1 h-px bg-gray-100" />
                    <button onClick={() => { setMenuOpen(false); setConfirmDelete(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" /> Project verwijderen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 shrink-0">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'tasks' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Taken
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'pages' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Pagina's
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {activeTab === 'tasks'
            ? <TaskBoard project={project} />
            : <WikiPane api={wikiApi} />
          }
        </div>
      </div>

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
              Weet je zeker dat je dit project wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                Annuleren
              </button>
              <button onClick={handleDeleteProject} disabled={deleting} className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-60">
                {deleting ? 'Verwijderen...' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
