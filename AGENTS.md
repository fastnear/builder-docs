# AGENTS.md

This file provides guidance to Codex (codex.ai/code) when working with code in this repository.

## Common Development Commands

### Production-style preview
```bash
yarn start
```

Regenerates hosted canonical route files, builds the site, and serves the production-style output locally. This is the lean default preview and does not regenerate AI/discovery artifacts on every run.

### Full preview including discovery artifacts
```bash
yarn start:full
```

Also regenerates AI-facing Markdown mirrors, `llms.txt`, `llms-full.txt`, per-family indexes, and `/structured-data/site-graph.json`.

### Hot-reload dev server
```bash
yarn start:dev
```

Use this for iterative UI/content work. Docusaurus serves one locale at a time in dev mode.

### Hot-reload dev server for Russian
```bash
yarn start:dev:ru
```

### Production build
```bash
yarn build
```

### Serve an existing production build
```bash
yarn serve
```

### Locale bootstrap and audits
```bash
yarn bootstrap:i18n --locale <code>
yarn bootstrap:i18n:reseed --locale <code>
yarn audit:i18n --locale <code> --wave <1|2|all>
yarn audit:i18n:all
yarn audit:ru-terminology
yarn ci:locale-quality
```

### Search, discovery, and indexing checks
```bash
yarn algolia:status
yarn algolia:sync
yarn algolia:crawler:start
yarn algolia:crawler:wait --task <taskId>
yarn algolia:inspect --query "view_account"
yarn audit:indexing
yarn audit:algolia-highlights
yarn audit:algolia-relevance
yarn submit:indexnow:dry-run
```

### Playwright smoke tests
```bash
yarn playwright:install
yarn test:e2e
```

## Feature Branch Workflow

- `builder-docs` is the main product, review, and deployment repo for `docs.fastnear.com`.
- Start here first for user-facing changes: layout, MDX content, navigation, sidebar behavior, theming, localized routing, search UX, and native docs UI.
- Only create a paired `mike-docs` branch when the work changes generated inputs or shared runtime behavior:
  - spec sync
  - enhancement manifests
  - page-model generation
  - structured graph generation
  - nearcore RPC generation
  - shared logic that feeds the native docs renderer
- If both repos are involved, use the same branch suffix in both repos, for example `codex/response-shell-polish`.
- Preferred sequence:
  1. change and validate generation/shared logic in `mike-docs`
  2. sync the generated artifacts into `builder-docs`
  3. finish the user-facing work here
  4. open the `builder-docs` PR as the main PR and link the supporting `mike-docs` PR
- Only `builder-docs` needs to deploy to update the public site, but upstream `mike-docs` work still needs to land first when the change depends on it.
- Keep branches narrow and single-purpose. Avoid bundling generation churn, large cleanup, and unrelated UI polish into one PR.

## High-Level Architecture

This repo is the public Docusaurus v3.10.0 site for FastNear docs. `builder-docs` deploys to `https://docs.fastnear.com`; `mike-docs` is the generation pipeline, local verification environment, and legacy Redocly backend.

Public RPC and API pages are no longer iframe embeds. They render directly in `builder-docs` from vendored generated data synced from `mike-docs`.

### Documentation structure

- `/` — root chooser, auth/access guidance, and cross-surface routing help
- `/rpc/` — canonical JSON-RPC reference docs rendered natively
- `/api/` — FastNear REST API reference
- `/tx/` — Transactions API reference
- `/transfers/` — Transfers API reference; can be hidden with `HIDE_EARLY_API_FAMILIES`
- `/neardata/` — NEAR Data API reference
- `/fastdata/kv/` — KV FastData API; can be hidden with `HIDE_EARLY_API_FAMILIES`
- `/auth/` — Auth & Access overview shared across RPC and REST surfaces
- `/agents/` — AI agent and automation guidance, surface routing, auth posture, and playbooks
- `/snapshots/` — validator snapshot documentation for mainnet/testnet
- `/transaction-flow/` — deep dive on NEAR transaction lifecycle; currently hidden from locale ship requirements
- `/internationalization/` — maintainer-facing locale rollout playbook
- Content is written in MDX and can use shared React components

### Current navigation model

