---
title: Transactions API
description: Indexed transaction, receipt, account-history, and block-history queries for FastNear builders.
sidebar_position: 1
displayed_sidebar: transactionsApiSidebar
slug: /tx
page_actions:
  - markdown
---

# Transactions API

Transactions API is the history surface. Use it when you want indexed transaction or receipt
views without repeatedly polling raw RPC methods and joining the results yourself.

## Base URLs

```bash title="Transactions API Mainnet"
https://tx.main.fastnear.com
```

```bash title="Transactions API Testnet"
https://tx.test.fastnear.com
```

## Best fit

- Account activity feeds.
- Debugging and support tooling.
- Transaction and receipt lookups by hash.
- Block and block-range history queries.

## When not to use it

- Use [FastNear API](/api) when you need balances, NFTs, staking, or public-key lookups.
- Use [RPC Reference](/rpc) when you need canonical node behavior or transaction submission.

## Auth and availability

- These pages do not currently use API keys or bearer tokens.
- The service is built for indexed history access rather than transaction submission.

## Common starting points

- [Transactions by hash](/tx/transactions) when you already know the transaction ID.
- [Account history](/tx/account) for activity feeds and account debugging.
- [Receipt lookup](/tx/receipt) for execution-flow investigation.
- [Block range](/tx/blocks) when you want a bounded history scan.

## Troubleshooting

### I expected to submit a transaction here

This family is for indexed history queries, not for sending signed transactions. Use raw RPC for submission.

### I need pagination guidance

`/v0/account` uses an opaque `resume_token`, while `/v0/blocks` is range and limit based. Reuse opaque tokens exactly as returned.

### Need one canonical transaction status result?

Use raw RPC instead of the indexed history family.
