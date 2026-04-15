# Adding a New Locale

A concrete step-by-step recipe for rolling out a new locale in `builder-docs`. Russian was the first full implementation; this chapter treats it as the template and walks through the same sequence a future locale (ES, ZH, JA, …) should follow.

Companion chapters:

- [i18n locale framework and Russian rollout](i18n_locale_framework_and_russian_rollout.md) — the architectural model (Docusaurus config, locale registry, routing, generated overlays, discovery artifacts). Read this first if you need to understand *why* the system is shaped the way it is.
- [Russian translation style guide](i18n_translating_russian.md), [Russian glossary](i18n_ru_glossary.md), [Russian quick-reference card](i18n_ru_quick_reference.md) — the per-locale artifacts you will mirror for the new language.

This chapter is the operational recipe. It assumes the framework is already in place and you have a team member who reads the target language fluently enough to exercise editorial judgment (not just run a bulk machine translation).

---

## Prerequisites

Before starting the locale rollout, confirm:

1. **The framework chapter is understood.** Translators and reviewers should skim the framework chapter to know what is in-scope vs out-of-scope (e.g. `/transaction-flow/` is currently hidden by editorial decision for Russian — each new locale makes its own call on hidden surfaces).
2. **You know the locale's authoritative references.** Russian used Yandex Cloud API Design Guide + Tinkoff Invest API + Waves Enterprise. For any new locale, identify two or three equivalent production-quality API documentation sites in the target language before authoring a style guide. Cite them.
3. **A fluent editor is available.** The audit script flags mechanical defects, not meaning. The pass sequence assumes a human reviewer catches register, tone, and word-choice issues before merge.

---

## Step sequence

### 1. Register the locale

- Add the locale to `src/data/localeRegistry.json` following the Russian entry. Include the display name, URL prefix, and translation policy selector.
- Add the locale to `docusaurus.config.js` under `i18n.locales` and the Docusaurus locale config map. Russian rides at `/ru`; the new locale should use its own ISO-639-1 (or BCP-47) prefix.
- Wire any locale-specific Algolia facet filters and the SearchBar modal heading via `src/theme/SearchBar` (see framework chapter).

### 2. Create the locale-owned editorial artifacts

Mirror the Russian set but adapt each to the target language:

| Russian artifact | New-locale equivalent | Purpose |
|---|---|---|
| `i18n/ru/glossary.yml` | `i18n/<locale>/glossary.yml` | Runtime glossary: `preserve` list + English→locale `replace` map. Feeds `audit-i18n.js`. Start with the Russian file and adjust the `replace` map to the target language. |
| `i18n/ru/docusaurus-plugin-content-docs/current/` | `i18n/<locale>/docusaurus-plugin-content-docs/current/` | Translated MDX sources. Bootstrapped from English, edited in passes. |
| `md-CLAUDE-chapters/i18n_translating_russian.md` | `md-CLAUDE-chapters/i18n_translating_<language>.md` | Style guide authored *for translators*. Cite 2–3 authoritative sources in the target language. |
| `md-CLAUDE-chapters/i18n_ru_glossary.md` | `md-CLAUDE-chapters/i18n_<locale>_glossary.md` | Human-readable glossary keyed to the style guide, with source citations for each term. |
| `md-CLAUDE-chapters/i18n_ru_quick_reference.md` | `md-CLAUDE-chapters/i18n_<locale>_quick_reference.md` | One-page translator card: three-tier rule, top 30 terms, top 5 rules, forbidden calques. |

The two `md-CLAUDE-chapters/` artifacts (style guide + glossary + quick-ref) are authored in English so the whole team can review them. They document the decisions; they are not translated themselves.

### 3. Bootstrap the translation pool

- Run the locale-specific bootstrap script (follow the `bootstrap-ru-i18n.js` pattern). The bootstrap pass seeds English source into the locale pool so translators can iterate without building an empty directory tree by hand.
- After the initial bootstrap, the runtime glossary's `replace` map runs across the pool and applies any English→locale substitutions already codified. Expect 10–30% coverage from this mechanical pass.
- The remaining 70–90% is editorial work in the passes below.

### 4. Three-pass editorial sequence

Russian was authored in exactly this sequence. Do not try to front-load everything into a single pass — the point of the sequence is each pass surfaces defects the next one fixes.

#### Pass 1 — defects + cite sources

Goals:

- Fix the specific calques and mixed-language fragments the bootstrap pass left behind.
- Author the style guide (`i18n_translating_<language>.md`) with explicit citations to the 2–3 external authoritative sources. This is the single most valuable artifact of Pass 1 — every later decision references it.
- Codify the highest-frequency conventions: hyphenation, sentence case, imperative voice, Latin preservation.

Scope boundaries:

- Per-endpoint index pages only (`/rpc`, `/api`, `/tx`, …) — do not touch the pool yet beyond targeted calque fixes.
- Do not pre-harmonize terminology you have not yet decided about. Pass 2 is for consistency.

#### Pass 2 — terminology harmonization + voice

Goals:

- Run a recon sweep: for each candidate term (node, stream, receipt, pagination, etc.) grep the corpus and count variants. Let the corpus-internal evidence drive decisions as much as the external sources.
- Settle every editorial question Pass 1 left open. Update the style guide when the evidence is stronger than your prior assumption (Russian quietly reversed the style-guide position on `receipt` after recon — the corpus had the right call).
- Rewrite direct-address voice to imperative/impersonal per the style-guide voice rules. Expect ~20–40 small rewrites in the index-page set.

Scope boundaries:

- Terminology + voice only. Hidden surfaces stay hidden.
- Do not introduce new surfaces or retranslate large blocks in this pass — that is a separate editorial project.

#### Pass 3 — guardrails and gold-standard polish

Goals:

- Produce the human-readable glossary (`i18n_<locale>_glossary.md`) and the quick-reference card (`i18n_<locale>_quick_reference.md`). Both reference the style guide as the primary source of truth and cite the external corpus.
- Create (or adapt) a runnable audit — copy `scripts/audit-ru-terminology.js` to `scripts/audit-<locale>-terminology.js` and port the patterns:
  - Calque patterns (language-specific; Russian's were `продакшен`, bare `стриминг`, `ЖСОН` etc.)
  - Voice-register checks (e.g. Russian checks for capitalized `Вы`; adapt for target-language equivalents like German `Sie`, French `Vous`, Japanese unnecessary politeness markers)
  - Hyphenation / Latin-preservation checks
  - Mixed-language "glue word" heuristic
- Add a `yarn audit:<locale>-terminology` script to `package.json` and hook it into `ci:locale-quality`.
- Extend `scripts/audit-i18n.js` allowlists if the locale surfaces new kinds of legitimate English-in-prose tokens (e.g. Russian needed URL-host pattern stripping and `Authorization` in the preserve list).
- Add the locale to this chapter's table, the CLAUDE.md cross-link, and the `md-CLAUDE-chapters/README.md` index.

---

## Editorial sequencing checklist

Use this list when planning a rollout. Each item is a concrete question with a concrete answer on the Russian side to compare against.

| Question | Russian precedent | New locale |
|---|---|---|
| What is the URL prefix? | `/ru` | — |
| What are the 2–3 authoritative sources for terminology? | Yandex Cloud API Design Guide, Tinkoff Invest API, Waves Enterprise | — |
| Which surfaces are hidden? | `/transaction-flow/` (11-page deep dive, deferred) | — |
| What pronoun forms does the language require? | None — imperative/impersonal default; capital `Вы` forbidden | — |
| What hyphenation rules apply to `Latin + NativeNoun`? | Always hyphenated: `API-ключ`, `HTTP-запрос`, `Bearer-токен` | — |
| What protocol names stay Latin? | JSON, REST, HTTP, API, gRPC, JWT (never Cyrillicized) | — |
| Which code identifiers stay Latin in prose? | `page_token`, `predecessor_id`, `user_id`, etc. | — |
| What is the canonical term for "production (environment)"? | `продовый контур` / `продовый сервис`; never `продакшен` | — |
| What is the canonical term for a NEAR receipt? | `квитанция` (corpus-driven; codified in `glossary.yml`) | — |
| What is the canonical term for a blockchain node? | `узел` (formal, default) / `нода` (informal/operator) | — |

---

## What success looks like

At the end of three passes, the locale should have:

- The per-locale artifacts listed in Step 2 above, authored and committed.
- A clean run of `yarn audit:<locale>-terminology` and `yarn audit:i18n:all`.
- A passing `yarn ci:locale-quality` gate.
- A style guide, glossary, and quick-reference card that a second fluent translator could pick up without needing to reconstruct the decisions.
- Index pages that read as native prose, not machine-translated first-draft text.
- Generated AI-surface mirrors (`static/<locale>/**`) that reflect the clean copy.

If any of these is missing at merge time, the locale is not ready. Leaving a half-rolled-out locale in `main` degrades the user experience below the English fallback — better to ship incrementally behind a feature flag or keep the branch open until the passes are complete.

---

## Related chapters

- [i18n locale framework and Russian rollout](i18n_locale_framework_and_russian_rollout.md) — the framework and why it is shaped this way.
- [Russian translation style guide](i18n_translating_russian.md) — the reference style guide authored in Pass 1.
- [Chinese translation style guide](i18n_translating_chinese.md) — an in-progress style guide for the next locale; useful as a second worked example alongside Russian.
- [Russian glossary](i18n_ru_glossary.md) and [Russian quick reference](i18n_ru_quick_reference.md) — the Pass 3 artifacts to mirror.
