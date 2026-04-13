# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Running the development server
```bash
yarn start
```

### Building for production
```bash
yarn build
```

### Serving the production build locally
```bash
yarn serve
```

## Feature Branch Workflow

- Treat `builder-docs` as the primary feature branch, review, and deployment repo for public docs work.
- Start here first for user-facing changes: layout, MDX content, navigation, sidebar behavior, theming, and native docs UI.
- Only create a paired `mike-docs` branch when the work needs generated inputs or shared-runtime changes:
  - spec sync
  - enhancement manifests
  - page-model generation
  - nearcore RPC generation
  - shared logic that feeds the native docs renderer
- If both repos are involved, use the same branch suffix in both repos, for example `codex/response-shell-polish`.
- Preferred sequence:
  1. change and validate generation/shared logic in `mike-docs`
  2. sync the generated artifacts into `builder-docs`
  3. finish the user-facing work here
  4. open the `builder-docs` PR as the main PR and link the supporting `mike-docs` PR
- Keep branches narrow and single-purpose. Avoid bundling generation churn, large cleanup, and unrelated UI polish into one PR.

## High-Level Architecture

This is a Docusaurus v3.9.2 documentation site focused on providing advanced NEAR Protocol documentation for seasoned developers, builders, and founders. The site complements the general NEAR documentation at docs.near.org with more technical, precise definitions.

### Documentation Structure

- `/docs/rpc-api/` — RPC and API reference documentation rendered natively with the shared bespoke runtime
- `/docs/transaction-flow/` — 11-page deep dive on NEAR transaction lifecycle (async model, finality, gas economics, runtime execution, etc.)
- `/docs/snapshots/` — Validator snapshot documentation for mainnet/testnet
- Content is written in MDX format, allowing React components within markdown

Current navigation model:
- `RPC` is the top-level entry for JSON-RPC reference docs.
- `API` is the top-level entry for the FastNear REST API section only.
- `Transactions`, `Transfers`, and `NEAR Data` each have their own top-level API entry and their own section-specific sidebar.
- `FastData` is a grouped section for the `KV FastData API`.
- `/docs/rpc-api` remains as a neutral overview page and is no longer the main navbar target for either `RPC` or `API`.
- This section-aware sidebar behavior is intentionally implemented in Docusaurus. `builder-docs` is the public docs runtime; `mike-docs` is the generation pipeline plus legacy verification backend.

### React Components

- **`FastnearDirectOperation`** (`src/components/FastnearDirectOperation/index.js`) — Shared native renderer for interactive RPC and API docs inside `/docs/rpc-api/**`.
- **`FastnearHostedOperationPage`** (`src/components/FastnearHostedOperationPage/index.js`) — Lightweight page wrapper used by the generated canonical `/rpcs/**` and `/apis/**` hosted pages. Also posts resize messages when embedded externally.
- **`ApiKeyManager`** (`src/components/ApiKeyManager/index.js`) — UI for users to set/manage their FastNear API key, stored in localStorage.
- **`FastnearApiSidebarVersionControl`** (`src/components/FastnearApiSidebarVersionControl/index.js`) — FastNear API version selector for the sidebar.
- **`SimpleButton`** — Reusable button component, used in the snapshots landing page.
- **`src/css/custom.css`** — Canonical bespoke UI stylesheet. Public layout/spacing/polish changes belong here first.

### Other Notable Files

- **`src/pages/near-rpc-openapi.yaml`** — A local snapshot of the OpenAPI spec. The canonical source of truth is `rpcs/openapi.yaml` in the mike-docs repo (auto-generated from nearcore via `npm run generate-rpc`). This local copy may drift from the upstream.
- **`static/js-loaded-globally/`** — Vendored JS bundles (`near-api-js` 5.1.1, `@fastnear/api` 0.9.7) loaded globally for interactive docs. The vendored bundles are separate pinned copies for browser use and are not managed via `package.json`.
- **`src/data/generatedFastnearPageModels.json`** — Vendored page-model registry generated in `mike-docs`. This is the source of truth for native docs rendering here.
- **`scripts/generate-bespoke-host-pages.js`** — Generates canonical hosted route pages under `src/pages/rpcs/**` and `src/pages/apis/**` from the vendored page-model registry so `docs.fastnear.com` can serve the bespoke contract directly.
- **`/Users/mikepurvis/near/mike-docs/README.md`** — The authoritative docs-backend workflow, including aggregate REST spec sync, portal-side splitting, bespoke generation, and local preview.
- **`@docusaurus/plugin-client-redirects`** — Installed as a dependency for URL redirect management.

### Content Focus Areas

- Asynchronous transactions and receipts in NEAR
- NEAR's account model (named accounts vs implicit accounts)
- Account key pairs (secp256k1 and ed25519 support)
- Smart contracts in Rust compiled to WebAssembly
- Transaction tracking and finality types

## Adding New RPC Endpoint Pages

This is the main expansion pattern for the site. Each RPC method gets its own MDX page that renders the corresponding generated page model.

### Step 1: Create the MDX file

Create a new file under `docs/rpc-api/<category>/`, following the existing pattern:

```mdx
---
title: <Method Title>
description: <Brief description>
sidebar_position: <N>
hide_table_of_contents: true
---

import FastnearDirectOperation from '@site/src/components/FastnearDirectOperation';

# <Method Title>

`<method_name>` request type

<Brief description of what this endpoint does.>

<FastnearDirectOperation pageModelId="<page_model_id>" />
```

