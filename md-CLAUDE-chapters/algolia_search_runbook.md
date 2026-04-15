# FastNear Algolia Search Runbook

This runbook is the practical companion to [algolia_search_and_crawler_control.md](/Users/mikepurvis/near/fn/builder-docs/md-CLAUDE-chapters/algolia_search_and_crawler_control.md). Its purpose is not to explain the whole architecture again. Its purpose is to help an operator make changes safely, verify live state, and troubleshoot failures.

Use this runbook when you need to:

- inspect live Algolia drift
- sync crawler config
- sync live search settings, Rules, and synonyms
- trigger a reindex
- verify that search quality improved
- debug why a sync or crawl failed

---

## What this runbook assumes

You are working in:

```bash
/Users/mikepurvis/near/fn/builder-docs
```

The repo already contains the source of truth for:

- crawler config
- index settings
- repo-owned Rules
- repo-owned synonyms
- relevance acceptance cases

Those live in:

- [algolia/crawler/shared.js](/Users/mikepurvis/near/fn/builder-docs/algolia/crawler/shared.js)
- [algolia/docsearch-crawler.config.js](/Users/mikepurvis/near/fn/builder-docs/algolia/docsearch-crawler.config.js)
- [algolia/index-settings.json](/Users/mikepurvis/near/fn/builder-docs/algolia/index-settings.json)
- [algolia/rules.json](/Users/mikepurvis/near/fn/builder-docs/algolia/rules.json)
- [algolia/synonyms.json](/Users/mikepurvis/near/fn/builder-docs/algolia/synonyms.json)
- [algolia/relevance-cases.json](/Users/mikepurvis/near/fn/builder-docs/algolia/relevance-cases.json)

---

## Required env vars

### Frontend DocSearch

These are needed for live relevance checks:

```bash
DOCS_SEARCH_PROVIDER=algolia
DOCSEARCH_APP_ID=...
DOCSEARCH_API_KEY=...
DOCSEARCH_INDEX_NAME=...
```

### Search-admin sync

This is needed for `yarn algolia:status` and `yarn algolia:sync`:

```bash
ALGOLIA_ADMIN_API_KEY=...
```

### Crawler control

These are needed for crawler status, sync, start, and wait:

```bash
ALGOLIA_CRAWLER_USER_ID=...
ALGOLIA_CRAWLER_API_KEY=...
ALGOLIA_CRAWLER_NAME=...
```

Important notes:

- `DOCSEARCH_INDEX_NAME` is the index name, not the crawler display name.
- `ALGOLIA_CRAWLER_NAME` is the crawler display name, for example `prod_fastnear_docs_crawler`.
- The repo now constructs crawler Basic auth internally. You do not need to precompute it.

---

## The normal operator flow

This is the default sequence after changing search behavior in the repo.

### 1. Validate the repo state locally

Run:

```bash
yarn audit:indexing
yarn audit:algolia-highlights
```

What this tells you:

- indexing surfaces still match the intended contract
- the crawler config artifact still matches the shared definition
- the SearchBar highlight handling still accepts the supported Algolia highlight shapes

### 2. Inspect live drift

Run:

```bash
yarn algolia:status
```

This compares live state against the repo-owned desired state for:

- search settings
- repo-owned Rules
- repo-owned synonyms
- crawler config

What to expect:

- exit code `0` if live state matches repo state and crawler is not blocked
- exit code non-zero if there is drift or a blocked crawler

If `ALGOLIA_ADMIN_API_KEY` is missing or invalid, this command will fail before giving you a useful diff.

### 3. Sync live state

Run:

```bash
yarn algolia:sync
```

This does two things:

- syncs live search settings, `fastnear-*` Rules, and `fastnear-*` synonyms
- syncs crawler config

What it does **not** do:

- it does not start a crawl

### 4. Start a reindex

Run:

```bash
yarn algolia:crawler:start
```

Expected result:

- prints a crawler ID
- prints a task ID

Example shape:

```text
Started Algolia Crawl
- Crawler ID: ...
- Task ID: ...
```

### 5. Wait for the crawl task

Run:

```bash
yarn algolia:crawler:wait --task <taskId>
```

Expected result:

- prints the completed task
- prints the latest crawl summary when available

### 6. Verify post-crawl state

Run:

```bash
yarn algolia:crawler:status
yarn audit:algolia-relevance
```

What you want to see:

- crawler drift: `none`
- live relevance improvements for the queries you changed

---

## Quick command reference

### Read-only inspection

```bash
yarn algolia:status
yarn algolia:crawler:status
yarn audit:algolia-relevance
yarn audit:algolia-highlights
yarn audit:indexing
```

### Mutating operations

```bash
yarn algolia:sync
yarn algolia:crawler:sync
yarn algolia:crawler:start
yarn algolia:crawler:wait --task <taskId>
```

