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

`/v0/transfers` returns a filtered feed plus a `resume_token` you replay with *unchanged* filters to keep paging. Each row already carries `human_amount`, `usd_amount`, `transaction_id`, and `receipt_id`, so most audit questions land without a second call.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=root.near

FEED="$(curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    account_id: $account_id,
    direction: "receiver",
    asset_id: "native:near",
    min_amount: "1000000000000000000000000",
    desc: true,
    limit: 10
  }')")"

echo "$FEED" | jq '{
  resume_token,
  transfers: [.transfers[] | {block_height, amount, human_amount, usd_amount, other_account_id, transaction_id, receipt_id}]
}'
```

For the pinned account this returns recent incoming native-NEAR transfers of at least 1 NEAR — sample rows are native transfers from `escrow.ai.near` with USD already computed. To page, resend the same body with a top-level `resume_token: "<value>"`; changing any other filter invalidates the token.

When one row needs its execution anchor, take its `receipt_id` straight to `/v0/receipt`:

```bash
RECEIPT_ID="$(echo "$FEED" | jq -r '.transfers[0].receipt_id')"

curl -s "$TX_BASE_URL/v0/receipt" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '.receipt | {receipt_id, transaction_hash, receiver_id, predecessor_id, tx_block_height, is_success}'
```

That's the same handoff covered in [Turn one ugly receipt ID from logs into a human story](/tx/examples#turn-one-ugly-receipt-id-from-logs-into-a-human-story) — one call gets the receipt and its full parent transaction.

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
