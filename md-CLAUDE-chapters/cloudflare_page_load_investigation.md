# Cloudflare Page Load Investigation

Date: April 16, 2026

This memo answers two questions:

1. Does the Cloudflare Web Analytics `Page Load 5,888 ms` reading reflect a real performance problem?
2. If yes, which reductions are worth pursuing first?

Short answer:

- Yes, there is real meat here.
- The evidence does not point to a broad desktop regression.
- The real issue is the first-navigation mobile experience, where the site is shipping enough JavaScript, CSS, font, and search/runtime code that aggregate page-load timing can legitimately climb into the `~5.5-6.1 s` range.

## Executive Summary

The current Cloudflare number should not be dismissed as noise. It is directionally consistent with independent mobile Lighthouse measurements against the live site on April 16, 2026.

The important nuance is scope:

- Desktop currently looks healthy.
- Origin latency is not the bottleneck.
- Mobile first-load cost is the main problem.
- The primary suspects are initial bundle shape and eagerly loaded runtime data, not the Cloudflare beacon itself.

That makes this a worthwhile optimization pass, but the work should be framed as initial-load bundle reduction and data-loading strategy, not as a generic server-speed problem.

## What the Cloudflare Metric Means

Cloudflare's [Page load time](https://developers.cloudflare.com/web-analytics/data-metrics/page-load-time-summary/) doc defines page load as the total time required to load the page, and explicitly notes that it does **not** correspond to the simple sum of the visible timing buckets. Cloudflare says the total also includes timing that is not separately displayed, including pre-DNS timings and unattributed gaps between metrics.

Cloudflare's [Data origin and collection](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/) doc says Web Analytics uses browser navigation timing data from `performance.getEntriesByType('navigation')`, with `performance.timing` as a fallback on older browsers.

That matters for interpretation:

- The `5,888 ms` number is not inherently suspicious just because the visible sub-buckets do not add up.
- A mixed audience with slower mobile devices can produce a much uglier aggregate page-load number than desktop spot-checks would suggest.
- Cloudflare's own page-load doc calls out `Processing` as the bucket to watch when scripts, styles, images, and rendering work are heavy.

## Measurement Method

The findings below combine three sources of truth from April 16, 2026:

- Cloudflare Web Analytics documentation for metric semantics.
- Lighthouse runs against the live production site at `https://docs.fastnear.com`.
- Repo inspection in the current `builder-docs` checkout to explain why the live bundle behaves this way.

Pages checked:

- `/`
- `/rpc/account/view-account`

Device classes checked:

- desktop Lighthouse
- mobile Lighthouse

## Measured Evidence From The Live Site

### Lighthouse summary

| Date | Page | Device | Performance | FCP | LCP | Interactive | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-04-16 | `/` | desktop | `0.96` | `0.9 s` | `1.2 s` | `1.2 s` | `10 ms` |
| 2026-04-16 | `/rpc/account/view-account` | desktop | `0.91` | `1.1 s` | `1.6 s` | `1.6 s` | `0 ms` |
| 2026-04-16 | `/` | mobile | `0.65` | `4.0 s` | `5.5 s` | `5.5 s` | `170 ms` |
| 2026-04-16 | `/rpc/account/view-account` | mobile | `0.64` | `4.0 s` | `6.1 s` | `6.1 s` | `180 ms` |

Immediate takeaway:

- Desktop is fine.
- Mobile is not catastrophic, but it is slow enough to fully justify the Cloudflare concern.

### Mobile resource summary

For the two sampled live pages on April 16, 2026, mobile Lighthouse reported a very similar first-load footprint:

- total transfer about `546-552 KB`
- scripts about `430 KB`
- fonts about `52 KB`
- stylesheet about `32 KB`
- third-party about `75 KB`

### Largest first-load assets

The biggest live first-load assets were:

- `main.39b98579.js` at about `265 KB` transferred
- `common.41b7f3d8.js` at about `94 KB` transferred

Additional notable first-load requests:

