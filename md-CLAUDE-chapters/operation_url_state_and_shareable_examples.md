# Builder Docs Operation URL State, Shareable Examples, and Response Inspection

This chapter documents the URL-driven live example system in `builder-docs`.

It now covers the full user-facing loop:

- URL-prefilled operation inputs
- shareable example URLs
- deliberate auto-run URLs
- expanded live-response inspection
- find-in-response and response-view URL state
- the current future-proofing seam for privileged URL params

This is an internal continuity chapter, not end-user docs copy.

---

## Why this feature matters

Before this work, live examples were already useful, but still relatively session-local.

The docs runtime could hydrate certain fields with recent values so a request would succeed, but that did not solve several common workflows:

- a user wants a docs link pre-filled for their account
- a teammate wants to send a runnable example URL to another teammate
- an internal guide wants to deep-link directly into a valid request state
- a support workflow wants to say "open this URL and click `Send request`"
- a technical user wants to inspect a large response in a roomier view than the inline panel
- a technical user wants to search a response and share that inspection state too

The goal was to make operation pages addressable by state without turning the docs into a full client-side router/state-sync app.

That design constraint still matters.

The feature is intentionally:

- page-model-driven
- centralized in one shared runtime
- explicit about reserved query params
- careful not to leak secrets
- load-time-oriented rather than long-lived URL sync
- broad across route families without becoming custom per endpoint

---

## What shipped

The completed feature set now includes:

- exact field-name URL prefills for operation inputs
- support across all `FastnearDirectOperation` surfaces
- support for both docs routes and hosted canonical routes
- locale-safe behavior on Russian routes
- shareable example URLs generated from current page state
- explicit auto-run URLs
- extra UI-state round-trip for selected network, example tab, and finality
- protection against runtime hydration overwriting explicit URL-provided values
- an expanded response modal
- find-in-response for large formatted responses
- shareable response-view URL state
- modal-level share buttons so response-view state can be copied while active
- representative Playwright coverage
- generated matrix coverage across root docs and hosted canonical routes
- lightweight builder-docs audits for page-model reference integrity
- a small privileged URL-param reservation seam for future account-linked docs behavior

This is no longer a convenience tweak. It is part of the contract of the interactive docs runtime.

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

The runtime reserves these active keys:

- `network`
- `autorun`
- `requestExample`
- `requestFinality`
- `responseView`
- `responseFind`
- `colorSchema`
- `apiKey`
- `token`

Their meanings are centralized in `src/utils/fastnearOperationUrlState.js`.

### Response-view params

The current response-view contract is:

- `responseView=expanded`
- `responseFind=<literal search term>`

Rules:

- `responseView=expanded` opens the response modal on load
- `responseFind` implies expanded response mode on load
- `responseFind` pre-fills the modal search box
- the first match becomes active automatically
- no URL param is used for current match index in v1

### Load-time semantics

URL params are treated as initial state only.

That means:

- they shape the page when it loads
- they do not create a long-lived live-sync contract between UI state and `window.location`
- later user interactions behave normally

This was an intentional design choice to keep the feature sharp and low-complexity.

### Shareable URLs

`Copy example URL` serializes the current operation state into a public URL.

`Copy auto-run URL` does the same thing, but always includes `autorun=1`.

That URL can include:

- the current route
- the selected network
- `autorun=1`
- the selected request example when it differs from the default example for the selected network
- selected finality when the page supports finality
- all non-empty field draft values
- `responseView=expanded` when the response modal is open
- `responseFind=<term>` when the modal search box is non-empty
- supported wrapper params such as hosted `colorSchema`

That URL excludes:

- `apiKey`
- `token`
- unknown wrapper params
- future privileged params
- arbitrary local-only state that is not part of the supported URL contract

### Modal behavior

The expanded response modal is intentionally simple:

- it opens with a dedicated expand button next to response copy
- it can be dismissed with `Escape`
- it can be dismissed with the `X` button in the upper right
- clicking the overlay dismisses it on desktop
- on mobile it effectively fills the available viewport inside safe-area padding

