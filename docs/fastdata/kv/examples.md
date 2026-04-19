---
sidebar_label: Examples
slug: /fastdata/kv/examples
title: KV FastData Examples
description: Plain-language workflows for verifying exact FastData keys, following exact-key history, and bridging indexed rows back to the originating transaction.
displayed_sidebar: kvFastDataSidebar
page_actions:
  - markdown
---

## Quick start

If you already know the contract, predecessor, and exact row name, read that exact row first.

```bash
KV_BASE_URL=https://kv.test.fastnear.com
CURRENT_ACCOUNT_ID=kv.gork-agent.testnet
PREDECESSOR_ID=YOUR_TESTNET_ACCOUNT
FASTDATA_ROW=value

curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$FASTDATA_ROW" \
  | jq '{
      latest_row: (
        .entries[0]
        | {
            current_account_id,
            predecessor_id,
            block_height,
            key,
            value
          }
      )
    }'
```

This is the shortest FastData read on the page. The full walkthrough below adds a controlled write, exact-key history, and transaction provenance.

## Worked investigation

### Write one testnet FastData row, then verify the exact indexed keys

Use this investigation when you want to prove exactly which FastData rows one write produced, confirm the exact keyed history for one of those rows, and then bridge the indexed row back to the originating transaction.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Create one controlled FastData write, verify the exact key rows it emitted, then hydrate the transaction that produced them.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">near call __fastdata_kv</span> creates one controlled testnet write from your own predecessor account.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">get-latest-key</span> and <span className="fastnear-example-strategy__code">get-history-key</span> verify the exact FastData rows that call emitted.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">latest-by-predecessor</span> with metadata plus <span className="fastnear-example-strategy__code">POST /v0/transactions</span> bridges those indexed rows back to the originating call.</span></p>
  </div>
</div>

**Goal**

- Prove which exact FastData rows a write produced and show how to trace those rows back to the transaction that created them.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Controlled write | `near` CLI | Submit one testnet `__fastdata_kv` call with a unique value | Gives you a row you can verify immediately instead of relying on someone else's old data |
| Exact indexed row | KV FastData [`get-latest-key`](/fastdata/kv/get-latest-key) | Read the exact `value` row, then the exact `key` row, under one predecessor and contract | Proves the precise FastData rows currently indexed for this write |
| Exact keyed history | KV FastData [`get-history-key`](/fastdata/kv/get-history-key) | Pull the exact-key history for the same `value` row | Shows whether that exact row changed again after the write |
| Broader write pattern + metadata | KV FastData [`latest-by-predecessor`](/fastdata/kv/latest-by-predecessor) | List the latest rows for the same predecessor with `include_metadata: true` | Recovers both emitted rows plus the `tx_hash` and `receipt_id` that produced them |
| Transaction hydration | Transactions API [`POST /v0/transactions`](/tx/transactions) | Hydrate the recovered `tx_hash` and decode the `FunctionCall.args` payload | Proves which method call created the indexed FastData rows |

**What a useful answer should include**

- the exact `current_account_id`, `predecessor_id`, and `key` investigated
- the latest indexed row and the exact-key history for that same row
- the `tx_hash` or `receipt_id` that produced the row, if provenance matters
- whether the question is still about FastData rows or has widened into contract-specific on-chain state

### Verified testnet shell walkthrough

Use this when you have a testnet account configured in `near` CLI and want one reproducible write that you can verify end to end.

**What you're doing**

- Write one fresh FastData entry to `kv.gork-agent.testnet`.
- Wait for KV FastData to index that transaction.
- Read the exact `value` row and the exact `key` row that the contract emitted.
- Pull the exact-key history for the `value` row.
- Widen to predecessor scope with metadata so you recover the indexed `tx_hash`.
- Hydrate that transaction and decode the original `__fastdata_kv` call args.

