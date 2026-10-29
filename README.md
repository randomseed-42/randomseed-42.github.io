# randomseed-42.github.io

Portfolio site for services I've built. Memento and Remember When are interactive, frontend-only
mock-ups that run in the browser on synthetic, seeded data; AIValidator and RAGen are screenshot
tours of the same kind of mock-up. No proprietary code, backends or customer data.

| Project | Route | Format |
|---|---|---|
| AIValidator: dataset quality report, sanitizer cleaning plan, document-repository clustering | `/projects/aivalidator` | screenshot tour |
| RAGen: concept selection, Bloom difficulty mix, text-to-SQL and text-to-Cypher introspection | `/projects/ragen` | screenshot tour |
| Memento: guided "incident to insight" tour, context-assembly inspector, view-as memory store, consolidation lineage | `/projects/memento` | interactive |
| Remember When: The call, Memory graph, Biosketch, Care console, with a viewer-role and consent switcher | `/projects/remember-when` | interactive |

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, builds to dist/, copies index.html → 404.html for SPA routes
```

Personal details (name, tagline, GitHub accounts, hidden repos, project cards and their cover images) live in `src/site.ts`.
Screenshot tours (steps, captions, image sizes) live in `src/tours.ts`; images are WebP files in `public/shots/`.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`.
In the repository settings, set **Pages → Source** to **GitHub Actions**.

## Layout

```
src/
  pages/                 portfolio landing, screenshot tour, 404
  components/            GitHub activity feed (public API, both accounts)
  demos/memento/
    data/memories.ts     a fictional org's agent memories, including consolidation outputs
    lib/engine.ts        visibility/scope rules, query classification, keyword/vector/RRF search,
                         tiered budget allocation, trust-aware positioning, truncation
    views/               context-assembly inspector, memory store, lineage
  demos/rememberwhen/
    data/                a fictional resident, her memory graph, sessions, three full calls, biosketch, community roster
    lib/access.ts        who-sees-what rules (D-004/011/021/024/028/031 analogues), driven by the demo's viewer switcher
    views/               The call, Memory graph, Biosketch, Care console
  demos/shared/          UI primitives and seeded RNG used by the demos
```
