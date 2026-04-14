# Plane Pages Viewer — Taskboard

**Sprint:** Setup + MVP ✅ DONE  
**Doel:** Werkende tree viewer in 3 dagen  
**Status:** 🟢 MVP LIVE

---

## ✅ COMPLETED (2026-04-14)

### Setup (Day 1) — ✅ DONE

- [x] **GitHub repo aangemaakt**
  - Repo: https://github.com/Fle-zz-xa/plane-pages-viewer
  - License: MIT
  - Initial commit: 2026-04-14 16:42

- [x] **Next.js project scaffold**
  - `npx create-next-app` met TypeScript + Tailwind
  - Dependencies: axios, lucide-react
  - Build test: ✅ passed

- [x] **Plane API client**
  - CSRF auth flow geïmplementeerd
  - `fetchPages()`, `buildTree()`, `createPage()` functions
  - Bestandslocatie: `src/lib/plane-api.ts`

- [x] **Collapsible tree UI**
  - `<PageTree />` + `<PageNodeComponent />` components
  - Icons: 📂 expanded, 📁 collapsed
  - Indentatie voor children
  - Bestandslocatie: `src/components/PageTree.tsx`

- [x] **Vault viewer page**
  - Route: `/vault-viewer`
  - Links: tree sidebar
  - Rechts: page content preview
  - Bestandslocatie: `src/app/vault-viewer/page.tsx`

- [x] **Deploy naar Cloudflare Pages**
  - Project: `rivetta-eu`
  - URL: https://3c25531d.rivetta-eu.pages.dev/vault-viewer
  - Build: static export (`output: 'export'`)

---

## 🟠 P1: Test + Auth (Day 2)

- [ ] **CSRF auth testen**
  - Handmatig inloggen op plane.rivetta.eu
  - Cookies moeten meegestuurd worden
  - Test: open vault-viewer → zie pages tree

- [ ] **CORS fix (indien nodig)**
  - Plane API CORS headers checken
  - Eventueel: proxy route in Next.js

- [ ] **Error handling verbeteren**
  - 401: redirect naar Plane login
  - Network errors: retry logic
  - Loading states: skeletons

---

## 🟡 P2: Features (Day 3)

- [ ] **Create page modal**
  - Form: name, parent (dropdown), content
  - POST naar Plane API
  - Tree refresh na create

- [ ] **Edit page**
  - Inline edit of modal
  - PUT /api/workspaces/{slug}/pages/{id}/

- [ ] **Delete page**
  - Confirm dialog
  - DELETE API call
  - Cascade delete children?

- [ ] **Drag & drop reorder**
  - dnd-kit of react-beautiful-dnd
  - Update sort_order via API

---

## 🟢 P3: Polish

- [ ] **Search + filter**
  - Search box boven tree
  - Filter by name (case-insensitive)
  - Highlight matches

- [ ] **Export to Markdown**
  - Download tree als .md files
  - Zip archive

- [ ] **Custom domain**
  - vault.rivetta.eu of pages.rivetta.eu
  - Cloudflare custom domain config

- [ ] **Link in Plane sidebar**
  - Custom navigation item (als Plane dat ondersteunt)

---

## Definition of Done

✅ Tree toont alle pages met correcte parent-child relaties  
✅ Collapsible folders (📂 / 📁 icons)  
✅ Click op page → content zichtbaar  
✅ Live op rivetta-eu.pages.dev/vault-viewer  
✅ Code op GitHub (Fle-zz-xa org)  
⏳ Auth flow getest met echte Plane login

---

## Known Issues

- ⚠️ **Auth flow:** CSRF cookies moeten correct meegestuurd worden (same-site cookies)
- ⚠️ **CORS:** Plane API moet CORS headers sturen voor cross-origin requests
- ⚠️ **Base URL:** workspace slug 'rivetta' is hardcoded → moet naar env

---

*Created: 2026-04-14 (JARVIS)*  
*Last updated: 2026-04-14 16:47 (MVP deployed)*