```bash
KV_BASE_URL=https://kv.test.fastnear.com
TX_BASE_URL=https://tx.test.fastnear.com
CURRENT_ACCOUNT_ID=kv.gork-agent.testnet
SIGNER_ID=YOUR_TESTNET_ACCOUNT
PREDECESSOR_ID="$SIGNER_ID"
FASTDATA_FIELD=verification
FASTDATA_VALUE="verify-$(date -u +%Y%m%dT%H%M%SZ)"

near call "$CURRENT_ACCOUNT_ID" __fastdata_kv \
  "$(jq -nc --arg key "$FASTDATA_FIELD" --arg value "$FASTDATA_VALUE" '{key: $key, value: $value}')" \
  --accountId "$SIGNER_ID" \
  --networkId testnet \
  --gas 30000000000000 \
  | tee /tmp/kv-fastdata-call.txt

CLI_TX_HASH="$(
  awk '/Transaction Id/{print $3}' /tmp/kv-fastdata-call.txt
)"

ATTEMPTS=0
until curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID" \
  -H 'content-type: application/json' \
  --data '{"include_metadata": true, "limit": 20}' \
  | tee /tmp/kv-predecessor-latest.json \
  | jq -e --arg tx_hash "$CLI_TX_HASH" '
      .entries
      | map(select(.tx_hash == $tx_hash))
      | length > 0
    ' >/dev/null
do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 30 ]; then
    echo "Timed out waiting for KV FastData to index $CLI_TX_HASH" >&2
    exit 1
  fi
  sleep 2
done

INDEXED_TX_HASH="$(
  jq -r --arg tx_hash "$CLI_TX_HASH" '
    first(.entries[] | select(.tx_hash == $tx_hash) | .tx_hash)
  ' /tmp/kv-predecessor-latest.json
)"

test "$CLI_TX_HASH" = "$INDEXED_TX_HASH" \
  && echo "CLI tx hash matches indexed metadata"

jq --arg tx_hash "$CLI_TX_HASH" '{
      tx_hashes: ([.entries[] | select(.tx_hash == $tx_hash) | .tx_hash] | unique),
      receipt_ids: ([.entries[] | select(.tx_hash == $tx_hash) | .receipt_id] | unique),
      entries: [
        .entries[]
        | select(.tx_hash == $tx_hash)
        | {
            block_height,
            key,
            value,
            tx_hash,
            receipt_id
          }
      ]
    }' /tmp/kv-predecessor-latest.json

jq '{
  latest_value_row: (
    .entries[0]
    | {
        current_account_id,
        predecessor_id,
        block_height,
        key,
        value
      }
  )
}' <(
  curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/value"
)

curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/key" \
  | jq '{
      latest_key_row: (
        .entries[0]
        | {
            current_account_id,
            predecessor_id,
            block_height,
            key,
            value
          }
      )
    }'

curl -s "$KV_BASE_URL/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/value" \
  | jq '{
      page_token,
      entries: [
        .entries[]
        | {
            block_height,
            key,
            value
          }
      ]
    }'

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$INDEXED_TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      transaction_hash: .transactions[0].transaction.hash,
      signer_id: .transactions[0].transaction.signer_id,
      receiver_id: .transactions[0].transaction.receiver_id,
      method_name: .transactions[0].transaction.actions[0].FunctionCall.method_name,
      args: (
        .transactions[0].transaction.actions[0].FunctionCall.args
        | @base64d
        | fromjson
      ),
      first_receipt_id: .transactions[0].execution_outcome.outcome.receipt_ids[0]
    }'
```

**Why this next step?**

This contract emits two FastData rows from one call: a `key` row that contains the logical field name you passed in, and a `value` row that contains the actual value. The exact-key routes prove those rows directly. The predecessor-scoped lookup is the bridge back to provenance, because it gives you the `tx_hash` and `receipt_id` that created those rows. Hydrating that transaction proves the indexed rows came from one `__fastdata_kv` call with the same decoded args.

