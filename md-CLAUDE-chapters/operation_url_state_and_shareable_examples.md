# Builder Docs Operation URL State and Shareable Example URLs

This chapter documents the URL-driven live example system in `builder-docs`.

It covers two closely related capabilities:

- URL-prefilled operation inputs
- shareable "Copy example URL" links that reconstruct a runnable live example

This is an internal architecture chapter, not end-user docs copy.

---

## Why this feature matters

Before this work, live examples were already useful, but they were still relatively session-local.

The docs runtime could hydrate certain fields with recent values so a request would succeed, but that did not help with a common real-world need:

- a user wants a docs link pre-filled for their account
- a teammate wants to send a runnable example URL to another teammate
- an internal guide wants to deep-link directly into a valid request state
- a support workflow wants to say "open this URL and click `Send request`"

The goal of this feature was to make operation pages addressable by state without turning the docs into a full client-side router/state-sync project.

That design constraint matters.

The feature is intentionally:

- page-model-driven
- load-time-based
- explicit about reserved query params
- careful not to leak secrets
- broad across route families without becoming custom per endpoint

---

## What shipped

The completed feature set includes:

- exact field-name URL prefills for operation inputs
- support across all `FastnearDirectOperation` surfaces
- support for both docs routes and hosted canonical routes
- locale-safe behavior on Russian routes
- shareable example URLs generated from current page state
- extra UI-state round-trip for selected network, example tab, and finality
- protection against runtime hydration overwriting explicit URL-provided values
- representative Playwright coverage
- generated matrix coverage across root docs and hosted canonical routes
- lightweight builder-docs audits for page-model reference integrity

This is no longer a small convenience tweak. It is part of the contract of the interactive docs runtime.

---

## User-facing contract

These rules define the feature as users experience it today.

### Supported route families

The feature works anywhere the shared direct renderer is used:

- `/rpc/**`
- `/api/**`
- `/tx/**`
- `/transfers/**`
- `/neardata/**`
- `/fastdata/kv/**`
- `/rpcs/**`
- `/apis/**`
- localized `/ru/...` variants of those routes

### Field prefills

Any field in `pageModel.interaction.fields` can be prefilled from a matching query param.

The rule is exact-match only:

- `?account_id=near` works if the field name is `account_id`
- `?accountId=near` does not
- `?Account_Id=near` does not

Unknown params are ignored silently.

### Reserved query params

The runtime reserves these keys:

- `network`
- `requestExample`
- `requestFinality`
- `colorSchema`
- `apiKey`
- `token`

Their meanings are centralized in `src/utils/fastnearOperationUrlState.js`.

### Load-time semantics

URL params are treated as initial state only.

That means:

- they shape the page when it loads
- they do not create a long-lived live-sync contract between UI state and `window.location`
- later user interactions behave normally

This was an intentional design choice to keep the feature sharp and low-complexity.

### Shareable URLs

`Copy example URL` serializes the current operation state into a public URL.

That URL includes:

- the current route
- the selected network
- the selected request example when present
- selected finality when the page supports finality
- all non-empty field draft values
- supported wrapper params such as hosted `colorSchema`

That URL excludes:

- `apiKey`
- `token`
- unknown wrapper params
- arbitrary local-only state that is not part of the supported URL contract

---

## Core implementation

### 1. Shared renderer owns the feature

The feature lives in `src/components/FastnearDirectOperation/index.js`.

That matters because it means the behavior is not implemented separately for:

- RPC docs pages
- REST docs pages
- hosted canonical pages
- Russian pages

All of those surfaces are consumers of the same operation runtime.

This was the biggest architectural win of the feature.

### 2. URL contract is centralized

`src/utils/fastnearOperationUrlState.js` is the source of truth for:

- reserved query param names
- field-prefill collection
- safe wrapper-param passthrough
- secret-query-param detection

This keeps the parser and serializer aligned.

It also gives us one place to extend if we ever add another supported piece of URL-driven state.

### 3. Field parsing and serialization are centralized

`src/utils/fastnearFieldValueCodec.js` handles the raw draft-string contract for fields.

That utility is responsible for:

- serializing defaults/examples into input drafts
- parsing user-facing drafts back into request payload values
- array handling
- object handling
- boolean handling
- integer and number coercion

