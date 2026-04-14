# Plane Pages Viewer — Dev Team Setup

**Doel:** Plane workspace + project aanmaken voor tracking van Plane Pages Viewer development.

---

## Instructies voor Ricardo

### Stap 1: Log in op Plane

Ga naar: https://plane.rivetta.eu  
Login met: `ricardo@rivetta.eu` / `Rivetta2026!`

### Stap 2: Maak Workspace aan (als die nog niet bestaat)

1. Klik op **"Create Workspace"**
2. Naam: `Rivetta`
3. Slug: `rivetta`
4. Visibility: Private
5. Klik **Create**

### Stap 3: Maak Project aan

1. In de Rivetta workspace, klik **"Create Project"**
2. Naam: `Plane Pages Viewer`
3. Slug: `plane-pages-viewer`
4. Icon: 📄 (of kies een icoon)
5. Project type: **Software**
6. Klik **Create**

### Stap 4: Maak Issues aan voor taken

Ga naar het **Plane Pages Viewer** project en maak deze issues aan:

**🔴 P0 — Deze week:**
- `PPV-1`: CSRF auth flow fixen — cookies correct meesturen
- `PPV-2`: Error handling — 401 redirect, retry logic
- `PPV-3`: Create page modal — nieuwe pagina aanmaken in Plane

**🟠 P1 — Volgende week:**
- `PPV-4`: Edit page — inline edit of modal
- `PPV-5`: Drag & drop reorder — sort_order updaten via API
- `PPV-6`: Search + filter — zoek door pages

**🟡 P2 — Backlog:**
- `PPV-7`: Export to Markdown — download tree als .md files
- `PPV-8`: Custom domain — vault.plane.rivetta.eu
- `PPV-9`: Link in Plane sidebar — custom navigation item

### Stap 5: Nodig team uit (optioneel)

1. Ga naar **Settings → Members**
2. Nodig uit:
   - Cheyenne (cheyenne@rivetta.eu)
   - Gioia (gioia@rivetta.eu)
3. Role: **Member** of **Contributor**

---

## GitHub Workflow

**Repo:** https://github.com/Fle-zz-xa/plane-pages-viewer

**Branches:**
- `main` → Production (alleen via PR merge)
- `develop` → Development branch (hier werk je op)
- `feature/*` → Optioneel voor losse features

**Workflow:**
```bash
# 1. Check uit naar develop
git checkout develop

# 2. Bouw feature lokaal
npm run dev
# Test op http://localhost:3003/vault-viewer

# 3. Commit + push
git add .
git commit -m "feat: description"
git push origin develop

# 4. Deploy testversie
cd /Users/ricardomulder/.openclaw/workspace/projects/plane-pages-viewer
npm run build
npx wrangler pages deploy dist --project-name plane-pages-viewer

# 5. Test live: https://plane-pages-viewer.pages.dev/vault-viewer

# 6. Als alles werkt → PR naar main
```

---

## Live URLs

| Omgeving | URL | Doel |
|----------|-----|------|
| **Production** | https://108d6d96.plane-pages-viewer.pages.dev/vault-viewer | Live versie |
| **Development** | http://localhost:3003/vault-viewer | Lokaal testen |
| **Plane Instance** | https://plane.rivetta.eu | Plane zelf |
| **GitHub Repo** | https://github.com/Fle-zz-xa/plane-pages-viewer | Code + PRs |

---

## Definition of Done

Een feature is **DONE** als:
- ✅ Code werkt lokaal (`npm run dev`)
- ✅ Code is gecommit naar `develop` branch
- ✅ Deployed naar Cloudflare Pages (testversie)
- ✅ Getest met echte Plane data
- ✅ Issue gesloten in Plane
- ✅ (Optioneel) Merge naar `main` voor production

---

*Created: 2026-04-14 (JARVIS)*
