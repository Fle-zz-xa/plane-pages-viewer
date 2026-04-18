'use client';

import { parsePhase, PHASES, ProjectPhase } from '@/helpers/rivetta/phase';

interface Props {
  description: string;
  className?: string;
  /** Force a specific phase instead of parsing from description */
  phase?: ProjectPhase;
}

export function RivettaPhaseBadge({ description, className = '', phase: forcedPhase }: Props) {
  const phase = forcedPhase ?? parsePhase(description);
  const cfg = PHASES[phase];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bgClass} ${cfg.textClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
      {cfg.shortLabel}
    </span>
  );
}

/** Phase progress bar — shows all non-archived phases as colored segments */
export function RivettaPhaseTimeline({ description }: { description: string }) {
  const current = parsePhase(description);
  const visible = ['vault', 'design_s1', 'design_s2', 'design_s3', 'preproduction', 'production', 'release', 'marketing'] as ProjectPhase[];
  const activeIdx = visible.indexOf(current);

  return (
    <div className="flex items-center gap-0.5 w-full">
      {visible.map((phase, idx) => {
        const cfg = PHASES[phase];
        const done = idx < activeIdx;
        const active = idx === activeIdx;
        return (
          <div
            key={phase}
            title={cfg.label}
            className={`h-1 flex-1 rounded-full transition-all ${
              active ? cfg.dotClass : done ? 'bg-indigo-300' : 'bg-gray-200'
            }`}
          />
        );
      })}
    </div>
  );
}
