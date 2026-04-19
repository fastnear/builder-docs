---
sidebar_label: Examples
slug: /transfers/examples
title: Transfers Examples
description: Plain-language workflows for finding transfers, paginating with resume_token, and pivoting into transaction history.
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

This is the shortest way to answer “did funds move here, and which receipt should I chase next?”

## Worked walkthrough

### Find one outgoing transfer, then pivot to execution details if needed

Use this when the user story is “I know this account sent funds in this window, and I may need the exact execution anchor behind one row, but I do not want the whole account history yet.”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Stay narrow on movement first, then pivot once into execution history only if the transfer row is not enough.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">POST /v0/transfers</span> gives you the tight outgoing window and the specific movement worth chasing.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span>Print the rows first, then choose one <span className="fastnear-example-strategy__code">transfer_index</span> before lifting its <span className="fastnear-example-strategy__code">receipt_id</span>.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">POST /v0/receipt</span> is the optional widening step when you need execution history behind that transfer.</span></p>
  </div>
</div>

**What you're doing**

- Query a bounded outgoing transfer window for one account on mainnet.
- Pull out one transfer row that looks like the movement you care about.
- Reuse its `receipt_id` in Transactions API only if you need to move from balance movement into execution history.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
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

The transfer query answers the first question quickly: did this account send funds in this window, and to whom? Looking up the `receipt_id` is the optional next step when the transfer row itself is not enough and you need the execution anchor behind it. If you still need more rows afterward, keep paginating with the same `resume_token` and unchanged filters.


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
