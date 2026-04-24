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

All shell examples below work on the public Transactions API hosts as-is. If `FASTNEAR_API_KEY` is set in your shell, they add it as a bearer header automatically; if it is unset, they fall back to the public unauthenticated path.

### I have one transaction hash. What happened?

Paste the hash into `POST /v0/transactions` and one response usually holds the whole story.

```bash
TX_HASH=7ZKnhzt2MqMNmsk13dV8GAjGu3Db8aHzSBHeNeu9MJCq
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -s "https://tx.main.fastnear.com/v0/transactions" \
  "${AUTH_HEADER[@]}" \
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

For the pinned hash, `root.near` sent a single `Transfer` to `escrow.ai.near` in block `188976785`, handing off into receipt `B8QzHQZ6VnUVy8zaVXCEkWuSs7MPb34yoHYixZV3Zdj1`. When `receipt_count > 1` or the next question is about receipt-level behavior, jump to [Which receipt emitted this log or event?](#which-receipt-emitted-this-log-or-event) or [`POST /v0/receipt`](/tx/receipt).

### Which receipt emitted this log or event?

List every logged receipt in the transaction with a flag for whether its logs contain your fragment. The match is provable rather than guessed: this pinned tx logs a `Transfer` on one receipt and a `Refund` on another, and only the `Refund` side flips to `true`.

```bash
TX_HASH=2KhhB1uDScGCFQfVchep7DiZTGTxMcgfUYHNzwf5e6uL
LOG_FRAGMENT=Refund
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -s "https://tx.main.fastnear.com/v0/transactions" \
  "${AUTH_HEADER[@]}" \
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

### Turn one receipt ID into a readable transaction story {#receipt-id-to-readable-story}

`POST /v0/receipt` returns the receipt record **and** its full parent transaction in one response, so a single call covers the whole story — no follow-up `/v0/transactions` fetch needed.

```bash
RECEIPT_ID=B8QzHQZ6VnUVy8zaVXCEkWuSs7MPb34yoHYixZV3Zdj1
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -s "https://tx.main.fastnear.com/v0/receipt" \
  "${AUTH_HEADER[@]}" \
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

For the pinned receipt, this returns an `Action` receipt from `root.near` to `escrow.ai.near` that executed successfully in block `188976786`, one block after its parent tx `7ZKnhzt2…` landed — a single `Transfer` (3.5 NEAR, visible as `3500000000000000000000000` yocto in the raw `.transaction.transaction.actions`). If the parent tx becomes the interesting anchor, you already have the hash — reuse it with [I have one transaction hash. What happened?](#i-have-one-transaction-hash-what-happened).

## Failure and Async

### Prove that one failed action reverted the whole batch

One batch submitted `CreateAccount → Transfer → AddKey → FunctionCall` and the final call hit a missing method. The indexed tx record already carries the ordered batch *and* the exact receipt-level failure, so one call answers "what was tried and what broke"; a `view_account` check then proves the earlier actions rolled back.

```bash
TX_HASH=CrhH3xLzbNwNMGgZkgptXorwh8YmqxRGuA6Mc11MkU6M
NEW_ACCOUNT_ID=rollback-mo4vmkig.temp.mike.testnet
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -s "https://tx.test.fastnear.com/v0/transactions" \
  "${AUTH_HEADER[@]}" \
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
NEW_ACCOUNT_ID=rollback-mo4vmkig.temp.mike.testnet
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -s "https://rpc.testnet.fastnear.com" \
  "${AUTH_HEADER[@]}" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$NEW_ACCOUNT_ID" '{
    jsonrpc: "2.0", id: "fastnear", method: "query",
    params: {request_type: "view_account", account_id: $account_id, finality: "final"}
  }')" \
  | jq '{error: .error.cause.name, requested_account_id: .error.cause.info.requested_account_id}'