- Navbar entries are `RPC`, `API`, `Transactions`, optional `Transfers`, `NEAR Data`, optional `FastData`, `Snapshots`, and external `Status`.
- `Auth & Access` lives at `/auth` and is included inside `rpcSidebar`.
- `/agents` and `/internationalization` are root-mounted guidance pages, not dedicated navbar items.
- `/` remains the neutral overview page and is no longer represented as its own navbar item.
- A locale dropdown is enabled. Current supported locales are `en` and `ru`.
- Legacy `/docs/...` routes remain only as permanent redirects to the root-mounted pages.

### Canonical route contract

- The indexed public docs surface is the root-mounted wrapper tree:
  - `/rpc/**`
  - `/api/**`
  - `/tx/**`
  - `/transfers/**`
  - `/neardata/**`
  - `/fastdata/kv/**`
- Stable hosted embed/reference routes live under `/rpcs/**` and `/apis/**`.
- Files under `src/pages/rpcs/**` and `src/pages/apis/**` are generated by `scripts/generate-bespoke-host-pages.js`; do not hand-edit them.
- AI/discovery mirrors are generated centrally into `static/**/*.md`, `static/llms.txt`, `static/llms-full.txt`, per-family `llms.txt` indexes, and `static/structured-data/site-graph.json`.

## React Components

- **`FastnearDirectOperation`** (`src/components/FastnearDirectOperation/index.js`) — shared native renderer for interactive RPC and API docs inside the root-mounted public reference pages.
- **`FastnearHostedOperationPage`** (`src/components/FastnearHostedOperationPage/index.js`) — lightweight page wrapper used by the generated canonical `/rpcs/**` and `/apis/**` hosted pages. Also posts resize messages when embedded externally.
- **`ApiKeyManager`** (`src/components/ApiKeyManager/index.js`) — UI for users to set/manage their FastNear API key in `localStorage`.
- **`FastnearApiSidebarVersionControl`** (`src/components/FastnearApiSidebarVersionControl/index.js`) — FastNear API version selector/filter in the sidebar.
- **`PageActions`** (`src/components/PageActions/index.js`) — page-level actions such as `Copy Markdown`, driven by MDX frontmatter `page_actions`.
- **`LocalizedLink`** (`src/components/LocalizedLink/index.js`) — locale-aware internal link wrapper used in authored docs/components.
- **`RpcApiServiceLinks`** (`src/components/RpcApiServiceLinks/index.js`) — shared link grid/list used on the root chooser and related docs surfaces.
- **`SimpleButton`** (`src/components/SimpleButton/index.js`) — reusable CTA component used by the snapshots landing page.
- **`src/css/custom.css`** — canonical bespoke UI stylesheet. Public layout/spacing/polish changes belong here first.

## Other Notable Files

- **`docusaurus.config.js`** — live site config, navbar/sidebar wiring, locale setup, search-provider selection, redirects, and discovery metadata.
- **`sidebars.js`** — section-specific sidebars for RPC, API, Transactions, Transfers, NEAR Data, FastData, snapshots, and transaction-flow docs.
- **`src/data/generatedFastnearPageModels.json`** — vendored page-model registry generated in `mike-docs`. This is the source of truth for native operation rendering here.
- **`src/data/generatedFastnearStructuredGraph.json`** — vendored structured-graph metadata generated in `mike-docs`, used for discovery and JSON-LD.
- **`src/data/localeRegistry.json`** — source of truth for supported locales and locale labels.
- **`src/data/fastnearTranslations.<locale>.json`** — localized FastNear overlay catalogs. These are overlays on generated English data, not in-place edits of vendored source artifacts.
- **`src/pages/near-rpc-openapi.yaml`** — local snapshot of the aggregate RPC OpenAPI spec. The canonical source of truth is `rpcs/openapi.yaml` in `mike-docs`.
- **`scripts/generate-bespoke-host-pages.js`** — generates canonical hosted route pages under `src/pages/rpcs/**` and `src/pages/apis/**`.
- **`scripts/generate-ai-surfaces.js`** — generates Markdown mirrors, `llms.txt`, `llms-full.txt`, per-family indexes, and `/structured-data/site-graph.json`.
- **`scripts/submit-indexnow.js`** — submits changed canonical docs URLs to IndexNow after deploys or explicit manual runs.
- **`plugins/finalizeLocalizedStaticAssets.cjs`** — finalizes localized static discovery assets after build.
- **`algolia/`** — crawler config, index settings, relevance cases, and search ops docs for the repo-managed Algolia setup.
- **`.env.example`** — template for DocSearch and crawler env vars plus optional `HIDE_EARLY_API_FAMILIES`.
- **`static/js-loaded-globally/`** — vendored browser bundles (`near-api-js`, `@fastnear/api`) loaded globally for interactive docs.
- **`/Users/mikepurvis/near/mike-docs/README.md`** — authoritative backend/generation workflow for spec sync and page-model generation.
- **`/Users/mikepurvis/near/mike-docs/INTEGRATION_GUIDE.md`** — current portal-side and cross-repo integration contract.