- `styles.fef66c14.css` at about `31-32 KB` transferred
- DM Sans font files from `fonts.gstatic.com` at about `52 KB` combined
- Cloudflare beacon at about `11 KB`

### Unused asset findings

Mobile Lighthouse flagged material waste in the initial payload:

- `main.js` wastes about `128-131 KB`
- `common.js` wastes about `46 KB` on the homepage
- the global stylesheet wastes about `20-23 KB`

That is enough to matter on slower mobile CPUs and networks even if the absolute transferred size is not enormous by modern SPA standards.

### TTFB is not the main problem

The root document response time was only about `30-50 ms` in Lighthouse.

That rules out the most convenient explanation. The problem is not that the site takes a long time to start responding. The problem is what the browser has to download, parse, and execute after the response arrives.

## Repo Evidence That Explains The Measurements

The live results line up with several concrete repo-level causes.

### Eager page-model payload

[pageModels.js](/Users/mikepurvis/.codex/worktrees/d3da/builder-docs/src/components/FastnearDirectOperation/pageModels.js) eagerly imports [generatedFastnearPageModels.json](/Users/mikepurvis/.codex/worktrees/d3da/builder-docs/src/data/generatedFastnearPageModels.json).

Measured raw file sizes in the repo:

- `generatedFastnearPageModels.json`: about `708 KB` raw
- `generatedFastnearStructuredGraph.json`: about `109 KB` raw

This is the strongest single clue that the interactive docs runtime is loading too much reference data up front instead of loading only the active operation.

### Eager locale catalog loading

[fastnearLocalization.js](/Users/mikepurvis/.codex/worktrees/d3da/builder-docs/src/utils/fastnearLocalization.js) uses `require.context(...)` to load all `fastnearTranslations.<locale>.json` catalogs into the bundle.

Measured raw file size in the repo:

- [fastnearTranslations.ru.json](/Users/mikepurvis/.codex/worktrees/d3da/builder-docs/src/data/fastnearTranslations.ru.json): about `247 KB` raw

That means the initial bundle is carrying non-default locale payload that English users do not need for first render.

### Search and Ask AI code on the initial path

[SearchBar/index.js](/Users/mikepurvis/.codex/worktrees/d3da/builder-docs/src/theme/SearchBar/index.js) statically imports DocSearch components and adapter hooks up front, even though the modal UI is only opened on interaction.

The live `main.js` bundle includes search and Ask AI related code paths, including DocSearch sidepanel logic and `vercel.ai` error classes. That is consistent with the large initial `main.js` footprint and with the homepage carrying search/runtime cost before the user searches.

### Google Fonts in the critical path

[custom.css](/Users/mikepurvis/.codex/worktrees/d3da/builder-docs/src/css/custom.css) imports Google Fonts for `DM Sans`.

That matches the live mobile requests Lighthouse recorded:

- `fonts.googleapis.com` stylesheet request
- two `fonts.gstatic.com` font downloads

The font cost is not the dominant issue, but it is real first-load work and is easy to target.

## Proven Findings

These are directly supported by live measurements or code inspection:

- Mobile first-navigation performance is materially slower than desktop.
- The initial mobile payload is script-heavy.
- The initial app bundle carries measurable unused JavaScript and CSS.
- Origin response time is fast enough that server latency is not the main problem.
- The repo currently uses eager imports for both generated page-model data and locale catalogs.
- The repo currently keeps Google Fonts on the render path.

## High-Confidence Interpretation

These points are inferences from the measured evidence and code shape, but they are high confidence:

- The Cloudflare `Page Load 5,888 ms` number is plausibly reflecting real mobile-user pain rather than a measurement artifact.
- The most meaningful wins will come from bundle and data-loading changes, not from origin tuning.
- The site is paying homepage cost for capabilities that are only needed after interaction, especially search and some reference-runtime behavior.
- The Cloudflare beacon is not the primary cause, but it is worth a one-time production sanity check because Lighthouse recorded both the public beacon URL and a versioned beacon path.

## Ranked Recommendations

### 1. Split page-model data by route or family and load only the active `pageModelId`

