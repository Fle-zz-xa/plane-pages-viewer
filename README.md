# Plane Pages Hierarchical Viewer

**Doel:** Collapsible tree view voor Plane Pages met parent-child relaties.

**Status:** 🟡 In ontwikkeling

---

## Architectuur

```
┌─────────────────────────────────────────────────────┐
│  Plane API (plane.rivetta.eu/api/)                 │
│  GET /api/workspaces/{slug}/pages/                 │
│  Returns: pages[] met parent_id, sort_order        │
└──────────────────┬──────────────────────────────────┘
                   │ REST API (CSRf auth)
                   ▼
┌─────────────────────────────────────────────────────┐
│  Next.js App (rivetta.eu/vault-viewer)             │
│  - Fetch pages van Plane API                       │
│  - Build tree from parent_id                       │
│  - Render collapsible tree                         │
│  - Click page → show content                       │
└─────────────────────────────────────────────────────┘
```

---

## Dev Workflow

1. **Code op GitHub** — `Fle-zz-xa/plane-pages-viewer`
2. **Plane project voor tracking** — taken, bugs, features in Plane zelf
3. **Lokaal testen** — `npm run dev` → http://localhost:3003
4. **Deploy** — Cloudflare Pages (rivetta-eu project)

---

## Technische Specificatie

### Data Structuur

```json
{
  "id": "uuid",
  "name": "📁 Care+ Subscription",
  "parent_id": null,
  "sort_order": 65536,
  "is_global": true,
  "description_html": "<h2>Content</h2>..."
}
```

### Tree Building Algorithm

```typescript
interface PageNode {
  id: string;
  name: string;
  parent_id: string | null;
  children: PageNode[];
  description_html?: string;
}

function buildTree(pages: Page[]): PageNode[] {
  const tree: PageNode[] = [];
  const lookup = new Map<string, PageNode>();

  pages.forEach(page => {
    lookup.set(page.id, { ...page, children: [] });
  });

  pages.forEach(page => {
    const node = lookup.get(page.id)!;
    if (page.parent_id && lookup.has(page.parent_id)) {
      lookup.get(page.parent_id)!.children.push(node);
    } else {
      tree.push(node);
    }
  });

  return tree;
}
```

---

## Taken

- [ ] GitHub repo aanmaken + initial commit
- [ ] Next.js project scaffold (`npx create-next-app`)
- [ ] Plane API auth flow implementeren (CSRF token)
- [ ] Pages fetch + tree builder
- [ ] Collapsible tree UI component
- [ ] Page content viewer (rechts panel)
- [ ] Deploy naar Cloudflare Pages
- [ ] Link toevoegen in Plane sidebar (custom navigation)

---

## Deployment

**Cloudflare Pages:**
- Project: `rivetta-eu` (zelfde als main site)
- Route: `/vault-viewer` → Next.js app
- Build: `npm run build`
- Output: `dist/`

**Optioneel:** Embed als widget in Plane zelf (als Plane custom widgets ondersteunt).

---

## Referenties

- Plane API docs: https://docs.plane.so/
- Plane instance: https://plane.rivetta.eu
- GitHub org: https://github.com/Fle-zz-xa
