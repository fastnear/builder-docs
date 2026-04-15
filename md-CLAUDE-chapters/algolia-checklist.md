# FastNear Algolia Checklist

Compact deployment and verification checklist for Algolia search on `docs.fastnear.com`.

This file is a short operator aid. The canonical deep docs are:

- [`md-CLAUDE-chapters/algolia_search_runbook.md`](./algolia_search_runbook.md)
- [`md-CLAUDE-chapters/algolia_search_and_crawler_control.md`](./algolia_search_and_crawler_control.md)
- [`algolia/operations.md`](../algolia/operations.md)

## Runtime docs search env vars

These power the public DocSearch UI in `builder-docs`:

```bash
DOCS_SEARCH_PROVIDER=algolia
DOCSEARCH_APP_ID=YOUR_ALGOLIA_APP_ID
DOCSEARCH_API_KEY=YOUR_ALGOLIA_SEARCH_ONLY_API_KEY
DOCSEARCH_INDEX_NAME=YOUR_DOCSEARCH_INDEX_NAME
```

Important notes:

- If `DOCS_SEARCH_PROVIDER=algolia` is set but any DocSearch value is missing, the site falls back to local search.
- `DOCSEARCH_API_KEY` must be the search-only frontend key.
- `DOCSEARCH_INDEX_NAME` is the index name, not the crawler display name.
- This repo intentionally does not expose `DOCSEARCH_ASSISTANT_ID` or an Ask-AI env seam.

## Operator-only crawler env vars

These are needed for crawler inspection and sync commands such as `yarn algolia:status`, `yarn algolia:sync`, `yarn algolia:crawler:start`, and `yarn algolia:crawler:wait`:

```bash
ALGOLIA_CRAWLER_USER_ID=YOUR_ALGOLIA_CRAWLER_USER_ID
ALGOLIA_CRAWLER_API_KEY=YOUR_ALGOLIA_CRAWLER_API_KEY
ALGOLIA_CRAWLER_NAME=YOUR_ALGOLIA_CRAWLER_NAME
```

Important notes:

- `ALGOLIA_CRAWLER_NAME` is the crawler display name, for example `prod_fastnear_docs_crawler`.
- The repo constructs crawler Basic auth internally. Do not precompute it.
- `ALGOLIA_ADMIN_API_KEY`, `ALGOLIA_CRAWLER_ID`, and `ALGOLIA_CRAWLER_BASIC_AUTH` are intentionally not part of the repo contract.

## Optional UI flag

Only set this if you intentionally want to hide the early API families:

```bash
HIDE_EARLY_API_FAMILIES=true
```

That removes:

- Transfers API
- KV FastData API

from the public nav, sitemap, and search/indexing surfaces.

## Repo-owned crawler scope

The source of truth is [`algolia/crawler/shared.js`](../algolia/crawler/shared.js).

Included public docs route groups:

- `/`
- `/rpc/**`
- `/api/**`
- `/tx/**`
- `/transfers/**`
- `/neardata/**`
- `/fastdata/**`
- `/auth/**`
- `/agents/**`
- `/snapshots/**`
- localized equivalents such as `/ru/**`

Explicitly excluded:

- `/transaction-flow/**`
- `/rpcs/**`
- `/apis/**`
- `/**/*.md`
- `/llms.txt`
- `/llms-full.txt`
- `/guides/llms.txt`
- `/structured-data/**`
- `/api/reference`
- `/redocly-config`

Search records rely on centralized `docsearch:*` meta tags. The most important fields are:

- `category`
- `method_type`
- `surface`
- `family`
- `audience`
- `page_type`

Operation pages also emit:

- `transport`
- `operation_id`
- `canonical_target`
- `keywords`

## Local verification

For repo-state validation:

```bash
yarn audit:indexing
yarn audit:algolia-highlights
```

To smoke-test the Algolia runtime branch locally:

```bash
DOCS_SEARCH_PROVIDER=algolia \
DOCSEARCH_APP_ID=test-app \
DOCSEARCH_API_KEY=test-key \
DOCSEARCH_INDEX_NAME=test-index \
yarn build
```

For live crawler/index maintenance after repo changes:

```bash
yarn algolia:status
yarn algolia:sync
yarn algolia:crawler:start
yarn algolia:crawler:wait --task <taskId>
yarn audit:algolia-relevance
```

## Post-deploy checks

Spot-check these public URLs:

- `/rpc`
- `/api`
- `/rpc/account/view-account`
- `/api/v1/public-key`
- `/ru/rpc`
- `/structured-data/site-graph.json`
- `/llms.txt`

Confirm:

- Algolia search UI appears and returns results.
- Locale filtering still works, including Russian pages.
- Search results do not surface `/rpcs/**`, `/apis/**`, or `/structured-data/**`.
- Public pages still emit expected JSON-LD and `docsearch:*` meta tags.
- Reference pages emit `docsearch:category`, `docsearch:surface`, `docsearch:audience`, `docsearch:page_type`, and the reference-only fields such as `docsearch:method_type` and `docsearch:family`.

## Scope boundaries

- Dashboard Rules and synonyms are a manual curation layer. The repo keeps their intended-state JSON, but the scripts do not automatically push them.
- `mike-docs` env vars such as `PLAN_GATES` are separate and are not required for the public `builder-docs` Algolia deploy.
