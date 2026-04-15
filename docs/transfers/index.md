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

Transfers API focuses on account-centric transfer history. It is the simplest starting point when the question is specifically about movement of NEAR or fungible tokens.

## Base URL

- `https://transfers.main.fastnear.com`

This surface is mainnet-only today; `?network=testnet` does not switch the backend.

## Best fit

- Transfer feeds.
- Wallet history views.
- Compliance or support tooling focused on sends and receives.

## When not to use it

- Use [Transactions API](/tx) when you need broader transaction or receipt history.
- Use [FastNear API](/api) when you need balances or holdings rather than transfer events.

## Auth and availability

- These pages do not use API keys or bearer tokens.
- Responses include an opaque `resume_token` for pagination.

## Common starting points

- [Query Transfers](/transfers/query) when you want the account-centric feed with direction, asset, amount, and time filters.
- Reuse the opaque `resume_token` exactly as returned when paging further into history.

## Troubleshooting

### I need full transaction metadata

Move to [Transactions API](/tx) if transfer history alone is too narrow.

### My `resume_token` stopped working

Treat the token as opaque and reuse it only with the same endpoint and filters that produced it.