## Creating Or Updating Docs Pages

Docs pages under the root-mounted public docs tree should use the native direct renderer.

### Adding a new RPC endpoint page

Create a file under `docs/rpc/<category>/` using the existing pattern:

```mdx
---
title: <Method Title>
description: <Brief description>
slug: /rpc/<category>/<route-segment>
sidebar_position: <N>
hide_table_of_contents: true
page_actions:
  - markdown
---

import FastnearDirectOperation from '@site/src/components/FastnearDirectOperation';

# <Method Title>

`<method_name>` request type

<Brief description of what this endpoint does.>

<FastnearDirectOperation pageModelId="<page_model_id>" />
```

The `pageModelId` comes from the generated registry synced from `mike-docs`. For example, `view_account` uses `pageModelId="rpc-view-account"`.

Add the new doc ID to the appropriate category in `sidebars.js`.

### Adding a new REST API page

Use `FastnearDirectOperation` for FastNear and REST API content under `docs/api/`, `docs/tx/`, `docs/transfers/`, `docs/neardata/`, and `docs/fastdata/kv/`.

Example:

```mdx
---
title: Account Full
description: Fetch a combined FastNear account view
sidebar_position: 1
hide_table_of_contents: true
page_actions:
  - markdown
---

import FastnearDirectOperation from '@site/src/components/FastnearDirectOperation';

# Account Full

<FastnearDirectOperation pageModelId="fastnear-v1-account-full" />
```

Guidelines:

- Use the generated `pageModelId`, not a raw `/apis/...` path string.
- Keep the existing doc IDs and folder routes stable when reorganizing nav or sidebar labels. The IA is section-sidebar driven, not route-driven.
- If the underlying page model is missing or wrong, fix it in `mike-docs` and resync instead of papering over it locally.
- Do not hand-edit generated hosted files under `src/pages/rpcs/**` or `src/pages/apis/**`.
- Use `LocalizedLink` for internal authored links when locale-preserving behavior matters.
- Use `page_actions: [markdown]` on overview and guidance pages that should expose the `Copy Markdown` action.

### Existing examples

- `docs/rpc/account/view-account.mdx` → `pageModelId="rpc-view-account"`
- `docs/rpc/contract/call-function.mdx` → `pageModelId="rpc-call"`
- `docs/api/v1-account-full.mdx` → `pageModelId="fastnear-v1-account-full"`
- `docs/agents/index.mdx` → authored guidance page with `page_actions: markdown`

## Docs Backend Integration

The site treats `mike-docs` as a generation pipeline, not an embedded runtime. Public docs pages render directly from vendored page-model and structured-graph data.

### How it works

1. Each YAML file in `mike-docs/rpcs/` gets its own canonical page path, for example `rpcs/account/view_account.yaml` → `/rpcs/account/view_account`.
2. REST API service repos own aggregate `openapi/openapi.yaml`; `mike-docs` syncs those aggregate specs and splits them into canonical `/apis/<service>/...` leaf pages.
3. `mike-docs` generates the shared page-model registry and structured graph, then vendors them into:
   - `builder-docs/src/data/generatedFastnearPageModels.json`
   - `builder-docs/src/data/generatedFastnearStructuredGraph.json`
