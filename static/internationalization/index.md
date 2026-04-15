**Source:** [https://docs.fastnear.com/internationalization](https://docs.fastnear.com/internationalization)

This playbook documents the locale framework in `builder-docs`.

Russian is the first full implementation, but it is no longer a one-off rollout. The goal is that every later locale follows the same system:

- shared locale registry
- locale-owned glossary and policy files
- non-destructive bootstrap scaffolding
- wave-based editorial QA
- locale-safe routing, SEO, and discovery artifacts
- localized FastNear overlay catalogs that never mutate generated English source data

## Design Goals

This framework is meant to keep future locale work mostly about content, not about infrastructure.

The non-negotiable rules are:

- English stays the default locale at `/`
- localized docs publish at `/<locale>/...`
- canonical technical identifiers stay stable
  - slugs
  - endpoint paths
  - payload keys
  - schema property names
  - operation IDs
- generated localization remains an overlay, never an in-place edit of vendored generated data

## Core Files

### Locale registry

Supported locales live in `src/data/localeRegistry.json`.

That registry is the shared source of truth for:

- Docusaurus locale config
- locale-aware route helpers
- bootstrap and audit tooling
- client-side hidden-section metadata

### Locale-owned glossary

Each non-default locale owns `i18n/<locale>/glossary.yml`.

The glossary is the terminology contract for both humans and scripts. It keeps translation decisions out of scattered JS arrays and prose docs.

Current schema:

- `preserve`
  Terms that must remain literal or canonical, such as `RPC`, `API`, `JSON-RPC`, `GET`, `POST`, `FastNear`, `mainnet`, and code-ish identifiers.
- `translate`
  Preferred exact and word-level mappings for recurring UI and docs phrases.
- `transliterate`
  Preferred transliterations for integrated jargon when that is better than keeping Latin script.
- `notes`
  Human guidance that explains the editorial intent but is not required by scripts.

### Locale-owned translation policy

Each non-default locale also owns `i18n/<locale>/translation-policy.yml`.

This file defines editorial scope and workflow policy:

- `waves.wave1`
  Required-for-ship docs and page-model IDs. This is the CI-enforced editorial bar.
- `waves.wave2`
  Expanded public surface for follow-up editorial passes.
- `hiddenSections`
  Route prefixes and doc path prefixes that are intentionally out of editorial scope until they become public.
- `bootstrap`
  Locale-owned route labels and translation JSON overrides used by the scaffold flow.

For Russian, `/transaction-flow` is the first hidden section tracked this way.

## Shared Tooling

The locale framework now uses generic commands instead of Russian-only scripts.

```bash
yarn bootstrap:i18n --locale <code>
yarn bootstrap:i18n:reseed --locale <code>
yarn audit:i18n --locale <code> --wave <1|2|all>
yarn audit:i18n:all
```

What they do:

- `bootstrap:i18n`
  Safe scaffold refresh. It fills in missing locale files and keys without overwriting curated content.
- `bootstrap:i18n:reseed`
  Explicit destructive path when you intentionally want to reseed a locale from the bootstrap heuristics.
- `audit:i18n`
  Glossary-aware editorial QA for a single locale and wave.
- `audit:i18n:all`
  CI-oriented wave-1 audit for every configured non-default locale.

Russian compatibility aliases still exist and remain supported:

```bash
yarn bootstrap:i18n:ru
yarn bootstrap:i18n:ru:reseed
yarn audit:i18n:ru
```

Those are convenience wrappers. The generic commands are now canonical.

## Bootstrap Behavior

`scripts/bootstrap-i18n.js` is intentionally non-destructive by default.

For a locale such as `ru`, it:

- runs `write-translations --locale ru`
- scaffolds missing docs into `i18n/ru/docusaurus-plugin-content-docs/current`
- preserves existing curated locale docs instead of overwriting them
- merges missing runtime translation keys into locale JSON catalogs
- refreshes `src/data/fastnearTranslations.<locale>.json` without discarding curated overlay entries
- applies locale-owned route labels and JSON overrides from `translation-policy.yml`

This keeps scaffold freshness and editorial curation compatible with each other.

## Audit Behavior

`scripts/audit-i18n.js` is the lightweight editorial gate.

It reads:

- the locale glossary for allowed literal terms
- the locale translation policy for wave scope and hidden-section exclusions
- locale docs under `i18n/<locale>/...`
- locale runtime translation catalogs
- locale FastNear overlay catalogs

The audit flags suspicious English leftovers while respecting allowed literals such as:

- protocol names
- HTTP verbs
- product names
- code identifiers
- canonical path fragments

This is meant to be practical QA, not language-policing for every long-tail page on day one.

## Wave Policy

Every locale should use the same editorial policy:

### Wave 1

Wave 1 is the shipping bar.

It should include:

- homepage and primary decision pages
- top-level auth, API, RPC, and transaction entry points
- the most visible generated operation wrappers and overlay entries
- live runtime UI strings on those pages

Wave 1 is the only translation scope enforced in CI.

### Wave 2

Wave 2 is the broader public-surface pass.

It should include:

- more leaf docs
- long-tail overview pages
- additional generated overlay entries
- lower-priority but still public runtime copy

Wave 2 is important, but it is intentionally non-blocking.

### Long tail

Long-tail work is ongoing polish:

- maintainer docs
- obscure leaf pages
- rarely surfaced theme strings
- low-traffic generated pages

That work should keep improving, but it should not block shipping a healthy locale.

## Hidden Sections

Hidden sections must be explicit so we do not confuse file coverage with editorial readiness.

The source of truth is `translation-policy.yml.hiddenSections`.

Those prefixes drive two things:

- they are excluded from wave-1 editorial requirements
- docs pages under those prefixes render a visible banner explaining that editorial and translation polish are intentionally deferred until the section becomes public

Today, `/transaction-flow` is the first section using this rule.

## Runtime, Routing, And Discovery

The locale framework also covers the non-prose surfaces that future locales should inherit automatically.

Important files:

- `docusaurus.config.js`
- `src/utils/localizedRoutes.js`
- `src/utils/fastnearLocalization.js`
- `scripts/generate-ai-surfaces.js`
- `plugins/finalizeLocalizedStaticAssets.cjs`

Together they ensure:

- locale dropdown and locale-aware routing work consistently
- root-relative links preserve the active locale
- generated FastNear overlays localize operation content without touching source page models
- localized Markdown mirrors, `llms.txt`, and site-graph output ship from the correct locale root
- structured data and SEO emit localized URLs and `inLanguage`

## Lean CI Gate

The locale-quality gate is intentionally small.

The required workflow runs:

```bash
yarn audit:i18n:all
yarn build
node scripts/audit-indexing-surface.js
```

That is enough to protect:

- wave-1 locale quality
- build correctness
- discovery/indexing correctness

It intentionally does not include Playwright, relevance scoring, or heavier editorial sweeps.

## Adding A New Locale

Use this checklist when adding the next language:

1. Add the locale to `src/data/localeRegistry.json`.
2. Create `i18n/<locale>/glossary.yml`.
3. Create `i18n/<locale>/translation-policy.yml`.
4. Run `yarn bootstrap:i18n --locale <code>`.
5. Curate the generated `i18n/<locale>/code.json` and docs tree.
6. Add `src/data/fastnearTranslations.<locale>.json` for generated FastNear overlays.
7. Run `yarn audit:i18n --locale <code> --wave 1`.
8. Run `yarn build` and `node scripts/audit-indexing-surface.js`.
9. Add targeted browser checks only if the locale introduces new runtime behavior worth smoke-testing.

If those steps are followed, later locales should mostly be editorial work layered onto a stable framework.
