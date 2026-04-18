---
sidebar_label: Examples
slug: /transfers/examples
title: Transfers API Examples
description: Plain-language workflows for using Transfers API docs for narrow transfer history, pagination, and escalation into broader investigation.
displayed_sidebar: transfersApiSidebar
page_actions:
  - markdown
---

# Transfers API Examples

Use this page when the question is specifically about asset movement and you want the shortest path through the transfer-history docs. This surface is intentionally narrow: start with the tightest transfer filter that answers the question, stay focused on sends and receives, and widen only when the question stops being transfer-only.

## When to start here

- The user cares about incoming or outgoing NEAR or FT transfers.
- You want a wallet feed, audit view, or support answer focused on asset movement.
- You already know the account and do not need the full execution story yet.
- Mainnet transfer history is enough for the task.

## Minimum inputs

- `account_id`
- no network choice: this surface is mainnet-only today
- optional direction, asset, amount, or time filters
- whether the answer needs only a few events or a longer history scan
- whether broader transaction context may be needed later

## Common jobs

### Find outgoing transfers for one account in a narrow time window

**Start here**

- [Query Transfers](/transfers/query) with the account, outgoing direction, and the tightest useful time filter.

**Next page if needed**

- Narrow again by asset or amount if the response still contains unrelated transfers.

**Stop when**

- You can answer who sent what, when, and in which asset.

**Widen when**

- The user asks why the transfer happened or what other actions surrounded it. Move to [Transactions API](/tx).

### Build a transfer feed with `resume_token` pagination

**Start here**

- [Query Transfers](/transfers/query) for the first page of recent events.

**Next page if needed**

- Reuse the exact returned `resume_token` to fetch the next page with the same filters.

**Stop when**

- You have enough pages to answer the requested feed, support review, or compliance check.

**Widen when**

- The user asks for transaction metadata beyond transfer events.
- The feed needs balances or holdings, not just movement. Move to [FastNear API](/api).

### Escalate from transfer-only history to full transaction investigation

**Start here**

- [Query Transfers](/transfers/query) to identify the specific transfer events that matter.

**Next page if needed**

- [Transactions API account history](/tx/account) if the user wants the surrounding execution story for the same account.
- [Transactions by Hash](/tx/transactions) when you already know which transaction to inspect next.

**Stop when**

- You have identified the right transfer event and the right next investigation surface.

**Widen when**

- The user explicitly needs receipt-level or canonical RPC confirmation. Move to [Transactions API](/tx) first, then [RPC Reference](/rpc) if needed.

## Worked walkthrough

### Query a narrow transfer window, then pivot by receipt

Use this when the first question is still transfer-only, but you know you may need one precise execution pivot after you isolate the relevant movement.

**What you're doing**

- Query a bounded outgoing transfer window for one account on mainnet.
- Extract the first `receipt_id` with `jq`.
- Reuse that receipt ID in Transactions API to move from asset movement into execution context.

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

The transfer query keeps the first pass narrow and pagination-friendly. Pivoting by `receipt_id` gives you one exact execution anchor without immediately widening into full account history. If you still need more rows afterward, continue paginating with the same `resume_token` and unchanged filters.

## Common mistakes

- Using Transfers API when the user really wants balances, holdings, or account summaries.
- Treating transfer history as full execution history.
- Reusing a `resume_token` with different filters.
- Starting here for testnet questions; this surface is mainnet-only today.

## Related guides

- [Transfers API](/transfers)
- [Transactions API](/tx)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