4. `builder-docs` renders `/rpc/**` and service-specific root-mounted reference pages with `FastnearDirectOperation`.
5. `builder-docs` generates canonical hosted pages under `src/pages/rpcs/**` and `src/pages/apis/**` so `docs.fastnear.com` serves the same bespoke runtime directly.
6. `builder-docs` generates AI/discovery mirrors and structured-data outputs from the authored docs tree plus vendored generated metadata.
7. Redocly remains available in `mike-docs` only for validation and legacy debugging.

### Refreshing generated artifacts

If you changed specs, enhancements, or shared runtime logic in `mike-docs`, refresh the vendored artifacts first:

```bash
cd /Users/mikepurvis/near/mike-docs
npm install
npm run sync:apis
```

That refreshes the generated page models copied into `builder-docs/src/data/generatedFastnearPageModels.json` and the structured graph copied into `builder-docs/src/data/generatedFastnearStructuredGraph.json`.

For deeper cross-repo validation:

```bash
# in mike-docs
npm run lint
npm run standalone:build
REDOCLY_LOCAL_PLAN=enterprise npm run build

# in builder-docs
yarn build
yarn serve
```

Useful companion previews in `mike-docs`:

- `npm run preview:headless` → legacy Redocly preview on `http://127.0.0.1:4000`
- `npm run standalone:dev` → standalone bespoke runtime on `http://127.0.0.1:4010`

## Authentication & API Keys

### Storage keys

Interactive docs pages use the default browser storage key `fastnear:apiKey`. The UI migrates away from the legacy `fastnear_api_key` key automatically when encountered.

### API key flow

1. User enters a key in `ApiKeyManager` → saved to `localStorage.fastnear:apiKey`
2. `FastnearDirectOperation` reads the key from localStorage or `?apiKey=`
3. The live request uses the transport configured by the page model, usually `Authorization: Bearer ...`
4. The copied curl command matches the live request shape
5. Auth guidance for humans lives at `/auth`; agent/automation-specific posture lives at `/agents/auth`

### Usage example

```bash
curl "https://rpc.mainnet.fastnear.com?apiKey=${API_KEY}" \
  -H "Content-Type: application/json" \
  --data '{"method":"block","params":{"finality":"final"},"id":1,"jsonrpc":"2.0"}'
```

## Localization & Locale Framework

The locale framework is now generic. Russian is the first fully implemented non-default locale and serves as the template for future locales.

### Core locale files

- `src/data/localeRegistry.json` — source of truth for supported locales
- `i18n/<locale>/glossary.yml` — locale-owned terminology contract
- `i18n/<locale>/translation-policy.yml` — editorial scope, waves, hidden sections, and bootstrap overrides
- `i18n/<locale>/docusaurus-plugin-content-docs/current/**` — localized docs content
- `i18n/<locale>/code.json` and related message catalogs — runtime translations
- `src/data/fastnearTranslations.<locale>.json` — localized FastNear overlay catalogs
- `docs/internationalization.md` — maintainer playbook for the locale framework

### Russian continuity docs

Technical continuity docs for Russian live under `md-CLAUDE-chapters/`:

- `md-CLAUDE-chapters/i18n_locale_framework_and_russian_rollout.md`
- `md-CLAUDE-chapters/i18n_translating_russian.md`
- `md-CLAUDE-chapters/i18n_ru_glossary.md`
- `md-CLAUDE-chapters/i18n_ru_quick_reference.md`
- `md-CLAUDE-chapters/i18n_adding_locales.md`

Runtime glossary and policy files for Russian:

- `i18n/ru/glossary.yml`
- `i18n/ru/translation-policy.yml`

### Workflow notes

- Use `yarn bootstrap:i18n --locale <code>` for safe scaffold refreshes. It preserves curated locale content by default.
- Use `yarn bootstrap:i18n:reseed --locale <code>` only when you intentionally want a destructive reseed.
- `wave 1` is the shipping bar and the only locale scope enforced in CI.
- Hidden sections, such as `/transaction-flow`, are tracked in `translation-policy.yml` and excluded from required editorial coverage until they are ready.
- `docusaurus start` serves one locale at a time, so the locale dropdown will not switch cleanly across locales in local dev mode.

### Russian audits

- `yarn audit:ru-terminology` catches common Russian terminology defects and is wired into `ci:locale-quality`.
- `yarn audit:i18n:all` checks for suspicious English leftovers across all configured non-default locales.
- When editing Russian content, run `yarn audit:ru-terminology` before committing.
- The CI gate in `.github/workflows/locale-quality.yml` runs `yarn ci:locale-quality`.

