# Page Load Tranche Plan — `address-page-load-latency`

This plan captures what was analyzed pre-compact and what we agreed to do next.
A resumed Claude session should read this file first before touching the branch.

## Anchor

- **Branch**: `address-page-load-latency`
- **Worktree**: `/Users/mikepurvis/.codex/worktrees/d3da/builder-docs`
- **Base**: `1a91272` on (old) `main`. The branch does **not** yet contain the
  two description-quality commits on current `main` (`16d592a` hide operation
  boilerplate + `41ed179` vendor resync). Expect a conflict window in
  `src/components/FastnearDirectOperation/index.js` when we eventually
  rebase/merge.
- **Current tip**: `9233dc4 first pass with codex doing latency, esp mobile lag`
  — single squashed commit, +26,768 / -622 across 29 files.
- **Strategy memo** (source of truth for intent): [`cloudflare_page_load_investigation.md`](./cloudflare_page_load_investigation.md).

## Current state (from pre-compact analysis)

Overall ~60–65 % of the strategy memo's 5 ranked recommendations.

| # | Recommendation | Status | Key files |
|---|---|---|---|
| R1 | Chunk page-model data | **~80 %** | `scripts/generate-page-model-chunks.js`, `src/data/generatedFastnearPageModelChunks/`, `pageModels.js`, `FastnearDirectOperation/index.js` |
| R2 | Lazy-load locale catalogs | **0 %** (not started) | `src/utils/fastnearLocalization.js` still uses `require.context()` — 247 KB RU bundled into EN first load |
| R3 | Search behind on-interaction boundary | **~70 %** | `src/theme/SearchBar/{index.js, AlgoliaSearchRuntime.js, shell.css}` |
| R4 | Self-host fonts | **~95 %, subtly broken** | `src/css/custom.css:55–116`, `static/fonts/` |
| R5 | Beacon hygiene | **0 %** | (one-shot check against `docusaurus.config.js` + rendered HTML) |

`yarn build` passes cleanly on `9233dc4` (verified in the compacted session).

## Ranked tranche plan

Each tranche is a self-contained PR-sized chunk with explicit **acceptance**.
Small tranches > one big bundle. No force-pushes. No pushes to `origin` until
local verify is green.

### Tranche A — Harden what already landed (fixes, no new scope)

Purpose: close obvious gaps before stacking more work on top.

1. **Fix font weights 500 / 600 / 700** — `src/css/custom.css:55–116`. All three
   weights currently reference the weight-400 WOFF2 files, so the browser either
   synthesizes bold or renders at 400. Either (a) add the missing weight WOFF2
   files under `static/fonts/` and update `@font-face`, or (b) deliberately drop
   those weights and audit typography for callers.
2. **Chunk-load error boundary** — `src/components/FastnearDirectOperation/index.js`
   around the `useFastnearPageModelById` call site (L86 area) and
   `pageModels.js` L114–139. Today `loadPageModelChunk` catches then returns
   null → Suspense fallback shows forever. Add either an `ErrorBoundary` with a
   retry affordance or an explicit "Couldn't load this page, try again" UI.
3. **SSR / hydration check for the search shell** — `src/theme/SearchBar/index.js`.
   The shell renders only CSR; SSG first paint uses the fallback `SearchBar`.
   Add a playwright test (`tests/playwright/search-ssr-hydration.spec.js`) that
   loads `/`, asserts the shell button renders without console errors, and
   verifies no React hydration-mismatch warnings fire.

**Acceptance for Tranche A**:
- `yarn build` clean.
- New playwright test passes.
- Visual check of typography: at least one known `font-weight: 600` site (e.g.,
  H2 on `/rpc/account/view-account`) renders the real DM Sans weight, not a
  synthesized bold.

### Tranche B — Complete R2 (locale catalog lazy-load)

Purpose: biggest untouched win. EN users stop paying 247 KB for RU strings.

- Mirror the `pageModels.js` manifest pattern at the locale layer:
  - New `scripts/generate-locale-catalog-manifest.js` (or fold into an existing
    build step) that writes `src/data/generatedFastnearLocaleCatalogManifest.json`
    mapping `{ locale: filename }`.
  - Rewrite `src/utils/fastnearLocalization.js` to drop `require.context()` and
    use dynamic `import()` (CSR) + synchronous disk read (SSR) against the
    manifest. Active locale is `i18n.currentLocale`.
  - Keep EN on a no-catalog path entirely (no import, no fetch) — EN strings
    live inline in components and don't need a runtime overlay.
