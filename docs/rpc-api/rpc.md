---
sidebar_label: RPC
id: rpc
slug: rpc
title: RPC Reference
displayed_sidebar: rpcSidebar
---

# RPC Reference

FastNear RPC gives you direct JSON-RPC access to NEAR nodes for state queries, block and chunk inspection, transaction submission, validator data, and protocol introspection.

## Endpoints

Regular RPCs keep the most recent epochs of state and are the default choice for most application traffic:

```bash title="Mainnet Regular RPC"
https://rpc.mainnet.fastnear.com
```

```bash title="Testnet Regular RPC"
https://rpc.testnet.fastnear.com
```

Archival RPCs expose the full chain history when you need older blocks, receipts, or historical contract state:

```bash title="Mainnet Archival RPC"
https://archival-rpc.mainnet.fastnear.com
```

```bash title="Testnet Archival RPC"
https://archival-rpc.testnet.fastnear.com
```

## What You’ll Find Here

- `Account` covers account, access key, and key-list queries.
- `Block` covers block lookup and block effects.
- `Contract` covers view calls, code lookup, and state inspection.
- `Protocol` covers status, health, gas price, config, network, and experimental protocol methods.
- `Transaction` covers submission and execution-status methods.
- `Validators` covers current and epoch-scoped validator views.

## When To Use RPC vs API

Use RPC when you want canonical node-backed behavior and low-level control over the NEAR protocol surface.

Use the separate API docs when you want indexed, higher-level, and often easier-to-query REST services such as FastNear account views, transactions history, transfers, or NEAR Data.