**Why it matters:** The current runtime imports a single page-model payload that is about `708 KB` raw. That is too much data to put anywhere near the initial path when any given operation page only needs one model, and the homepage needs none of it.

**Expected impact:** This is the highest-leverage change. It should reduce both transfer size and parse/execute time on first navigation, especially for non-reference pages and for individual operation pages.

**Risk / effort:** Medium to high. This touches the data contract between generated artifacts and the runtime, but it is a clean optimization target with a strong performance story.

### 2. Stop bundling every locale catalog into the initial app; load only the active locale catalog, and keep English on a no-catalog path

**Why it matters:** English users should not pay to download Russian overlay data during first load. The current `require.context(...)` approach makes that hard to avoid.

**Expected impact:** Moderate. This should reduce initial JS weight and parse cost, especially for the default locale.

**Risk / effort:** Medium. Locale behavior needs careful verification, but the change is conceptually straightforward and should not alter public docs contracts.

### 3. Move Algolia search and Ask AI code behind a true on-interaction boundary

**Why it matters:** The navbar shell should be cheap. Right now the static imports still pull search and sidepanel-related runtime into the first-load bundle shape even though the user may never search.

**Expected impact:** Moderate to high on the homepage and other top-entry pages. This is a strong candidate for shrinking `main.js` and `common.js`.

**Risk / effort:** Medium. Search UX must remain intact, but the existing code already treats the modal and sidepanel as deferred UI, so there is a natural seam to tighten.

### 4. Reduce CSS and font cost; prefer self-hosting or removing Google Fonts before deeper styling work

**Why it matters:** Lighthouse showed both unused CSS and additional third-party font requests. The absolute numbers are smaller than JavaScript, but they still matter on mobile and they sit directly on the critical rendering path.

**Expected impact:** Small to moderate. This should improve first paint and reduce third-party dependency cost. Self-hosting would also improve determinism.

**Risk / effort:** Low to medium. This is comparatively easy work, but it should follow the bundle/data wins in priority.

### 5. Keep Cloudflare Web Analytics enabled, but treat the beacon as a secondary cost and perform a one-time duplicate-injection check

**Why it matters:** The beacon is not the main problem. The live first-load cost is dominated by app code and fonts. Still, it is worth verifying that production is not loading the beacon more than intended.

**Expected impact:** Small. Even a perfect beacon cleanup will not solve the main slowdown.

**Risk / effort:** Low. This is a quick hygiene check, not a strategic optimization track.

## What Not To Blame

It is important to say these explicitly so the next round of work stays focused:

- Desktop performance is currently healthy.
- Origin response time is not the main bottleneck.
- Cloudflare Web Analytics is not the primary cause of the current mobile slowdown.

## Public Interfaces

No public API, route, sidebar, or docs contract changes are recommended in this phase.

The changes described here are internal implementation changes only:

- bundle splitting
- page-model data loading strategy
- locale catalog loading strategy
- search loading strategy
- font delivery strategy

## Verification Plan For Future Implementation

After any performance work in this area, rerun the same checks:

- rerun Lighthouse mobile on `/`
- rerun Lighthouse mobile on `/rpc/account/view-account`
- compare request count and transferred bytes for `main.js`, `common.js`, fonts, and third-party scripts
- compare Cloudflare Web Analytics page-load trend after deploy
- confirm English and Russian locale behavior still works correctly
- confirm DocSearch and any Ask AI sidepanel behavior still work correctly
- confirm operation pages still load the right page model and render the correct interactive controls

## Answers To The Two Original Questions

### Is there real meat here?

Yes. The `Page Load 5,888 ms` reading is consistent with a real mobile first-load problem, even though desktop is healthy.

### What should we do next?

Prioritize the initial payload:

1. chunk page-model data
2. stop bundling all locale catalogs
3. tighten search and Ask AI code-splitting
4. clean up fonts and CSS
5. verify beacon hygiene, but do not mistake it for the main fix

That sequence is balanced, high signal, and should improve the real user experience without removing major features.
