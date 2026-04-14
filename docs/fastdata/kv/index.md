---
title: KV FastData API
description: Read-only key-value lookups over FastData for predecessor, account, key, and batch retrieval flows.
sidebar_position: 1
displayed_sidebar: kvFastDataSidebar
slug: /fastdata/kv
page_actions:
  - markdown
---

# KV FastData API

KV FastData API is the read-only key-value family. It works best when you already know the account, predecessor, or key patterns you want to inspect and you want those rows without building your own storage indexing layer.

## Best fit

- Predecessor-centric key-value history.
- Account-centric key-value lookups.
- Exact-key or prefix-style retrieval.
- Batch lookup flows for debugging and agent backends.

## When not to use it

- Use [FastNear API](/api) for higher-level account, token, and NFT views.
- Use [NEAR Data API](/neardata) for block-family reads instead of key-value history.

## Base URLs

- `https://kv.main.fastnear.com`
- `https://kv.test.fastnear.com`

## Auth and availability

- These embeds do not forward API keys or bearer tokens.
- Add `?network=testnet` to switch the page to the testnet backend where supported.
- List responses omit `page_token` when there are no more results.

## Common starting points

- `All by predecessor` for a broad predecessor scan.
- `History by predecessor` when you need a filtered history stream.
- `History by account` or `History by key` for narrower retrieval.
- `Multi lookup` when you already know the exact keys.

## Troubleshooting

### My pagination token stopped working

Treat `page_token` values as opaque and reuse them only with the same endpoint and filters.

### I need product-facing account balances instead of raw key-value rows

Move up to [FastNear API](/api).