The `pageModelId` comes from the generated registry synced from `mike-docs`. For example, `view_account` uses `pageModelId="rpc-view-account"`.

## Adding New REST API Pages

Use `FastnearDirectOperation` for FastNear and REST API content under `docs/rpc-api/<service>/`.

For a standard REST operation page:

```mdx
---
title: Account Full
description: Fetch a combined FastNear account view
sidebar_position: 1
hide_table_of_contents: true
---

import FastnearDirectOperation from '@site/src/components/FastnearDirectOperation';

# Account Full

<FastnearDirectOperation pageModelId="fastnear-v1-account-full" />
```

Guidelines:

- Use the generated `pageModelId`, not a raw `/apis/...` path string.
- Keep the existing doc IDs and folder routes stable when reorganizing nav or sidebar labels. The current IA is section-sidebar driven, not route-driven.
- If the underlying page model is missing or wrong, fix it in `mike-docs` and resync instead of papering over it locally.

### Step 2: Add to sidebars.js

Add the new doc ID to the appropriate category in `sidebars.js`:

```js
{
  type: 'category',
  label: 'Account',
  items: [
    'rpc-api/account/view-account',
    'rpc-api/account/your-new-page',   // <-- add here
  ],
},
```

### Step 3: Verify

Run `yarn start` and navigate to the new page. The direct renderer should load without needing any iframe or backend routing glue.

### Existing endpoint pages

- `docs/rpc-api/account/view-account.mdx` → `pageModelId="rpc-view-account"`
- `docs/rpc-api/contract/call-function.mdx` → `pageModelId="rpc-call"`

## Docs Backend Integration

The site now treats `mike-docs` as a generation pipeline, not an embedded runtime. Public docs pages render directly from the vendored page-model registry.

### How it works

1. Each YAML file in mike-docs `rpcs/` gets its own canonical page path (e.g. `rpcs/account/view_account.yaml` → `/rpcs/account/view_account`).
2. REST API service repos now own only aggregate `openapi/openapi.yaml`; mike-docs syncs those aggregate specs and splits them into canonical `/apis/<service>/...` leaf pages.
3. `mike-docs` generates the shared page-model registry and vendors it into `builder-docs/src/data/generatedFastnearPageModels.json`.
4. `builder-docs` renders `/docs/rpc-api/**` pages with `FastnearDirectOperation`.
5. `builder-docs` generates canonical hosted pages under `src/pages/rpcs/**` and `src/pages/apis/**` so `docs.fastnear.com` serves the same bespoke runtime directly.
6. Redocly remains available in `mike-docs` only for validation and legacy debugging.

See [`/Users/mikepurvis/near/mike-docs/README.md`](/Users/mikepurvis/near/mike-docs/README.md) and [`/Users/mikepurvis/near/mike-docs/INTEGRATION_GUIDE.md`](/Users/mikepurvis/near/mike-docs/INTEGRATION_GUIDE.md) for the current portal-side configuration guide.

## Authentication & API Keys

### Storage keys

All docs pages use the default localStorage key `fastnear:apiKey`. The UI migrates away from the legacy `fastnear_api_key` key automatically when encountered.

### API key flow

1. User enters key in `ApiKeyManager` → saved to `localStorage.fastnear:apiKey`
2. `FastnearDirectOperation` reads key from localStorage or `?apiKey=`
3. The live request uses the transport configured by the page model, usually `Authorization: Bearer ...`
4. The copied curl command matches the live request shape

### Usage example

```bash
curl "https://rpc.mainnet.fastnear.com?apiKey=${apiKey}" \
  -H "Content-Type: application/json" \
  --data '{"method":"block","params":{"finality":"final"},"id":1,"jsonrpc":"2.0"}'
```

## Development Notes

- Deployed to https://docs.fastnear.com
- GitHub repository: https://github.com/fastnear/builder-docs
- Yarn v4.9.2 as package manager
- Node.js 18.0 or higher required
- Legacy Redocly pages can be previewed locally using `npm run preview:headless` in the **mike-docs** repo root — runs on http://127.0.0.1:4000
- Bespoke pages can be previewed locally using `npm run standalone:dev` in the **mike-docs** repo root — runs on http://127.0.0.1:4010
- Public docs pages in this repo no longer depend on the legacy iframe routing layer

## Upstream: nearcore Generator Pipeline

The `rpcs/` YAML files in mike-docs are auto-generated from nearcore's OpenAPI spec:

```
nearcore (Rust)
    ↓  cargo build generates openapi.json
nearcore/chain/jsonrpc/openapi/openapi.json
    ↓  npm run generate-rpc (in mike-docs)
scripts/nearcore-operation-map.js  →  scripts/generate-from-nearcore.js
    ↓
mike-docs/rpcs/<category>/<operation>.yaml    (per-operation specs)
mike-docs/rpcs/openapi.yaml                  (aggregate spec)
    ↓  shared page-model generation + vendor sync
builder-docs renders via FastnearDirectOperation
```

To add a new RPC operation from nearcore:

1. In **mike-docs**: add an entry to `OPERATIONS` in `scripts/nearcore-operation-map.js`
2. In **mike-docs**: run `npm run generate-rpc` to generate the YAML
3. In **builder-docs**: create an MDX page under `docs/rpc-api/<category>/` using `FastnearDirectOperation`
4. In **builder-docs**: add the page to `sidebars.js`

See mike-docs `CLAUDE.md` and `README.md` for full generator documentation.