- Review every call site of the localization helpers to ensure they tolerate
  an async / not-yet-loaded catalog (Suspense boundary or render-null-until-ready).

**Acceptance for Tranche B**:
- `yarn build` passes for both EN and RU.
- Lighthouse mobile on `/` shows `main.js` transferred size drop vs the Tranche A
  baseline. Record the number in the PR body.
- RU locale still renders translated strings correctly on at least `/`,
  `/rpc/account/view-account`, `/auth` (the three surfaces we already
  RU-translated earlier today).
- `yarn audit:ru-terminology` still green.

### Tranche C — Measurement infrastructure

Purpose: close the feedback loop so every PR can paste a concrete delta.

- `scripts/measure-bundle.js`:
  - Run `yarn build` (if not already present), compute transferred sizes for
    `build/static/js/main*.js`, `build/static/js/common*.js`, `build/static/css/*`,
    and total fonts under `build/static/fonts/` (or wherever Docusaurus emits).
  - Print a simple table: asset | gzipped size | raw size.
  - Optional `--compare <ref>` flag that runs against a checked-out ref first
    (stash / checkout / build / measure / restore) and diffs against HEAD.
- Optional lightweight Lighthouse CI script that hits a local `yarn serve`
  instance for `/` and `/rpc/account/view-account` on mobile emulation.

**Acceptance for Tranche C**:
- Running `node scripts/measure-bundle.js` emits a clean table.
- Running it with `--compare main` emits a before/after table.

### Tranche D — R5 beacon hygiene (small)

Purpose: five-minute audit. Not the main fix; just don't let it regress.

- Grep `docusaurus.config.js` + rendered HTML from `yarn build` for the Cloudflare
  beacon script tag. If there's only one, document it in
  `cloudflare_page_load_investigation.md`'s verification section and close the
  recommendation.
- If there are two (the memo flagged that Lighthouse recorded both the public
  beacon URL and a versioned path), remove the duplicate.

**Acceptance for Tranche D**: one beacon injection in the built HTML, noted in
the investigation memo.

### Tranche E — Merge-path prep

Purpose: bring the branch current with `main` before opening a PR.

- Fetch and rebase onto current `main` (`41ed179`). Resolve conflicts in
  `src/components/FastnearDirectOperation/index.js` by keeping **both**:
  the `data-fastnear-crawler-skip` attribute + `renderDescription = true`
  default from `16d592a`, and the chunk-aware `useFastnearPageModelById` from
  this branch.
- Re-run `npm run generate:page-model-chunks` after rebase so the chunk
  manifest/files reflect the latest `generatedFastnearPageModels.json` (which
  `41ed179` regenerated).
- `yarn build` clean post-rebase. Full test suite passes. Re-run the Tranche C
  measurement script against `main` and against HEAD, paste in the PR.

**Acceptance for Tranche E**: clean rebase, rebuild green, measurement delta
visible.

## Safety notes

- **No force-push.** If we have to rewrite the branch history after a rebase,
  push with `--force-with-lease` only and only after confirming with the user.
- **No destructive git ops** on this branch without a fresh `git status`
  confirmation.
- **Never commit the Cloudflare beacon token or any API key** — the page-load
  work touches analytics; treat every config change as credential-adjacent.
- **Hydration gotchas**: when editing `pageModels.js` or the search shell,
  `yarn build` is not enough — also test `yarn serve` and watch browser console
  for `Hydration failed` / `There was an error while hydrating` warnings.
- **Chunk path invariants**: the naming scheme `{family}.json` in
  `src/data/generatedFastnearPageModelChunks/` is referenced at runtime; do
  not rename without updating `scripts/generate-page-model-chunks.js` and the
  loader in `pageModels.js` together.
- **Locale SSR fallback**: in Tranche B, if a locale catalog import fails on
  the server, the page must still render — fall back to EN strings, not to a
  crash.

## Verification per tranche

Minimum for every tranche:

1. `yarn build` clean (both EN + RU locales).
2. `yarn audit:ru-terminology` + `yarn audit:i18n:all` if the tranche touches
   locale code.
3. Lighthouse mobile on `/` and `/rpc/account/view-account` — paste numbers
   in the PR body (at least FCP, LCP, transferred JS size).
4. Playwright smoke tests pass: at minimum the existing `search-smoke.spec.js`
   + any new tests from the tranche.
