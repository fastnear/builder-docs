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

## Best fit

- Transfer feeds.
- Wallet history views.
- Compliance or support tooling focused on sends and receives.

## When not to use it

- Use [Transactions API](/tx) when you need broader transaction or receipt history.
- Use [FastNear API](/api) when you need balances or holdings rather than transfer events.

## Base URL

- `https://transfers.main.fastnear.com`

## Auth and availability

- These pages do not use API keys or bearer tokens.
- Responses include an opaque `resume_token` for pagination.

## Troubleshooting

### I need full transaction metadata

Move to [Transactions API](/tx) if transfer history alone is too narrow.

### I expected testnet switching

This surface is currently mainnet-focused, so `?network=` does not change the backend here.
