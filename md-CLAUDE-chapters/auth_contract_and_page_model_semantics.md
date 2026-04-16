# Builder Docs Auth Contract and Page-Model Semantics

This chapter documents how authentication metadata currently works across `mike-docs` and `builder-docs`, what the runtime is actually allowed to infer from that metadata, and where the contract is still intentionally incomplete.

This is an internal continuity chapter, not end-user docs copy.

---

## Why this chapter exists

While hardening shareable operation URLs and `autorun=1`, we ran into a subtle but important modeling issue:

- many page models say `interaction.authTransport = "bearer"`
- some of those same operations are described elsewhere as publicly callable without a key
- the runtime therefore cannot safely interpret `authTransport` as "auth required"

That distinction matters because it influences:

- whether the UI should block a request
- whether auto-run links should execute on load
- how we explain auth in product docs
- what future generated metadata needs to say explicitly

This chapter captures the current truth so we do not accidentally over-infer from the wrong field later.

---

## The current contract

### What `authTransport` means

Today, `pageModel.interaction.authTransport` answers one question only:

- if a FastNear API key is available, how should the runtime attach it to the request?

In practice that means:

- `bearer` => send `Authorization: Bearer ...`
- `query` => send `?apiKey=...`

That is all.

It does **not** currently mean:

- auth is required
- auth is optional
- auth changes limits only
- auth changes behavior materially
- the request must be blocked when no key is present

### What the runtime does with it

In `builder-docs`, the shared runtime uses `authTransport` in a narrow, mechanical way:

- cURL generation chooses header vs query-param auth shape
- live requests attach the key only when one is present
- the auth summary text describes how the current key would be injected

If no key is present, the runtime falls back to "none detected" rather than treating the request as invalid.

That behavior is deliberate and currently correct for this repo.

---

## Where the data comes from

### Page models

The generated page models currently expose `interaction.authTransport`, but not an explicit required/optional semantic.

That means a model can say:

- `authTransport: "bearer"`

without also saying:

- whether a key is mandatory
- whether the endpoint is publicly callable
- whether auth only affects rate limits or quotas

### Structured graph

The generated structured graph is a little richer in practice because it already carries an `authSummary` string such as:

- `API key via query apiKey`
- `No auth required`

That is useful signal, but it is still not a typed compatibility contract. It is descriptive metadata, not a stable field the runtime should branch on casually.

### Product docs

Some authored docs already make the real behavior clear:

- the RPC overview says API keys are optional
- the FastNear API overview says public REST endpoints do not require a key

Those authored statements are important because they are closer to the intended product semantics than `authTransport` alone.

---

## The concrete mismatch we observed

The clearest example is `rpc-view-account`.

The page model says:

- `authTransport: "bearer"`

But the authored docs and actual product posture say:

- the public endpoint works without a key
- a key is optional and primarily about higher-limit or paid access

If we had interpreted `bearer` as "do not run without auth", we would have introduced a real regression:

- the normal `Send request` behavior would have become stricter than the rest of the docs
- `autorun=1` links would have silently refused to run for public operations

That would have been the wrong behavior.

---

## The correct runtime rule today

Until the generated contract becomes stronger, the runtime should follow this rule:

- use `authTransport` only to decide **how** to inject auth when a key exists
- do not use `authTransport` alone to decide **whether** a request is allowed

That leads to the current safe behavior:

- requests still run without a key when required inputs are present
- copied cURL commands include auth only when a key exists
- `autorun=1` mirrors normal `Send request` behavior instead of inventing a stricter policy

This rule is intentionally conservative.

It prefers preserving known product behavior over guessing at missing semantics.

---

## Why the runtime should stay conservative

There are several reasons not to infer too much from current metadata.

### 1. False negatives are worse than mild ambiguity

If we guess wrong and block a public request, we break a real workflow:

- docs examples look flaky
- shared links stop being trustworthy
- a user sees an auth requirement where the product does not actually have one

### 2. Auth can be optional for reasons other than transport

A service might support:

- anonymous public usage
- higher-limit keyed usage
- paid keyed usage

All of those can legitimately still use bearer transport when the key is present.

### 3. The current UI already models "present vs absent key"

The existing auth panel is oriented around:

- whether a key is saved
- whether a key came from the URL
- how that key would be used

It is not currently built around hard "must authenticate" gating.

That is okay as long as the runtime stays honest about what it knows.

---

## What an improved future contract should look like

If we want the runtime to make stronger decisions, the generator should expose a typed semantic field in page models.

Good options would be something like:

- `authRequirement: "none" | "optional" | "required"`

or:

- `authMode: "public" | "optional_key" | "required_key"`

That field should be:

- explicit
- generated upstream in `mike-docs`
- copied into vendored page models
- treated as a compatibility-sensitive contract

Once that exists, the runtime could make smarter choices such as:

- block auto-run on truly key-required pages with no key
- show clearer auth copy in the panel
- tailor docs hints more precisely
- possibly warn when a copied example URL points to a key-required operation

---

## What should not happen

There are a few tempting shortcuts we should avoid.

### Do not infer requirement from `authTransport`

This is the main footgun. It is too coarse.

### Do not branch on `authSummary` strings in product code

Those strings are useful for human-facing metadata and auditing, but they are not a stable typed contract.

### Do not hardcode endpoint-family assumptions in the renderer

Avoid rules like:

- "all RPC is optional"
- "all FastData is required"
- "all transactions endpoints are public"

Those may be true today for some slices, but they are not the right long-term ownership boundary.

The renderer should keep deferring to generated metadata rather than accumulating product folklore.

---

## Recommended next-step plan

If we choose to strengthen this area upstream, the clean sequence is:

1. Add an explicit auth-requirement field in `mike-docs` page-model generation.
2. Populate it from the same source of truth that already produces human-facing auth summaries.
3. Sync regenerated page models into `builder-docs`.
4. Update the shared runtime to use that field for any gating behavior.
5. Add focused tests for one public operation and one truly key-required operation.

That would be an idiomatic improvement for this bespoke system.

It keeps the semantic ownership in the generator pipeline instead of burying guesswork in the UI.

---

## Current guidance for future edits

If you are changing auth behavior in `builder-docs` today, use these rules:

- assume `authTransport` is about injection shape, not requirement
- preserve the existing "request can run without a key unless the product explicitly says otherwise" behavior
- prefer authored docs and upstream generator data over local inference
- if you feel tempted to block behavior based on auth, stop and check whether the page-model contract actually supports that decision

This is the safe mental model until the upstream schema gets richer.

---

## Related files

Builder-docs runtime and UI:

- `src/components/FastnearDirectOperation/index.js`
- `src/components/FastnearDirectOperation/portalAuth.js`
- `src/components/FastnearDirectOperation/uiText.js`

Builder-docs generated inputs:

- `src/data/generatedFastnearPageModels.json`
- `src/data/generatedFastnearStructuredGraph.json`

Mike-docs generator and shared runtime:

- `/Users/mikepurvis/near/mike-docs/scripts/generate-page-models.js`
- `/Users/mikepurvis/near/mike-docs/shared/FastnearOperationPage.tsx`
- `/Users/mikepurvis/near/mike-docs/shared/generatedFastnearPageModels.json`
- `/Users/mikepurvis/near/mike-docs/shared/generatedFastnearStructuredGraph.json`

---

## Bottom line

The important truth is simple:

- `authTransport` tells us how to send a key
- it does not yet tell us whether a key is required

As long as we keep that distinction clear, the current runtime behavior is coherent.

If we want stronger behavior, the right next move is a stronger generated contract, not a smarter guess.
