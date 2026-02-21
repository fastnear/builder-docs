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

## High-Level Architecture

This is a Docusaurus v3.9.2 documentation site focused on providing advanced NEAR Protocol documentation for seasoned developers, builders, and founders. The site complements the general NEAR documentation at docs.near.org with more technical, precise definitions.

### Documentation Structure

- `/docs/rpc-api/` — RPC and API reference documentation (embedded Redocly pages)
- `/docs/transaction-flow/` — 11-page deep dive on NEAR transaction lifecycle (async model, finality, gas economics, runtime execution, etc.)
- `/docs/snapshots/` — Validator snapshot documentation for mainnet/testnet
- Content is written in MDX format, allowing React components within markdown

### React Components

- **`RpcRedoc`** (`src/components/RpcRedoc/index.js`) — The primary component for embedding single Redocly operation pages via iframe. Used by all RPC endpoint doc pages.
- **`ApiKeyManager`** (`src/components/ApiKeyManager/index.js`) — UI for users to set/manage their FastNEAR API key, stored in localStorage.
- **`SimpleButton`** — Reusable button component, used in the snapshots landing page.

### Other Notable Files

- **`src/pages/near-rpc-openapi.yaml`** — A local snapshot of the OpenAPI spec. The canonical source of truth is `rpcs/openapi.yaml` in the mike-docs repo (auto-generated from nearcore via `npm run generate-rpc`). This local copy may drift from the upstream.
- **`static/js-loaded-globally/`** — Vendored JS bundles (`near-api-js` 5.1.1, `@fastnear/api` 0.9.7) loaded globally for interactive docs. The vendored bundles are separate pinned copies for browser use and are not managed via `package.json`.
- **`REDOCLY_SETUP.md`** — Guide for how the Redocly portal itself must be configured (pagination, hidden chrome, auth injection). These changes live on the Redocly side, not in this repo.
- **`@docusaurus/plugin-client-redirects`** — Installed as a dependency for URL redirect management.

### Content Focus Areas

- Asynchronous transactions and receipts in NEAR
- NEAR's account model (named accounts vs implicit accounts)
- Account key pairs (secp256k1 and ed25519 support)
- Smart contracts in Rust compiled to WebAssembly
- Transaction tracking and finality types

## Adding New RPC Endpoint Pages

This is the main expansion pattern for the site. Each RPC method gets its own MDX page that embeds the corresponding Redocly operation.

### Step 1: Create the MDX file

Create a new file under `docs/rpc-api/<category>/`, following the existing pattern:

```mdx
---
title: <Method Title>
description: <Brief description>
sidebar_position: <N>
hide_table_of_contents: true
---

import RpcRedoc from '@site/src/components/RpcRedoc';

# <Method Title>

`<method_name>` request type

<Brief description of what this endpoint does.>

<RpcRedoc
  redoclyBase="https://fastnear.redocly.app"
  path="/rpcs/<category>/<yaml_filename_without_ext>"
  height="1600px"
/>
```

The `path` value corresponds to the YAML file path in the mike-docs repo under `rpcs/`. For example, `rpcs/account/view_account.yaml` becomes `path="/rpcs/account/view_account"`. Check the mike-docs repo's `rpcs/` directory for available operations — these are generated from nearcore via `npm run generate-rpc` in mike-docs (see "Upstream: nearcore Generator Pipeline" below).

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

Run `yarn start` and navigate to the new page. The Redocly iframe should load the operation documentation with the Try-It console.

### Existing endpoint pages

- `docs/rpc-api/account/view-account.mdx` → `path="/rpcs/account/view_account"`
- `docs/rpc-api/contract/call-function.mdx` → `path="/rpcs/contract/call"`

## Redocly Integration

The site uses Redocly (paid plan) as a headless API documentation renderer, embedding single-operation pages at `fastnear.redocly.app` without navigation chrome.

### How it works

1. Each YAML file in mike-docs `rpcs/` gets its own page at the corresponding path (e.g. `rpcs/account/view_account.yaml` → `/rpcs/account/view_account`)
2. Portal chrome (sidebar, navbar) is hidden via `redocly.yaml` settings
3. The `RpcRedoc` component embeds these pages in iframes using the `path` prop
4. API keys flow from localStorage → iframe URL param → Redocly's `configure.ts` → Try-It console

See `REDOCLY_SETUP.md` for the full Redocly portal configuration guide.

### RpcRedoc props

| Prop | Default | Description |
|------|---------|-------------|
| `redoclyBase` | (required) | Base URL, e.g. `"https://fastnear.redocly.app"` |
| `path` | — | Path to the operation page, e.g. `"/rpcs/account/view_account"` |
| `operationHref` | — | Alternative: path to operation page if using `pagination: item` routes |
| `apiKey` | — | Optional explicit API key (overrides localStorage/URL) |
| `bearerToken` | — | Optional explicit bearer token (overrides localStorage/URL) |
| `apiKeyStorageKey` | `"fastnear:apiKey"` | localStorage key to read API key from |
| `bearerStorageKey` | `"fastnear:bearer"` | localStorage key to read bearer token from |
| `height` | `"calc(100vh - 140px)"` | iframe height |

## Authentication & API Keys

### Storage keys

All MDX pages use the default localStorage key `"fastnear:apiKey"`. The `ApiKeyManager` component also writes to the legacy key `fastnear_api_key` for backward compatibility, and migrates on read.

### API key flow

1. User enters key in `ApiKeyManager` → saved to both localStorage keys
2. `RpcRedoc` reads key from localStorage (using the `apiKeyStorageKey` prop)
3. Key is appended to iframe URL as `?apiKey=<key>`
4. Redocly's `configure.ts` reads it from the URL and injects into Try-It requests

### Usage example

```bash
curl "https://rpc.mainnet.fastnear.com?apiKey=${apiKey}" \
  -H "Content-Type: application/json" \
  --data '{"method":"block","params":{"finality":"final"},"id":1,"jsonrpc":"2.0"}'
```

## Development Notes

- Deployed to https://builder-docs.fastnear.com
- GitHub repository: https://github.com/fastnear/builder-docs
- Yarn v4.9.2 as package manager
- Node.js 18.0 or higher required
- Redocly documentation can be previewed locally using `npm run preview` in the **mike-docs** repo root (not this repo) — runs on http://127.0.0.1:4000
- Redocly integration files are tracked in this repo alongside the documentation content

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
    ↓  Redocly renders at fastnear.redocly.app
builder-docs embeds via RpcRedoc iframe
```

To add a new RPC operation from nearcore:

1. In **mike-docs**: add an entry to `OPERATIONS` in `scripts/nearcore-operation-map.js`
2. In **mike-docs**: run `npm run generate-rpc` to generate the YAML
3. In **builder-docs**: create an MDX page under `docs/rpc-api/<category>/` using the `RpcRedoc` component
4. In **builder-docs**: add the page to `sidebars.js`

See mike-docs `CLAUDE.md` and `README.md` for full generator documentation.
