function makeHeaders(apiKey: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Api-Key': apiKey };
}

export interface PlaneUser {
  id: string;
  display_name: string;
  email: string;
  avatar: string | null;
}

export interface PlaneProjectMember {
  id: string;
  member: PlaneUser;
  role: number;
}

export interface PlaneState {
  id: string;
  name: string;
  color: string;
  group: 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled';
  sequence: number;
}

export type IssuePriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface PlaneIssue {
  id: string;
  name: string;
  description_html: string;
  state: string;
  priority: IssuePriority;
  assignees: string[];
  parent: string | null;
  sequence_id: number;
  sub_issues_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export async function fetchCurrentUser(baseUrl: string, apiKey: string): Promise<PlaneUser> {
  const res = await fetch(`${baseUrl}/api/users/me/`, { headers: makeHeaders(apiKey) });
  if (!res.ok) throw new Error(`Kan gebruiker niet ophalen: ${res.status}`);
  return res.json();
}

export async function fetchProjectMembers(
  baseUrl: string, workspaceSlug: string, apiKey: string, projectId: string
): Promise<PlaneProjectMember[]> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/members/`,
    { headers: makeHeaders(apiKey) }
  );
  if (!res.ok) throw new Error(`Kan leden niet ophalen: ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

export async function fetchProjectStates(
  baseUrl: string, workspaceSlug: string, apiKey: string, projectId: string
): Promise<PlaneState[]> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/states/`,
    { headers: makeHeaders(apiKey) }
  );
  if (!res.ok) throw new Error(`Kan statussen niet ophalen: ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

export async function fetchProjectIssues(
  baseUrl: string, workspaceSlug: string, apiKey: string, projectId: string
): Promise<PlaneIssue[]> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/`,
    { headers: makeHeaders(apiKey) }
  );
  if (!res.ok) throw new Error(`Kan taken niet ophalen: ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

export async function createIssue(
  baseUrl: string, workspaceSlug: string, apiKey: string, projectId: string,
  issue: { name: string; state?: string; priority?: IssuePriority; assignees?: string[]; parent?: string | null; description_html?: string }
): Promise<PlaneIssue> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/`,
    { method: 'POST', headers: makeHeaders(apiKey), body: JSON.stringify(issue) }
  );
  if (!res.ok) throw new Error(`Kan taak niet aanmaken: ${res.status}`);
  return res.json();
}

export async function updateIssue(
  baseUrl: string, workspaceSlug: string, apiKey: string, projectId: string, issueId: string,
  updates: Partial<Pick<PlaneIssue, 'name' | 'state' | 'priority' | 'assignees' | 'description_html'>>
): Promise<PlaneIssue> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`,
    { method: 'PATCH', headers: makeHeaders(apiKey), body: JSON.stringify(updates) }
  );
  if (!res.ok) throw new Error(`Kan taak niet bijwerken: ${res.status}`);
  return res.json();
}

export async function deleteIssue(
  baseUrl: string, workspaceSlug: string, apiKey: string, projectId: string, issueId: string
): Promise<void> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`,
    { method: 'DELETE', headers: makeHeaders(apiKey) }
  );
  if (!res.ok) throw new Error(`Kan taak niet verwijderen: ${res.status}`);
}

// Priority config
export const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string; dot: string }> = {
  urgent: { label: 'Urgent',  color: 'text-red-600',    dot: 'bg-red-500' },
  high:   { label: 'Hoog',    color: 'text-orange-600', dot: 'bg-orange-500' },
  medium: { label: 'Middel',  color: 'text-yellow-600', dot: 'bg-yellow-400' },
  low:    { label: 'Laag',    color: 'text-blue-500',   dot: 'bg-blue-400' },
  none:   { label: '—',       color: 'text-gray-400',   dot: 'bg-gray-300' },
};

// State group config
export const STATE_GROUP_CONFIG: Record<PlaneState['group'], { label: string; bg: string; text: string }> = {
  backlog:   { label: 'Backlog',       bg: 'bg-gray-100',   text: 'text-gray-600' },
  unstarted: { label: 'Te doen',       bg: 'bg-gray-100',   text: 'text-gray-700' },
  started:   { label: 'In uitvoering', bg: 'bg-blue-50',    text: 'text-blue-700' },
  completed: { label: 'Klaar',         bg: 'bg-green-50',   text: 'text-green-700' },
  cancelled: { label: 'Geannuleerd',   bg: 'bg-red-50',     text: 'text-red-600' },
};

export function userInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
