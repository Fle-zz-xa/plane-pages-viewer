# Plane Pages Viewer — Taskboard

**Sprint:** Setup + MVP  
**Doel:** Werkende tree viewer in 3 dagen

---

## 🔴 P0: Setup (Day 1)

- [ ] **GitHub repo aanmaken**
  - Repo: `Fle-zz-xa/plane-pages-viewer`
  - License: MIT
  - README.md pushen

- [ ] **Next.js project scaffold**
  - `npx create-next-app@latest . --typescript --tailwind --app`
  - Dependencies: `axios`, `lucide-react` (icons)
  - Test: `npm run dev` → localhost:3003

- [ ] **Plane workspace + project aanmaken**
  - Workspace: `Rivetta`
  - Project: `Plane Pages Viewer`
  - Issues aanmaken voor deze taskboard items

- [ ] **CSRF auth flow testen**
  - Script: `scripts/test-plane-auth.js`
  - GET /auth/get-csrf-token → cookie + token
  - POST met `X-CSRFToken` header

---

## 🟠 P1: Core Features (Day 2)

- [ ] **Pages API fetch**
  - Function: `fetchPages(workspaceSlug)`
  - Return: `Page[]` met alle fields
  - Error handling: 401, 403, network

- [ ] **Tree builder implementeren**
  - Function: `buildTree(pages)` → `PageNode[]`
  - Test met dummy data
  - Edge cases: orphan pages, circular refs

- [ ] **Collapsible tree UI**
  - Component: `<PageTree />` + `<PageNode />`
  - Icons: 📂 expanded, 📁 collapsed
  - Indentatie voor children
  - Click handler: toggle expand

- [ ] **Page content viewer**
  - Rechts panel (50% width)
  - Render `description_html` met `dangerouslySetInnerHTML`
  - Loading state, error state

---

## 🟡 P2: Polish + Deploy (Day 3)

- [ ] **Styling + UX**
  - Tailwind classes voor layout
  - Hover states, transitions
  - Responsive (mobile: accordion)

- [ ] **Deploy naar Cloudflare Pages**
  - `npx wrangler pages deploy dist --project-name rivetta-eu`
  - Route: `/vault-viewer`
  - Test live URL

- [ ] **Link in Plane navigation**
  - Custom navigation item toevoegen (als Plane dat ondersteunt)
  - Of: bookmark sharen met team

---

## 🟢 P3: Future Features

- [ ] **Create/edit page from viewer**
  - POST /api/workspaces/{slug}/pages/
  - Form modal: name, parent, content
  - Refresh tree after create

- [ ] **Drag & drop reorder**
  - Sort_order updaten via API
  - Visual feedback tijdens drag

- [ ] **Search + filter**
  - Search box: filter by name
  - Filter: hide empty folders

- [ ] **Export to Markdown**
  - Download tree als .md files
  - Zip archive voor backup

---

## Definition of Done

✅ Tree toont alle pages met correcte parent-child relaties  
✅ Collapsible folders (📂 / 📁 icons)  
✅ Click op page → content zichtbaar  
✅ Live op rivetta.eu/vault-viewer  
✅ Code op GitHub (Fle-zz-xa org)

---

*Created: 2026-04-14 (JARVIS)*
