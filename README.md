# Builder Documentation

Targeted NEAR documentation site for advanced builders and founders. The public site is served from [docs.fastnear.com](https://docs.fastnear.com).

## Current Architecture

Two repos now split cleanly between presentation and generation:

| Repo | Deploys to | Role |
| --- | --- | --- |
| **builder-docs** (this repo) | `docs.fastnear.com` | Public Docusaurus site, native API/RPC docs pages, generated canonical `/rpcs/...` and `/apis/...` routes |
| **mike-docs** | `fastnear.redocly.app` (legacy), local standalone runtime | OpenAPI sync and generation, page-model generation, local verification, legacy Redocly backend |

Public API and RPC pages are no longer iframe embeds. They render directly in `builder-docs` from vendored page-model data generated in `mike-docs`.

## What Lives Here

- MDX content under `docs/`
- `src/components/FastnearDirectOperation/` for native interactive API and RPC docs inside the root-mounted public reference pages (`/rpc/**`, `/api/**`, `/tx/**`, and related families)
- `src/components/FastnearHostedOperationPage/` for canonical hosted `/rpcs/...` and `/apis/...` routes
- `src/components/ApiKeyManager/` for browser-persisted FastNear API keys
- `src/components/FastnearApiSidebarVersionControl/` for FastNear API version-aware sidebar filtering
- `src/data/generatedFastnearPageModels.json`, vendored from `mike-docs`
- `src/data/generatedFastnearStructuredGraph.json`, vendored from `mike-docs`
- `scripts/generate-bespoke-host-pages.js`, which generates `src/pages/rpcs/**` and `src/pages/apis/**`
- `scripts/generate-ai-surfaces.js`, which generates Markdown mirrors, `llms.txt`, and `/structured-data/site-graph.json`
- `scripts/submit-indexnow.js`, which submits changed canonical docs URLs to IndexNow after production deploys

## Development

### Prerequisites

- Node.js 20+ (`.node-version` currently pins `24` for local development)
- Yarn 4 (`corepack` supported)

### Local builder-docs development

```bash
yarn install
yarn start
```

`yarn start` regenerates the hosted canonical route files, builds the site, and serves the production-style output. It is the lean default preview and does not regenerate the AI-surface artifacts on every run.
Local development now reads DocSearch env vars from `.env` or `.env.local` automatically so Algolia can work without shell-exporting those values first. Shell-exported env vars still win if both are present.

For most UI/content work in this repo, that is enough. The docs pages render directly from the vendored page-model registry and make live network requests themselves.

If you want the preview to also refresh the production discovery surfaces, use:

```bash
yarn start:full
```

That additionally regenerates:

- Markdown mirrors
- `llms.txt` and `llms-full.txt`
- per-family `guides/llms.txt`, `rpcs/llms.txt`, and `apis/llms.txt`
- `/structured-data/site-graph.json`

If you want hot reload instead of a production-like preview, use the single-locale Docusaurus dev server explicitly:

```bash
yarn start:dev
# or preview the Russian locale only
yarn start:dev:ru
```

That is a Docusaurus limitation rather than a FastNear routing bug: `docusaurus start` serves one locale at a time, so the locale dropdown will not cross-switch correctly between locales on that dev server.

### Locale workflow

The locale framework is now generic. Use these commands for any non-default locale:

```bash
yarn bootstrap:i18n --locale <code>
yarn bootstrap:i18n:reseed --locale <code>
yarn audit:i18n --locale <code> --wave <1|2|all>
yarn audit:i18n:all
```

The safe bootstrap command preserves curated locale files by default. It only scaffolds missing docs, message-catalog entries, and generated overlay keys.

Each locale owns:

- `i18n/<locale>/glossary.yml`
- `i18n/<locale>/translation-policy.yml`
- `i18n/<locale>/docusaurus-plugin-content-docs/current/**`
- `i18n/<locale>/code.json` and related message catalogs
- `src/data/fastnearTranslations.<locale>.json`

Russian compatibility aliases remain available:

```bash
yarn bootstrap:i18n:ru
yarn bootstrap:i18n:ru:reseed
yarn audit:i18n:ru
```

Wave policy is intentionally lightweight:

- `wave 1` is the ship bar and the only locale scope enforced in CI
- `wave 2` is the broader public-surface pass
- `long-tail` cleanup stays non-blocking

Hidden sections, such as `/transaction-flow`, are tracked in each locale's `translation-policy.yml`. They are excluded from required editorial coverage until they become public, the live docs render a visible banner so the scope is explicit, and they stay out of sitemap/crawler indexing until they are ready to surface publicly.

### Playwright smoke tests

```bash
yarn playwright:install
yarn test:e2e
```

The Playwright config starts a local Docusaurus server automatically, then runs a small Chromium-based smoke suite against the public docs experience. Use it for routing, theming, copy-action, and interaction regressions as the bespoke docs UI evolves.

### Algolia crawler contract

Treat the clean root-mounted public docs as the public search surface.

- Crawl: `/`, `/rpc/**`, `/api/**`, `/tx/**`, `/transfers/**`, `/neardata/**`, `/fastdata/**`, `/auth/**`, `/agents/**`, `/snapshots/**`
- Exclude: `/rpcs/**`, `/apis/**`, `/**/*.md`, `/llms.txt`, `/llms-full.txt`, `/guides/llms.txt`, `/rpcs/llms.txt`, `/apis/llms.txt`, `/structured-data/**`
- Exclude low-value utility pages already kept out of the sitemap: `/api/reference`, `/redocly-config`
- Add `category`, `method_type`, `surface`, `family`, `audience`, and `page_type` to `attributesForFaceting`
- Use [algolia/crawler/shared.js](/Users/mikepurvis/near/fn/builder-docs/algolia/crawler/shared.js) as the shared crawler definition for repo-managed sync
- Use [algolia/docsearch-crawler.config.js](/Users/mikepurvis/near/fn/builder-docs/algolia/docsearch-crawler.config.js) as the generated pasteable crawler editor artifact
- Use [algolia/index-settings.json](/Users/mikepurvis/near/fn/builder-docs/algolia/index-settings.json), [algolia/rules.json](/Users/mikepurvis/near/fn/builder-docs/algolia/rules.json), and [algolia/synonyms.json](/Users/mikepurvis/near/fn/builder-docs/algolia/synonyms.json) as the repo-owned live search artifacts
- Use [.env.example](/Users/mikepurvis/near/fn/builder-docs/.env.example) as the deploy-time env template
- `DOCSEARCH_INDEX_NAME` should match the crawler action's `indexName`, not the crawler display name
- Algolia search analytics and DocSearch Insights events use the public search-only key already configured in `DOCSEARCH_API_KEY`
- This is search analytics, not a general pageview snippet; for sitewide traffic analytics you would still add a separate product such as Plausible or GA
- The repo-managed control layer additionally uses `ALGOLIA_ADMIN_API_KEY`, `ALGOLIA_CRAWLER_USER_ID`, `ALGOLIA_CRAWLER_API_KEY`, and `ALGOLIA_CRAWLER_NAME`

The docs runtime now emits `docsearch:category`, `docsearch:method_type`, `docsearch:surface`, `docsearch:family`, `docsearch:audience`, and `docsearch:page_type` meta tags centrally, so the crawler can facet and group pages without hand-authored `<head>` blocks in MDX.

It also emits stable `data-fastnear-*` attributes on the docs wrapper and direct operation runtime so selector choices do not have to depend on incidental CSS classes.

The interactive API playground is marked with `data-fastnear-crawler-skip` so the crawler can strip request controls, copy helpers, and placeholder runtime text before extraction while keeping the actual reference prose indexable.

The search modal itself is swizzled in [src/theme/SearchBar/index.js](/Users/mikepurvis/near/fn/builder-docs/src/theme/SearchBar/index.js) so DocSearch results are grouped by page, deduplicated across anchors, and rendered with FastNear-specific result cards and snippets.

Generated discovery surfaces are emitted centrally too:

- machine-readable Markdown mirrors at both `/path.md` and `/path/index.md`
- top-level and per-family `llms.txt` indexes
- a public machine-readable site graph at `/structured-data/site-graph.json`

Structured data is emitted centrally too:

- global `WebSite` and `Organization` JSON-LD from `docusaurus.config.js`
- page-level `CollectionPage`, `TechArticle`, or `WebPage` graphs from the docs runtime
- `APIReference` and `WebAPI` entities from the vendored `generatedFastnearStructuredGraph.json`
- a public machine-readable site graph at `/structured-data/site-graph.json`

### Discovery verification

```bash
yarn algolia:status
yarn algolia:sync
yarn algolia:crawler:start
yarn audit:algolia-highlights
yarn audit:indexing
yarn audit:algolia-relevance
yarn audit:i18n:all
yarn submit:indexnow:dry-run
```

`yarn algolia:status` compares the live Algolia index settings, repo-owned Rules, repo-owned synonyms, and crawler configuration against the repo.

`yarn algolia:sync` applies the repo-owned search settings plus crawler configuration, without starting a crawl.

`yarn algolia:crawler:start` starts a crawl and prints the returned crawler task ID. Follow it with `yarn algolia:crawler:wait --task <taskId>` to wait for completion and print the latest crawl summary.

`yarn audit:indexing` rebuilds the site, verifies sitemap/robots/structured-data coverage, confirms hosted `/rpcs/**` and `/apis/**` stay `noindex`, checks the generated Markdown mirrors, and validates the root IndexNow key file.

The lean locale CI gate is also available locally:

```bash
yarn ci:locale-quality
```

That runs the required locale audit, the production build, and the discovery/indexing audit without adding heavier browser or relevance checks.

`yarn audit:algolia-relevance` runs a small set of high-intent queries against the configured live Algolia index and checks that canonical public docs pages win over noisy or duplicate matches. It reads the cases from [algolia/relevance-cases.json](/Users/mikepurvis/near/fn/builder-docs/algolia/relevance-cases.json) and requires the DocSearch env vars from `.env` or your shell.

Use [algolia/operations.md](/Users/mikepurvis/near/fn/builder-docs/algolia/operations.md) as the operator checklist for repo-managed Algolia sync and crawl control.

`yarn deploy` now publishes the site and then submits the canonical route set to IndexNow automatically.

For reruns or nonstandard deploy flows, you can still submit IndexNow manually with either the deployed diff range or the full canonical route set:

```bash
yarn submit:indexnow --from <previous-sha> --to <current-sha>
# or fall back to the full canonical docs set
yarn submit:indexnow
```

### Refreshing the generated docs models

If you changed specs, enhancements, or the shared runtime in `mike-docs`, refresh the vendored artifacts first:

```bash
cd /Users/mikepurvis/near/mike-docs
npm install
npm run sync:apis
```

That updates the generated page models copied into `builder-docs/src/data/generatedFastnearPageModels.json`.
It also refreshes the structured graph copied into `builder-docs/src/data/generatedFastnearStructuredGraph.json`.

## Feature Branch Workflow

- `builder-docs` is the main product branch and deployment repo for `docs.fastnear.com`.
- Use a `builder-docs` feature branch for UI, content, navigation, and direct-render docs changes.
- Use a matching `mike-docs` branch only when the work changes generated inputs or shared runtime behavior.
- When both repos are involved, use the same suffix in both repos so the branches pair cleanly.
- Recommended order:
  1. make and validate the generation/shared change in `mike-docs`
  2. sync the generated artifacts into `builder-docs`
  3. finish the public-facing work in `builder-docs`
  4. open the `builder-docs` PR as the main PR and link the supporting `mike-docs` PR
- Only `builder-docs` needs to be redeployed to update the live site, but upstream `mike-docs` work still needs to be merged and synced first when it is part of the change.

### Deeper validation

When you want full parity checks across both repos:

```bash
# in mike-docs
npm run lint
npm run standalone:build
REDOCLY_LOCAL_PLAN=enterprise npm run build

# in builder-docs
yarn build
yarn serve
```

The Redocly preview in `mike-docs` is now legacy infrastructure. Use it only when validating generation or legacy behavior, not as the primary public runtime.

## Creating Or Updating Docs Pages

Docs pages under the root-mounted docs tree should use the native direct renderer:

```mdx
---
slug: /rpc/<category>/<route-segment>
---

import FastnearDirectOperation from '@site/src/components/FastnearDirectOperation';

<FastnearDirectOperation pageModelId="rpc-view-account" />
```

RPC source files now live under `docs/rpc/<category>/` and publish at `/rpc/<category>/<route-segment>`.

Use the generated `pageModelId` from `mike-docs`. The canonical hosted `/rpcs/...` and `/apis/...` routes are generated automatically; do not hand-edit files under `src/pages/rpcs/**` or `src/pages/apis/**`.

## Canonical Route Contract

These hosted paths remain the stable embed and reference contract:

```text
/rpcs/account/view_account
/rpcs/block/block_by_id
/apis/fastnear/v1/account_full
/apis/transactions/v0/account
```

They are generated and hosted directly by this repo and remain reachable for embeds and AI mirrors, but the indexed public docs surface is the root-mounted wrapper tree:

- `/rpc/**`
- `/api/**`
- `/tx/**`
- `/transfers/**`
- `/neardata/**`
- `/fastdata/kv/**`

Legacy `/docs/...` routes now exist only as permanent redirects to the matching root-mounted pages.

## Useful URLs

| URL | Purpose |
| --- | --- |
| `https://docs.fastnear.com` | Production docs host |
| `http://localhost:3000` | Local Docusaurus dev server |
| `http://127.0.0.1:4000` | Local legacy Redocly preview from `mike-docs` |
| `http://127.0.0.1:4010` | Local standalone bespoke runtime from `mike-docs` |

## Further Reading

- [CLAUDE.md](CLAUDE.md) for repo-specific coding guidance
- [docs/internationalization.md](/Users/mikepurvis/near/fn/builder-docs/docs/internationalization.md) for the locale rollout template and maintainer playbook
- [/Users/mikepurvis/near/mike-docs/README.md](/Users/mikepurvis/near/mike-docs/README.md) for the generation pipeline
- [/Users/mikepurvis/near/mike-docs/INTEGRATION_GUIDE.md](/Users/mikepurvis/near/mike-docs/INTEGRATION_GUIDE.md) for the current cross-repo contract
