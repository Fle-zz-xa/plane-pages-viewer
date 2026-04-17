'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Loader2, Trash2, ChevronDown, ChevronRight,
  User, AlertCircle, Circle, CheckCircle2,
} from 'lucide-react';
import {
  PlaneIssue, PlaneState, PlaneProjectMember,
  fetchProjectIssues, fetchProjectStates, fetchProjectMembers,
  createIssue, updateIssue, deleteIssue,
  PRIORITY_CONFIG, STATE_GROUP_CONFIG, IssuePriority, userInitials,
} from '@/lib/issues-api';
import { PlaneProject } from '@/lib/projects-api';
import { getSettings } from '@/lib/settings';

interface Props {
  project: PlaneProject;
}

// ── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'sm' }: { user: { display_name: string; avatar: string | null }; size?: 'sm' | 'xs' }) {
  const cls = size === 'xs' ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]';
  if (user.avatar) {
    return <img src={user.avatar} alt={user.display_name} className={`${cls} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-indigo-100 text-indigo-600 font-semibold flex items-center justify-center shrink-0`}>
      {userInitials(user.display_name)}
    </div>
  );
}

// ── Priority dot ─────────────────────────────────────────────────────────────

function PriorityDot({ priority }: { priority: IssuePriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} title={cfg.label} />;
}

// ── Inline text input ─────────────────────────────────────────────────────────

function InlineCreate({ placeholder, onSubmit, onCancel }: {
  placeholder: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!value.trim()) return;
    setSaving(true);
    await onSubmit(value.trim());
    setSaving(false);
    setValue('');
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={placeholder}
        className="flex-1 text-sm bg-transparent border-b border-indigo-400 focus:outline-none placeholder:text-gray-400 py-0.5"
      />
      <button
        onClick={submit}
        disabled={!value.trim() || saving}
        className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700"
      >
        {saving ? '...' : 'Toevoegen'}
      </button>
      <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">Annuleer</button>
    </div>
  );
}

// ── Subtask row ───────────────────────────────────────────────────────────────

