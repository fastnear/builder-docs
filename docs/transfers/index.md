---
title: Transfers API
description: Account-centric NEAR and fungible-token transfer history for product feeds and investigative tooling.
sidebar_position: 1
displayed_sidebar: transfersApiSidebar
slug: /transfers
page_actions:
  - markdown
---

# Transfers API

Transfers API is the narrowest FastNear history surface. Start here when the question is specifically about asset movement and not about the broader execution story behind that movement.

## Base URL

```bash title="Transfers API Mainnet"
https://transfers.main.fastnear.com
```

This surface is mainnet-only today. `?network=testnet` does not switch the backend.

## Use this API when

- you want account-centric NEAR or FT transfer history
- you are building wallet feeds or transfer-only activity views
- you are answering support or compliance questions about sends and receives

## Do not start here when

- you need broader transaction or receipt history
- you need balances, holdings, NFTs, or staking views
- you need testnet traffic

Use [Transactions API](/tx) for broader execution history and [FastNear API](/api) for account-state style answers.

## Minimum useful inputs

- `account_id`
- optional asset, direction, amount, or time filters
- whether the user wants just a few events or a longer history scan

## Default workflow

1. Start with [Query Transfers](/transfers/query) using the narrowest filter set that still answers the question.
2. Read the returned events as transfer history only. Do not reconstruct a full receipt timeline unless the user asks for it.
3. Reuse the opaque `resume_token` exactly as returned when paging further.
4. Stop once you can answer who sent what, when, and in what asset.

## Auth and availability

- Public transfer-history reads often work without a key.
- If you standardize on one FastNear API key across FastNear surfaces, reuse the same header or query-param shape here too.
- Responses include an opaque `resume_token` for pagination.
- The service is mainnet-only today.

## Widen only if

- the user starts asking about receipts or non-transfer actions
- the user wants the broader transaction context behind a transfer
- the user is really asking for balances or current holdings rather than movement

When that happens, widen to [Transactions API](/tx) or [FastNear API](/api) instead of overloading the transfer view.

## Common starting points

- [Query Transfers](/transfers/query) for the account-centric feed with direction, asset, amount, and time filters

## Need a workflow?

Use [Transfers API Examples](/transfers/examples) for plain-language flows like narrow transfer searches, `resume_token` pagination, and escalation into broader transaction investigation.

## Troubleshooting

### I need full transaction metadata

Move to [Transactions API](/tx) if transfer history alone is too narrow.

### My `resume_token` stopped working

Treat the token as opaque and reuse it only with the same endpoint and filters that produced it.
