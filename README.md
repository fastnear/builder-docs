# Builder Documentation

Targeted documentation site for seasoned NEAR developers, builders, and founders. Complements the general [NEAR docs](https://docs.near.org) with clinical, precise definitions and advanced technical content.

Deployed at: https://builder-docs.fastnear.com

## Two-Repo Architecture

Two repositories work together to deliver embedded API documentation:

| Repo | GitHub | Deploys to | Purpose |
|------|--------|------------|---------|
| **builder-docs** (this repo) | `fastnear/builder-docs` | `builder-docs.fastnear.com` | Docusaurus site — all content pages, navigation, API key management |
| **mike-docs** | `fastnear/docs` | `fastnear.redocly.app` | Redocly portal — OpenAPI specs, Try-It console, operation pages rendered headlessly |

### How they connect

1. The mike-docs repo contains OpenAPI YAML specs under `rpcs/` and `apis/` — each YAML file becomes its own page
2. Redocly builds those specs into pages at the corresponding path (e.g. `rpcs/account/view_account.yaml` → `/rpcs/account/view_account`)
3. The builder-docs `RpcRedoc` component embeds those pages in iframes via the `path` prop
4. API keys flow from builder-docs localStorage → iframe URL param → Redocly's `configure.ts` → Try-It console

### What lives where

**builder-docs (this repo):**
- MDX content pages (`docs/`)
- `RpcRedoc` iframe embedding component
- `ApiKeyManager` component for API key entry
- Docusaurus config, sidebars, styling

**mike-docs:**
- OpenAPI YAML specs (`rpcs/openapi.yaml`, `apis/openapi.yaml`)
- `redocly.yaml` — portal config (hidden sidebar/navbar/breadcrumbs)
- `reference.page.yaml` — enables `pagination: item` for single-operation pages
- `@theme/ext/configure.ts` — reads API key from URL params and injects into requests
- `scripts/dark-mode.js` — dark mode support

## Development

### Prerequisites

- Node.js 18+
- Yarn (v4.9.2, included via corepack)

### Running builder-docs

```bash
yarn install
yarn start        # Dev server on http://localhost:3000
```

### Running mike-docs (Redocly preview)

```bash
cd /path/to/mike-docs
npm install
npx @redocly/cli preview   # Preview server on http://localhost:4000
```

### Testing the full integration locally

1. Start the Redocly preview (port 4000)
2. Temporarily change `redoclyBase` in an MDX file to `"http://localhost:4000"`
3. Start builder-docs (port 3000)
4. Navigate to an RPC endpoint page and verify the iframe loads

### Production build

```bash
yarn build        # Output to build/
yarn serve        # Serve the production build locally
```

## URL Routing Convention

Each YAML file in mike-docs `rpcs/` gets its own Redocly page at the corresponding path. The URL is derived from the file path, not the operationId:

```
rpcs/account/view_account.yaml  →  /rpcs/account/view_account
rpcs/contract/call.yaml         →  /rpcs/contract/call
rpcs/block/block_by_height.yaml →  /rpcs/block/block_by_height
```

The `path` prop in builder-docs MDX files must match these paths exactly. See `CLAUDE.md` for the full guide on adding new endpoint pages.

## Key URLs

| URL | Description |
|-----|-------------|
| `https://builder-docs.fastnear.com` | Production site |
| `https://fastnear.redocly.app` | Redocly portal (headless, no chrome) |
| `https://fastnear.redocly.app/rpcs/account/view_account` | Example single-operation page |
| `http://localhost:3000` | Local builder-docs dev server |
| `http://localhost:4000` | Local Redocly preview server |

## Further Reading

- `CLAUDE.md` — Development guide, component docs, adding new endpoint pages
- `REDOCLY_SETUP.md` — How the Redocly portal is configured for headless embedding
