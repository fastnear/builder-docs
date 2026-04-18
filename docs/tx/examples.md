---
sidebar_label: Examples
slug: /tx/examples
title: Transactions API Examples
description: Plain-language workflows for using Transactions API docs for transaction lookups, receipt investigation, account history, and block windows.
displayed_sidebar: transactionsApiSidebar
page_actions:
  - markdown
---

# Transactions API Examples

Use this page when the question is "what happened?" and you want indexed history before dropping to canonical RPC confirmation. Start with the identifier you already have, explain the execution story in readable order, and widen only if exact RPC semantics become necessary.

## When to start here

- You already have a transaction hash, receipt ID, account ID, or bounded block range.
- The user wants execution history, support/debug context, or a readable timeline.
- You need indexed history without rebuilding it from raw RPC calls.
- The first answer should explain what happened before it dives into protocol detail.

## Minimum inputs

- network: mainnet or testnet
- primary identifier: transaction hash, receipt ID, `account_id`, or block/range
- whether you are investigating one item or a history window
- whether canonical RPC confirmation is required before you stop

## Common jobs

### Look up one transaction

**Start here**

- [Transactions by Hash](/tx/transactions) when you already know the transaction ID.

**Next page if needed**

- [Receipt Lookup](/tx/receipt) if the interesting part is now a downstream receipt.
- [Block](/tx/block) if the block context matters.
- [Transaction Status](/rpc/transaction/tx-status) if you need canonical RPC confirmation.

**Stop when**

- You can explain the outcome, affected accounts, and the main execution takeaway.

**Widen when**

- The user asks for exact RPC-level status semantics or submission behavior.
- The transaction lookup alone is not enough to explain downstream execution.

### Investigate a receipt

**Start here**

- [Receipt Lookup](/tx/receipt) when the receipt ID is your best anchor.

**Next page if needed**

- [Transactions by Hash](/tx/transactions) to reconnect the receipt to the originating transaction story.
- [Account History](/tx/account) if you need to see the surrounding activity for one of the touched accounts.

**Stop when**

- You can say where the receipt fits in the execution flow and why it matters.

**Widen when**

- The user needs exact canonical confirmation beyond the indexed receipt view. Move to [RPC Reference](/rpc).
- The question shifts from one receipt to a broader history investigation.

### Review recent account activity

**Start here**

- [Account History](/tx/account) for an account-centric activity feed.

**Next page if needed**

- [Transactions by Hash](/tx/transactions) for a specific transaction from the feed.
- [Receipt Lookup](/tx/receipt) if one receipt becomes the real focus.

**Stop when**

- The account history already answers what the account has been doing.

**Widen when**

- The user actually wants transfer-only movement instead of broader execution context. Move to [Transfers API](/transfers).
- The user actually wants exact current state or holdings, not history. Move to [RPC Reference](/rpc) or [FastNear API](/api).

### Reconstruct a bounded block window

**Start here**

- [Blocks](/tx/blocks) for a bounded block-range scan.
- [Block](/tx/block) when you already know the exact block you want.

**Next page if needed**

- [Transactions by Hash](/tx/transactions) to inspect a specific item from the block window.
- [Receipt Lookup](/tx/receipt) when one receipt becomes the important follow-up.

**Stop when**

- The bounded history window answers the question without dropping into lower-level protocol details.

**Widen when**

- The user needs exact canonical block fields or transaction finality. Move to [RPC Reference](/rpc).
- The user really wants freshest polling-oriented block reads rather than indexed history. Move to [NEAR Data API](/neardata).

## Worked investigations

### Prove callback order in a staged release flow

Use this investigation when you staged async work first, released it later, and need to prove not just that the transactions succeeded, but that the downstream callbacks executed in a particular order.

**Goal**

- Turn two transaction hashes into a durable forensic record that covers receipt DAGs, block anchors, and contract state changes.

