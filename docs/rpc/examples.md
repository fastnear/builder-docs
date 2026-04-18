---
sidebar_label: Examples
slug: /rpc/examples
title: RPC Examples
description: Plain-language workflows for using FastNear RPC docs for exact state checks, block inspection, contract views, and transaction submission.
displayed_sidebar: rpcSidebar
page_actions:
  - markdown
---

# RPC Examples

Use this page when you already know the answer needs canonical RPC behavior and you want the shortest doc path to get there. The goal is not to memorize every method. It is to pick the right starting page, stop as soon as the RPC result answers the question, and widen only when a higher-level surface would help.

## When to start here

- The user asked for exact on-chain state or protocol-native fields.
- You need a direct contract view call or transaction submission flow.
- You are inspecting blocks, chunks, validators, or protocol metadata.
- Correctness depends on node semantics rather than indexed summary data.

## Minimum inputs

- network: mainnet or testnet
- primary identifier: `account_id`, public key, contract ID plus method, transaction hash, or block height/hash
- whether you need current state, historical state, or submission/finality behavior
- whether the result should stay canonical or become a human-friendly summary afterward

## Common jobs

### Check exact account or access-key state

**Start here**

- [View Account](/rpc/account/view-account) for canonical account fields.
- [View Access Key](/rpc/account/view-access-key) or [View Access Key List](/rpc/account/view-access-key-list) for key inspection.

**Next page if needed**

- [FastNear API full account view](/api/v1/account-full) if you need a wallet-style summary after confirming the canonical state.
- [Transactions API account history](/tx/account) if the next question is "what has this account been doing?"

**Stop when**

- The RPC fields already answer the state or permission question.

**Widen when**

- The user wants balances, NFTs, staking, or other product-shaped output.
- The user really wants recent activity history rather than current canonical state.

### Inspect a block or protocol snapshot

**Start here**

- [Block by ID](/rpc/block/block-by-id) or [Block by Height](/rpc/block/block-by-height) for a specific block.
- [Latest Block](/rpc/protocol/latest-block) for the current canonical head.
- [Status](/rpc/protocol/status), [Health](/rpc/protocol/health), or [Network Info](/rpc/protocol/network-info) for node and network diagnostics.

**Next page if needed**

- [Block Effects](/rpc/block/block-effects) if the block lookup needs state-change context.
- [Transactions API block history](/tx/block) or [Transactions API block range](/tx/blocks) if you need a more readable execution window.

**Stop when**

- The canonical block or protocol payload answers the question directly.

**Widen when**

- The user wants recent polling-oriented block data instead of one canonical snapshot. Move to [NEAR Data API](/neardata).
- The user needs a history story across many transactions, not just one block payload. Move to [Transactions API](/tx).

### Run a contract view call

**Start here**

- [Call Function](/rpc/contract/call-function) for a contract view method.
- [View State](/rpc/contract/view-state) when the question is about raw contract storage.
- [View Code](/rpc/contract/view-code) if code presence or hash is the real question.

**Next page if needed**

- [FastNear API](/api) if the user actually wants a product-shaped answer such as holdings or account summary after the raw call.
- [KV FastData API](/fastdata/kv) if the next task is indexed key-value history rather than an exact RPC state read.

**Stop when**

- The contract view result already answers the question in canonical form.

**Widen when**

- The user wants indexed history or a simpler summary instead of raw contract output.
- The user starts asking "what changed over time?" rather than "what does it return right now?"

### Send and confirm a transaction

**Start here**

- [Send Transaction](/rpc/transaction/send-tx) when you want canonical submission behavior with explicit waiting semantics.
- [Broadcast Transaction Async](/rpc/transaction/broadcast-tx-async) or [Broadcast Transaction Commit](/rpc/transaction/broadcast-tx-commit) when those exact submission modes are the point.
- [Transaction Status](/rpc/transaction/tx-status) to confirm the canonical result.

**Next page if needed**

- [Transactions by Hash](/tx/transactions) for a readable history record after submission.
- [Receipt Lookup](/tx/receipt) when you need to investigate downstream execution or callback flow.

**Stop when**

- You have the submission result and final canonical status you needed.

**Widen when**

- The next question is about receipts, affected accounts, or execution history in a human-friendly order.
- You need a broader investigation workflow instead of one canonical status check.

## Common mistakes

- Starting in RPC when the user really wants a holdings summary or indexed history.
- Forgetting to switch from regular RPC to archival RPC for older state.
- Treating docs UI browser auth as a production backend pattern.
- Staying in low-level transaction status calls after the question becomes forensic or history-oriented.

## Related guides

- [RPC Reference](/rpc)
- [Auth & Access](/auth)
- [FastNear API](/api)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
