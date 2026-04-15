# FastNear Algolia Search and Crawler Control

This chapter documents how `builder-docs` manages Algolia search as a first-class part of the docs product rather than as a disconnected dashboard configuration. It covers the architecture, repo-owned artifacts, crawler semantics, index semantics, operator workflow, UI contract, and the practical lessons learned while validating the live setup on April 14, 2026.

The short version is:

- `builder-docs` now owns both the **crawler configuration** and the **search index behavior**.
- The public docs site is the only canonical indexed surface.
- Hosted `/rpcs/**` and `/apis/**` pages remain useful for embeds and mirrors, but are intentionally excluded from public search.
- The crawler and the search index are related, but they are **different control planes** with different credentials, APIs, and failure modes.

---

## Why this matters

Algolia relevance for developer docs is not just “turn on DocSearch and hope for the best.” FastNear’s docs have a few special properties that make active shaping worthwhile:

- We have **high-intent leaf pages** like `view-account`, `send-tx`, and `block-headers` that should beat broad landing pages.
- We have **interactive runtime surfaces** that contain useful prose mixed with noisy UI text.
- We have **multiple documentation strata**:
  - root-mounted canonical docs pages like `/rpc/account/view-account`
  - hosted supporting pages like `/rpcs/account/view_account`
  - AI-oriented exports like `llms.txt`, `llms-full.txt`, and Markdown mirrors
- We want search that feels curated for FastNear rather than generic Docusaurus DocSearch.

That means there are four separate problems to solve:

1. Decide **what the crawler should ingest**
2. Decide **how records should be shaped**
3. Decide **how the live index should rank, facet, dedupe, and highlight**
4. Decide **how the frontend search modal should render those hits**

This repo now treats all four as explicit product concerns.

---

## The two Algolia layers

There are two separate Algolia control layers in this setup.

### 1. The crawler layer

The crawler is responsible for:

- deciding which URLs to crawl
- extracting records from HTML
- setting initial index settings for a new or reset index
- reindexing after config changes

This layer is controlled through the **Crawler REST API** and uses separate crawler credentials.

### 2. The search index layer

The search index is responsible for:

- settings like searchable attributes, faceting, distinct behavior, snippets, separators, ranking
- promoted-result Rules
- synonyms

This layer is controlled through the **Algolia search admin client** and uses the standard Algolia admin API key.

These layers overlap, but they are not interchangeable:

- changing the crawler extractor does not automatically update existing live Rules
- changing live Rules does not change the crawler config
- `initialIndexSettings` inside the crawler config are important, but for existing indices the live search-admin sync is the more reliable source of truth

That is why `builder-docs` now exposes both sets of operations separately.

---

## Repo-owned source of truth

The Algolia source of truth lives under `algolia/` plus a few scripts and UI files.

### Core artifacts

- `algolia/index-settings.json`
  - Repo-owned subset of live index settings
- `algolia/rules.json`
  - Repo-owned promoted-result Rules, all keyed with `fastnear-*`
- `algolia/synonyms.json`
  - Repo-owned synonyms, all keyed with `fastnear-*`
- `algolia/relevance-cases.json`
  - Query acceptance cases used by the live relevance audit
- `algolia/crawler/shared.js`
  - Shared crawler definition used by both sync scripts and the pasteable crawler config artifact
- `algolia/docsearch-crawler.config.js`
  - Generated pasteable crawler config for the Algolia crawler editor
- `algolia/operations.md`
  - Operator checklist and workflow notes

### Supporting scripts

- `scripts/lib/algolia-search-control.js`
  - Search settings, Rules, and synonym drift detection and sync
- `scripts/lib/algolia-crawler-control.js`
  - Crawler drift detection, config sync, crawl start, and task wait
- `scripts/algolia-status.js`
- `scripts/algolia-sync.js`
- `scripts/algolia-crawler-status.js`
- `scripts/algolia-crawler-sync.js`
- `scripts/algolia-crawler-start.js`
- `scripts/algolia-crawler-wait.js`
- `scripts/audit-algolia-relevance.js`
- `scripts/audit-algolia-highlights.js`

### Frontend contract files

- `src/theme/SearchBar/index.js`
  - Swizzled DocSearch UI with grouped page-first result cards
- `src/theme/SearchBar/highlight.mjs`
  - Normalizes Algolia highlight HTML from either `<mark>` or the custom DocSearch span shape
- `src/theme/SearchBar/styles.css`
  - FastNear-specific search styling

---

## Current env model

There are now three classes of Algolia env vars.

### Frontend DocSearch env vars

These power the browser search box:

