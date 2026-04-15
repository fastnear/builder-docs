# Builder Docs i18n Locale Framework and Russian Rollout

This chapter documents the completed internationalization system in `builder-docs`.

It is not a translation style guide. It is the architectural and editorial model that future locales should follow.

Russian is the first full implementation of this system, but the important outcome is broader than one language: `builder-docs` now has a reusable locale framework for Docusaurus, generated FastNear content, localized discovery artifacts, and a lightweight editorial quality gate.

---

## What was completed

The i18n work was intentionally much larger than “turn on a locale dropdown.”

The finished system includes:

- Docusaurus locale support with English at `/` and Russian at `/ru`
- localized authored docs in `i18n/ru/docusaurus-plugin-content-docs/current`
- localized runtime UI strings through Docusaurus translation APIs
- locale-safe routing so internal navigation preserves the active locale
- a separate Russian overlay for generated FastNear page-model content
- localized Markdown mirrors, `llms.txt`, `llms-full.txt`, and site-graph output
- localized structured data and SEO metadata
- a non-destructive locale bootstrap flow
- a glossary-aware translation audit
- a lean CI gate for locale quality
- explicit hidden-section policy for content that exists but is not yet editorially in scope

This is now a full-stack localization model, not a docs-only experiment.

---

## User-facing contract

These rules define the public contract and should remain stable as new locales are added.

### Locale URLs

- English is the default locale and remains mounted at `/`
- Russian is mounted at `/ru`
- future locales should follow the same `/<locale>/...` pattern

### Stable docs families

The public root-mounted docs families remain stable and do not get renamed per language:

- `/rpc/**`
- `/api/**`
- `/tx/**`
- `/transfers/**`
- `/neardata/**`
- `/fastdata/kv/**`
- `/auth/**`
- `/agents/**`
- `/snapshots/**`

### Stable canonical hosted routes

Hosted operation pages also remain stable in structure:

- `/rpcs/**`
- `/apis/**`

Localized variants are path-prefixed, not structurally redesigned:

- `/ru/rpcs/**`
- `/ru/apis/**`

### Never translate wire identifiers

The system explicitly preserves:

- slugs
- endpoint paths
- payload keys
- schema property names
- operation IDs
- protocol names and HTTP verbs where they function as literal technical tokens

The rule is simple: translate prose, not protocol identity.

---

## Core architecture

### 1. Locale registry

`src/data/localeRegistry.json` is the shared source of truth for configured locales.

It currently declares:

- default locale: `en`
- supported locales: `en`, `ru`
- per-locale `htmlLang`
- per-locale native label

This registry feeds:

- `docusaurus.config.js`
- server-side locale tooling
- client-side locale-aware helpers
- indexing audits

The key design decision here is that supported locales are no longer scattered across one-off scripts.

### 2. Locale-owned glossary

Each non-default locale owns `i18n/<locale>/glossary.yml`.

This file is both human guidance and machine input.

It contains:

- `preserve`
- `translate`
- `transliterate`
- `notes`

This keeps terminology rules out of ad hoc JS arrays and makes later locales mostly a data-entry task rather than a scripting task.

For Russian, the glossary captures accepted literals such as:

- `API`
- `RPC`
- `JSON-RPC`
- `OpenAPI`
- `NEAR Data API`
- `FastNear`
- `mainnet`
- `testnet`

along with house-style translation and transliteration choices.

### 3. Locale-owned translation policy

Each non-default locale also owns `i18n/<locale>/translation-policy.yml`.

This file defines the editorial and workflow contract for the locale:

- `waves.wave1`
- `waves.wave2`
- `hiddenSections`
- `bootstrap.routeLabels`
- `bootstrap.translationJsonOverrides`

This is one of the most important design improvements in the completed system.

Wave coverage, route labels, and hidden-section scope are now locale-owned policy data, not hardcoded Russian constants inside scripts.

### 4. Generic locale framework loader

`scripts/lib/locale-framework.js` is the shared loader for:

- locale registry data
- glossary data
- translation policy data
- locale-specific paths

It is what allowed the repo to stop thinking in “Russian script” terms and start thinking in “configured locale” terms.

---

## Docusaurus integration

### Locale config

`docusaurus.config.js` now reads locale state from the shared registry rather than from hardcoded `en`/`ru` constants.

That config exposes:

- default locale
- locale list
- `localeConfigs`
- `localeDropdown`
- client-visible `customFields.localeFramework`

The client-visible part matters because hidden-section metadata is consumed by the docs runtime.

### Search config

Local search is configured for both English and Russian.

The locale work also included cleaning up stale search/theme translation keys so the locale scaffolding no longer emits noisy warnings during bootstrap.

### Docs runtime

The docs runtime now handles locale-specific behavior in a central way:

- localized breadcrumbs
- locale-preserving internal links
- hidden-section banners
- localized page actions and runtime UI

The swizzled docs/search runtime is part of the i18n surface, not an afterthought.

---

## Locale-safe routing

The routing layer is one of the most important invisible parts of the rollout.

`src/utils/localizedRoutes.js` and `scripts/lib/localized-routes.js` normalize locale behavior by:

- stripping an optional locale prefix for matching
- re-applying locale prefixes when generating internal links
- preserving the active locale for root-relative paths

Without this layer, Russian pages would repeatedly bounce users back to English when they clicked internal links such as `/api`, `/rpc`, or `/snapshots`.

This helper is now the shared contract for any place that needs to compare or generate route-family paths.

---

## Generated FastNear localization

One of the most important architectural choices was to keep generated English content as the source of truth.

The repo does **not** translate generated page models in place.

Instead, it uses locale-specific overlay catalogs:

- `src/data/fastnearTranslations.ru.json`

These overlays are keyed by stable identifiers such as:

- `pageModelId`
- `familyId`
- route labels where needed

That allows Russian to localize:

- operation titles
- summaries
- descriptions
- field labels
- field descriptions
- example labels
- response descriptions
- security-scheme descriptions
- family names and descriptions

while preserving the generated source contract unchanged.

This separation is mandatory for future locales too.

If a later language needs localized generated content, it should add a new overlay file, not mutate vendored generated JSON.

---

## Discovery, indexing, and machine-readable surfaces

The finished i18n system also localizes the “AI/discovery surface,” not just human-facing pages.

### Localized AI surfaces

`scripts/generate-ai-surfaces.js` emits localized:

- Markdown mirrors
- `llms.txt`
- `llms-full.txt`
- `guides/llms.txt`
- `rpcs/llms.txt`
- `apis/llms.txt`
- `structured-data/site-graph.json`

These are emitted both for English and for Russian.

### Structured data

Structured data and SEO metadata are locale-aware:

- localized public URLs
- localized `inLanguage`
- localized breadcrumb graph output
- stable `WebSite` and `Organization` entities

### Static locale finalization

`plugins/finalizeLocalizedStaticAssets.cjs` is part of the finished system because Docusaurus otherwise nests localized static output under duplicated locale paths.

This finalizer:

- promotes localized static assets into the correct built locale root
- removes duplicated nested locale directories
- ensures locale sitemap references remain healthy

This plugin should be considered part of the permanent locale framework.

---

## Bootstrap and audit workflow

### Generic commands

The canonical interface is now generic:

```bash
yarn bootstrap:i18n --locale <code>
yarn bootstrap:i18n:reseed --locale <code>
yarn audit:i18n --locale <code> --wave <1|2|all>
yarn audit:i18n:all
```

Russian compatibility aliases remain:

```bash
yarn bootstrap:i18n:ru
yarn bootstrap:i18n:ru:reseed
yarn audit:i18n:ru
```

The important part is that the generic commands are now the primary contract for future locales.

### Non-destructive bootstrap

`scripts/bootstrap-i18n.js` is intentionally safe by default.

It:

- runs `write-translations --locale <code>`
- scaffolds missing locale files
- preserves curated docs
- preserves curated message catalogs
- preserves curated generated overlay entries
- applies locale-owned policy overrides

This makes repeated locale refreshes practical.

That was one of the major lessons of the Russian rollout: destructive scaffolding is fine for a first seed, but terrible for ongoing editorial work.

### Glossary-aware audit

`scripts/audit-i18n.js` is a lightweight editorial check.

It reads:

- the locale glossary
- the locale translation policy
- locale docs
- locale runtime catalogs
- locale overlay catalogs

It flags suspicious English leftovers while respecting approved literals.

This is deliberately a practical regression barrier, not a comprehensive linguistic validator.

---

## Editorial wave model

The completed system now encodes a strict but lightweight editorial policy.

