---
title: Pricing & Limits
description: FastNear credits, the 500,000-credit trial, and each plan's monthly credits, request-rate limit, and API key count for the RPC and REST APIs.
slug: /pricing
displayed_sidebar: rpcSidebar
page_actions:
  - markdown
keywords:
  - pricing
  - plans
  - credits
  - free trial
  - trial credits
  - rate limit
  - requests per minute
  - archival rpc
  - reserve credits
---

# Pricing & Limits

FastNear bills in **credits**. Every request to the FastNear RPC and REST APIs costs **one credit**, and archival RPC requests cost the same as regular ones. One API key works across all of them.

Sign in to [FastNear Dashboard](https://dashboard.fastnear.com) to create your API key. Your project gets **500,000 trial credits** on first sign-in.

## Plans

| Plan | Credits | Requests per minute, per key | API keys |
| --- | --- | --- | --- |
| Trial | 500,000, granted once | up to 1,000 | 1 |
| Dev | 10,000,000 per month | up to 10,000 | 1 |
| Pro | 36,000,000 per month | up to 20,000 | 2 |
| Business | 100,000,000 per month | up to 50,000 | 4 |
| Custom | By arrangement | By arrangement | By arrangement |

- Trial credits do not expire.
- Monthly plan credits refresh each billing period and are used before reserve credits.
- Current prices are shown in [FastNear Dashboard](https://dashboard.fastnear.com) after you sign in.
- For higher volumes or custom terms, contact [FastNear](https://fastnear.com).

## Reserve credits

Reserve credits are a one-time purchase that never expires. Use them on their own without a subscription, or as backup when a monthly plan's credits run out. Purchases stack onto your reserve balance.

## When you hit a limit

- **Out of credits:** requests return HTTP `402` with `"error": "quota_exceeded"` until you add credits or upgrade.
- **Over the rate limit:** requests return HTTP `429`. Slow down and retry, or move to a plan with a higher limit.

You can also set a per-key rate cap below your plan's limit, so a leaked key cannot use up your whole quota. See [Browser Keys](/auth/browser-keys).

## Usage alerts

FastNear emails the project owner as credits run low and when they run out.

| Plan | Emails |
| --- | --- |
| Monthly plan | At 80% and 90% of the month's credits, when they run out and requests start using reserve credits, and when all credits are used |
| Reserve credits only | At 80% of your reserve credits, and when they are used up |

- Each email is sent once per billing period. Warnings go out at most once a day unless usage reaches a more serious stage.
- The 80% email is skipped when your recent usage would last until your plan resets.
- Once credits run out, requests return HTTP `402` until you add credits or upgrade.
- [FastNear Dashboard](https://dashboard.fastnear.com) shows your usage and remaining credits at any time.

## Changing plans

- Upgrades take effect immediately, with prorated billing.
- Downgrades take effect on your next billing date.

## Related guides

- [Auth & Access](/auth): send your API key as a Bearer header or `?apiKey=` parameter
- [Browser Keys](/auth/browser-keys): per-key rate caps and website restrictions
- [RPC Reference](/rpc)