This is why URL params can stay raw string inputs while still producing correct request bodies and RPC params.

The URL layer does not need custom coercion logic per field type.

### 4. Default/example selection is centralized

`src/utils/fastnearOperationSelection.js` now owns:

- default field values per network
- initial example picking
- example-to-draft-field merging
- initial operation selection state assembly

This utility exists partly for runtime clarity and partly to keep tests from re-implementing the same selection logic.

That simplification was worth doing.

### 5. Initial state flow

At load time, the runtime does this:

1. read the current search params
2. resolve `requestExample` if present
3. derive the selected network
4. derive the selected example
5. collect exact field-name URL prefills
6. build the merged draft field state from defaults/example plus URL overrides
7. derive selected finality
8. track which fields were explicitly sourced from the URL

That is the core state assembly path.

The key behavior is that URL-prefilled field values are an overlay on top of example/default state, not a separate parallel model.

### 6. Copy example URL flow

When the user clicks `Copy example URL`, the runtime:

1. starts from the current route
2. preserves safe wrapper params like hosted `colorSchema`
3. serializes supported reserved params
4. serializes all non-empty field draft values
5. sanitizes the result as a public URL

This keeps the copied link faithful to the visible example while still removing secrets.

---

## Hydration and overwrite protection

One of the trickiest parts of this feature was not serialization. It was coexistence with runtime hydration.

Some RPC pages intentionally fetch fresh runtime values so a request is likely to succeed, for example:

- latest block height
- latest block hash
- recent transaction identifiers

That behavior is still useful, but it creates a conflict:

- if the user provides `?block_id=123`, the runtime should not immediately overwrite it with a fresh block height

The current solution is intentionally simple:

- the runtime records which fields came from initial URL prefills
- hydration skips those fields on first load
- once the user edits fields or switches network/example, that protection is cleared

This preserves the explicitness of the URL without permanently disabling helpful hydration behavior.

That is one of the most important implementation details in the whole feature.

---

## Shareable UI state beyond raw fields

The feature now carries a small supported set of non-field UI state:

- `network`
- `requestExample`
- `requestFinality`

These are the right level of UI state to preserve because they materially affect:

- the visible example
- request payload shape
- selected server
- "click send and it works" behavior

They are also relatively stable and explainable.

The feature does **not** try to serialize every possible ephemeral UI detail.

That restraint is part of why the implementation still feels sane.

---

## Secrets and safe public URLs

This feature would be much less trustworthy if copied URLs could accidentally leak credentials.

The public-URL hygiene rules are:

- `apiKey` must never survive into copied public URLs
- `token` must never survive into copied public URLs
- `header.*` query params are also considered secret-like and stripped

These rules are shared through `isSecretQueryParam` in `src/utils/fastnearOperationUrlState.js`.

They are also used by `src/utils/markdownExport.js`, which means:

- copied example URLs
- public markdown/export URLs
- related AI/discovery surfaces

all use the same secret-stripping contract.

That shared rule is an important hardening improvement.

---

## Route wrappers and hosted pages

One subtle point about this feature is that the majority of public operation route surface is not the same thing as the majority of unique logic.

There are many hosted routes under:

- `/rpcs/**`
- `/apis/**`

But they are thin wrappers around the same shared operation renderer.

That means confidence comes from two layers:

- core runtime coverage in the shared renderer
- wrapper-specific checks for hosted-route behavior such as `noindex`, canonical path shape, and locale preservation

This is why the test strategy uses both representative hosted tests and a generated hosted-route matrix.

---

## Testing strategy

This feature ended up with a two-level test strategy, which is the right shape for this repo.

### Focused representative specs

The hand-written Playwright specs are now split by concern:

- `tests/playwright/rpc-operations.spec.js`
- `tests/playwright/http-operations.spec.js`
- `tests/playwright/shareable-operation-urls.spec.js`
- `tests/playwright/docs-routes-and-locales.spec.js`

These focused specs cover:

- core RPC prefill behavior
- HTTP prefill behavior
- hydration-protection behavior
- shareable URL round-trips
- hosted route behavior
- locale behavior
- docs-route smoke behavior

They are intentionally readable and scenario-driven.

### Generated matrices

Broad confidence comes from the generated Playwright matrices:

- `tests/playwright/url-prefill-matrix.spec.js`
- `tests/playwright/url-prefill-hosted-matrix.spec.js`

