'use client';

import { useState } from 'react';
import { ChevronRight, Loader2, Archive } from 'lucide-react';
import {
  parsePhase, getNextPhase, encodePhase, stripPhaseMarker, PHASES,
} from '@/helpers/rivetta/phase';
import { RivettaPhaseBadge, RivettaPhaseTimeline } from '@/components/rivetta/phase-badge';
import { RivettaHandoffModal } from '@/components/rivetta/handoff-modal';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Props {
  project: Project;
  workspaceSlug: string;
  onUpdated?: (newDescription: string) => void;
}

/**
 * Calls Plane's own PATCH endpoint using session cookies (no API key needed
 * when rendered inside Plane's frontend). Returns the updated description string.
 *
 * If Plane uses CSRF protection, retrieve the token from cookies:
 *   const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1] ?? '';
 * and add header: 'X-CSRFToken': csrf
 *
 * Alternatively, replace this function with Plane's projectService:
 *   import { projectService } from '@/services/project';
 *   await projectService.updateProject(workspaceSlug, projectId, payload);
 */
async function patchProjectDescription(
  workspaceSlug: string,
  projectId: string,
  description: string
): Promise<void> {
  const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1] ?? '';
  const res = await fetch(
    `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRFToken': csrf } : {}),
      },
      body: JSON.stringify({ description }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
}

async function createHandoverPage(
  workspaceSlug: string,
  projectId: string,
  name: string,
  descriptionHtml: string
): Promise<void> {
  const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1] ?? '';
  const res = await fetch(
    `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/pages/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRFToken': csrf } : {}),
      },
      body: JSON.stringify({
        name,
        description_html: descriptionHtml,
        access: 0,
      }),
    }
  );
  if (!res.ok) throw new Error(`Pagina aanmaken mislukt (HTTP ${res.status})`);
}

export function RivettaPhaseControls({ project, workspaceSlug, onUpdated }: Props) {
  const [advancing, setAdvancing] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);

  const phase = parsePhase(project.description);
  const nextPhase = getNextPhase(phase);
  const phaseCfg = PHASES[phase];

  const handleAdvance = async () => {
    if (!nextPhase) return;
    if (phase === 'production') {
      setShowHandoff(true);
      return;
    }
    setAdvancing(true);
    try {
      const newDesc = encodePhase(nextPhase, stripPhaseMarker(project.description));
      await patchProjectDescription(workspaceSlug, project.id, newDesc);
      onUpdated?.(newDesc);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fase-overgang mislukt');
    } finally {
      setAdvancing(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm(`"${project.name}" archiveren?`)) return;
    try {
      const newDesc = encodePhase('archived', stripPhaseMarker(project.description));
      await patchProjectDescription(workspaceSlug, project.id, newDesc);
      onUpdated?.(newDesc);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Archiveren mislukt');
    }
  };

  const handleHandoffConfirm = async (briefing: string, checkedItems: string[]) => {
    setAdvancing(true);
    const today = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    const checklistHtml = checkedItems.map(item => `<li>✅ ${item}</li>`).join('');
    const briefingHtml = `
      <h2>Handover — ${project.name}</h2>
      <p><strong>Datum:</strong> ${today}</p>
      <h3>Checklist afgerond</h3>
      <ul>${checklistHtml}</ul>
      ${briefing.trim() ? `<h3>Toelichting voor Marketing &amp; Sales</h3><p>${briefing.replace(/\n/g, '<br/>')}</p>` : ''}
    `.trim();

    const newDesc = encodePhase('release', stripPhaseMarker(project.description));

    await Promise.all([
      createHandoverPage(
        workspaceSlug,
        project.id,
        `Handover briefing — ${today}`,
        briefingHtml
      ),
      patchProjectDescription(workspaceSlug, project.id, newDesc).then(() =>
        onUpdated?.(newDesc)
      ),
    ]);

    setShowHandoff(false);
    setAdvancing(false);
  };

  return (
    <>
      {/* Inline panel — embed this in the project header or settings sidebar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-custom-text-300">Fase</span>
            <RivettaPhaseBadge description={project.description} />
          </div>
          <div className="flex items-center gap-1.5">
            {nextPhase && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-custom-primary-100 text-custom-primary-600 hover:bg-custom-primary-200 rounded-md transition-colors disabled:opacity-50"
              >
                {advancing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                {PHASES[nextPhase].shortLabel}
              </button>
            )}
            {phase !== 'archived' && (
              <button
                onClick={handleArchive}
                title="Archiveren"
                className="p-1 text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 rounded transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <RivettaPhaseTimeline description={project.description} />
      </div>

      {showHandoff && (
        <RivettaHandoffModal
          project={project}
          onConfirm={handleHandoffConfirm}
          onCancel={() => setShowHandoff(false)}
        />
      )}
    </>
  );
}
