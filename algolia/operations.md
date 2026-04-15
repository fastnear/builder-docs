# Algolia Operations

Treat this directory as the executable source of truth for FastNear search quality.

## Repo-owned artifacts

- `index-settings.json`: the repo-owned Algolia index settings embedded into the crawler's `initialIndexSettings`
- `rules.json`: optional dashboard curation baseline for promoted-result rules keyed by `fastnear-*` object IDs
- `synonyms.json`: optional dashboard curation baseline for synonyms keyed by `fastnear-*` object IDs
- `crawler/shared.js`: the shared crawler definition used for API sync and the pasteable editor artifact
- `docsearch-crawler.config.js`: the generated pasteable crawler editor artifact
- `relevance-cases.json`: live-query acceptance cases for the public docs index

## Required env vars

### Runtime docs search

These power the public docs search UI at runtime and only need the search-only DocSearch key.

```bash
DOCSEARCH_APP_ID=...
DOCSEARCH_INDEX_NAME=...
DOCSEARCH_API_KEY=...
```

### Operator sync and crawler control

These are only needed for repo-managed Algolia maintenance commands such as `yarn algolia:status`,
`yarn algolia:sync`, and the crawler control scripts.

```bash
ALGOLIA_CRAWLER_USER_ID=...
ALGOLIA_CRAWLER_API_KEY=...
ALGOLIA_CRAWLER_NAME=...
```

The crawler's internal indexing `apiKey` is intentionally preserved from the live crawler and is not managed by this repo.

## Operator flow

1. Update the repo-owned crawler or index-settings artifacts.
2. Run `yarn algolia:status`.
3. Run `yarn algolia:sync`.
4. Run `yarn algolia:crawler:start`.
5. Run `yarn algolia:crawler:wait --task <taskId>`.
6. Run `yarn audit:algolia-relevance`.

Use `yarn algolia:inspect --query "view_account"` when you want to see the grouped live hits and inspect retrievable fields such as `surface`, `family`, `page_type`, `transport`, `operation_id`, and `canonical_target`.

## Safety model

- `yarn algolia:status` compares the live crawler config against the repo's generated crawler config.
- `yarn algolia:sync` patches the crawler config, including `initialIndexSettings`, and preserves the live crawler indexing key.
- Dashboard Rules and synonyms are no longer repo-synced by scripts; keep them as a manual curation layer when needed.
- Crawler sync and crawl execution are intentionally separate commands.
