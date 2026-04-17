import { PlanePage } from '@/lib/plane-api';

export interface PlaneProject {
  id: string;
  name: string;
  description: string;
  identifier: string;
  network: number;
  status: string;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

function makeHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': apiKey,
  };
}

export async function fetchProjects(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string
): Promise<PlaneProject[]> {
  const res = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/projects/`, {
    headers: makeHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Kan projecten niet ophalen: ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

export async function createProject(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  project: { name: string; description: string; identifier: string; network: number }
): Promise<PlaneProject> {
  const res = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/projects/`, {
    method: 'POST',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error(`Kan project niet aanmaken: ${res.status}`);
  return res.json();
}

export async function updateProject(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  projectId: string,
  updates: Partial<Pick<PlaneProject, 'name' | 'description' | 'network'>>
): Promise<PlaneProject> {
  const res = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/`, {
    method: 'PATCH',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Kan project niet bijwerken: ${res.status}`);
  return res.json();
}

export async function deleteProject(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  projectId: string
): Promise<void> {
  const res = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/`, {
    method: 'DELETE',
    headers: makeHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Kan project niet verwijderen: ${res.status}`);
}

// Project-level pages (sections)
export async function fetchProjectPages(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  projectId: string
): Promise<PlanePage[]> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`,
    { headers: makeHeaders(apiKey) }
  );
  if (!res.ok) throw new Error(`Kan secties niet ophalen: ${res.status}`);
  const data = await res.json();
  return data.results ?? data;
}

export async function createProjectPage(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  projectId: string,
  page: Partial<PlanePage>
): Promise<PlanePage> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/`,
    {
      method: 'POST',
      headers: makeHeaders(apiKey),
      body: JSON.stringify(page),
    }
  );
  if (!res.ok) throw new Error(`Kan sectie niet aanmaken: ${res.status}`);
  return res.json();
}

export async function updateProjectPage(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  projectId: string,
  pageId: string,
  updates: Partial<PlanePage>
): Promise<PlanePage> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`,
    {
      method: 'PATCH',
      headers: makeHeaders(apiKey),
      body: JSON.stringify(updates),
    }
  );
  if (!res.ok) throw new Error(`Kan sectie niet bijwerken: ${res.status}`);
  return res.json();
}

export async function deleteProjectPage(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  projectId: string,
  pageId: string
): Promise<void> {
  const res = await fetch(
    `${baseUrl}/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/`,
    {
      method: 'DELETE',
      headers: makeHeaders(apiKey),
    }
  );
  if (!res.ok) throw new Error(`Kan sectie niet verwijderen: ${res.status}`);
}

export function generateIdentifier(name: string): string {
  const upper = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  const words = upper.split(/\s+/).filter(Boolean);
  const fromInitials = words.map(w => w[0]).join('').slice(0, 5);
  if (fromInitials.length >= 2) return fromInitials;
  return upper.replace(/\s+/g, '').slice(0, 5) || 'PROJ';
}
