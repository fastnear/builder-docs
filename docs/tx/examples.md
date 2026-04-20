---
sidebar_label: Examples
slug: /tx/examples
title: Transactions Examples
description: Task-first transaction investigations for hashes, receipts, async failures, and callbacks.
displayed_sidebar: transactionsApiSidebar
page_actions:
  - markdown
---

## Start Here

### I have one transaction hash. What happened?

Paste the hash into `POST /v0/transactions` and one response usually holds the whole story.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=AdgNifPYpoDNS5ckfBZm36Ai6LuL5bTstuKsVdGjKwGp

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      hash: .transactions[0].transaction.hash,
      signer_id: .transactions[0].transaction.signer_id,
      receiver_id: .transactions[0].transaction.receiver_id,
      included_block_height: .transactions[0].execution_outcome.block_height,
      actions: (.transactions[0].transaction.actions | map(if type == "string" then . else keys[0] end)),
      first_receipt_id: .transactions[0].execution_outcome.outcome.status.SuccessReceiptId,
      receipt_count: (.transactions[0].receipts | length)
    }'
```

For the pinned hash, `mike.near` sent a single `Transfer` to `global-counter.mike.near` in block `194263342`, handing off into receipt `5GhZcpfKWhrpaZo5Am74QfEUFQnZBz48G7hfoLPVDXcq`. When `receipt_count > 1` or the next question is about receipt-level behavior, jump to [Which receipt emitted this log or event?](#which-receipt-emitted-this-log-or-event) or [`POST /v0/receipt`](/tx/receipt).

### Which receipt emitted this log or event?

List every logged receipt in the transaction with a flag for whether its logs contain your fragment. The match is provable rather than guessed: this pinned tx logs a `Transfer` on one receipt and a `Refund` on another, and only the `Refund` side flips to `true`.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=2KhhB1uDScGCFQfVchep7DiZTGTxMcgfUYHNzwf5e6uL
LOG_FRAGMENT=Refund

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq --arg fragment "$LOG_FRAGMENT" '
      [
        .transactions[0].receipts[]
        | select((.execution_outcome.outcome.logs | length) > 0)
        | {
            receipt_id: .receipt.receipt_id,
            receiver_id: .receipt.receiver_id,
            method_name: (.receipt.receipt.Action.actions[0]
              | if type == "string" then . else (.FunctionCall.method_name // keys[0]) end),
            matches_fragment: any(.execution_outcome.outcome.logs[]?; contains($fragment)),
            logs: .execution_outcome.outcome.logs
          }
      ]'
```

The `Refund` fragment attributes to receipt `9sLHQpaGz3NnMNMn8zGrDUSyktR1q6ts2otr9mHkfD1w` on `wrap.near`, method `ft_resolve_transfer`. Receipt logs live on receipts, not on the transaction, so this single pass is enough — no deeper async trace needed.

### Turn one ugly receipt ID from logs into a human story

`POST /v0/receipt` returns the receipt record **and** its full parent transaction in one response, so a single call covers the whole story — no follow-up `/v0/transactions` fetch needed.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
RECEIPT_ID=5GhZcpfKWhrpaZo5Am74QfEUFQnZBz48G7hfoLPVDXcq

curl -s "$TX_BASE_URL/v0/receipt" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '{
      receipt: {
        receipt_id: .receipt.receipt_id,
        type: .receipt.receipt_type,
        is_success: .receipt.is_success,
        receipt_block: .receipt.block_height,
        tx_block: .receipt.tx_block_height,
        predecessor_id: .receipt.predecessor_id,
        receiver_id: .receipt.receiver_id,
        transaction_hash: .receipt.transaction_hash
      },
      parent_transaction: {
        signer_id: .transaction.transaction.signer_id,
        receiver_id: .transaction.transaction.receiver_id,
        action_types: (.transaction.transaction.actions | map(if type == "string" then . else keys[0] end))
      }
    }'
```

For the pinned receipt, this returns an `Action` receipt from `mike.near` to `global-counter.mike.near` that executed successfully in block `194263343`, one block after its parent tx `AdgNifPY…` landed — a single `Transfer` (5 NEAR, visible as `5000000000000000000000000` yocto in the raw `.transaction.transaction.actions`). If the parent tx becomes the interesting anchor, you already have the hash — reuse it with [I have one transaction hash. What happened?](#i-have-one-transaction-hash-what-happened).

## Failure and Async

### Prove that one failed action reverted the whole batch

One batch submitted `CreateAccount → Transfer → AddKey → FunctionCall` and the final call hit a missing method. The indexed tx record already carries the ordered batch *and* the exact receipt-level failure, so one call answers "what was tried and what broke"; a `view_account` check then proves the earlier actions rolled back.

```bash
TX_BASE_URL=https://tx.test.fastnear.com
RPC_URL=https://rpc.testnet.fastnear.com
TX_HASH=CrhH3xLzbNwNMGgZkgptXorwh8YmqxRGuA6Mc11MkU6M
NEW_ACCOUNT_ID=rollback-mo4vmkig.temp.mike.testnet

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      action_types: (.transactions[0].transaction.actions | map(if type == "string" then . else keys[0] end)),
      final_method: .transactions[0].transaction.actions[3].FunctionCall.method_name,
      tx_handoff: .transactions[0].execution_outcome.outcome.status,
      receipt_failure: (
        first(
          .transactions[0].receipts[]
          | select(.execution_outcome.outcome.status.Failure != null)
          | .execution_outcome.outcome.status.Failure.ActionError
        )
      )
    }'
