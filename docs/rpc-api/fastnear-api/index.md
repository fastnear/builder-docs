---
title: FastNear API
description: Indexed account, token, NFT, and public-key views for wallets, explorers, analytics, and agent backends.
sidebar_position: 1
displayed_sidebar: fastnearApiSidebar
slug: /api
page_actions:
  - markdown
---

# FastNear API

FastNear API is the indexed REST family for builder-facing account views. It is the fastest way to answer questions like "what does this account own?" or "which accounts map to this public key?" without stitching together raw RPC calls.

## Best fit

- Wallet balances and asset overviews.
- NFT and fungible-token account views.
- Public-key to account lookups.
- Combined account snapshots for dashboards, explorers, and agents.

## When not to use it

- Use [RPC Reference](/docs/rpc) when you need protocol-native JSON-RPC methods.
- Use [Transactions API](/docs/tx) when the primary job is transaction or receipt history.
- Use [NEAR Data API](/docs/neardata) when the job is block-family polling and freshness checks.

## Base URLs

- `https://api.fastnear.com`
- `https://test.api.fastnear.com`

## Auth and network availability

- FastNear public REST endpoints do not require an API key.
- The docs UI can still forward an optional FastNear key when you want authenticated behavior or higher limits on supported surfaces.
- Add `?network=testnet` to move compatible pages to the testnet backend and seeded testnet defaults.

## Common starting points

- `V1 full account view` for a combined account snapshot.
- `V1 account FT` and `V1 account NFT` for product-facing asset views.
- `V1 public key` when you need account resolution from a key.
- `V1 FT top holders` for token-distribution views.

## Troubleshooting

### I only need one low-level value from chain state

Use raw RPC instead. The indexed surface is optimized for product views, not for mirroring every RPC method.

### My page is still on mainnet data

Check whether the page supports `?network=testnet`. Some flows are mainnet-only; the docs call that out when it applies.

### I need transactions, not balances

Move to [Transactions API](/docs/tx) so you do not overload the account-view surface with history queries.
