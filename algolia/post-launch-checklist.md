# Algolia Search Post-Launch Checklist

Use this file as the first-pass review sheet after the initial Algolia push. The goal is to keep one focused list of improvements instead of collecting screenshots and one-off notes across chat history.

## Relevance

- Re-run [algolia/relevance-cases.json](/Users/mikepurvis/near/fn/builder-docs/algolia/relevance-cases.json) with `yarn audit:algolia-relevance` after each crawler or dashboard change.
- Review the highest-volume no-click and zero-result queries in Algolia analytics every few days after launch.
- Add or tighten Rules when a query clearly names one canonical page.
- Add synonyms when the issue is separator or vocabulary drift, not ranking.
- Watch for odd section labels surfacing from overview pages and either:
  - rename the source heading to user-facing wording, or
  - keep it out of the result card if it is too long or too internal.

## UI polish

- Check vertical alignment of page paths against result titles on desktop.
- Keep related-section chips short and readable; avoid surfacing long internal-sounding headings.
- Decide whether overview pages should show one chip, two chips, or none when there is no snippet text.
- Trim unused vertical space between result groups and the footer if the modal feels airy.
- Keep the `Powered by Algolia` footer unless your Algolia plan or agreement explicitly allows removing it.

## Functional quality

- Confirm the first highlighted result is the one you expect before pressing Enter.
- Check keyboard flow: open, arrow navigation, Enter, Escape, and clear-query interactions.
- Make sure exact route leaves win over overview pages for high-intent queries.
- Confirm the search page (`/search`) is a useful fallback when the modal has many results.
- Verify no hosted `/rpcs/**`, `/apis/**`, Markdown mirrors, or utility assets surface in results.

## Content gaps to assess

- Add a dedicated rate-limits page if `rate limits` is a real user query you expect.
- ~~Decide whether `/auth` or `/auth/backend` should be the canonical destination for `api key` and `bearer token` intent.~~ Resolved: `/auth` is the single canonical page.
- Add explicit playground wording if users are likely to search for `rpc playground`, `try it`, or `interactive`.
- Add stronger auth wording to the auth landing page if `authentication` is common in analytics.

## Metrics to watch

- Top queries
- Zero-result queries
- No-click queries
- Click-through rate
- Average click position
- Most-returned results with poor CTR