## Search, Discovery, And AI Surfaces

The repo now has a first-class discovery layer for humans, crawlers, and AI clients.

### Search provider behavior

- Search defaults to the local Docusaurus search plugin.
- If `DOCS_SEARCH_PROVIDER=algolia` and the required DocSearch env vars are present, the runtime switches to Algolia.
- `docusaurus.config.js` auto-loads supported keys from `.env` and `.env.local`, while shell-exported env vars still take precedence.

Relevant env vars:

- `DOCS_SEARCH_PROVIDER`
- `DOCSEARCH_APP_ID`
- `DOCSEARCH_API_KEY`
- `DOCSEARCH_INDEX_NAME`
- `ALGOLIA_CRAWLER_USER_ID`
- `ALGOLIA_CRAWLER_API_KEY`
- `ALGOLIA_CRAWLER_NAME`
- `HIDE_EARLY_API_FAMILIES`

### Generated discovery outputs

- per-page Markdown mirrors at both `/path.md` and `/path/index.md`
- top-level `llms.txt` and `llms-full.txt`
- per-family indexes at `/guides/llms.txt`, `/rpcs/llms.txt`, and `/apis/llms.txt`
- localized equivalents such as `/ru/llms.txt`
- public machine-readable site graph at `/structured-data/site-graph.json`
- page-level and operation-level structured data generated from authored docs plus `generatedFastnearStructuredGraph.json`

### Operational guidance

- Treat the clean root-mounted public docs as the indexed public search surface.
- Keep `/rpcs/**`, `/apis/**`, `/**/*.md`, `llms.txt`, `llms-full.txt`, and `/structured-data/**` out of the public crawler surface.
- The interactive playground is intentionally marked so crawlers can skip UI controls while still indexing the reference prose.
- `src/theme/SearchBar/index.js` is swizzled and customized for FastNear-specific grouped search results.
- `yarn audit:indexing` rebuilds the site, validates discovery outputs, checks `noindex` behavior for hosted canonical routes, and verifies the root IndexNow key file.
- `yarn deploy` publishes the site and then submits the canonical route set to IndexNow automatically.

Use `algolia/operations.md` as the operator checklist for repo-managed Algolia sync and crawl control.

## Development Notes

- Deployed to `https://docs.fastnear.com`
- GitHub repository: `https://github.com/fastnear/builder-docs`
- Yarn v4.9.2 is the package manager
- Node.js 20.0 or higher is required; `.node-version` currently pins `24` for local development
- `yarn start` is a production-style preview, not a hot-reload dev server
- `yarn start:dev` and `yarn start:dev:ru` are the live dev servers
- Public docs pages in this repo no longer depend on the legacy iframe routing layer

## Upstream: nearcore Generator Pipeline

The `rpcs/` YAML files in `mike-docs` are auto-generated from nearcore's OpenAPI spec:

```text
nearcore (Rust)
    ↓ cargo build generates openapi.json
nearcore/chain/jsonrpc/openapi/openapi.json
    ↓ npm run generate-rpc (in mike-docs)
scripts/nearcore-operation-map.js → scripts/generate-from-nearcore.js
    ↓
mike-docs/rpcs/<category>/<operation>.yaml    (per-operation specs)
mike-docs/rpcs/openapi.yaml                   (aggregate spec)
    ↓ shared page-model + structured-graph generation
builder-docs renders via FastnearDirectOperation
```

To add a new RPC operation from nearcore:

1. In `mike-docs`, add an entry to `OPERATIONS` in `scripts/nearcore-operation-map.js`
2. In `mike-docs`, run `npm run generate-rpc` to generate the YAML
3. In `mike-docs`, run `npm run sync:apis` to refresh vendored artifacts consumed here
4. In `builder-docs`, create an MDX page under `docs/rpc/<category>/` using `FastnearDirectOperation`
5. In `builder-docs`, add the page to `sidebars.js`

See `mike-docs/AGENTS.md`, `mike-docs/README.md`, and `mike-docs/INTEGRATION_GUIDE.md` for the full generator and integration workflow.