5. Visual spot-check in `yarn serve` on a mobile viewport (Chrome DevTools
   device emulation at iPhone 12 or similar).

## Open questions (resolve before starting)

1. **Are 500 / 600 / 700 DM Sans weights used site-wide?** If we're only using
   400 + 700, we can skip sourcing 500/600 and just fix 700. Grep
   `font-weight` across `src/css/` + any CSS modules to confirm.
2. **Does the existing build pipeline include `generate:page-model-chunks` in
   the right order?** Confirm `package.json` runs the chunk generator before
   `docusaurus build` so `generatedFastnearPageModelChunks/` always exists
   during SSR.
3. **Do we want Lighthouse CI in the loop or defer to manual runs?** Automating
   is Tranche C scope; deferring keeps tranches tighter.

## Post-compact resumption checklist

A resumed Claude session should:

1. `cd /Users/mikepurvis/.codex/worktrees/d3da/builder-docs && git status` to
   confirm branch + clean tree.
2. Read `md-CLAUDE-chapters/cloudflare_page_load_investigation.md` for strategy.
3. Read this file for tactical plan.
4. Confirm with the user which tranche to start — default to **Tranche A**.
5. Proceed only after the user confirms the tranche.

## 2026-04-16 Investigation update: Tranche B dropped, new lunr/search direction

### What we learned

- **Tranche B premise was false.** The investigation memo claimed EN users
  paid ~247 KB for `fastnearTranslations.ru.json`. Empirically not true on
  `9233dc4`:
  - Byte-level scan for UTF-8 Cyrillic (`0xD0/0xD1` prefixes) across every
    `build/**/*.js` and `build/ru/**/*.js` → **0 bytes** in both locales.
  - Full-tree grep for distinctive catalog strings (`Получите права и nonce`,
    `Индексированные REST`) → matches only in pre-rendered HTML/MD/TXT, never
    in JS.
  - No unicode-escaped Cyrillic (`\u04xx`) anywhere in JS.
  - `.docusaurus/client-manifest.json` has no reference to
    `fastnearTranslations` or `fastnearLocalization`.
  - Conclusion: the catalog is a **pure SSR asset**; webpack excludes it
    from the client bundle (either tree-shaking or `require.context`
    handling). R2 is effectively already achieved.
- **Attempted Tranche B implementation regressed both locales.** Measured on
  `9233dc4` baseline vs a full Tranche B implementation:

  | | EN main.js | RU main.js | RU extra |
  |---|---|---|---|
  | Baseline | 185 KB gz | 192 KB gz | — |
  | Tranche B | 186 KB gz (+1) | 193 KB gz (+1) | +37 KB gz (`fastnear-locale-ru.js`) |

  So Tranche B added ~1 KB gz to EN main.js (preload plumbing) and ~38 KB gz
  to RU first-load (new catalog chunk). Dropped via `git stash drop`.

### New target: Tranche F — audit and trim production `main.js`

Evidence that matters:

- `https://docs.fastnear.com/assets/js/main.af19d637.js` is **980,261 raw /
  269,533 gz** — the real first-load cost. Much bigger than my local
  `local` search-provider builds (186 KB gz EN), because prod uses
  `DOCS_SEARCH_PROVIDER=algolia`, pulling in DocSearch + Ask AI sidepanel +
  `@algolia/autocomplete` + `vercel.ai`.
- Prod main.js contains: `algolia` (64 hits), `docsearch` (157), `vercel.ai`
  (7), `ai-sdk` (4), `mermaid` (7), `nprogress` (8), `prism` (35),
  `clipboard` (9), `emoji` (15).
- Prod main.js does **not** contain lunr anything, so
  `@easyops-cn/docusaurus-search-local` is only paid for in local-search
  builds. On deploy it's dead weight in `package.json` but not in the
  bundle. Still worth double-checking the theme registration path doesn't
  accidentally register it in Algolia mode.
- Homepage loads only `main.js + runtime~main.js` — every other chunk is
  lazy. So every byte trimmed from `main.js` helps every first-time visitor.

Constraints from user guidance (2026-04-16):

- Algolia DocSearch is critical and must stay fully working.
- Other deps are candidates for trimming.

Open questions for the audit:

1. Is the Ask AI sidepanel active today? If not, can we tree-shake out the
   `vercel.ai` + `ai-sdk/provider` slice?
