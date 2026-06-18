# `/debug` — hidden API-key / rate-limit tester

A hidden internal page for probing how the FastNear edge treats keyed requests from a real browser
origin. Added 2026-06-18.

- Route: `https://docs.fastnear.com/debug` — **not** in the sitemap, `noindex`, not linked anywhere.
  Reachable by direct URL only. (Sitemap exclusion: `/debug` in `buildLocalizedIgnorePatterns` in
  `docusaurus.config.js`; local search already uses `indexPages: false`.)
- Files: `src/pages/debug.js` (thin `Layout` + `noindex` + `BrowserOnly` wrapper) and
  `src/components/RateLimitDebugger/index.js` (the tool). Reuses `usePortalAuth()` from
  `src/components/FastnearDirectOperation/portalAuth.js` and `<ApiKeyManager/>`.
- Capabilities: spams the RPC from the page's true browser origin; presets (block / view_account /
  gas_price / validators / REST status / custom); auth as Bearer / `?apiKey=` / none; count/concurrency/
  delay + Burst; `?apiKey=KEY&debug_retry=N` auto-runs N on load; per-request table + summary
  (status histogram, latency p50/p95); generates an off-origin `hey` script for the lifted-key comparison.

## Why a browser can only test one side

The browser sets `Origin`/`Referer` automatically and JS cannot override them, so `/debug` tests the
**legit on-origin** path only. The **off-origin / lifted-key** side must be run outside the browser
(the page generates a `hey` script). Origin restriction is enforced at the edge (Origin-primary,
Referer-fallback) → `403 origin_not_allowed` off-origin.

## Findings (2026-06-18)

- **Origin enforcement works (confirmed server-side 2026-06-18, all 3 corrected keys dev2/pro/business):**
  no-Origin, wrong-Origin, **and `?apiKey=` no-Origin** all → `403 {"error":"origin_not_allowed"}`; a
  **forged** matching `Origin: https://docs.fastnear.com` → `200` (via Bearer *or* `?apiKey=`). So the
  binding stops casual lifts, `?apiKey=` doesn't bypass it, but the `Origin` header is trivially forged
  off-browser — origin/referer is a soft deterrent, **not** an auth boundary.
- **PRIMARY BUG — CORS preflight throttling.** Browser keyed calls fail with "Failed to fetch" at ~100
  req/IP regardless of tier, because the `fastnear.com` anonymous per-IP rate-limit rules match requests
  with no `apiKey=` and no `Authorization`, and a CORS `OPTIONS` preflight has neither. Fix runbook (CF
  rule OPTIONS-exemption, prepared, rollout pending) lives in the dashboard repo:
  `~/near/fn/dashboard/md-CLAUDE-chapters/cors-preflight-ratelimit-fix.md`.
- **Header visibility + the `/debug` ERR callout.** `x-rate-limit-score`/`cf-ray`/`retry-after` are not
  CORS-exposed, the throttled preflight `429` lacks `access-control-allow-origin`, **and so does the keyed
  plan-limit `-429`** — so a browser dApp that exceeds its plan also sees an opaque "Failed to fetch" rather
  than the upgrade message (status + body are the only reliable browser signals; use curl/`hey` for exact
  scores/thresholds). `/debug` now labels unreadable rows **"CORS-blocked — status hidden by browser"** and
  shows a callout explaining that a rate-limited preflight `429` without ACAO is unreadable *by design*,
  with the fix (switch Auth to `?apiKey=`, which dodges the anon preflight rule, or fix the edge). ARL block
  responses can't carry custom headers, so adding ACAO to `429`s needs an `http_response_headers_transform`
  rule.
- **Per-tier enforcement — `x-rate-limit-score` IS the enforcement input (corrected).** The plan limit is
  two **active** Cloudflare ARL rules (Bearer + apiKey query) that sum `x-rate-limit-score` per `(key, colo)`
  over 60s and block at `1e9` with the `-429` "project plan exceeded" custom response. The config is correct
  (`score = floor(1e9/budget)`; budgets dev 10k / pro 20k / business 50k; all three scores observed on the
  wire). **But measured enforcement ≠ config:** dev caps ~**5k**, pro ~**10k** (each **half** its budget —
  effective trip ≈ 5e8, systematic across c=20 and c=150), and **business never trips** (>55k, single colo
  SEA) → effectively unlimited. CF's response-header score counting is empirically imprecise (high scores
  trip ~2× early; the low business score under-counts to non-enforcement). My earlier note here
  ("dev≈pro≈10k / score informational / snippet `-429` binds / business ≫137k") was **wrong** — the old
  "dev" was a mislabeled pro key, and the `-429` is the ARL rule's custom response, not snippet code. Full
  data + fix options: `~/near/fn/dashboard/md-CLAUDE-chapters/arl-tier-enforcement-findings.md`.

## Secret hygiene

The three tier API keys and the Cloudflare API token are **never** written to files or memory — supplied
in-session only. The CF runbook sources `$CF_API_TOKEN` from `dashboard/.env.local`.
