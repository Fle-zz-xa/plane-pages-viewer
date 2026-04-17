'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Package, Settings, Loader2, AlertCircle, CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import { fetchCurrentUser, fetchProjectIssues, fetchProjectStates, updateIssue, PlaneUser, PlaneIssue, PlaneState, PRIORITY_CONFIG } from '@/lib/issues-api';
import { fetchProjects, PlaneProject } from '@/lib/projects-api';
import { getSettings, isConfigured } from '@/lib/settings';
import { SettingsModal } from '@/components/SettingsModal';

interface TaskWithContext {
  issue: PlaneIssue;
  project: PlaneProject;
  state: PlaneState | undefined;
}

export default function MyTasksPage() {
  const [currentUser, setCurrentUser] = useState<PlaneUser | null>(null);
  const [tasks, setTasks] = useState<TaskWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const settings = getSettings();
    if (!isConfigured(settings)) {
      setShowSettings(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { apiKey, workspaceSlug, planeBaseUrl } = settings;
      const [user, projects] = await Promise.all([
        fetchCurrentUser(planeBaseUrl, apiKey),
        fetchProjects(planeBaseUrl, workspaceSlug, apiKey),
      ]);
      setCurrentUser(user);

      const perProject = await Promise.all(
        projects.map(async project => {
          const [issues, states] = await Promise.all([
            fetchProjectIssues(planeBaseUrl, workspaceSlug, apiKey, project.id),
            fetchProjectStates(planeBaseUrl, workspaceSlug, apiKey, project.id),
          ]);
          const stateMap = new Map(states.map(s => [s.id, s]));
          return issues
            .filter(i => i.assignees.includes(user.id))
            .map(issue => ({ issue, project, state: stateMap.get(issue.state) }));
        })
      );

      setTasks(perProject.flat().sort((a, b) => {
        const order = ['urgent', 'high', 'medium', 'low', 'none'];
        return order.indexOf(a.issue.priority) - order.indexOf(b.issue.priority);
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleDone = async (task: TaskWithContext) => {
    const settings = getSettings();
    const isDone = task.state?.group === 'completed';
    setTogglingId(task.issue.id);
    try {
      // We need a completed or unstarted state id — find from same project issues
      // Re-fetch states for the project
      const states = await fetchProjectStates(settings.planeBaseUrl, settings.workspaceSlug, settings.apiKey, task.project.id);
      const target = isDone
        ? states.find(s => s.group === 'unstarted' || s.group === 'backlog')
        : states.find(s => s.group === 'completed');
      if (!target) return;
      await updateIssue(settings.planeBaseUrl, settings.workspaceSlug, settings.apiKey, task.project.id, task.issue.id, { state: target.id });
      await load();
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  const open = tasks.filter(t => t.state?.group !== 'completed' && t.state?.group !== 'cancelled');
  const done = tasks.filter(t => t.state?.group === 'completed' || t.state?.group === 'cancelled');

  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden">
      {/* Top nav */}
      <nav className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white shrink-0">
        <Link href="/wiki" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          <BookOpen className="w-4 h-4" />
          Wiki
        </Link>
        <span className="text-gray-200">/</span>
        <Link href="/projects" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
          <Package className="w-4 h-4" />
          Projecten
        </Link>
        <span className="text-gray-200">/</span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-900">
          Mijn taken
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={load} disabled={loading} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40" title="Vernieuwen">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Instellingen">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mijn taken</h1>
            {currentUser && (
              <p className="text-sm text-gray-500 mt-1">
                Ingelogd als <span className="font-medium text-gray-700">{currentUser.display_name}</span>
              </p>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Taken laden...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Fout bij laden</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
                <button onClick={() => setShowSettings(true)} className="mt-2 text-xs text-red-700 underline">Instellingen controleren</button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Open tasks */}
              <section className="mb-8">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Open — {open.length}
                </h2>
                {open.length === 0 ? (
                  <div className="text-center py-10 text-gray-300">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2" strokeWidth={1} />
                    <p className="text-sm text-gray-400">Geen openstaande taken</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {open.map(task => (
                      <TaskRow key={task.issue.id} task={task} onToggle={() => toggleDone(task)} toggling={togglingId === task.issue.id} />
                    ))}
                  </div>
                )}
              </section>

              {/* Done tasks */}
              {done.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Afgerond — {done.length}
                  </h2>
                  <div className="space-y-1.5">
                    {done.map(task => (
                      <TaskRow key={task.issue.id} task={task} onToggle={() => toggleDone(task)} toggling={togglingId === task.issue.id} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={() => { setShowSettings(false); load(); }}
        />
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, toggling }: { task: TaskWithContext; onToggle: () => void; toggling: boolean }) {
  const isDone = task.state?.group === 'completed' || task.state?.group === 'cancelled';
  const priorityCfg = PRIORITY_CONFIG[task.issue.priority];

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${isDone ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
      <button
        onClick={onToggle}
        disabled={toggling}
        className="mt-0.5 shrink-0 text-gray-300 hover:text-indigo-500 transition-colors disabled:opacity-40"
      >
        {isDone
          ? <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
          : <Circle className="w-4.5 h-4.5" />
        }
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.issue.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{task.project.name}</span>
          {task.state && (
            <>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">{task.state.name}</span>
            </>
          )}
          {task.issue.priority !== 'none' && (
            <>
              <span className="text-gray-200">·</span>
              <span className={`text-xs font-medium ${priorityCfg.color}`}>{priorityCfg.label}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
