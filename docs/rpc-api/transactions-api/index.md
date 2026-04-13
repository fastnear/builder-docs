---
title: Transactions API
description: Indexed transaction, receipt, block, and account-history queries.
sidebar_position: 1
displayed_sidebar: transactionsApiSidebar
---

# Transactions API

Base URL: `https://tx.main.fastnear.com`

Authentication: these pages do not use API keys or bearer tokens.

Pagination:
- `/v0/account` uses an opaque `resume_token`.
- `/v0/blocks` is range and limit based.

Interaction notes:
- account and block pages open with seeded example request bodies
- because this service is currently mainnet-only, `?network=` does not change the backend here

The sidebar for this section is intentionally scoped to Transactions so the operation list stays visible while you move between hash, account, block, range, and receipt queries.

Operations:
- [Transactions by hash](/docs/rpc-api/transactions-api/transactions)
- [Account history](/docs/rpc-api/transactions-api/account)
- [Block lookup](/docs/rpc-api/transactions-api/block)
- [Block range](/docs/rpc-api/transactions-api/blocks)
- [Receipt lookup](/docs/rpc-api/transactions-api/receipt)
