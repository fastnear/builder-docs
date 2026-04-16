# Builder Docs CLAUDE Chapters

This folder collects longer-form reference chapters that are useful while evolving `builder-docs`. These are not product docs for end users. They are internal working chapters for architecture, operations, and style decisions that are easy to lose across chat history.

## Current chapters

### Algolia search and crawler

- [FastNear Algolia Search and Crawler Control](/Users/mikepurvis/near/fn/builder-docs/md-CLAUDE-chapters/algolia_search_and_crawler_control.md)
  - Architecture and source-of-truth chapter for the Algolia crawler, index settings, Rules, synonyms, SearchBar contract, and live validation lessons.
- [FastNear Algolia Search Runbook](/Users/mikepurvis/near/fn/builder-docs/md-CLAUDE-chapters/algolia_search_runbook.md)
  - Operator-oriented runbook for env setup, sync flow, reindexing, verification, and troubleshooting.

### Interactive operation URLs

- [Builder Docs Operation URL State and Shareable Example URLs](/Users/mikepurvis/near/fn/builder-docs/md-CLAUDE-chapters/operation_url_state_and_shareable_examples.md)
  - Architecture and testing chapter for URL-prefilled live examples, auto-run links, expanded response inspection, find-in-response, public URL sanitization, and future compatibility constraints.

### Auth semantics

- [Builder Docs Auth Contract and Page-Model Semantics](/Users/mikepurvis/.codex/worktrees/3973/builder-docs/md-CLAUDE-chapters/auth_contract_and_page_model_semantics.md)
  - Source-of-truth chapter for what `authTransport` does and does not mean today, how auth metadata flows from `mike-docs`, and what an idiomatic future `auth required` contract should look like.

### i18n translation guidance

- [Translating API and RPC documentation into Russian](/Users/mikepurvis/near/fn/builder-docs/md-CLAUDE-chapters/i18n_translating_russian.md)
  - Russian translation style guide for technical API and RPC documentation.
- [Russian translation glossary](/Users/mikepurvis/near/fn/builder-docs/md-CLAUDE-chapters/i18n_ru_glossary.md)
  - Authoritative term list for the Russian locale with source citations (Yandex Cloud, Tinkoff, Waves Enterprise).
- [Russian translation quick-reference card](/Users/mikepurvis/near/fn/builder-docs/md-CLAUDE-chapters/i18n_ru_quick_reference.md)
  - One-page translator's card: three-tier rule, top 30 terms, top 5 rules.
- [Adding a new locale](/Users/mikepurvis/near/fn/builder-docs/md-CLAUDE-chapters/i18n_adding_locales.md)
  - Step-by-step recipe for rolling out a new locale using Russian as the template.
- [API / RPC 中文术语翻译风格指南](/Users/mikepurvis/near/fn/builder-docs/md-CLAUDE-chapters/i18n_translating_chinese.md)
  - Chinese translation style guide for API and RPC terminology decisions.

## How to use this folder

- Put architecture-heavy explanations here when they are too long or too important to leave only in commit history or chat history.
- Prefer one chapter per topic area rather than a single giant notes file.
- When a topic has both conceptual and operational material, keep both:
  - one architecture chapter
  - one runbook chapter
- When adding a new chapter, update this index so the folder stays navigable.

## Suggested future chapters

- structured data and JSON-LD strategy
- AI discovery surfaces (`llms.txt`, Markdown mirrors, site graph, IndexNow)
- docs IA and landing-page design language
- localized-content workflow and quality gates
