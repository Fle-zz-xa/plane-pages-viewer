import { PlanePage } from '@/lib/plane-api';
import { getSettings } from '@/lib/settings';
import { fetchPages, createPage, updatePage, deletePage } from '@/lib/plane-api';
import {
  fetchProjectPages, createProjectPage, updateProjectPage, deleteProjectPage,
} from '@/lib/projects-api';

export interface WikiApi {
  fetch: () => Promise<PlanePage[]>;
  create: (data: { name: string; parent_id: string | null; description_html: string }) => Promise<PlanePage>;
  update: (id: string, updates: Partial<PlanePage>) => Promise<PlanePage>;
  delete: (id: string) => Promise<void>;
}

// Each function reads getSettings() at call time — always fresh after settings change
export const workspaceWikiApi: WikiApi = {
  fetch: () => {
    const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
    return fetchPages(planeBaseUrl, workspaceSlug, apiKey);
  },
  create: ({ name, parent_id, description_html }) => {
    const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
    return createPage(planeBaseUrl, workspaceSlug, apiKey, { name, parent_id, is_global: true, description_html });
  },
  update: (id, updates) => {
    const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
    return updatePage(planeBaseUrl, workspaceSlug, apiKey, id, updates);
  },
  delete: (id) => {
    const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
    return deletePage(planeBaseUrl, workspaceSlug, apiKey, id);
  },
};

export function makeProjectWikiApi(projectId: string): WikiApi {
  return {
    fetch: () => {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      return fetchProjectPages(planeBaseUrl, workspaceSlug, apiKey, projectId);
    },
    create: ({ name, parent_id, description_html }) => {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      return createProjectPage(planeBaseUrl, workspaceSlug, apiKey, projectId, { name, parent_id, is_global: false, description_html });
    },
    update: (id, updates) => {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      return updateProjectPage(planeBaseUrl, workspaceSlug, apiKey, projectId, id, updates);
    },
    delete: (id) => {
      const { apiKey, workspaceSlug, planeBaseUrl } = getSettings();
      return deleteProjectPage(planeBaseUrl, workspaceSlug, apiKey, projectId, id);
    },
  };
}
