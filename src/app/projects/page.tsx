'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Settings, CheckSquare } from 'lucide-react';
import { fetchProjects, PlaneProject } from '@/lib/projects-api';
import { getSettings, isConfigured } from '@/lib/settings';
import { ProjectsList } from '@/components/ProjectsList';
import { ProjectDetail } from '@/components/ProjectDetail';
import { SettingsModal } from '@/components/SettingsModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<PlaneProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<PlaneProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const loadProjects = useCallback(async () => {
    const settings = getSettings();
    if (!isConfigured(settings)) {
      setShowSettings(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchProjects(settings.planeBaseUrl, settings.workspaceSlug, settings.apiKey);
      setProjects(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleProjectUpdated = (updated: PlaneProject) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedProject(updated);
  };

  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden">
      {/* Top navigation bar */}
      <nav className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white shrink-0">
        <Link
          href="/wiki"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Wiki
        </Link>
        <span className="text-gray-200">/</span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-900">
          Projecten
        </span>
        <span className="text-gray-200">/</span>
        <Link
          href="/my-tasks"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          Mijn taken
        </Link>
        <div className="ml-auto">
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Instellingen"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
            onProjectUpdated={handleProjectUpdated}
            onProjectDeleted={() => {
              setSelectedProject(null);
              loadProjects();
            }}
          />
        ) : (
          <ProjectsList
            projects={projects}
            loading={loading}
            error={error}
            onSelectProject={setSelectedProject}
            onRefresh={loadProjects}
            onShowSettings={() => setShowSettings(true)}
          />
        )}
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setShowSettings(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}