### When to use which command

- `yarn algolia:status`
  - use when you want the full live-vs-repo comparison
- `yarn algolia:sync`
  - use when you want to push all repo-owned Algolia state live
- `yarn algolia:crawler:status`
  - use when you only care about crawler state
- `yarn algolia:crawler:sync`
  - use when only crawler config changed
- `yarn algolia:crawler:start`
  - use after a config sync when you want the crawler to apply the new shape
- `yarn algolia:crawler:wait`
  - use to observe completion of a reindex task you already started

---

## Safe ownership model

The repo is intentionally conservative about what it mutates.

### Search-admin sync

`yarn algolia:sync` only mutates:

- repo-owned keys from `algolia/index-settings.json`
- Rules with `objectID` prefixed `fastnear-`
- synonyms with `objectID` prefixed `fastnear-`

This means:

- repo-owned entries are created or updated
- removed repo-owned entries are deleted
- non-FastNear live entries are left alone

### Crawler sync

`yarn algolia:crawler:sync` only patches the crawler config fields owned by the repo.

Important detail:

- the crawler’s internal indexing `apiKey` is intentionally preserved from the live crawler and is **not** managed by this repo

---

## Typical success signals

### Healthy crawler status

Good output looks like:

```text
Algolia Crawler
- Crawler ID: ...
- Name: prod_fastnear_docs_crawler
- Running: yes
- Reindexing: no
- Blocked: no
- Latest config version: 3
- Drift: none
```

Notes:

- `Running: yes` is normal
- `Blocked: no` is the important health signal
- `Reindexing: yes` is normal while a crawl is in progress

### Healthy sync output

Crawler sync:

```text
Synced Algolia Crawler
- Crawler ID: ...
- Task ID: ...
- Latest config version: ...
```

Crawler start:

```text
Started Algolia Crawl
- Crawler ID: ...
- Task ID: ...
```

Crawler wait:

```text
Completed Algolia Crawl Task
- Crawler ID: ...
- Task ID: ...
```

---

## Troubleshooting

This section is based on real failures encountered during the live integration work.

### Problem: `Invalid Application-ID or API key`

Usually means:

- `ALGOLIA_ADMIN_API_KEY` is missing
- `ALGOLIA_ADMIN_API_KEY` is not valid for the current app
- `DOCSEARCH_APP_ID` is wrong for the index you are trying to inspect

What to do:

1. Confirm `DOCSEARCH_APP_ID`
2. Confirm `DOCSEARCH_INDEX_NAME`
3. Confirm `ALGOLIA_ADMIN_API_KEY`
4. Retry:

```bash
yarn algolia:status
```

### Problem: crawler API auth fails

Usually means:

- `ALGOLIA_CRAWLER_USER_ID` is missing or wrong
- `ALGOLIA_CRAWLER_API_KEY` is missing or wrong
- `ALGOLIA_CRAWLER_NAME` does not match the real crawler display name

What to do:

1. Confirm the crawler user ID
2. Confirm the crawler API key
3. Confirm the exact crawler name
4. Retry:

```bash
yarn algolia:crawler:status
```

### Problem: crawler list endpoint rejects `appID`

This was a real integration issue.

Symptom:

```text
validation_error: appID is not allowed
```

Interpretation:

- do not assume every crawler endpoint accepts the same query params
- in this repo, crawler resolution now uses crawler name alone

This has already been fixed in the scripts. If you see this again, something regressed in the resolver.

### Problem: crawler run fetch rejects pagination params

This also happened during live validation.

Symptom:

- `crawl_runs` returned validation errors

Cause:

- the endpoint expects `limit` and `order`, not `itemsPerPage` and `page`

This has already been fixed in the repo. If it reappears, check `scripts/lib/algolia-crawler-control.js`.

### Problem: crawler config sync fails with parser errors

Symptom shape:

```text
validation_error
Parsing error: Unexpected token ...
```

What this usually means:

- the live crawler parser is stricter than modern Node
- the extractor uses syntax the crawler runtime dislikes

Known risky syntax:

- optional chaining
- bare `catch {}`
- overly clever modern shorthand inside the embedded extractor function

How to fix:

1. Edit [algolia/crawler/shared.js](/Users/mikepurvis/near/fn/builder-docs/algolia/crawler/shared.js)
2. Make the extractor more conservative
3. Regenerate:

```bash
node - <<'EOF'
const fs = require('node:fs');
const { renderCrawlerConfigSource } = require('/Users/mikepurvis/near/fn/builder-docs/algolia/crawler/shared.js');
fs.writeFileSync('/Users/mikepurvis/near/fn/builder-docs/algolia/docsearch-crawler.config.js', renderCrawlerConfigSource(), 'utf8');
EOF
```