### Wave 1

Wave 1 is the shipping bar.

It covers:

- homepage and core landing pages
- main auth/API/RPC/transactions entry points
- the highest-traffic generated wrappers and page-model overlays
- live runtime strings visible on those surfaces

Wave 1 is the only locale scope enforced in CI.

### Wave 2

Wave 2 is the broader public-surface pass.

It covers:

- additional leaf docs
- more generated overlay entries
- lower-priority but still public copy
- maintainer docs and supporting pages when useful

Wave 2 matters, but it stays intentionally non-blocking.

### Long tail

Long-tail cleanup includes:

- obscure leaf pages
- hidden content that is not yet public
- lower-signal theme/runtime strings
- rarely visited generated entries

This work continues over time without blocking release readiness.

---

## Hidden sections and editorial scope

One of the best outcomes of the completed system is that hidden content is no longer silently counted as translation coverage.

`translation-policy.yml.hiddenSections` is the source of truth for content that exists but is intentionally out of editorial scope until it becomes public.

Right now the primary example is:

- `/transaction-flow`

The system uses that metadata in two ways:

1. Hidden sections are excluded from required wave-1 coverage.
2. The docs runtime shows a visible warning banner on those pages explaining that translation and editorial polish are intentionally deferred.

This is important because it prevents future teams from mistaking broad file coverage for completed editorial work.

---

## Lean CI gate

The locale-quality gate is intentionally small and healthy rather than overbuilt.

`.github/workflows/locale-quality.yml` runs:

```bash
yarn ci:locale-quality
```

which in turn runs:

- `yarn audit:i18n:all`
- `yarn build`
- `node scripts/audit-indexing-surface.js`

This protects the most important things:

- wave-1 locale quality
- build correctness
- discovery/indexing correctness

It explicitly does **not** force:

- Playwright
- search-relevance checks
- heavy editorial sweeps

That was a conscious product decision: enough guardrails to keep locale quality healthy, without turning content work into bureaucracy.

---

## Russian as the first reference locale

Russian is important here for two different reasons.

### 1. It is the first full locale

Russian proved that the architecture works across:

- authored docs
- runtime UI
- generated overlays
- localized SEO
- AI/discovery surfaces
- build output
- CI

### 2. It is the template locale

Russian also now serves as the concrete template for future locales because it already includes:

- `i18n/ru/glossary.yml`
- `i18n/ru/translation-policy.yml`
- `i18n/ru/code.json`
- translated docs content
- `src/data/fastnearTranslations.ru.json`

A later locale should follow the same structure rather than creating bespoke scripts or conventions.

---

## Local development caveat

One Docusaurus behavior matters enough to remember explicitly:

- `yarn start` serves the production-style multi-locale build
- `yarn start:dev` and `yarn start:dev:ru` are single-locale hot-reload modes

Single-locale Docusaurus dev mode does **not** cross-switch languages correctly through the locale dropdown.

That is a Docusaurus limitation, not a routing bug in the FastNear implementation.

This distinction matters during future locale work because it is easy to think locale switching is broken when the real issue is just the preview mode.

---

## How future locales should proceed

When adding another language, the correct order is:

1. Add the locale to `src/data/localeRegistry.json`.
2. Create `i18n/<locale>/glossary.yml`.
3. Create `i18n/<locale>/translation-policy.yml`.
4. Run `yarn bootstrap:i18n --locale <code>`.
5. Curate locale docs and runtime catalogs.
6. Add `src/data/fastnearTranslations.<locale>.json` for generated overlays.
7. Run `yarn audit:i18n --locale <code> --wave 1`.
8. Run `yarn build`.
9. Run `node scripts/audit-indexing-surface.js`.

The larger lesson is this:

**new locales should add locale data and editorial content, not new infrastructure.**

If a future locale needs new scripting or new routing rules, that is probably a sign the existing framework is being bypassed instead of reused.

---

## Why this matters

This i18n work is a strong save point for the repo because it converted a bold first-language experiment into a maintainable platform feature.

Before this work, adding a language would have implied:

- new locale wiring
- new routing risk
- new search/indexing uncertainty
- new generated-content localization decisions
- new deploy/finalization edge cases

After this work, adding a language should mostly mean:

- add locale metadata
- define glossary and policy
- seed content
- review copy
- ship wave 1

That is the real accomplishment of the completed rollout.