```bash
DOCS_SEARCH_PROVIDER=algolia
DOCSEARCH_APP_ID=...
DOCSEARCH_API_KEY=...
DOCSEARCH_INDEX_NAME=...
```

Notes:

- `DOCSEARCH_API_KEY` is the public search-only key.
- `DOCSEARCH_INDEX_NAME` must match the crawler action `indexName`, not the crawler display name.

### Search-admin env vars

These power repo-managed live index sync:

```bash
ALGOLIA_ADMIN_API_KEY=...
```

This is needed for:

- `yarn algolia:status`
- `yarn algolia:sync`

### Crawler env vars

These power repo-managed crawler control:

```bash
ALGOLIA_CRAWLER_USER_ID=...
ALGOLIA_CRAWLER_API_KEY=...
ALGOLIA_CRAWLER_NAME=...
```

Important detail:

- The crawler API uses **Basic auth** built from `user_id:api_key`.
- The repo now builds that header internally.
- We intentionally removed the older public env seams for:
  - `ALGOLIA_CRAWLER_BASIC_AUTH`
  - `ALGOLIA_CRAWLER_ID`

That keeps the operator experience simpler and closer to what Algolia actually shows in the crawler UI.

---

## Canonical crawl surface

The crawler is deliberately focused on the public root-mounted docs surface.

### Included

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
- `/transaction-flow/**`

### Excluded

- `/rpcs/**`
- `/apis/**`
- `/**/*.md`
- `/llms.txt`
- `/llms-full.txt`
- `/guides/llms.txt`
- `/rpcs/llms.txt`
- `/apis/llms.txt`
- `/structured-data/**`
- `/api/reference`
- `/redocly-config`

This is a core principle:

**Search should expose the canonical docs pages, not mirrors, utility artifacts, or embedded-operation surfaces.**

---

## Record extraction strategy

The crawler extractor in `algolia/crawler/shared.js` is intentionally more semantic than the older generic Docusaurus template.

### Noise removal

Before extracting content, the crawler strips UI chrome and runtime-only text:

- `[data-fastnear-crawler-skip]`
- `.hash-link`
- `.table-of-contents`
- `.theme-edit-this-page`
- `.theme-last-updated`
- `.theme-doc-toc-mobile`
- `.breadcrumbs`
- `.pagination-nav`
- `.clean-btn`

This matters because interactive docs pages contain a lot of text that is useful to users in-page but harmful in a search result.

### Semantic metadata

The docs runtime emits:

- `docsearch:category`
- `docsearch:method_type`
- `docsearch:surface`
- `docsearch:family`
- `docsearch:audience`
- `docsearch:page_type`

The crawler reads those values and stores them as real record attributes.

This is much better than trying to infer meaning from path strings alone.

### Page-type-aware extraction

Different page types keep different kinds of content.

#### Reference pages

Reference pages keep:

- top-level prose
- list items
- schema descriptions
- response descriptions
- parameter/value descriptions

The point is to make leaves rich enough to rank and snippet well.

#### Collection pages

Collection pages keep:

- lead copy
- curated card text
- top-level explanatory content

The point is to keep them useful, but not so verbose that they crowd out leaf pages.

#### Guides

Guides keep normal article prose.

### Hierarchy shaping

The extractor assigns a top-level `lvl0` bucket from the surface:

- `RPC`
- `API`
- `Transactions`
- `NEAR Data`
- `FastData`
- `Auth`
- `Agents`
- `Snapshots`
- `Transaction Flow`
- `Guides`

This improves grouping in the search modal without relying on transient UI state.

---

## Page-rank strategy

The crawler now assigns explicit `pageRank` values to support the intended docs hierarchy.

### Current intent

- RPC reference leaves: strongest
- REST / tx / transfers / neardata / fastdata leaves: also very strong
- other reference pages: strong
- collection pages: meaningfully lower
- homepage: lower still
- auth guide pages: modestly boosted for auth intent
- special guide:
  - `/agents/choosing-surfaces` gets a deliberate boost so that “choosing surfaces” remains a good search experience

### Why this matters

Without explicit page ranking, generic overview pages often win on term repetition and breadth. For developer docs, that usually feels wrong. Users searching `view account` want the method page, not a broad section overview.

---

## Index settings philosophy

The repo-owned `algolia/index-settings.json` is tuned for a page-first docs experience.

### Distinct and dedupe

```json
"distinct": true,
"attributeForDistinct": "url_without_anchor"
```

This is important. It means we dedupe at the page level rather than letting every anchor variant fight for visibility.

The frontend still groups hits by page, but page-level distinct in the index helps reduce duplicate noise before the UI even sees the records.