Those matrices validate URL-prefill behavior across the generated page-model inventory rather than only across a handful of hand-selected examples.

This gives the feature near-exhaustive breadth without requiring us to hand-author one test per endpoint.

### Shared Playwright helpers

`tests/playwright/helpers/operation-page.js` holds the test-level glue for:

- clipboard spying
- copied-text retrieval
- request payload parsing
- RPC request waits
- HTTP request waits

This keeps the concern-based specs focused on behavior instead of repetitive harness code.

### Verification commands

The main commands to run while changing this feature are:

- `yarn test:e2e`
- `yarn audit:page-models`

The first verifies runtime behavior. The second verifies that the underlying page-model world is still coherent.

---

## Stability and compatibility model

This feature depends on some generated identifiers being treated as compatibility-sensitive.

### In `builder-docs`

The repo now has a lightweight authored-reference audit:

- `scripts/audit-page-model-references.js`

It checks:

- authored docs references to `pageModelId`
- localized docs references to `pageModelId`
- localized FastNear overlay references to generated page-model IDs

That audit runs via:

- `yarn audit:page-models`

This catches local drift such as:

- a docs page referencing a missing `pageModelId`
- a localization overlay targeting a removed model

### Cross-repo dependency on `mike-docs`

The feature also relies on upstream generation stability.

The most important compatibility-sensitive identifiers are:

- `pageModelId`
- `canonicalPath`
- `request.examples[].id`

Why they matter:

- `pageModelId` ties authored docs and overlays to generated operation models
- `canonicalPath` ties hosted route generation and structured graph records to stable operation URLs
- `request.examples[].id` now powers shareable `requestExample` round-trips

If those identifiers drift silently upstream, shared example URLs can degrade from "restores this exact example" into "falls back to something else."

So the feature should be thought of as a cross-repo compatibility contract, not merely a frontend convenience.

---

## What the feature intentionally does not do

These non-goals are important and should stay intentional unless there is a strong reason to change them.

- no alias matching such as `accountId`
- no case-insensitive field matching
- no automatic URL sync while the user types
- no serialization of arbitrary local-only UI details
- no inclusion of saved or URL-provided secrets in copied public URLs
- no endpoint-specific URL parsing branches unless truly unavoidable

The feature is stronger because it is constrained.

---

## Extending the feature safely

If future work needs to extend URL-driven operation state, the safe path is:

1. decide whether the new state deserves to be public and shareable
2. add the reserved query-param contract in `src/utils/fastnearOperationUrlState.js`
3. teach initial state assembly how to read it
4. teach URL copying how to write it
5. keep field interpretation inside `fastnearFieldValueCodec` if the new state uses field-like drafts
6. add one focused scenario test
7. add or update matrix coverage only if the new state materially affects broad route behavior

Good candidates for future extension are small, explicit, and user-visible.

Bad candidates are ad hoc bits of ephemeral UI state that would make links harder to reason about.

---

## Files to know

These are the key files for anyone working on this feature again:

- `src/components/FastnearDirectOperation/index.js`
- `src/utils/fastnearOperationUrlState.js`
- `src/utils/fastnearFieldValueCodec.js`
- `src/utils/fastnearOperationSelection.js`
- `src/utils/markdownExport.js`
- `tests/playwright/helpers/operation-page.js`
- `tests/playwright/rpc-operations.spec.js`
- `tests/playwright/http-operations.spec.js`
- `tests/playwright/shareable-operation-urls.spec.js`
- `tests/playwright/docs-routes-and-locales.spec.js`
- `tests/playwright/url-prefill-matrix.spec.js`
- `tests/playwright/url-prefill-hosted-matrix.spec.js`
- `scripts/audit-page-model-references.js`

---

## Bottom line

This feature is one of the better examples of what the bespoke builder-docs runtime is good at.

It takes generated operation metadata, applies a small explicit URL contract, and turns docs pages into durable runnable links without introducing a heavy client-state architecture.

That is the right kind of sophistication for this system:

- shared, not duplicated
- explicit, not magical
- broad, not endpoint-by-endpoint
- safe for public sharing
- backed by both scenario tests and generated coverage

If this chapter stays accurate, future work on operation URLs should feel like extending a coherent subsystem rather than re-discovering tribal knowledge.
