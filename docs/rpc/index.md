---
sidebar_label: RPC
slug: /rpc
title: RPC Reference
description: Direct JSON-RPC access to FastNear NEAR nodes for state queries, blocks, contract calls, and transaction submission.
displayed_sidebar: rpcSidebar
page_actions:
  - markdown
---

# RPC Reference

FastNear RPC gives you direct JSON-RPC access to NEAR nodes for state queries,
block and chunk inspection, transaction submission, validator data, and protocol introspection.

## Base URLs

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

## Common starting points

- [`view_account`](/rpc/account/view-account), [`view_access_key`](/rpc/account/view-access-key), [`view_access_key_list`](/rpc/account/view-access-key-list) for account and key-list queries.
- [`block`](/rpc/block/block-by-id) for height or hash lookup; [`block_effects`](/rpc/block/block-effects) for changes within a block.
- [`call_function`](/rpc/contract/call-function), [`view_code`](/rpc/contract/view-code), [`view_state`](/rpc/contract/view-state) for contract introspection.
- [`status`](/rpc/protocol/status), [`health`](/rpc/protocol/health), [`gas_price`](/rpc/protocol/gas-price) for node and protocol diagnostics.
- [`send_tx`](/rpc/transaction/send-tx) for transaction submission; [`tx`](/rpc/transaction/tx-status) for execution status.
- [`validators`](/rpc/validators/validators-current) for the current epoch's validator set.

## Use RPC when

- You want protocol-native request and response shapes.
- You need canonical node-backed behavior for state queries or block lookups.
- You are submitting transactions or inspecting execution outcomes.
- You want the lowest-level surface before adding indexed or product-specific views.

## Skip RPC when

- You want wallet-style balances, NFTs, staking positions, or public-key lookups in one call.
- You need indexed transaction history by account instead of polling and stitching together node responses.
- You are optimizing for product simplicity over raw protocol control.

In those cases, move to the indexed REST families such as [FastNear API](/api), [Transactions API](/tx), or [NEAR Data API](/neardata).

## Auth and limits

- FastNear API keys are optional; the public endpoints work without one.
- Higher-limit or paid access goes through [Auth & Access](/auth), where the same key works as either an `Authorization: Bearer` header or an `?apiKey=` URL parameter.

## Shareable live examples

- Use `Copy example URL` on any interactive RPC page to share the selected network, example tab, finality, and filled inputs.
- Use `Copy auto-run URL` when you want the page to execute immediately after it opens.
- Saved API keys and tokens are never included in those shared docs URLs.

## Troubleshooting

### My request worked locally but fails in production

Check whether you relied on the docs UI to append an API key for you. Production backends should inject credentials explicitly and never depend on browser storage.

### I need older state than the default RPC returns

Switch from the regular RPC endpoint to the archival RPC endpoint.

### I need a simpler response than JSON-RPC gives me

That usually means you want an indexed REST family instead of raw RPC. Use the chooser page to pick the higher-level surface.
