# Plane Pages Hierarchical Viewer

**Doel:** Collapsible tree view voor Plane Pages met parent-child relaties.

**Status:** 🟢 MVP LIVE

**Live URL:** https://108d6d96.plane-pages-viewer.pages.dev/vault-viewer

---

## Architectuur

```
┌─────────────────────────────────────────────────────┐
│  Plane API (plane.rivetta.eu/api/)                 │
│  GET /api/workspaces/{slug}/pages/                 │
│  Returns: pages[] met parent_id, sort_order        │
└──────────────────┬──────────────────────────────────┘
                   │ REST API (CSRF auth)
                   ▼
┌─────────────────────────────────────────────────────┐
│  Next.js App (plane-pages-viewer.pages.dev)        │
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
4. **Deploy** — Cloudflare Pages (apart project, raakt rivetta.eu niet)

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

- [x] GitHub repo aanmaken + initial commit
- [x] Next.js project scaffold (`npx create-next-app`)
- [x] Plane API auth flow implementeren (CSRF token)
- [x] Pages fetch + tree builder
- [x] Collapsible tree UI component
- [x] Page content viewer (rechts panel)
- [x] Deploy naar Cloudflare Pages (apart project)
- [ ] Link toevoegen in Plane sidebar (custom navigation)

---

## Deployment

**Cloudflare Pages:**
- Project: `plane-pages-viewer` (apart van rivetta-eu!)
- Route: `/vault-viewer` → Next.js app
- Build: `npm run build`
- Output: `dist/`
- Live: https://108d6d96.plane-pages-viewer.pages.dev/vault-viewer

**Custom domain (optioneel):**
- vault.plane.rivetta.eu → CNAME naar plane-pages-viewer.pages.dev

---

## Referenties

- Plane API docs: https://docs.plane.so/
- Plane instance: https://plane.rivetta.eu
- GitHub org: https://github.com/Fle-zz-xa
- GitHub repo: https://github.com/Fle-zz-xa/plane-pages-viewer
