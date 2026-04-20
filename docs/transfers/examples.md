---
sidebar_label: Examples
slug: /transfers/examples
title: Transfers Examples
description: Task-first transfer examples for filtering feeds, paging, and pivoting into transaction history.
displayed_sidebar: transfersApiSidebar
page_actions:
  - markdown
---

## Example

### Filter and page a transfer feed for one account

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Build the account feed first, then lift one receipt only if one row needs more story.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">POST /v0/transfers</span> gives you the first page of one filtered account feed.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">jq</span> lifts the returned rows plus <span className="fastnear-example-strategy__code">resume_token</span> so you can keep paging the same feed.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">POST /v0/receipt</span> is only the optional follow-up when one row needs the execution story behind it.</span></p>
  </div>
</div>

**Network**

- mainnet only today

**Flow**

- Fetch the first page of one filtered transfer feed for a single account.
- Use the feed parameters themselves as the core levers: `account_id`, `direction`, `asset_id`, `min_amount`, `desc`, and `limit`.
- Inspect the returned rows plus `resume_token` before you decide whether any row deserves deeper execution history.
- Only if one row does deserve that deeper story, reuse its `receipt_id` in Transactions API.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
ASSET_ID=native:near
MIN_AMOUNT=1000000000000000000000000

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg asset_id "$ASSET_ID" \
    --arg min_amount "$MIN_AMOUNT" '{
      account_id: $account_id,
      direction: "receiver",
      asset_id: $asset_id,
      min_amount: $min_amount,
      desc: true,
      limit: 10
    }')" \
  | tee /tmp/transfers-feed.json >/dev/null

jq '{
  resume_token,
  transfers: [
    .transfers[]
    | {
        transaction_id,
        receipt_id,
        asset_id,
        amount,
        human_amount,
        usd_amount,
        other_account_id,
        block_height
      }
  ]
}' /tmp/transfers-feed.json
```

Optional: if one feed row still needs its execution anchor, lift that row’s `receipt_id` and pivot once into Transactions API.

```bash
RECEIPT_ID="$(jq -r '.transfers[0].receipt_id' /tmp/transfers-feed.json)"

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

**When to pivot**

The transfer query answers the first question directly: what does this account’s filtered feed look like right now, and how do you keep paging it without losing your place? Only after the feed tells you which row matters should you switch to `receipt_id` and chase execution history in `/tx`.

## Common jobs

### Filter one account’s transfer feed

**Start here**

- [Query Transfers](/transfers/query) with the account plus the narrowest stable feed filters: direction, asset, amount, and order.

**Next page if needed**

- Keep refining the same feed with asset or amount filters if the first page still contains unrelated rows.

**Stop when**

- You can explain what the filtered feed contains and how to keep paging it.

**Switch when**

- One specific row now needs its execution story or receipt trail. Move to [Transactions API](/tx).

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

## Related guides

- [Transfers API](/transfers)
- [Transactions API](/tx)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
