# Rivetta Features — Plane Integration Guide

This directory contains ready-to-copy files that add Rivetta's fase-tracking, handoff mechanism,
project templates, and vault view directly into Plane's source code.

## Prerequisites

```bash
# Clone your Plane fork (or use your existing installation)
git clone https://github.com/makeplane/plane.git
cd plane
git checkout -b rivetta-features

# Verify your Plane version
cat web/package.json | grep '"version"'
```

---

## Step 1 — Copy new files

Run from the root of the Plane repository:

```bash
# Source: the plane-patch/ directory from plane-pages-viewer repo
PATCH_DIR=/path/to/plane-pages-viewer/plane-patch

# Copy helpers
mkdir -p web/core/helpers/rivetta
cp "$PATCH_DIR/web/core/helpers/rivetta/phase.ts" web/core/helpers/rivetta/

# Copy components
mkdir -p web/core/components/rivetta
cp "$PATCH_DIR/web/core/components/rivetta/"*.tsx web/core/components/rivetta/

# Copy vault page (adjust path if Plane uses different routing structure)
mkdir -p "web/app/[workspaceSlug]/(projects)/vault"
cp "$PATCH_DIR/web/app/[workspaceSlug]/(projects)/vault/page.tsx" \
   "web/app/[workspaceSlug]/(projects)/vault/"
```

Verify the routing directory exists in your Plane version:
```bash
ls web/app/*/\(projects\)/
# Should show: issues/ pages/ cycles/ modules/ etc.
# If not found, check: ls web/apps/app/app/[workspaceSlug]/
```

---

## Step 2 — Fix import paths in copied files

The copied files use `@/helpers/...` and `@/components/...` which map to `web/core/`.
Check `web/tsconfig.json` for the `paths` config. If Plane uses a different alias, do a
find-and-replace:

```bash
# Check what aliases Plane uses
cat web/tsconfig.json | grep -A20 '"paths"'

# Common Plane alias: @plane-web/... or just @/...
# Update if needed:
sed -i 's|@/helpers/rivetta/|@plane-web/helpers/rivetta/|g' \
  web/core/components/rivetta/*.tsx

sed -i 's|@/components/rivetta/|@plane-web/components/rivetta/|g' \
  web/core/components/rivetta/*.tsx \
  "web/app/[workspaceSlug]/(projects)/vault/page.tsx"
```

---

## Step 3 — Fix the vault page store integration

**File:** `web/app/[workspaceSlug]/(projects)/vault/page.tsx`

The `usePlaneProjects` function is a stub. Replace it with Plane's actual hook.

Find what's available:
```bash
grep -r "useProject\|workspaceProjectIds\|getProjectById" web/core/hooks/ | head -10
grep -r "export.*useProject" web/core/hooks/ | head -5
```

Typical replacement (adapt to what you find):

```tsx
// Replace the entire usePlaneProjects function with:
function usePlaneProjects(): { projects: IProject[]; loading: boolean } {
  const { workspaceProjectIds, getProjectById } = useProject(); // from '@/hooks/store/use-project'
  const projects = (workspaceProjectIds ?? [])
    .map(id => getProjectById(id))
    .filter(Boolean) as IProject[];
  return { projects, loading: false };
}
```

Add the import at the top:
```tsx
import { useProject } from '@/hooks/store/use-project';
// (adjust path as needed)
```

---

## Step 4 — Add phase badge to project cards

Find the project card component:
```bash
find web/core/components/project -name "*.tsx" | xargs grep -l "project.name" | head -5
# Look for: card-list-item.tsx, card-grid-item.tsx, project-list-item.tsx, or similar
```

In that file, add the import and badge:

```tsx
// Add import at top:
import { RivettaPhaseBadge } from '@/components/rivetta/phase-badge';

// Find where project.name is rendered, e.g.:
//   <span className="...">{project.name}</span>
// Add below it:
<RivettaPhaseBadge description={project.description ?? ''} className="mt-0.5" />
```

Do the same for the grid card variant if it exists.

---