This is designed as a technical inspection surface, not a feature-rich console.

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

This is the biggest architectural win of the feature.

### 2. URL contract is centralized

`src/utils/fastnearOperationUrlState.js` is the source of truth for:

- reserved query param names
- future privileged query param reservations
- field-prefill collection
- safe wrapper-param passthrough
- secret-query-param detection
- non-shareable query-param detection

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

`src/utils/fastnearOperationSelection.js` owns:

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
8. derive requested response-view state
9. track which fields were explicitly sourced from the URL

That is the core state assembly path.

The key behavior is that URL-prefilled field values are an overlay on top of example/default state, not a separate parallel model.

### 6. Public URL sanitization is shared

`src/utils/markdownExport.js` uses the same URL-state rules to strip non-shareable params from public links and exports.

That means the same contract now applies across:

- copied example URLs
- copied auto-run URLs
- markdown exports
- source links and related sanitized URLs

This is an important hardening improvement.

---

## Request-state round-trip

### Copy example URL flow

When the user clicks `Copy example URL`, the runtime:

1. starts from the current route
2. preserves safe wrapper params like hosted `colorSchema`
3. serializes supported reserved params
4. serializes all non-empty field draft values
5. serializes active response-view state when present
6. sanitizes the result as a public URL

This keeps the copied link faithful to the visible example while still removing secrets and non-shareable future state.

### Copy auto-run URL flow

`Copy auto-run URL` reuses the same serializer, but forces `autorun=1`.

This means it composes cleanly with:

- request field prefills
- `requestExample`
- `requestFinality`
- `responseView=expanded`
- `responseFind=<term>`

### Deliberate rather than default auto-run

`autorun=1` is an explicit opt-in for load-time execution.

That is why:

- normal shared links restore a runnable state but still wait for the user to press `Send request`
- a user can append `autorun=1` when they want the page to immediately execute on load
- a user can click `Copy auto-run URL` when they want that variant explicitly
- `Copy example URL` preserves `autorun=1` if the current page was already explicitly opened that way

This keeps automatic execution explicit while still making fully self-running examples easy to share.

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

## Response inspection

### Why a modal exists

The inline response panel is useful for quick checks, but it is not ideal for:

- large JSON payloads
- repeated key inspection
- sharing a response-focused link
- searching a response the way a technical user expects

The response modal exists to solve those problems without turning the inline panel into a full log viewer.

### Response rendering model

The response search works on `runResultText`, not on the raw parsed object.

That means:

- both JSON and text responses can be handled consistently
- the search logic operates on the same formatted output the user sees
- we avoid repeated object re-interpretation while navigating matches

### Find-in-response behavior

The current search model is intentionally simple:

- case-insensitive
- literal substring matching
- no regex mode
- no replace mode
- no case-sensitivity toggle

The modal supports:

- next match
- previous match
- `Enter` for next
- `Shift+Enter` for previous
- active-match highlighting
- result count such as `3 of 12`
- auto-scroll of the active match into view

This is enough to make large technical responses genuinely inspectable without overbuilding the UI.

### Shared response-view state

Response inspection is treated as first-class shareable state when active.

That means:

- if the modal is open, copied URLs can preserve that
- if the search box contains a term, copied URLs can preserve that
- the modal now has its own share buttons so users can copy that state while it is active

This is important because otherwise response-view state would exist in theory but not in a realistic user flow.

### Modal shell and visual language

The current modal styling intentionally borrows from the product's existing Algolia/DocSearch overlay language rather than inventing a disconnected shell.

That means:

- centered roomy desktop presentation
- strong but not flashy container edges
- predictable top-right close affordance
- mobile behavior that nearly fills the viewport

This is a technical inspection surface, not a marketing modal.

---

## Auth caveat

One subtle but important implementation detail is that `interaction.authTransport` is not the same thing as "auth required."