That is also the important boundary for this surface: FastData rows are indexed FastData output, not a guarantee that raw RPC `view_state` will expose the same keys. Because this is an indexed surface, a fresh write may take a short moment to appear; wait until the indexed `tx_hash` shows up before treating the latest rows as final. If the user's question changes from “which FastData rows were emitted?” to “what does this contract's canonical on-chain state look like?”, move to the contract's own read method or [View State](/rpc/contract/view-state) only when you independently know the storage layout you are asking for.

## Common jobs

### Look up one exact FastData key right now

**Start here**

- [GET Latest by Exact Key](/fastdata/kv/get-latest-key) when one fully qualified key is already known.

**Next page if needed**

- [GET History by Exact Key](/fastdata/kv/get-history-key) if the question becomes “how did this key change?”

**Stop when**

- The latest indexed row already answers the FastData question.

**Switch when**

- The user is no longer asking about indexed FastData rows. Move to the contract's own read method or [View State](/rpc/contract/view-state) only if you know the raw-state layout you need.

### Turn one exact FastData key into a change history

**Start here**

- [GET History by Exact Key](/fastdata/kv/get-history-key) for path-based history under one contract and one predecessor.
- [History by Key](/fastdata/kv/history-by-key) only when you intentionally want the same key string across all contracts and predecessors.

**Next page if needed**

- Revisit [GET Latest by Exact Key](/fastdata/kv/get-latest-key) if you want the current indexed value alongside the history.

**Stop when**

- You can explain how the key changed over time.

**Switch when**

- The user now needs canonical contract state, not just indexed FastData history. Use the contract's own read method or [View State](/rpc/contract/view-state) only when the raw-state shape is known.

### Trace writes from one predecessor

**Start here**

- [All by Predecessor](/fastdata/kv/all-by-predecessor) for latest rows across contracts touched by one predecessor.
- [Latest by Predecessor](/fastdata/kv/latest-by-predecessor) when you need the rows for one contract and one predecessor, optionally with metadata.
- [History by Predecessor](/fastdata/kv/history-by-predecessor) when you need the write history over time.

**Next page if needed**

- Narrow to an exact key if one row becomes the real focus, or widen to [Transactions by Hash](/tx/transactions) if provenance becomes the real question.

**Stop when**

- You can answer what this predecessor changed and where.

**Switch when**

- The user stops asking about indexed writes and starts asking about the current chain state.

### Bridge one FastData row back to its transaction

**Start here**

- [Latest by Predecessor](/fastdata/kv/latest-by-predecessor) with `include_metadata: true` to recover `tx_hash` and `receipt_id`.
- [Transactions by Hash](/tx/transactions) to hydrate the originating call and decode its args.

**Next page if needed**

- Move to [Receipt by Id](/tx/receipt) if the next question is about one downstream receipt rather than the original call.

**Stop when**

- You can explain which call produced the indexed FastData row.

**Switch when**

- The user needs canonical execution semantics or exact executor-level status. Move to RPC transaction status.

### Batch-check several known keys

**Start here**

- [Multi Lookup](/fastdata/kv/multi) when you already know a fixed set of fully qualified keys.

**Next page if needed**

- Move one interesting key to [GET History by Exact Key](/fastdata/kv/get-history-key) if the batch result raises a historical question.

**Stop when**

- The batch response already answers which of the keys matter.

**Switch when**

- You no longer have a fixed key list and need to inspect the contract or predecessor more broadly.

## Common mistakes

- Starting with broad account or predecessor scans when an exact key is already known.
- Mixing up [GET History by Exact Key](/fastdata/kv/get-history-key) with [History by Key](/fastdata/kv/history-by-key). The former stays inside one contract and predecessor; the latter searches the same key string globally.
- Using KV FastData when the user really wants balances or holdings.
- Confusing indexed FastData rows with exact canonical contract state.
- Assuming a FastData key is directly queryable through raw RPC `view_state`.
- Assuming a fresh write will be indexed synchronously with chain inclusion.
- Reusing pagination tokens or changing filters mid-scan.

## Related guides

- [KV FastData API](/fastdata/kv)
- [RPC Reference](/rpc)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
