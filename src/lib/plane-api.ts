export interface PlanePage {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  is_global: boolean;
  description_html?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PageNode extends PlanePage {
  children: PageNode[];
}

function makeHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': apiKey,
  };
}

export async function fetchPages(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string
): Promise<PlanePage[]> {
  const res = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/pages/`, {
    headers: makeHeaders(apiKey),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Ongeldige API key. Controleer je instellingen.');
    throw new Error(`Kan pages niet ophalen: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.results ?? data;
}

export async function fetchPage(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  pageId: string
): Promise<PlanePage> {
  const res = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/pages/${pageId}/`, {
    headers: makeHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Kan page niet ophalen: ${res.status}`);
  return res.json();
}

export async function createPage(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  page: Partial<PlanePage>
): Promise<PlanePage> {
  const res = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/pages/`, {
    method: 'POST',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(page),
  });
  if (!res.ok) throw new Error(`Kan page niet aanmaken: ${res.status}`);
  return res.json();
}

export async function updatePage(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  pageId: string,
  updates: Partial<PlanePage>
): Promise<PlanePage> {
  const res = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/pages/${pageId}/`, {
    method: 'PATCH',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Kan page niet bijwerken: ${res.status}`);
  return res.json();
}

export async function deletePage(
  baseUrl: string,
  workspaceSlug: string,
  apiKey: string,
  pageId: string
): Promise<void> {
  const res = await fetch(`${baseUrl}/api/workspaces/${workspaceSlug}/pages/${pageId}/`, {
    method: 'DELETE',
    headers: makeHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Kan page niet verwijderen: ${res.status}`);
}

export function buildTree(pages: PlanePage[]): PageNode[] {
  const lookup = new Map<string, PageNode>();
  pages.forEach(p => lookup.set(p.id, { ...p, children: [] }));

  const tree: PageNode[] = [];
  pages.forEach(p => {
    const node = lookup.get(p.id)!;
    if (p.parent_id && lookup.has(p.parent_id)) {
      lookup.get(p.parent_id)!.children.push(node);
    } else {
      tree.push(node);
    }
  });

  const sort = (nodes: PageNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach(n => sort(n.children));
  };
  sort(tree);
  return tree;
}

export function flattenTree(nodes: PageNode[]): PageNode[] {
  return nodes.flatMap(n => [n, ...flattenTree(n.children)]);
}