2. Is mermaid actually used in any rendered docs page? If used on ~5 pages,
   does the theme statically import the full Mermaid parser into the
   initial bundle, or is it per-route?
3. `@docsearch/docusaurus-adapter` vs direct `@docsearch/react` — is there
   still overhead we can avoid?
4. `turndown` + `turndown-plugin-gfm` — declared deps but 0 hits in prod
   `main.js`; could still be in lazy chunks. Worth confirming where they
   show up and whether they're used at all.

Sequencing proposal:

1. Run `yarn docusaurus build --bundle-analyzer --locale en` in Algolia
   mode (dummy env keys suffice for build) to get a concrete treemap of
   what's inside `main.js`.
2. Rank candidates by gz bytes × interaction-likelihood (low = good
   candidate).
3. Implement one trim at a time, measure delta, commit individually.
4. Keep Algolia happy-path tested after every change.

**Tranche B is dropped; this Tranche F replaces it as the next actionable
work.** Tranche A (harden existing: fonts, error boundary, SSR test) is
still queued but deferred until we have the bundle-analyzer picture.

### 2026-04-16 afternoon — Tranche F wins landed

**`perf(search): lazy-load SearchBarFallback`** (47205c2). Bundle analyzer
pinpointed `@docsearch/react/dist/esm/Sidepanel.js` (380 KB raw) sitting
in the main chunk because `@docsearch/docusaurus-adapter`'s SearchBar
statically imported `SidepanelButton from '@docsearch/react/sidepanel'`,
and our swizzle imported the adapter SearchBar as its fallback. Wrapping
the fallback in `React.lazy` + `Suspense` kicked Sidepanel.js into its
own chunk (9580), loaded only when the Ask AI path is invoked.

- EN Algolia-mode main.js: 978,218 → 582,549 raw; **267,904 → 165,795 gz**
- Delta: -395 KB raw / **-102 KB gz** (-38 %).

**`perf(navbar): lazy-load mobile sidebar items`** (5457d3a). The 6
navbar `docSidebar` entries each embedded a fully-resolved
`mobileSidebarItemsByLocale` map, ~52 KB raw / ~10 KB gz of themeConfig
baked into main.js. Moved the data into
`src/data/generatedFastnearMobileSidebarItems.json` (written at config
load, gitignored) and lazy-imported it from
`src/theme/Navbar/MobileSidebar/PrimaryMenu/index.js` on
pointer-enter/click. Desktop users never pay for it.

- EN Algolia-mode main.js: 582,549 → 552,035 raw; **165,798 → 161,902 gz**
- Delta: -30 KB raw / -4 KB gz this step.

**Tranche D (beacon hygiene) closed.** Prod HTML has exactly one
`static.cloudflareinsights.com/beacon.min.js` injection (with the
`data-cf-beacon` token); `docusaurus.config.js` only injects when
`CF_ANALYTICS_TOKEN` is set, so non-prod builds have zero. No duplicate
versioned-beacon path in the served HTML.

**Playwright smoke suite green** against a fresh local-mode build: all 9
specs pass (search-smoke, theme-smoke, rpc-routes). Validates the search
shell lazy-load, mobile-sidebar lazy-load, and structuredData localize
paths still work end-to-end, including Russian locale pages.

### Remaining inventory (end of 2026-04-16 afternoon)

Session cumulative delta on Algolia-mode EN main.js: **-426 KB raw /
-106 KB gz** (978,218 → 552,035 raw; 267,904 → 161,902 gz; -40 %).

| Target | Est. gz | Status | Notes |
|---|---|---|---|
| Prism syntax highlighting | ~35-45 KB | deferred | Used on every docs page with code; deferral risks visible reflow/FOUC on code-heavy pages |
| Font weights 500/600/700 | 0 (polish) | deferred | Current decls reference 400 WOFF2; either source missing weights or adopt variable font |
| Tranche A error boundary | 0 (correctness) | queued | `useFastnearPageModelById` null-state fallback at `pageModels.js:114-139` |
| Tranche A SSR hydration test | 0 (guardrail) | queued | Playwright spec for the search shell |
| Tranche C measurement CLI | 0 (infra) | partially done | `BUNDLE_REPORT_PATH` / `BUNDLE_STATS_PATH` plugin landed; no before/after diff script yet |
| Tranche E rebase onto `main` | n/a | queued | `FastnearDirectOperation/index.js` conflict with 16d592a |