In staged-release flows, the stage transaction usually remains the primary forensic anchor because the yielded callback receipts stay on its original transaction tree, not on the release transaction's tree.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Stage and release trace capture | RPC [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status) | Query the stage transaction hash and the release transaction hash with `wait_until: "FINAL"`, usually hot RPC first and archival RPC on `UNKNOWN_TRANSACTION` | The receipt DAG is the primary proof surface for callback order and tells you which receipts belong to which transaction tree |
| Stage materialization check | RPC [`query(call_function)`](/rpc/contract/call-function) | Poll the staging contract's view method, such as `staged_calls_for({ caller_id })`, with `finality: "final"` until the yielded steps appear | Confirms the yielded callbacks are actually live before the release transaction tries to resume them |
| Transaction enrichment | Transactions API [`POST /v0/transactions`](/tx/transactions) | Fetch both transaction hashes to recover `block_height`, `block_hash`, `receiver_id`, and indexed execution status | Gives each transaction a durable block anchor so later archival or human follow-up does not depend on memory |
| Recorder state snapshots | RPC [`query(call_function)`](/rpc/contract/call-function) | Read the downstream recorder state before the release, then poll it after release until the expected entries appear | Proves actual downstream effect order in contract state, not just metadata in the receipt tree |
| Receipt pivot | Transactions API [`POST /v0/receipt`](/tx/receipt) | Use any interesting yielded or downstream receipt ID to reconnect it to the originating transaction | Lets you move quickly from one receipt in the DAG back to the broader transaction story |
| Per-block reconstruction | Transactions API [`POST /v0/block`](/tx/block) | Fetch the included block and the cascade blocks with receipts enabled | Reconstructs the block-by-block execution timeline once you know which blocks matter |
| Account activity context | Transactions API [`POST /v0/account`](/tx/account) | Fetch function-call history for the contracts that participated in the cascade over the same window | Gives humans a simpler account-history view to compare against the trace |
| Block-pinned state replay | RPC [`query(call_function)`](/rpc/contract/call-function) | Re-run the recorder view with `block_id` pinned to the interesting heights | Turns final state into a time series so you can say when state changed, not just what it became |

**What a useful answer should include**

- why the stage transaction, not the release transaction, is usually the primary forensic anchor
- the callback order you observed
- the blocks where the observable state changed
- any receipt or account pivots the next investigator should keep

### Start from a receipt ID and rebuild the execution story

Use this investigation when the only thing you have is a receipt ID from a trace, error report, or callback tree and you need to get back to a readable story of what happened.

**Goal**

- Pivot from one receipt to the originating transaction, then widen just enough to explain the surrounding execution and state effects.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Receipt anchor | Transactions API [`POST /v0/receipt`](/tx/receipt) | Look up the receipt ID first and identify the receipt payload, status, and linked transaction context | Receipt IDs show up in traces and logs before humans know the full transaction story |
| Transaction story | Transactions API [`POST /v0/transactions`](/tx/transactions) | Pull the originating transaction by hash once the receipt lookup gives you the pivot | Turns one receipt into a readable execution story with receiver, block, and status context |
| Canonical confirmation | RPC [`tx`](/rpc/transaction/tx-status) or [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status) | Confirm the protocol-level result when the indexed view is not enough or the user needs canonical semantics | Useful when the investigation must distinguish between indexed interpretation and exact RPC behavior |
| Block context | Transactions API [`POST /v0/block`](/tx/block) | Fetch the containing block, and widen to nearby cascade blocks if the execution spilled over multiple heights | Places the receipt into a block timeline that is easier to explain |
| Account window | Transactions API [`POST /v0/account`](/tx/account) | Pull recent activity for the accounts touched by the receipt | Helps correlate the receipt with the surrounding account-level history |
| State replay | RPC [`query(call_function)`](/rpc/contract/call-function) | Re-run the relevant view method at a pinned `block_id` if the receipt changed contract-visible state | Lets you prove whether a receipt only existed in metadata or also changed durable contract state |

**What a useful answer should include**

- the originating transaction you recovered from the receipt
- whether the receipt was the main event or only one step in a larger cascade
- the minimum block and account context needed to explain it
- whether the state effect was durable and at which block height it became visible

## Common mistakes

- Trying to submit a transaction from the history API instead of raw RPC.
- Using Transactions API when the user only wants current balances or holdings.
- Dropping to raw RPC before indexed history has answered the readable "what happened?" question.
- Reusing opaque pagination tokens in a different endpoint or filter context.

## Related guides

- [Transactions API](/tx)
- [RPC Reference](/rpc)
- [FastNear API](/api)
- [NEAR Data API](/neardata)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
