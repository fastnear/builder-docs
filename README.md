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
- `src/components/FastnearDirectOperation/` for native interactive API and RPC docs inside `/docs/**` reference pages
- `src/components/FastnearHostedOperationPage/` for canonical hosted `/rpcs/...` and `/apis/...` routes
- `src/components/ApiKeyManager/` for browser-persisted FastNear API keys
- `src/components/FastnearApiSidebarVersionControl/` for FastNear API version-aware sidebar filtering
- `src/data/generatedFastnearPageModels.json`, vendored from `mike-docs`
- `scripts/generate-bespoke-host-pages.js`, which generates `src/pages/rpcs/**` and `src/pages/apis/**`

## Development

### Prerequisites

- Node.js 20+ (`.node-version` currently pins `24` for local development)
- Yarn 4 (`corepack` supported)

### Local builder-docs development

```bash
yarn install
yarn start
```

`yarn start` regenerates the hosted canonical route files before starting Docusaurus.

For most UI/content work in this repo, that is enough. The docs pages render directly from the vendored page-model registry and make live network requests themselves.

### Playwright smoke tests

```bash
yarn playwright:install
yarn test:e2e
```

The Playwright config starts a local Docusaurus server automatically, then runs a small Chromium-based smoke suite against the public docs experience. Use it for routing, theming, copy-action, and interaction regressions as the bespoke docs UI evolves.

### Refreshing the generated docs models

If you changed specs, enhancements, or the shared runtime in `mike-docs`, refresh the vendored artifacts first:

```bash
cd /Users/mikepurvis/near/mike-docs
npm install
npm run sync:apis
```

That updates the generated page models copied into `builder-docs/src/data/generatedFastnearPageModels.json`.

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

Docs pages under `docs/rpc-api/**` should use the native direct renderer:

```mdx
---
slug: /rpc/<category>/<route-segment>
---

import FastnearDirectOperation from '@site/src/components/FastnearDirectOperation';

<FastnearDirectOperation pageModelId="rpc-view-account" />
```

RPC source files currently live under `docs/rpc-api/<category>/`, but they publish at `/docs/rpc/<category>/<route-segment>` via frontmatter `slug`.

Use the generated `pageModelId` from `mike-docs`. The canonical hosted `/rpcs/...` and `/apis/...` routes are generated automatically; do not hand-edit files under `src/pages/rpcs/**` or `src/pages/apis/**`.

## Canonical Route Contract

These paths are the public contract:

```text
/rpcs/account/view_account
/rpcs/block/block_by_id
/apis/fastnear/v1/account_full
/apis/transactions/v0/account
```

They are generated and hosted directly by this repo. The matching `/docs/rpc/**` pages and service-specific `/docs/**` reference pages use the same underlying page-model data and interactive runtime.

## Useful URLs

| URL | Purpose |
| --- | --- |
| `https://docs.fastnear.com` | Production docs host |
| `http://localhost:3000` | Local Docusaurus dev server |
| `http://127.0.0.1:4000` | Local legacy Redocly preview from `mike-docs` |
| `http://127.0.0.1:4010` | Local standalone bespoke runtime from `mike-docs` |

## Further Reading

- [CLAUDE.md](CLAUDE.md) for repo-specific coding guidance
- [/Users/mikepurvis/near/mike-docs/README.md](/Users/mikepurvis/near/mike-docs/README.md) for the generation pipeline
- [/Users/mikepurvis/near/mike-docs/INTEGRATION_GUIDE.md](/Users/mikepurvis/near/mike-docs/INTEGRATION_GUIDE.md) for the current cross-repo contract