4. Re-run:

```bash
yarn audit:indexing
yarn algolia:crawler:sync
```

### Problem: crawler status still shows the old version after a sync

Usually means:

- the status command started before the sync completed

What to do:

- run a fresh `yarn algolia:crawler:status`

Do not assume the sync failed just because a parallel or earlier status process still shows the older version.

### Problem: crawler drift is gone but relevance is still wrong

This is a very important distinction.

If crawler drift is `none` but queries like these still fail:

- `view account`
- `authentication`
- `api key`
- `bearer token`

then the remaining work is likely in the **search-admin layer**, not the crawler layer.

What to do:

```bash
yarn algolia:sync
yarn audit:algolia-relevance
```

That pushes:

- live index settings
- repo-owned Rules
- repo-owned synonyms

### Problem: search result UI shows literal markup like `<mark>`

That means the highlight shape is not being normalized correctly.

What to do:

1. Check [src/theme/SearchBar/highlight.mjs](/Users/mikepurvis/near/fn/builder-docs/src/theme/SearchBar/highlight.mjs)
2. Run:

```bash
yarn audit:algolia-highlights
```

If this audit fails, fix the normalization first before blaming the crawler or index.

---

## Query verification checklist

After syncing and reindexing, these are the most useful queries to spot-check:

- `view account`
- `view-account`
- `view_account`
- `send tx`
- `send-tx`
- `send_tx`
- `account history`
- `public key`
- `authentication`
- `api key`
- `bearer token`
- `block headers`
- `choosing surfaces`

The canonical acceptance list lives in [algolia/relevance-cases.json](/Users/mikepurvis/near/fn/builder-docs/algolia/relevance-cases.json).

Run:

```bash
yarn audit:algolia-relevance
```

Interpretation:

- leaf and auth routing wins mean the system is behaving like a curated docs search product
- failures usually tell you whether the issue is:
  - missing Rule
  - missing synonym
  - index settings drift
  - insufficient record shaping

---

## When to edit what

### Edit `algolia/crawler/shared.js` when:

- the crawler is indexing noisy text
- a page type needs better content selection
- a surface should be included or excluded
- page-rank behavior should change

### Edit `algolia/index-settings.json` when:

- result dedupe needs to change
- snippet size needs to change
- searchable attribute priority needs to change
- separators or highlight tags need to change
- semantic attrs need to be retrievable or facetable

### Edit `algolia/rules.json` when:

- a specific user intent should route to a specific page
- a canonical leaf should win for an exact query

### Edit `algolia/synonyms.json` when:

- users express the same intent with multiple domain terms
- separator variants should be treated as equivalent
- shorthand like `tx`, `ft`, `nft`, `pk` should map cleanly

### Edit the SearchBar when:

- the UI is not making good use of the indexed fields
- dedupe, snippets, or highlight rendering need to change
- the card layout is noisy or misleading

---

## Minimal safe change recipes

### Recipe: fix one exact-query ranking bug

1. Add or adjust a Rule in `algolia/rules.json`
2. Run:

```bash
yarn algolia:sync
yarn audit:algolia-relevance
```

If the results still lag, give the index a minute and rerun the audit.

### Recipe: reduce noisy results from a page family

1. Update the extractor or exclusions in `algolia/crawler/shared.js`
2. Regenerate `algolia/docsearch-crawler.config.js`
3. Run:

```bash
yarn audit:indexing
yarn algolia:crawler:sync
yarn algolia:crawler:start
yarn algolia:crawler:wait --task <taskId>
yarn audit:algolia-relevance
```

### Recipe: improve title-vs-content weighting

1. Update `algolia/index-settings.json`
2. Run:

```bash
yarn algolia:sync
yarn audit:algolia-relevance
```

If the change depended on record reshaping too, follow with a crawler run.

---

## Practical guidance

### Bias toward leaves

For API and RPC docs, users are often expressing method intent, not browsing intent. If you are torn between making an overview page stronger and making a leaf page stronger, bias toward the leaf page.

### Keep the query suite honest

Do not let `algolia/relevance-cases.json` become a vanity list. It should reflect real user intent and real product risk.

### Prefer semantic extraction over more Rules

If you can solve a search-quality issue by:

- improving metadata
- improving extraction
- improving page-type handling

that is usually more durable than adding another Rule.

Rules are still valuable, but they should capture product knowledge, not compensate for poor crawling.

---

## One-line operator playbook

If you just need the shortest reliable sequence:

```bash
cd /Users/mikepurvis/near/fn/builder-docs
yarn audit:indexing
yarn algolia:status
yarn algolia:sync
yarn algolia:crawler:start
yarn algolia:crawler:wait --task <taskId>
yarn audit:algolia-relevance
```

That is the core loop.
