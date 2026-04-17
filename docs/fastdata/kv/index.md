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

KV FastData API is the indexed key-value family. Use it when you already know the contract, account, predecessor, or key scope you want to inspect and you want indexed rows without building your own storage indexing layer.

## Base URLs

```bash title="KV FastData API Mainnet"
https://kv.main.fastnear.com
```

```bash title="KV FastData API Testnet"
https://kv.test.fastnear.com
```

## Use this API when

- you want latest indexed state for one key or a known key family
- you want historical key changes by account, key, or predecessor
- you want batch lookups for known exact keys
- you are debugging contract storage in indexed form

## Do not start here when

- you need balances, token holdings, NFTs, or account summaries
- you need recent block-family data
- you need exact current on-chain state with canonical RPC semantics

Use [FastNear API](/api) for higher-level account views, [NEAR Data API](/neardata) for block-family reads, and [RPC Reference](/rpc) for canonical contract-state inspection.

## Minimum useful inputs

- network
- contract ID or another precise scope such as account, predecessor, or exact key
- whether the user needs the latest indexed value or historical changes

## Choose a query shape

- [GET Latest by Exact Key](/fastdata/kv/get-latest-key) when you already know one exact key
- [GET History by Exact Key](/fastdata/kv/get-history-key) when you need the change history for one exact key
- [Latest by Account](/fastdata/kv/latest-by-account) or [History by Account](/fastdata/kv/history-by-account) when the scope is account-centric
- [All by Predecessor](/fastdata/kv/all-by-predecessor) or [History by Predecessor](/fastdata/kv/history-by-predecessor) when the predecessor is the right scope
- [Multi Lookup](/fastdata/kv/multi) when you already know several exact keys

## Default workflow

1. Pick the narrowest scope that matches the user's question.
2. Stay within KV FastData first when the question is still about indexed key-value data.
3. Use the latest endpoints for current indexed views and the history endpoints only when the user needs change-over-time answers.
4. Stop once the indexed rows already answer the storage question.

## Auth and availability

- These embeds do not forward API keys or bearer tokens.
- Add `?network=testnet` to switch the page to the testnet backend where supported.
- List responses omit `page_token` when there are no more results.

## Widen only if

- the user needs exact current on-chain state rather than indexed storage data
- the user needs canonical contract-state semantics
- the indexed storage view is the wrong abstraction for the question

When that happens, widen to [View State](/rpc/contract/view-state) in [RPC Reference](/rpc).

## Troubleshooting

### My pagination token stopped working

Treat `page_token` values as opaque and reuse them only with the same endpoint and filters.

### I need product-facing account balances instead of raw key-value rows

Move up to [FastNear API](/api).