In the current contract it only tells the runtime how to attach auth when a key is present, for example:

- `bearer` means send `Authorization: Bearer ...`
- `query` means send `?apiKey=...`

That is why the runtime's auto-run gating mirrors the existing `Send request` behavior instead of trying to infer whether a missing key should block execution.

If we ever need a true "must have auth to run" distinction, that should become an explicit page-model contract rather than a guess derived from `authTransport`.

See also:

- `md-CLAUDE-chapters/auth_contract_and_page_model_semantics.md`

---

## Future privileged params

There is now a small forward-compatibility seam for future account-linked docs behavior.

The URL-state layer reserves `useArchival` as a future privileged query param, but it is intentionally inactive today.

That reservation matters because it:

- keeps future gated params out of normal field-prefill matching
- makes our public URL sanitizers treat those params as non-shareable until the product contract is real
- gives us a clear place to attach future entitlement-aware parsing without rewriting the URL contract from scratch

### Important naming rule

Do not introduce a bare reserved param like `block`.

The direct renderer already supports exact field-name URL prefills, and generic names like `block` are too collision-prone for a reserved control param. There are already generated schemas with a literal `block` field name, so using that as a control param would be unsafe.

If we later add an archival block selector, it should be explicitly namespaced, for example:

- `archivalBlock`
- `archivalBlockHeight`
- `archivalBlockHash`

The eventual rule should be:

- namespaced param
- explicit entitlement check through docs auth
- no public-share serialization unless product says otherwise

That is the right ownership boundary.

---

## Route wrappers and hosted pages

One subtle point about this feature is that the majority of public operation route surface is not the same thing as the majority of unique logic.

There are many hosted routes under:

- `/rpcs/**`
- `/apis/**`

But those are thin wrappers over the same direct renderer.

So:

- root-mounted matrix coverage proves the core runtime behavior
- representative hosted tests prove wrapper-specific behavior such as route shape and `noindex`

This is why the feature scales across many routes without per-endpoint UI logic.

---

## Testing strategy

This feature is protected by several layers of tests.

### Focused Playwright specs

Focused specs cover:

- basic request-state prefills
- auto-run behavior
- response modal behavior
- find-in-response navigation
- copied URL round-tripping
- modal-level share buttons
- locale smoke behavior

These tests are intentionally readable and user-flow-oriented.

### Generated matrices

Generated matrices cover:

- root-mounted docs routes
- hosted canonical routes

The matrices prove that the shared URL-prefill contract works broadly across page models without requiring hand-written tests for every operation page.

### What still needs hand-writing

The matrix is not enough for everything.

Hand-written tests are still the right place for:

- wrapper-family behavior
- locale-specific route behavior
- hydration overwrite protection
- response modal and search behavior
- share/copy affordance behavior
- reserved-param interaction behavior

That division is healthy.

### Generator and repo guardrails

Outside Playwright, we also now rely on:

- generator-side compatibility rules for page-model identity and example IDs
- builder-docs audits for authored page-model references

Together, those reduce the chance of silent drift.

---

## Why the feature feels crisp now

The feature feels crisp now because the responsibilities are well-shaped:

- request-state URL parsing is centralized
- selection/defaulting is centralized
- field coercion is centralized
- public URL sanitization is shared
- response inspection is an extension of the same state model, not a bolt-on side path
- coverage is broad without being purely manual

It is not "finished forever," but it has reached the point where future work should mostly be:

- product polish
- richer auth contracts
- future privileged capability

not cleanup of a shaky core.

---

## Recommended future extensions

If we extend this feature again, the clean next directions are:

1. Introduce a real upstream auth-requirement contract.
2. Add docs-account-linked privileged URL handling only after entitlement checks exist.
3. If needed, add richer response inspection features without abandoning the simple modal contract.

The key discipline is to keep new behavior in the same shape:

- explicit
- centralized
- page-model-aware
- public-share-safe by default

That is the architectural pattern that made this feature hold together.
