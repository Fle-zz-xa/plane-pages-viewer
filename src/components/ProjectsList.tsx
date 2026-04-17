'use client';

import { useState } from 'react';
import { Plus, Loader2, AlertCircle, Package, Lightbulb, Zap, CheckCircle, Archive } from 'lucide-react';
import { PlaneProject } from '@/lib/projects-api';
import { parsePhase, PHASES, ACTIVE_PHASES, ProjectPhase, stripPhaseMarker } from '@/lib/phase';
import { CreateProjectModal } from '@/components/CreateProjectModal';

interface Props {
  projects: PlaneProject[];
  loading: boolean;
  error: string | null;
  onSelectProject: (project: PlaneProject) => void;
  onRefresh: () => void;
  onShowSettings: () => void;
}

function PhaseBadge({ phase }: { phase: ProjectPhase }) {
  const cfg = PHASES[phase];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bgClass} ${cfg.textClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.shortLabel}
    </span>
  );
}

function ProjectCard({ project, onClick }: { project: PlaneProject; onClick: () => void }) {
  const phase = parsePhase(project.description);
  const description = stripPhaseMarker(project.description);
  const updatedAt = new Date(project.updated_at).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short',
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 leading-tight">
          {project.name}
        </span>
        <PhaseBadge phase={phase} />
      </div>
      {description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{description}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-gray-400">{project.identifier}</span>
        <span className="text-xs text-gray-400">{updatedAt}</span>
      </div>
    </button>
  );
}

type Group = {
  key: string;
  label: string;
  icon: React.ReactNode;
  projects: PlaneProject[];
  emptyText: string;
};

export function ProjectsList({ projects, loading, error, onSelectProject, onRefresh, onShowSettings }: Props) {
  const [showCreate, setShowCreate] = useState(false);

  const vault = projects.filter(p => parsePhase(p.description) === 'vault');
  const active = projects.filter(p => ACTIVE_PHASES.includes(parsePhase(p.description)));
  const released = projects.filter(p => ['release', 'marketing'].includes(parsePhase(p.description)));
  const archived = projects.filter(p => parsePhase(p.description) === 'archived');

  const groups: Group[] = [
    {
      key: 'vault',
      label: 'Vault — Ideeën',
      icon: <Lightbulb className="w-4 h-4 text-gray-400" />,
      projects: vault,
      emptyText: 'Geen ideeën in de vault',
    },
    {
      key: 'active',
      label: 'In ontwikkeling',
      icon: <Zap className="w-4 h-4 text-indigo-500" />,
      projects: active,
      emptyText: 'Geen actieve projecten',
    },
    {
      key: 'released',
      label: 'Release & Marketing',
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      projects: released,
      emptyText: 'Geen projecten in release',
    },
    {
      key: 'archived',
      label: 'Archief',
      icon: <Archive className="w-4 h-4 text-gray-400" />,
      projects: archived,
      emptyText: 'Geen gearchiveerde projecten',
    },
  ];

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Projecten</h1>
              <p className="text-xs text-gray-400">
                {loading ? 'Laden...' : `${projects.length} project${projects.length !== 1 ? 'en' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuw project
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8 max-w-5xl">
          {loading && (
            <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Projecten laden...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Fout bij laden</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
                <button onClick={onShowSettings} className="mt-2 text-xs text-red-700 underline">
                  Instellingen controleren
                </button>
              </div>
            </div>
          )}

          {!loading && !error && groups.map(group => (
            <section key={group.key}>
              <div className="flex items-center gap-2 mb-3">
                {group.icon}
                <h2 className="text-sm font-semibold text-gray-700">{group.label}</h2>
                <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                  {group.projects.length}
                </span>
              </div>

              {group.projects.length === 0 ? (
                <p className="text-sm text-gray-400 pl-6">{group.emptyText}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.projects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => onSelectProject(project)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}

          {!loading && !error && projects.length === 0 && (
            <div className="text-center py-20">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-200" strokeWidth={1} />
              <p className="text-gray-400 font-medium">Nog geen projecten</p>
              <p className="text-sm text-gray-300 mt-1">Maak je eerste project aan</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Eerste project aanmaken
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