### Snippets

```json
"attributesToSnippet": ["content:14"]
```

This intentionally gives slightly richer snippets than the older `content:10` shape. The search UI is more readable when the snippet has enough context to explain *why* the result is relevant.

### Searchable attributes order

The current desired order is:

1. `hierarchy.lvl1`
2. `hierarchy.lvl2`
3. `hierarchy.lvl3`
4. `hierarchy.lvl4`
5. `hierarchy.lvl5`
6. `hierarchy.lvl6`
7. `hierarchy.lvl0`
8. `content`

That is intentional.

We want:

- page titles and section headings to matter more than broad surface labels
- exact method pages to beat generic “RPC” or “API” buckets

### Separators

```json
"separatorsToIndex": "_"
```

This is especially useful for developer-doc search because queries often arrive in multiple shapes:

- `view account`
- `view-account`
- `view_account`

### Semantic facets

We keep the semantic attrs retrievable and facetable:

- `category`
- `method_type`
- `surface`
- `family`
- `audience`
- `page_type`

These are useful now for search shaping and UI introspection, and potentially later for more tailored filtering or sidepanel behavior.

---

## Rules and synonyms philosophy

Rules and synonyms are not decorative. They are how we express product knowledge that the crawler alone cannot infer reliably.

### Current promoted-result themes

We explicitly promote canonical leaves for:

- `view account`
- `view-account`
- `view_account`
- `send tx`
- `send-tx`
- `send_tx`
- `account history`
- `public key`
- `block headers`
- `authentication`
- `api key`
- `x-api-key`
- `x api key`
- `bearer token`
- `access token`
- `authorization header`

### Why both synonyms and rules?

Because they do different jobs.

#### Synonyms

Synonyms normalize terminology:

- `view account` / `view-account` / `view_account`
- `send tx` / `send-tx` / `send_tx`
- `pk` / `public key`
- `tx` / `txn` / `transaction`
- `ft` / `fungible token`
- `nft` / `non fungible token`

#### Rules

Rules answer “for this exact intent, what should win?”

That is why auth queries point at `/auth/backend` and not just any page that happens to mention “key” or “token.”

### Ownership model

All repo-owned Rules and synonyms use `fastnear-*` object IDs.

That means sync can safely:

- upsert repo-owned entries
- delete removed repo-owned entries
- leave non-FastNear entries alone

---

## Frontend search UI contract

The search modal is not generic anymore. It expects specific record fields and renders them in a FastNear-specific way.

### The UI assumes these fields are retrievable

- `hierarchy`
- `content`
- `anchor`
- `url`
- `url_without_anchor`
- `type`
- `category`
- `method_type`
- `surface`
- `family`
- `audience`
- `page_type`

Those fields are declared in both:

- `algolia/index-settings.json`
- `src/theme/SearchBar/index.js`

### Result shaping

The modal now:

- groups hits by page
- deduplicates anchors
- renders a page-first result card
- prefers a clean path label and a single concise snippet

This means the index can be richer without the UI becoming noisy.

---

## Highlight normalization

One subtle problem we discovered is that live Algolia indices may return different highlight HTML shapes:

- default `<mark>...</mark>`
- custom `<span class="algolia-docsearch-suggestion--highlight">...</span>`

If the frontend assumes only one of those shapes, raw markup can leak into the UI as visible text.

To prevent that, `src/theme/SearchBar/highlight.mjs` now normalizes both shapes into one FastNear-specific render path.

This is intentionally narrow:

- known safe highlight tags are normalized
- unsupported markup falls back to plain text
- we do **not** broaden `dangerouslySetInnerHTML` to arbitrary HTML

---

## Operator workflow

The intended workflow is:

1. Update repo-owned crawler or search artifacts.
2. Run:

```bash
yarn algolia:status
```

3. Sync repo-owned live state:

```bash
yarn algolia:sync
```

4. Start a crawler run:

```bash
yarn algolia:crawler:start
```

5. Wait for the crawler task:

```bash
yarn algolia:crawler:wait --task <taskId>
```

6. Verify relevance:

```bash
yarn audit:algolia-relevance
```

### Important separation

- `yarn algolia:sync`
  - syncs search settings / Rules / synonyms plus crawler config
  - does **not** start a crawl
- `yarn algolia:crawler:sync`
  - syncs crawler config only
- `yarn algolia:crawler:start`
  - starts a crawl only

That separation is deliberate. Syncing desired state and executing a reindex are different operator actions.

---

## Live validation lessons from April 14, 2026

While implementing and testing this system, several real integration details surfaced.

### 1. The crawler list endpoint did not accept the `appID` query parameter in this account context

