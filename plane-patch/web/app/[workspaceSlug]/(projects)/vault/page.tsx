'use client';

/**
 * Rivetta Vault — overzicht van projecten in de Vault-fase (ideeën die nog niet in ontwikkeling zijn).
 *
 * INTEGRATIE IN PLANE:
 * - Plaats dit bestand in: web/app/[workspaceSlug]/(projects)/vault/page.tsx
 * - Voeg een nav-item toe in de workspace sidebar (zie APPLY.md)
 *
 * PLANE-SPECIFIEKE AANPASSINGEN NODIG:
 * De `useProject` hook en het `IProject` type hieronder zijn gebaseerd op Plane's gebruikelijke
 * patroon. Controleer de exacte import paden in jouw Plane versie:
 *   - Hook: zoek naar `useProject` of `useProjectStore` in web/core/hooks/store/
 *   - Type:  zoek naar `IProject` in web/core/types/projects/
 *   - Router: `useParams` werkt standaard in Next.js App Router
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { Package, ChevronRight, Loader2, Search } from 'lucide-react';

import { parsePhase, encodePhase, stripPhaseMarker, PHASES } from '@/helpers/rivetta/phase';
import { RivettaPhaseTimeline } from '@/components/rivetta/phase-badge';

// ─── Plane-specific imports ─────────────────────────────────────────────────
// Adjust these import paths to match your actual Plane version:
//
//   import { useProject } from '@/hooks/store/use-project';
//   OR
//   import { useAppStore } from '@/hooks/store';
//   const { project: projectStore } = useAppStore();
//
// For the IProject type, check web/core/types/projects/projects.d.ts
// ────────────────────────────────────────────────────────────────────────────

// Minimal interface — Plane's IProject will have more fields
interface IProject {
  id: string;
  name: string;
  description: string;
  identifier: string;
  created_at: string;
}

// Replace this with Plane's actual project store hook
function usePlaneProjects(): { projects: IProject[]; loading: boolean } {
  // TODO: replace with actual Plane hook, e.g.:
  //
  // const { workspaceProjectIds, getProjectById } = useProject();
  // const projects = workspaceProjectIds?.map(id => getProjectById(id)).filter(Boolean) ?? [];
  // return { projects: projects as IProject[], loading: false };
  //
  // Or with useAppStore:
  // const { project } = useAppStore();
  // const { workspaceSlug } = useParams();
  // useEffect(() => { project.fetchProjects(workspaceSlug as string); }, [workspaceSlug]);
  // const projects = Object.values(project.projects ?? {}) as IProject[];
  // return { projects, loading: project.loader };

  return { projects: [], loading: false }; // stub — replace above
}

const VaultPage = observer(() => {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [advancing, setAdvancing] = useState<string | null>(null);

  const { projects, loading } = usePlaneProjects();

  const vaultProjects = projects.filter(
    p => parsePhase(p.description) === 'vault'
  );

  const filtered = query.trim()
    ? vaultProjects.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        stripPhaseMarker(p.description).toLowerCase().includes(query.toLowerCase())
      )
    : vaultProjects;

  const handleStartDesign = async (project: IProject) => {
    if (!confirm(`"${project.name}" starten met Sample 1?`)) return;
    setAdvancing(project.id);
    try {
      const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1] ?? '';
      const newDesc = encodePhase('design_s1', stripPhaseMarker(project.description));
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/projects/${project.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(csrf ? { 'X-CSRFToken': csrf } : {}),
          },
          body: JSON.stringify({ description: newDesc }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Navigate to the project after advancing
      router.push(`/${workspaceSlug}/projects/${project.id}/issues/`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fout bij fase-overgang');
    } finally {
      setAdvancing(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="h-full flex flex-col bg-custom-background-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-custom-border-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-custom-text-100">Vault</h1>
            <p className="text-xs text-custom-text-300">
              {vaultProjects.length} idee{vaultProjects.length !== 1 ? 'ën' : ''} in de wacht
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-custom-text-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Zoeken..."
            className="pl-8 pr-3 py-1.5 text-sm border border-custom-border-200 bg-custom-background-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-primary-100 text-custom-text-100 placeholder:text-custom-text-400 w-48"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-custom-text-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Package className="w-10 h-10 text-custom-text-400 mb-3" />
            <p className="text-sm font-medium text-custom-text-200">
              {query ? 'Geen resultaten' : 'Vault is leeg'}
            </p>
            <p className="text-xs text-custom-text-400 mt-1">
              {query
                ? 'Probeer een andere zoekterm'
                : 'Maak een nieuw project aan in de Vault-fase om ideeën te bewaren'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => {
              const cleanDesc = stripPhaseMarker(project.description);
              return (
                <div
                  key={project.id}
                  className="group bg-custom-background-90 border border-custom-border-200 rounded-xl p-4 flex flex-col gap-3 hover:border-custom-border-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-custom-text-100 truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-custom-text-400 mt-0.5 font-mono">
                        {project.identifier}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      {PHASES.vault.shortLabel}
                    </span>
                  </div>

                  {cleanDesc && (
                    <p className="text-xs text-custom-text-300 line-clamp-2">{cleanDesc}</p>
                  )}

                  <RivettaPhaseTimeline description={project.description} />

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-custom-text-400">
                      {formatDate(project.created_at)}
                    </span>
                    <button
                      onClick={() => handleStartDesign(project)}
                      disabled={advancing === project.id}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-custom-primary-100 text-custom-primary-600 hover:bg-custom-primary-200 rounded-md transition-colors disabled:opacity-50"
                    >
                      {advancing === project.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      Start Design
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default VaultPage;
