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

### Find one suspicious transfer, then chase its receipt

Use this when the user story is “I know funds moved, but I want the exact execution anchor behind that movement without dragging in the whole account history yet.”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Stay narrow on movement first, then pivot once into execution history.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">POST /v0/transfers</span> gives you the tight outgoing window and the specific movement worth chasing.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">jq</span> lifts one <span className="fastnear-example-strategy__code">receipt_id</span> without dragging in the rest of the account history.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">POST /v0/receipt</span> turns that movement into one execution anchor you can keep following in <span className="fastnear-example-strategy__code">/tx</span>.</span></p>
  </div>
</div>

**What you're doing**

- Query a bounded outgoing transfer window for one account on mainnet.
- Pull out one transfer that looks like the movement you care about.
- Reuse its `receipt_id` in Transactions API to move from balance movement into execution history.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
FROM_TIMESTAMP_MS=1711929600000
TO_TIMESTAMP_MS=1712016000000

RECEIPT_ID="$(
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
    | tee /tmp/transfers-window.json \
    | jq -r '.transfers[0].receipt_id'
)"

jq '{
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
}' /tmp/transfers-window.json

curl -s "$TX_BASE_URL/v0/receipt" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '{
      receipt_id: .receipt.receipt_id,
      transaction_hash: .receipt.transaction_hash,
      receiver_id: .receipt.receiver_id,
      tx_block_height: .receipt.tx_block_height
    }'
```

**Why this next step?**

The transfer query answers the first question quickly: did this account send funds in this window, and to whom? Looking up the `receipt_id` gives you the exact execution anchor for that movement without dragging in the whole account history yet. If you still need more rows afterward, keep paginating with the same `resume_token` and unchanged filters.

## Common jobs

### Find outgoing transfers for one account in a narrow time window

**Start here**

- [Query Transfers](/transfers/query) with the account, outgoing direction, and the tightest useful time filter.

**Next page if needed**

- Narrow again by asset or amount if the response still contains unrelated transfers.

**Stop when**

- You can answer who sent what, when, and in which asset.

**Switch when**

- The user asks why the transfer happened or what other actions surrounded it. Move to [Transactions API](/tx).

### Keep paging through a transfer feed without losing your place

**Start here**

- [Query Transfers](/transfers/query) for the first page of recent events, using the tightest stable filters you can.

**Next page if needed**

- Reuse the exact returned `resume_token` to fetch the next page with the same filters.
- Keep the filters unchanged while you paginate, or you are no longer looking at the same feed.

**Stop when**

- You have enough pages to answer the requested feed, support review, or compliance check.

**Switch when**

- The user asks for transaction metadata beyond transfer events.
- The feed needs balances or holdings, not just movement. Move to [FastNear API](/api).

### Escalate from transfer-only history to full transaction investigation

**Start here**

- [Query Transfers](/transfers/query) to identify the specific transfer events that matter.

**Next page if needed**

- [Transactions API account history](/tx/account) if the user wants the surrounding execution story for the same account.
- [Transactions by Hash](/tx/transactions) when you already know which transaction to inspect next.

**Stop when**

- You have identified the right transfer event and the right next API to open.

**Switch when**

- The user explicitly needs receipt-level detail or exact RPC confirmation. Move to [Transactions API](/tx) first, then [RPC Reference](/rpc) if needed.

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