## Step 5 — Add phase controls to project header/settings

Find the project detail header or settings panel:
```bash
find web/core/components -name "*.tsx" | xargs grep -l "updateProject\|project.*identifier" | head -10
find web/core/components/headers -name "*.tsx" 2>/dev/null
find web/app -name "layout.tsx" -path "*projects*" | head -5
```

In the project settings sidebar or header, add:

```tsx
// Add import:
import { RivettaPhaseControls } from '@/components/rivetta/phase-controls';

// Add component (needs project object and workspaceSlug):
<RivettaPhaseControls
  project={{ id: project.id, name: project.name, description: project.description ?? '' }}
  workspaceSlug={workspaceSlug}
  onUpdated={(newDesc) => {
    // Trigger a re-fetch or update the MobX store:
    // Option A: mutate store directly
    //   projectStore.projects[project.id].description = newDesc;
    // Option B: call Plane's updateProject action
    //   projectStore.updateProject(workspaceSlug, project.id, { description: newDesc });
    // Option C: router.refresh() — simplest, triggers server re-fetch
    router.refresh();
  }}
/>
```

A good place to add this is in the "Settings" dropdown or the project detail sidebar,
next to where the project network (public/private) is shown.

---

## Step 6 — Add template support to create-project modal

**File:** `web/core/components/project/create-project-modal.tsx`

Find this file:
```bash
find web -name "create-project-modal.tsx" 2>/dev/null
```

Add these imports at the top:
```tsx
import { encodePhase, ProjectPhase, PHASES } from '@/helpers/rivetta/phase';
```

Add state near other useState declarations:
```tsx
const [rivettaPhase, setRivettaPhase] = useState<ProjectPhase>('vault');
const [useTemplate, setUseTemplate] = useState(true);
```

Find where the form fields end (before the submit button), add:

```tsx
{/* ── Rivetta: Startfase ── */}
<div className="space-y-2">
  <label className="text-sm font-medium text-custom-text-200">Startfase</label>
  <div className="flex flex-col gap-1.5">
    {(['vault', 'design_s1'] as ProjectPhase[]).map(ph => (
      <label key={ph} className="flex items-center gap-2 cursor-pointer text-sm text-custom-text-200">
        <input
          type="radio"
          name="rivetta-phase"
          checked={rivettaPhase === ph}
          onChange={() => setRivettaPhase(ph)}
          className="accent-custom-primary-100"
        />
        {PHASES[ph].label}
      </label>
    ))}
  </div>
</div>

{/* ── Rivetta: Template pagina's ── */}
<div>
  <label className="flex items-center gap-2 cursor-pointer text-sm text-custom-text-200">
    <input
      type="checkbox"
      checked={useTemplate}
      onChange={e => setUseTemplate(e.target.checked)}
      className="accent-custom-primary-100"
    />
    Standaard pagina's aanmaken
  </label>
  {useTemplate && (
    <div className="ml-6 mt-1.5 flex flex-wrap gap-1.5">
      {(rivettaPhase === 'vault'
        ? ['Brief']
        : ['Brief', 'Design', 'Materialen', 'Technisch', 'Productie', 'Marketing & Sales']
      ).map(p => (
        <span key={p} className="px-2 py-0.5 bg-custom-primary-10 text-custom-primary-100 text-xs rounded font-medium">{p}</span>
      ))}
    </div>
  )}
</div>
```

In the form submit handler, after the project is created, add template page creation.
Find the line where `createProject` or `project.createProject(...)` resolves, then add:

```tsx
// After project creation:
const encodedDesc = encodePhase(rivettaPhase, formData.description ?? '');
// Re-submit or patch the description to add the phase marker:
await projectService.updateProject(workspaceSlug, project.id, { description: encodedDesc });
// Or better: include the encoded description in the initial createProject payload:
//   formData.description = encodePhase(rivettaPhase, formData.description ?? '');

if (useTemplate) {
  const templatePages = rivettaPhase === 'vault'
    ? ['Brief']
    : ['Brief', 'Design', 'Materialen', 'Technisch', 'Productie', 'Marketing & Sales'];

  const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1] ?? '';
  await Promise.all(
    templatePages.map((name, idx) =>
      fetch(`/api/v1/workspaces/${workspaceSlug}/projects/${project.id}/pages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        body: JSON.stringify({
          name,
          description_html: '<p></p>',
          access: 0,
          sort_order: (idx + 1) * 10000,
        }),
      })
    )
  );
}
```

---

## Step 7 — Add Vault nav item to workspace sidebar

Find the sidebar navigation file:
```bash
find web/core/components/workspace -name "*.tsx" | xargs grep -l "href.*issues\|projects" | head -5
find web/core/components/sidebar -name "*.tsx" 2>/dev/null | head -5
```

In the navigation list, add a Vault item after the Projects link:

```tsx
import { Package } from 'lucide-react';

// In the nav items array or JSX, add:
{
  label: 'Vault',
  href: `/${workspaceSlug}/vault`,
  icon: Package,
}

// Or as direct JSX next to the Projects link:
<Link
  href={`/${workspaceSlug}/vault`}
  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
    pathname.includes('/vault')
      ? 'bg-custom-primary-10 text-custom-primary-100 font-medium'
      : 'text-custom-text-200 hover:bg-custom-background-80'
  }`}
>
  <Package className="w-4 h-4" />
  Vault
</Link>
```

---

## Step 8 — Tailwind safelist

**File:** `web/tailwind.config.js` (or `tailwind.config.ts`)

Add the Rivetta phase colors to the safelist so they aren't purged:

```js
safelist: [
  // Rivetta phase colors
  'bg-gray-100', 'text-gray-600', 'bg-gray-400',
  'bg-sky-50', 'text-sky-700', 'bg-sky-500',
  'bg-blue-50', 'text-blue-700', 'bg-blue-500',
  'bg-indigo-50', 'text-indigo-700', 'bg-indigo-500',
  'bg-violet-50', 'text-violet-700', 'bg-violet-500',
  'bg-orange-50', 'text-orange-700', 'bg-orange-500',
  'bg-green-50', 'text-green-700', 'bg-green-500',
  'bg-pink-50', 'text-pink-700', 'bg-pink-500',
  'bg-gray-300', 'text-gray-400',
],
```

---

## Step 9 — Build & Deploy

```bash
cd web

# Install dependencies (use the package manager Plane uses)
pnpm install   # or yarn install / npm install

# Build
pnpm build     # or turbo run build --filter=web

# Restart the Docker container
cd ..  # back to Plane root
docker compose ps                    # find the frontend service name
docker compose restart plane-web     # replace 'plane-web' with actual name
docker compose logs -f plane-web     # watch for errors
```

---

## Verification Checklist

- [ ] Projects list shows phase badge (e.g. "Sample 1", "Productie") on each card
- [ ] Creating a new project shows Startfase radio + template checkbox
- [ ] After creating a project with template, pages are created in the project
- [ ] Opening a project shows phase controls (current phase badge + advance button)
- [ ] Advancing from Productie → shows handoff checklist modal
- [ ] Completing handoff creates a "Handover briefing" page in project pages
- [ ] Navigating to `/[workspace]/vault` shows vault projects grid
- [ ] "Start Design" on vault card advances project to design_s1

---

## Troubleshooting

**Phase badge not showing:** The description field may be `null` — ensure you use `project.description ?? ''`.

**CSRF errors on PATCH/POST:** Add the CSRF token header (already in phase-controls.tsx).
If still failing, use Plane's internal `projectService` instead of raw fetch.

**Import errors:** Check `web/tsconfig.json` for the correct `@/` alias and adjust imports.

**Vault page not routing:** Check the exact route group structure in `web/app/[workspaceSlug]/`.
The `(projects)` group might be named differently — check with `ls web/app/[workspaceSlug]/`.

**MobX observer not updating after phase change:** Call `router.refresh()` in `onUpdated` 
to trigger a server re-fetch, or use the MobX store's updateProject action to mutate in place.
