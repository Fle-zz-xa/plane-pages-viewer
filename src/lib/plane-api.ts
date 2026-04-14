// Plane API Client
// Base URL: https://plane.rivetta.eu/api/

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

const PLANE_BASE_URL = 'https://plane.rivetta.eu/api';
const WORKSPACE_SLUG = 'rivetta'; // TODO: get from env
const PLANE_APP_URL = 'https://plane.rivetta.eu'; // For cookie sharing

// CSRF Token management
let csrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  const response = await fetch(`${PLANE_BASE_URL}/auth/get-csrf-token/`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to get CSRF token: ${response.status}`);
  }

  const data = await response.json();
  csrfToken = data.csrf_token || data.token || null;
  if (!csrfToken) {
    throw new Error('CSRF token not found in response');
  }
  return csrfToken;
}

// Get auth headers for API requests
// IMPORTANT: Must be called from a page that shares cookies with plane.rivetta.eu
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getCsrfToken();
  return {
    'Content-Type': 'application/json',
    'X-CSRFToken': token,
  };
}

// Helper to check if user is authenticated
export async function checkAuth(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${PLANE_BASE_URL}/workspaces/`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Fetch all pages from workspace
export async function fetchPages(workspaceSlug: string = WORKSPACE_SLUG): Promise<PlanePage[]> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${PLANE_BASE_URL}/workspaces/${workspaceSlug}/pages/`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      csrfToken = null; // Reset token on auth error
      throw new Error('Authentication failed. Please log in to Plane.');
    }
    throw new Error(`Failed to fetch pages: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || data; // Handle different response formats
}

// Fetch single page with full content
export async function fetchPage(workspaceSlug: string, pageId: string): Promise<PlanePage> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${PLANE_BASE_URL}/workspaces/${workspaceSlug}/pages/${pageId}/`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  return await response.json();
}

// Build tree structure from flat pages array
export function buildTree(pages: PlanePage[]): PageNode[] {
  const tree: PageNode[] = [];
  const lookup = new Map<string, PageNode>();

  // First pass: create nodes with empty children arrays
  pages.forEach(page => {
    lookup.set(page.id, { ...page, children: [] });
  });

  // Second pass: build hierarchy
  pages.forEach(page => {
    const node = lookup.get(page.id)!;
    if (page.parent_id && lookup.has(page.parent_id)) {
      lookup.get(page.parent_id)!.children.push(node);
    } else {
      tree.push(node);
    }
  });

  // Sort by sort_order
  tree.sort((a, b) => a.sort_order - b.sort_order);
  
  return tree;
}

// Create new page
export async function createPage(
  workspaceSlug: string,
  page: Partial<PlanePage>
): Promise<PlanePage> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${PLANE_BASE_URL}/workspaces/${workspaceSlug}/pages/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(page),
  });

  if (!response.ok) {
    throw new Error(`Failed to create page: ${response.status}`);
  }

  return await response.json();
}