```

The tx-level status is `SuccessReceiptId` — the transaction successfully handed its batched actions off to a receipt. The failure lives one layer down on that receipt: `index: 3` (the `FunctionCall`), kind `CodeDoesNotExist` on `rollback-mo4vmkig.temp.mike.testnet`. `SuccessReceiptId` on the tx outcome means "handoff worked," not "everything finished" — a real trap if you only look at the tx-level status.

Now prove the earlier actions rolled back by asking for the account the batch *tried* to create:

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$NEW_ACCOUNT_ID" '{
    jsonrpc: "2.0", id: "fastnear", method: "query",
    params: {request_type: "view_account", account_id: $account_id, finality: "final"}
  }')" \
  | jq '{error: .error.cause.name, requested_account_id: .error.cause.info.requested_account_id}'
```

`UNKNOWN_ACCOUNT` is the proof. If `CreateAccount` had stuck, `view_account` would resolve; because it does not, the earlier `Transfer` and `AddKey` from the same batched receipt did not stick either.

### Why did this contract call look successful, but a later receipt failed?

A single tx can end with the outer handoff reporting `SuccessReceiptId` while a descendant receipt quietly fails — that's NEAR's async model, and `/v0/transactions` surfaces the whole timeline in one call.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=2KhhB1uDScGCFQfVchep7DiZTGTxMcgfUYHNzwf5e6uL

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      tx_handoff: .transactions[0].execution_outcome.outcome.status,
      outer_method: .transactions[0].transaction.actions[0].FunctionCall.method_name,
      descendant_failures: [
        .transactions[0].receipts[]
        | select(.execution_outcome.outcome.status.Failure != null)
        | {
            receiver_id: .receipt.receiver_id,
            method_name: (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "system"),
            block_height: .execution_outcome.block_height,
            failure: .execution_outcome.outcome.status.Failure
          }
      ],
      receipt_timeline: [
        .transactions[0].receipts[]
        | {
            receiver_id: .receipt.receiver_id,
            method_name: (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "system"),
            status_class: (.execution_outcome.outcome.status | keys[0])
          }
      ]
    }'
```

For the pinned mainnet tx, `tx_handoff` is `SuccessReceiptId` — the tx kicked off its first receipt cleanly. Read that alone and you'd call it a win. `descendant_failures` tells a second story: `ft_on_transfer` on `v2.ref-finance.near` panicked with `E51: contract paused` — the DEX had been paused when this swap ran, so it couldn't accept the wrapped NEAR. The `receipt_timeline` then shows how the story resolved: wrap.near's callback `ft_resolve_transfer` ran anyway and emitted a `Refund` log returning the wrapped NEAR to the sender.

Receipt success is not transitive. A protocol can hand off cleanly and still see the detached work fail later. If your app "looked successful" but money came back anyway, walk this same timeline — the split is visible on the indexed response without a separate RPC status call. To check specifically that your callback ran, see [Did my callback run at all?](#did-my-callback-run-at-all).

### Did my callback run at all?

NEAR cross-contract calls return through a callback receipt on the origin contract. Whether that callback actually ran is a one-line `any(...)` check against the indexed receipt list — and the full refund story falls out of the same response.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=2KhhB1uDScGCFQfVchep7DiZTGTxMcgfUYHNzwf5e6uL
ORIGIN_CONTRACT_ID=wrap.near
CALLBACK_METHOD=ft_resolve_transfer

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq --arg origin "$ORIGIN_CONTRACT_ID" --arg callback "$CALLBACK_METHOD" '{
      top_method: .transactions[0].transaction.actions[0].FunctionCall.method_name,
      callback_ran: any(
        .transactions[0].receipts[];
        .receipt.receiver_id == $origin
        and (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "") == $callback
      ),
      receipt_chain: [
        .transactions[0].receipts[]
        | {
            receiver_id: .receipt.receiver_id,
            method: (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "system"),
            block: .execution_outcome.block_height,
            status: (.execution_outcome.outcome.status | keys[0]),
            logs: .execution_outcome.outcome.logs
          }
      ]
    }'
```

For the pinned tx, `ft_transfer_call` on `wrap.near` hands off to `v2.ref-finance.near`'s `ft_on_transfer`, which **fails**. The callback `ft_resolve_transfer` still runs on `wrap.near` and logs `Refund 7278020378457059679767103 from v2.ref-finance.near to …` back to the sender — so `callback_ran: true` even though the downstream receipt failed. A downstream failure never prevents the origin contract from seeing its callback; that's how NEAR async error handling stays recoverable. The `method: "system"` rows are runtime gas refunds, not contract logic. To attribute one of the logs above to its emitting receipt, see [Which receipt emitted this log or event?](#which-receipt-emitted-this-log-or-event).

## Common mistakes

- Trying to submit a transaction from the history API instead of raw RPC.
- Using Transactions API when the user only wants current balances or holdings.
- Dropping to raw RPC before indexed history has answered the readable "what happened?" question.

## Related guides

- [Transactions API](/tx)
- [RPC Reference](/rpc)
- [FastNear API](/api)
- [NEAR Data API](/neardata)
- [Berry Club: live board and one historical reconstruction path](/tx/examples/berry-club)
- [Advanced SocialDB write lookup](/tx/socialdb-proofs)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