The repo originally attempted:

- `GET /crawlers?appID=...&name=...`

In practice, the live endpoint returned a validation error saying `appID is not allowed`.

The working solution was simpler:

- resolve crawler identity by `name` alone

### 2. The crawler runs endpoint does not use the same pagination params as the crawler list/config endpoints

The repo originally used:

- `itemsPerPage`
- `page`

For `crawl_runs`, the live API expected:

- `limit`
- `order`

This was a useful reminder that the crawler API is not perfectly uniform across endpoints.

### 3. The crawler parser is stricter than modern Node

The shared extractor worked fine in local Node, but Algolia’s crawler parser rejected newer syntax until we downgraded it.

The main compatibility fixes were:

- avoid optional chaining in the extractor
- avoid bare `catch {}`
- avoid clever regex usage where a simpler string approach works

This means the extractor should be treated as **crawler-runtime JavaScript**, not just as “whatever current Node can parse.”

### 4. Status can look stale if you query before a sync finishes

During testing, a status command started before the sync completed still reported the older config version. A fresh status call immediately afterward showed the new version and zero drift.

That is normal timing behavior, not a logic failure.

---

## Current desired search behavior

As of this chapter, the intended FastNear search behavior is:

- Canonical leaf pages win over broad landing pages.
- Query-shape variants are handled explicitly.
- Auth-intent queries route somewhere actionable.
- Hosted `/rpcs/**` and `/apis/**` pages do not compete with canonical docs pages.
- Search results are page-first, readable, and concise.

Examples of intended outcomes:

- `view account` -> `/rpc/account/view-account`
- `send tx` -> `/rpc/transaction/send-tx`
- `account history` -> `/tx/account`
- `block headers` -> `/neardata/block-headers`
- `authentication` -> `/auth`
- `api key` -> `/auth/backend`
- `bearer token` -> `/auth/backend`

---

## What the crawler sync accomplished

During live validation on April 14, 2026, the crawler side was successfully brought under repo control:

- live crawler name: `prod_fastnear_docs_crawler`
- live crawler config version advanced to `3`
- live crawler drift report reached `none`

That means the live crawler now reflects:

- the intended crawl surface
- the newer page-aware extractor
- the newer initial index settings shape

This is an important milestone because it means the site content entering the index is now being shaped the way the repo intends.

---

## What still depends on search-admin sync

The crawler alone is not enough to finish the search product.

Some relevance failures still depend on the search-admin layer being live:

- Rules
- synonyms
- existing index settings for the current index

If the live relevance audit still shows misses like:

- `view account`
- `authentication`
- `api key`
- `bearer token`

after the crawler sync, that usually means the remaining work is:

```bash
yarn algolia:sync
```

with a valid `ALGOLIA_ADMIN_API_KEY`.

In other words:

- crawler sync fixes what gets crawled and how records are created
- search-admin sync fixes how the live index interprets and ranks those records

---

## Recommended maintenance habits

### Keep the relevance suite small but sharp

`algolia/relevance-cases.json` should stay focused on high-value queries that reflect user intent rather than vanity completeness.

Good candidates:

- exact method names
- auth setup phrases
- common NEAR domain terms
- high-intent troubleshooting phrases

### Add semantics where they naturally belong

If a future surface needs better search behavior, the best first move is often:

- improve emitted `docsearch:*` metadata
- improve crawler extraction

Only after that should you add more Rules.

### Prefer product meaning over generic search cleverness

When in doubt:

- exact reference leaves over broad collections
- concrete operational docs over thematic overviews
- canonical docs pages over alternate renderings

That bias matches what users of API docs usually want.

---

## Quick command reference

```bash
# Compare live search + crawler state to repo-owned desired state
yarn algolia:status

# Sync live index settings / rules / synonyms and crawler config
yarn algolia:sync

# Compare live crawler config only
yarn algolia:crawler:status

# Sync crawler config only
yarn algolia:crawler:sync

# Start a reindex
yarn algolia:crawler:start

# Wait for a crawler task
yarn algolia:crawler:wait --task <taskId>

# Check live query quality
yarn audit:algolia-relevance

# Check highlight normalization
yarn audit:algolia-highlights
```

---

## Final principle

FastNear search quality is now a docs-engineering concern, not just a hosted-search checkbox.

The crawler, the search index, the docs runtime, and the search UI are all part of one system. The strongest results come from shaping that whole system deliberately:

- canonical crawl surface
- semantic extraction
- explicit ranking behavior
- repo-owned Rules and synonyms
- UI rendering that reinforces the intended information hierarchy

That is the model this repo now supports.
