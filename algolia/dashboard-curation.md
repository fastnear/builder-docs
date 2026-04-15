# Algolia Dashboard Curation

This note captures the small amount of live dashboard work that still sits outside the repo-managed crawler config and relevance checks.

## Use This For

- Rules that pin or reshape results for high-intent searches
- Synonyms that improve recall for builder vocabulary
- Ranking tweaks that need a live dashboard change

The committed source files in this directory remain the desired baseline:

- `algolia/docsearch-crawler.config.js`
- `algolia/index-settings.json`
- `algolia/rules.json`
- `algolia/synonyms.json`
- `algolia/relevance-cases.json`

## Curation Policy

- Prefer fixing extraction, metadata, or ranking inputs in the repo before adding dashboard-only overrides.
- Keep dashboard rules narrow and reversible.
- Avoid locale-specific dashboard hacks unless the issue cannot be modeled through docs content or crawler metadata.
- Re-run `yarn audit:algolia-relevance` after meaningful dashboard changes.

## Checklist

1. Confirm the issue is visible in the live DocSearch index rather than only in local content.
2. Decide whether the fix belongs in docs content, crawler metadata, index settings, rules, or synonyms.
3. If the change must live in Algolia, update the dashboard conservatively.
4. Reflect the intended state back into the committed JSON or notes in this directory when possible.
5. Re-run the local relevance and indexing audits.

## Locale Note

Wave-1 locale quality is enforced in CI through the locale audit and build checks. Algolia dashboard curation should stay a secondary, manual layer on top of that system, not a substitute for fixing locale content or metadata in the repo.