```

`UNKNOWN_ACCOUNT` is the proof. If `CreateAccount` had stuck, `view_account` would resolve; because it does not, the earlier `Transfer` and `AddKey` from the same batched receipt did not stick either.

### When a tx looks successful, what actually happened?

A tx's outer `execution_outcome.outcome.status` reports `SuccessReceiptId` whenever the first receipt handoff worked — it says nothing about whether downstream receipts succeeded or whether the origin callback ran. One pipeline over `/v0/transactions` answers all three questions at once.

```bash
TX_HASH=2KhhB1uDScGCFQfVchep7DiZTGTxMcgfUYHNzwf5e6uL
ORIGIN_CONTRACT_ID=wrap.near
CALLBACK_METHOD=ft_resolve_transfer
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -s "https://tx.main.fastnear.com/v0/transactions" \
  "${AUTH_HEADER[@]}" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq --arg origin "$ORIGIN_CONTRACT_ID" --arg callback "$CALLBACK_METHOD" '{
      outer: {
        method: .transactions[0].transaction.actions[0].FunctionCall.method_name,
        tx_handoff: (.transactions[0].execution_outcome.outcome.status | keys[0])
      },
      callback: {
        expected_on: $origin,
        method: $callback,
        ran: any(
          .transactions[0].receipts[];
          .receipt.receiver_id == $origin
          and (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "") == $callback
        )
      },
      descendant_failures: [
        .transactions[0].receipts[]
        | select(.execution_outcome.outcome.status.Failure != null)
        | {
            receiver_id: .receipt.receiver_id,
            method: (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "system"),
            cause: .execution_outcome.outcome.status.Failure
          }
      ]
    }'
```

For the pinned tx, `outer.method` is `ft_transfer_call` and `outer.tx_handoff` is `SuccessReceiptId` — the tx kicked off its first receipt cleanly, and read alone you'd call it a win. `descendant_failures` tells a second story: `ft_on_transfer` on `v2.ref-finance.near` panicked with `E51: contract paused` — the DEX was paused when this swap ran, so it couldn't accept the wrapped NEAR. `callback.ran: true` tells a third: `wrap.near`'s `ft_resolve_transfer` fired anyway. A downstream failure never prevents the origin contract's callback from running — that's the mechanism by which NEP-141 refunds the sender when the receiver rejects.

Receipt success is not transitive. A protocol can hand off cleanly and still see the detached work fail later; the origin callback runs either way. Read these three fields together and the async story is legible without chasing the receipt chain by hand. To surface the `Refund` log line itself, pivot to [Which receipt emitted this log or event?](#which-receipt-emitted-this-log-or-event).

### Pair one OutLayer request with its TEE worker resolution

[OutLayer](https://outlayer.fastnear.com) splits one logical call across two transactions: a user signs `request_execution` on `outlayer.near`, an Intel TDX worker runs the requested WASM off-chain, then `worker.outlayer.near` submits the result with `submit_execution_output_and_resolve`. Both halves carry the same `request_id` — passing the two tx hashes to `/v0/transactions` in one call and extracting that field from each proves the pair.

```bash
REQUEST_TX=BZDQAxEdpQ9wUGXmXTa2APwFLDTTqTy5ucrBPsfgZeyz
WORKER_TX=3NYD4Mkn5cwkuVkGP9PPoiJ9PB5Vr7v6r8CwSswtHVA3
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -s "https://tx.main.fastnear.com/v0/transactions" \
  "${AUTH_HEADER[@]}" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg a "$REQUEST_TX" --arg b "$WORKER_TX" '{tx_hashes: [$a, $b]}')" \
  | jq '[
      .transactions[]
      | {
          role: (if .transaction.actions[0].FunctionCall.method_name == "request_execution"
                 then "request" else "worker" end),
          hash: .transaction.hash,
          signer: .transaction.signer_id,
          method: .transaction.actions[0].FunctionCall.method_name,
          block: .execution_outcome.block_height,
          request_id: (
            if .transaction.actions[0].FunctionCall.method_name == "request_execution"
            then (.receipts[0].execution_outcome.outcome.logs[] | select(startswith("EVENT_JSON"))
                  | sub("EVENT_JSON:"; "") | fromjson | .data[0].request_data | fromjson | .request_id)
            else (.receipts[0].receipt.receipt.Action.actions[0].FunctionCall.args
                  | @base64d | fromjson | .request_id)
            end
          )
        }
    ]'
```

Both rows carry `request_id: 1868`, confirming the pair. The request half, signed by `retrorn.near` in block `194832281`, lives in an `EVENT_JSON:` log on its receipt (that's NEAR's yield/resume pattern — the on-chain promise pauses while the TDX worker runs). The worker half lands 11 blocks later with `submit_execution_output_and_resolve`, signed by `worker.outlayer.near`, and its `request_id` decodes straight out of the base64 `FunctionCall.args`. The same two payloads also carry the richer fingerprint — `sender_id`, `project_id`, `code_hash`, `resources_used.instructions`, `resources_used.time_ms`, encrypted-result byte count — if you want to audit what actually ran; this minimal pipeline just confirms they belong together. `/v0/transactions` serves historical pairs indefinitely, so you don't need archival RPC weeks later.

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
