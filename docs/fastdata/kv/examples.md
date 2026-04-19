---
sidebar_label: Examples
slug: /fastdata/kv/examples
title: KV FastData Examples
description: Plain-language workflows for reading exact FastData rows, checking exact-key history, and tracing one indexed row back to its originating transaction.
displayed_sidebar: kvFastDataSidebar
page_actions:
  - markdown
---

## Quick start

If you already know the exact FastData keys you care about, read them directly.

```bash
KV_BASE_URL=https://kv.test.fastnear.com
CURRENT_ACCOUNT_ID=kv.gork-agent.testnet
PREDECESSOR_ID=kv.gork-agent.testnet

curl -s "$KV_BASE_URL/v0/multi" \
  -H 'content-type: application/json' \
  --data '{
    "keys": [
      "kv.gork-agent.testnet/kv.gork-agent.testnet/key",
      "kv.gork-agent.testnet/kv.gork-agent.testnet/value"
    ]
  }' \
  | jq '{
      entries: [
        .entries[]
        | {
            current_account_id,
            predecessor_id,
            block_height,
            key,
            value
          }
      ]
    }'
```

This is the shortest useful FastData read on the page: one request, two exact rows.

## Worked investigation

### Read one indexed setting, then trace it back to the write

Use this investigation when you already know the contract and predecessor, and the question is: “what is the current indexed setting value, did it change before, and which transaction created it?”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Read the exact setting rows first, widen to predecessor metadata only when provenance matters, and use Transactions API only for the final proof.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">multi</span> or <span className="fastnear-example-strategy__code">get-latest-key</span> reads the exact indexed setting rows.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">get-history-key</span> shows whether the indexed setting changed again later.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">latest-by-predecessor</span> with metadata plus <span className="fastnear-example-strategy__code">POST /v0/transactions</span> proves which write created those indexed rows.</span></p>
  </div>
</div>

**Goal**

- Read one stable indexed setting from a minimal public testnet contract, confirm the exact-key history for one row, and recover the transaction that created both rows.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Exact setting read | KV FastData [`multi`](/fastdata/kv/multi) | Read the known `key` and `value` rows in one request | This is the narrowest useful read when the exact indexed setting rows are already known |
| Exact row read | KV FastData [`get-latest-key`](/fastdata/kv/get-latest-key) | Re-read one exact row by path | Useful when the question is about one row, not the whole setting pair |
| Exact keyed history | KV FastData [`get-history-key`](/fastdata/kv/get-history-key) | Check the change history for the exact `value` row | Shows whether that indexed setting changed across multiple writes |
| Optional provenance bridge | KV FastData [`latest-by-predecessor`](/fastdata/kv/latest-by-predecessor) | Recover `tx_hash` and `receipt_id` for the indexed rows only when provenance matters | This is the optional bridge from indexed rows back to one write |
| Optional transaction hydration | Transactions API [`POST /v0/transactions`](/tx/transactions) | Hydrate the recovered `tx_hash` and decode the original args only when you need that proof | Final optional proof that one write created the indexed setting rows |

**What a useful answer should include**

- the exact `current_account_id`, `predecessor_id`, and indexed setting rows investigated
- the latest indexed rows and the exact-key history for one of them
- the `tx_hash` or `receipt_id` that created those rows, only if provenance matters
- whether the question is still about indexed FastData rows or has widened into canonical contract state

### Verified read-only testnet shell walkthrough

Use this when you want a fully read-only example against the stable sample data in `kv.gork-agent.testnet`.

This minimal contract behaves like a tiny settings store: one write emits two indexed rows, `key` and `value`. The sample setting currently reads as `test=hello`, which is simple enough to teach the FastData shape without pretending it is a richer application object.
This sample contract indexes its own writes, so `CURRENT_ACCOUNT_ID` and `PREDECESSOR_ID` are intentionally the same in this walkthrough.

**What you're doing**

- Read the exact indexed setting rows together.
- Re-read the same rows individually so the exact-key route shape is clear.
- Pull the exact-key history for the setting `value` row.
- Stop there unless provenance matters.

```bash
KV_BASE_URL=https://kv.test.fastnear.com
TX_BASE_URL=https://tx.test.fastnear.com
CURRENT_ACCOUNT_ID=kv.gork-agent.testnet
PREDECESSOR_ID=kv.gork-agent.testnet

curl -s "$KV_BASE_URL/v0/multi" \
  -H 'content-type: application/json' \
  --data '{
    "keys": [
      "kv.gork-agent.testnet/kv.gork-agent.testnet/key",
      "kv.gork-agent.testnet/kv.gork-agent.testnet/value"
    ]
  }' \
  | jq '{
      entries: [
        .entries[]
        | {
            current_account_id,
            predecessor_id,
            block_height,
            key,
            value
          }
      ]
    }'

curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/key" \
  | jq '{
      latest_key_row: (
        .entries[0]
        | {
            block_height,
            key,
            value
          }
      )
    }'

curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/value" \
  | jq '{
      latest_value_row: (
        .entries[0]
        | {
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
```

That is the whole main read path: exact rows, exact latest reads, and exact-key history for the same indexed setting.

### Optional provenance extension

Only use this follow-up when the next question is “which write created these rows?”

```bash

curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID" \
  -H 'content-type: application/json' \
  --data '{"include_metadata": true, "limit": 10}' \
  | tee /tmp/kv-predecessor-latest.json >/dev/null

jq '{
  entries: [
    .entries[]
    | {
        block_height,
        key,
        value,
        tx_hash,
        receipt_id
      }
  ]
}' /tmp/kv-predecessor-latest.json

INDEXED_TX_HASH="$(
  jq -r '
    first(.entries[] | select(.key == "value") | .tx_hash)
  ' /tmp/kv-predecessor-latest.json
)"

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
      receipt_ids: .transactions[0].execution_outcome.outcome.receipt_ids
    }'
```

**Why this next step?**

This sample contract emits two indexed rows from one write: `key=test` and `value=hello`. Treat that as one indexed setting. The exact-key routes prove those rows directly. The predecessor-scoped lookup with metadata is the optional bridge back to provenance, because it gives you the `tx_hash` and `receipt_id` that created those rows. Hydrating that transaction proves those indexed rows came from one `__fastdata_kv` call with decoded args `{ "key": "test", "value": "hello" }`.

That is also the important boundary for this surface: KV FastData answers questions about indexed FastData rows. If the question changes to canonical contract state, move to the contract's own read method or [View State](/rpc/contract/view-state) only when you independently know the storage layout you want.


## Common mistakes

- Starting with broad predecessor scans when the exact FastData rows are already known.
- Treating [History by Key](/fastdata/kv/history-by-key) as if it were the same as [GET History by Exact Key](/fastdata/kv/get-history-key). The first is global by key string; the second stays inside one contract and predecessor.
- Using KV FastData when the real question is about balances, holdings, or account summaries.
- Confusing indexed FastData rows with canonical on-chain contract state.
- Assuming every FastData investigation needs a fresh write before any read is useful.

## Related guides

- [KV FastData API](/fastdata/kv)
- [Transactions API](/tx)
- [RPC Reference](/rpc)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