function SubtaskRow({ issue, states, members, projectId, onUpdated, onDeleted }: {
  issue: PlaneIssue;
  states: PlaneState[];
  members: PlaneProjectMember[];
  projectId: string;
  onUpdated: (updated: PlaneIssue) => void;
  onDeleted: (id: string) => void;
}) {
  const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
  const state = states.find(s => s.id === issue.state);
  const isDone = state?.group === 'completed' || state?.group === 'cancelled';

  const toggleDone = async () => {
    const targetGroup = isDone ? 'unstarted' : 'completed';
    const targetState = states.find(s => s.group === targetGroup) ?? states[0];
    if (!targetState) return;
    const updated = await updateIssue(planeBaseUrl, workspaceSlug, apiKey, projectId, issue.id, { state: targetState.id });
    onUpdated(updated);
  };

  const assignee = members.find(m => issue.assignees.includes(m.member.id));

  return (
    <div className="flex items-center gap-2 pl-8 pr-3 py-1.5 group hover:bg-gray-50 rounded-lg">
      <button onClick={toggleDone} className="shrink-0 text-gray-400 hover:text-indigo-600">
        {isDone
          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          : <Circle className="w-3.5 h-3.5" />
        }
      </button>
      <span className={`flex-1 text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {issue.name}
      </span>
      {assignee && <Avatar user={assignee.member} size="xs" />}
      <button
        onClick={() => deleteIssue(planeBaseUrl, workspaceSlug, apiKey, projectId, issue.id)
          .then(() => onDeleted(issue.id))
          .catch(() => alert('Verwijderen mislukt'))}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({ issue, allIssues, states, members, projectId, onUpdated, onDeleted }: {
  issue: PlaneIssue;
  allIssues: PlaneIssue[];
  states: PlaneState[];
  members: PlaneProjectMember[];
  projectId: string;
  onUpdated: (updated: PlaneIssue) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();

  const state = states.find(s => s.id === issue.state);
  const isDone = state?.group === 'completed' || state?.group === 'cancelled';
  const assignee = members.find(m => issue.assignees.includes(m.member.id));
  const subtasks = allIssues.filter(i => i.parent === issue.id);

  const toggleDone = async () => {
    const targetGroup = isDone ? 'unstarted' : 'completed';
    const targetState = states.find(s => s.group === targetGroup) ?? states[0];
    if (!targetState) return;
    const updated = await updateIssue(planeBaseUrl, workspaceSlug, apiKey, projectId, issue.id, { state: targetState.id });
    onUpdated(updated);
  };

  const handleAssigneeChange = async (userId: string) => {
    const newAssignees = userId === '' ? [] : [userId];
    const updated = await updateIssue(planeBaseUrl, workspaceSlug, apiKey, projectId, issue.id, { assignees: newAssignees });
    onUpdated(updated);
  };

  const handleStateChange = async (stateId: string) => {
    const updated = await updateIssue(planeBaseUrl, workspaceSlug, apiKey, projectId, issue.id, { state: stateId });
    onUpdated(updated);
  };

  const handleAddSubtask = async (name: string) => {
    const created = await createIssue(planeBaseUrl, workspaceSlug, apiKey, projectId, {
      name,
      parent: issue.id,
      state: issue.state,
    });
    onUpdated({ ...issue, sub_issues_count: issue.sub_issues_count + 1 });
    // Add subtask to allIssues via parent callback
    onUpdated(created); // reuse callback to bubble up
    setAddingSubtask(false);
  };

  const handleSubtaskUpdated = (updated: PlaneIssue) => onUpdated(updated);
  const handleSubtaskDeleted = (id: string) => onDeleted(id);

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden transition-all ${expanded ? 'shadow-sm' : ''}`}>
      {/* Main row */}
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer group ${expanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Done toggle */}
        <button
          onClick={e => { e.stopPropagation(); toggleDone(); }}
          className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          {isDone
            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
            : <Circle className="w-4 h-4" />
          }
        </button>

        {/* Expand chevron */}
        <span className="shrink-0 text-gray-300">
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />
          }
        </span>

        {/* Priority */}
        <PriorityDot priority={issue.priority} />

        {/* Name */}
        <span className={`flex-1 text-sm min-w-0 truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {issue.name}
        </span>

        {/* Subtask count */}
        {(subtasks.length > 0 || issue.sub_issues_count > 0) && (
          <span className="text-xs text-gray-400 shrink-0">
            {subtasks.filter(s => {
              const st = states.find(x => x.id === s.state);
              return st?.group === 'completed';
            }).length}/{subtasks.length || issue.sub_issues_count}
          </span>
        )}

        {/* Assignee */}
        <div onClick={e => e.stopPropagation()}>
          <select
            value={assignee?.member.id ?? ''}
            onChange={e => handleAssigneeChange(e.target.value)}
            className="text-xs border-0 bg-transparent focus:outline-none cursor-pointer text-gray-500 max-w-[100px]"
            title="Assignee"
          >
            <option value="">— Niemand</option>
            {members.map(m => (
              <option key={m.member.id} value={m.member.id}>{m.member.display_name}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div onClick={e => e.stopPropagation()}>
          <select
            value={issue.state}
            onChange={e => handleStateChange(e.target.value)}
            className="text-xs border-0 bg-transparent focus:outline-none cursor-pointer text-gray-500 max-w-[110px]"
          >
            {states.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Delete */}
        <button
          onClick={e => {
            e.stopPropagation();
            if (confirm(`"${issue.name}" verwijderen?`)) {
              deleteIssue(planeBaseUrl, workspaceSlug, apiKey, projectId, issue.id)
                .then(() => onDeleted(issue.id))
                .catch(() => alert('Verwijderen mislukt'));
            }
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded: subtasks */}
      {expanded && (
        <div className="border-t border-gray-100 bg-white pb-1">
          {subtasks.length > 0 && (
            <div className="pt-1">
              {subtasks.map(sub => (
                <SubtaskRow
                  key={sub.id}
                  issue={sub}
                  states={states}
                  members={members}
                  projectId={projectId}
                  onUpdated={handleSubtaskUpdated}
                  onDeleted={handleSubtaskDeleted}
                />
              ))}
            </div>
          )}

          {addingSubtask ? (
            <InlineCreate
              placeholder="Subtaak omschrijven..."
              onSubmit={handleAddSubtask}
              onCancel={() => setAddingSubtask(false)}
            />
          ) : (
            <button
              onClick={() => setAddingSubtask(true)}
              className="flex items-center gap-1.5 pl-8 pr-3 py-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Subtaak toevoegen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── State group ───────────────────────────────────────────────────────────────

function StateGroup({ state, issues, allIssues, states, members, projectId, onUpdated, onDeleted, onAdd }: {
  state: PlaneState;
  issues: PlaneIssue[];
  allIssues: PlaneIssue[];
  states: PlaneState[];
  members: PlaneProjectMember[];
  projectId: string;
  onUpdated: (updated: PlaneIssue) => void;
  onDeleted: (id: string) => void;
  onAdd: (stateId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(state.group === 'cancelled');
  const cfg = STATE_GROUP_CONFIG[state.group];

  return (
    <div>
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-2 w-full mb-2 group"
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        }
        <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>{state.name}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{issues.length}</span>
      </button>

      {!collapsed && (
        <div className="space-y-1.5 mb-6">
          {issues.map(issue => (
            <TaskCard
              key={issue.id}
              issue={issue}
              allIssues={allIssues}
              states={states}
              members={members}
              projectId={projectId}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
            />
          ))}
          <button
            onClick={() => onAdd(state.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors w-full"
          >
            <Plus className="w-3.5 h-3.5" />
            Taak toevoegen
          </button>
        </div>
      )}
    </div>
  );
}

// ── TaskBoard (main export) ────────────────────────────────────────────────────

export function TaskBoard({ project }: Props) {
  const [issues, setIssues] = useState<PlaneIssue[]>([]);
  const [states, setStates] = useState<PlaneState[]>([]);
  const [members, setMembers] = useState<PlaneProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToState, setAddingToState] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
    setLoading(true);
    setError(null);
    try {
      const [issueList, stateList, memberList] = await Promise.all([
        fetchProjectIssues(planeBaseUrl, workspaceSlug, apiKey, project.id),
        fetchProjectStates(planeBaseUrl, workspaceSlug, apiKey, project.id),
        fetchProjectMembers(planeBaseUrl, workspaceSlug, apiKey, project.id),
      ]);
      // Sort states by sequence
      setStates(stateList.sort((a, b) => a.sequence - b.sequence));
      setIssues(issueList);
      setMembers(memberList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const handleUpdated = (updated: PlaneIssue) => {
    setIssues(prev => {
      const exists = prev.find(i => i.id === updated.id);
      return exists ? prev.map(i => i.id === updated.id ? updated : i) : [...prev, updated];
    });
  };

  const handleDeleted = (id: string) => {
    setIssues(prev => prev.filter(i => i.id !== id));
  };

  const handleAddToState = async (name: string, stateId: string) => {
    const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
    const created = await createIssue(planeBaseUrl, workspaceSlug, apiKey, project.id, {
      name,
      state: stateId,
      priority: 'none',
    });
    setIssues(prev => [...prev, created]);
    setAddingToState(null);
  };

  // Top-level issues only (no parent)
  const rootIssues = issues.filter(i => !i.parent);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Taken laden...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 bg-red-50 border border-red-200 rounded-xl p-5 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-6">
        {states.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">
            Geen statussen gevonden voor dit project in Plane.
          </p>
        )}

        {states.map(state => {
          const stateIssues = rootIssues.filter(i => i.state === state.id);

          return (
            <div key={state.id}>
              {addingToState === state.id ? (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${STATE_GROUP_CONFIG[state.group].text}`}>
                      {state.name}
                    </span>
                  </div>
                  <div className="border border-indigo-200 rounded-xl overflow-hidden">
                    <InlineCreate
                      placeholder={`Taak toevoegen aan ${state.name}...`}
                      onSubmit={name => handleAddToState(name, state.id)}
                      onCancel={() => setAddingToState(null)}
                    />
                  </div>
                </div>
              ) : (
                <StateGroup
                  state={state}
                  issues={stateIssues}
                  allIssues={issues}
                  states={states}
                  members={members}
                  projectId={project.id}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                  onAdd={setAddingToState}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
