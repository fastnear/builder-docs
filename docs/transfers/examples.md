---
sidebar_label: Examples
slug: /transfers/examples
title: Transfers Examples
description: Plain-language workflows for checking whether funds moved in one window and optionally anchoring one row to a receipt.
displayed_sidebar: transfersApiSidebar
page_actions:
  - markdown
---

## Quick start

Start with one tight outgoing window and print the rows before you chase receipts.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
FROM_TIMESTAMP_MS=1711929600000
TO_TIMESTAMP_MS=1712016000000

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --argjson from_timestamp_ms "$FROM_TIMESTAMP_MS" \
    --argjson to_timestamp_ms "$TO_TIMESTAMP_MS" '{
      account_id: $account_id,
      direction: "sender",
      from_timestamp_ms: $from_timestamp_ms,
      to_timestamp_ms: $to_timestamp_ms,
      desc: true,
      limit: 10
    }')" \
  | jq '{
      resume_token,
      transfers: [
        .transfers[]
        | {
            transaction_id,
            receipt_id,
            asset_id,
            amount,
            other_account_id,
            block_height
          }
      ]
    }'
```

This is the shortest way to answer “did funds move here, and which row should I inspect next?”

## Worked walkthrough

### Did this account send funds in this window, and which row should I inspect?

Use this when the user story is “I need one narrow outgoing window first, and only after I see the rows will I decide whether one of them needs a receipt-level follow-up.”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Answer the movement question first, then widen once only if one row still needs an execution anchor.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">POST /v0/transfers</span> gives you the tight outgoing window and the specific movement worth chasing.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span>Print the rows first, then choose one <span className="fastnear-example-strategy__code">transfer_index</span> before lifting its <span className="fastnear-example-strategy__code">receipt_id</span>.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">POST /v0/receipt</span> is the optional follow-up when you want to know what one transfer row did on chain.</span></p>
  </div>
</div>

**What you're doing**

- Query a bounded outgoing transfer window for one account on mainnet.
- Print the rows first, then choose one transfer row that looks like the movement you care about.
- Reuse its `receipt_id` only if you need to move from balance movement into execution history.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
FROM_TIMESTAMP_MS=1711929600000
TO_TIMESTAMP_MS=1712016000000
TRANSFER_INDEX=0

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --argjson from_timestamp_ms "$FROM_TIMESTAMP_MS" \
    --argjson to_timestamp_ms "$TO_TIMESTAMP_MS" '{
      account_id: $account_id,
      direction: "sender",
      from_timestamp_ms: $from_timestamp_ms,
      to_timestamp_ms: $to_timestamp_ms,
      desc: true,
      limit: 10
    }')" \
  | tee /tmp/transfers-window.json >/dev/null

jq '{
  resume_token,
  transfers: [
    .transfers
    | to_entries[]
    | {
        transfer_index: .key,
        transaction_id: .value.transaction_id,
        receipt_id: .value.receipt_id,
        asset_id: .value.asset_id,
        amount: .value.amount,
        other_account_id: .value.other_account_id,
        block_height: .value.block_height
      }
  ]
}' /tmp/transfers-window.json

RECEIPT_ID="$(
  jq -r --argjson transfer_index "$TRANSFER_INDEX" \
    '.transfers[$transfer_index].receipt_id // empty' \
    /tmp/transfers-window.json
)"

printf 'Chosen transfer index: %s\n' "$TRANSFER_INDEX"
printf 'Chosen receipt id: %s\n' "$RECEIPT_ID"
```

That answers the first question: did funds move here, and which transfer row should you inspect next?

#### Optional follow-up: What did this transfer row do on chain?

Only widen to receipt history if the transfer row itself is not enough.

```bash
TX_BASE_URL=https://tx.main.fastnear.com

if [ -n "$RECEIPT_ID" ]; then
  curl -s "$TX_BASE_URL/v0/receipt" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
    | jq '{
        receipt_id: .receipt.receipt_id,
        transaction_hash: .receipt.transaction_hash,
        receiver_id: .receipt.receiver_id,
        tx_block_height: .receipt.tx_block_height
      }'
fi
```

**Why this next step?**

The transfer query answers the first question quickly: did this account send funds in this window, and to whom? Looking up the `receipt_id` is the optional second question: what execution anchor sits behind this one row? If you still need more rows afterward, keep paginating with the same `resume_token` and unchanged filters.


## Common mistakes

- Using Transfers API when the user really wants balances, holdings, or account summaries.
- Treating transfer history as full execution history.
- Reusing a `resume_token` with different filters.
- Starting here for testnet questions; this API is mainnet-only today.

## Related guides

- [Transfers API](/transfers)
- [Transactions API](/tx)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
