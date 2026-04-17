export type ProjectPhase =
  | 'vault'
  | 'design_s1'
  | 'design_s2'
  | 'design_s3'
  | 'preproduction'
  | 'production'
  | 'release'
  | 'marketing'
  | 'archived';

export interface PhaseConfig {
  label: string;
  shortLabel: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}

export const PHASES: Record<ProjectPhase, PhaseConfig> = {
  vault: {
    label: 'Vault — Idee',
    shortLabel: 'Vault',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    dotClass: 'bg-gray-400',
  },
  design_s1: {
    label: 'Design — Sample 1',
    shortLabel: 'Sample 1',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
    dotClass: 'bg-sky-500',
  },
  design_s2: {
    label: 'Redesign — Sample 2',
    shortLabel: 'Sample 2',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    dotClass: 'bg-blue-500',
  },
  design_s3: {
    label: 'Redesign — Sample 3',
    shortLabel: 'Sample 3',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    dotClass: 'bg-indigo-500',
  },
  preproduction: {
    label: 'Pre-productie',
    shortLabel: 'Pre-prod',
    bgClass: 'bg-violet-50',
    textClass: 'text-violet-700',
    dotClass: 'bg-violet-500',
  },
  production: {
    label: 'Productie',
    shortLabel: 'Productie',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    dotClass: 'bg-orange-500',
  },
  release: {
    label: 'Release',
    shortLabel: 'Release',
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
    dotClass: 'bg-green-500',
  },
  marketing: {
    label: 'Marketing & Sales',
    shortLabel: 'Marketing',
    bgClass: 'bg-pink-50',
    textClass: 'text-pink-700',
    dotClass: 'bg-pink-500',
  },
  archived: {
    label: 'Gearchiveerd',
    shortLabel: 'Archief',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-400',
    dotClass: 'bg-gray-300',
  },
};

export const PHASE_ORDER: ProjectPhase[] = [
  'vault',
  'design_s1',
  'design_s2',
  'design_s3',
  'preproduction',
  'production',
  'release',
  'marketing',
  'archived',
];

// Active phases shown in the "In ontwikkeling" group
export const ACTIVE_PHASES: ProjectPhase[] = [
  'design_s1', 'design_s2', 'design_s3', 'preproduction', 'production',
];

const MARKER_RE = /^\[_riv:([a-z_0-9]+)\]\n?/;

export function parsePhase(description: string): ProjectPhase {
  const m = (description ?? '').match(MARKER_RE);
  if (m && m[1] in PHASES) return m[1] as ProjectPhase;
  return 'vault';
}

export function encodePhase(phase: ProjectPhase, description: string): string {
  return `[_riv:${phase}]\n${stripPhaseMarker(description)}`;
}

export function stripPhaseMarker(description: string): string {
  return (description ?? '').replace(MARKER_RE, '');
}

export function getNextPhase(current: ProjectPhase): ProjectPhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  // archived is the last, marketing->archived requires explicit archive action
  if (idx < 0 || idx >= PHASE_ORDER.length - 1) return null;
  if (current === 'marketing') return null; // archiving is a separate action
  return PHASE_ORDER[idx + 1];
}
