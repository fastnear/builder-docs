# Algolia Operations

Treat this directory as the executable source of truth for FastNear search quality.

## Repo-owned artifacts

- `index-settings.json`: the repo-owned subset of live Algolia index settings
- `rules.json`: repo-owned promoted-result rules, keyed by `fastnear-*` object IDs
- `synonyms.json`: repo-owned synonyms, keyed by `fastnear-*` object IDs
- `crawler/shared.js`: the shared crawler definition used for API sync and the pasteable editor artifact
- `docsearch-crawler.config.js`: the generated pasteable crawler editor artifact
- `relevance-cases.json`: live-query acceptance cases for the public docs index

## Required env vars

```bash
DOCSEARCH_APP_ID=...
DOCSEARCH_INDEX_NAME=...
DOCSEARCH_API_KEY=...
ALGOLIA_ADMIN_API_KEY=...
ALGOLIA_CRAWLER_USER_ID=...
ALGOLIA_CRAWLER_API_KEY=...
ALGOLIA_CRAWLER_NAME=...
```

The crawler's internal indexing `apiKey` is intentionally preserved from the live crawler and is not managed by this repo.

## Operator flow

1. Update the repo-owned search or crawler artifacts.
2. Run `yarn algolia:status`.
3. Run `yarn algolia:sync`.
4. Run `yarn algolia:crawler:start`.
5. Run `yarn algolia:crawler:wait --task <taskId>`.
6. Run `yarn audit:algolia-relevance`.

## Safety model

- Search settings sync only updates the repo-owned keys from `index-settings.json`.
- Search Rules and synonyms sync only creates, updates, or deletes `fastnear-*` entries.
- Crawler sync only patches the repo-owned crawler fields. It preserves the live crawler indexing key.
- Crawler sync and crawl execution are intentionally separate commands.
