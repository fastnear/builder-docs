---
sidebar_label: Examples
slug: /transfers/examples
title: Transfers Examples
description: Task-first transfer examples for filtering feeds, paging, and pivoting into transaction history.
displayed_sidebar: transfersApiSidebar
page_actions:
  - markdown
---

## Examples

### What's this account's recent transfer activity?

`/v0/transfers` with just `account_id` and `desc: true` returns the most recent transfers touching that account across every asset type, both directions mixed. Each row already carries `human_amount`, `asset_id`, and `transaction_id`, so the feed doubles as a quick activity scan before you reach for filters.

```bash
ACCOUNT_ID=root.near
FASTNEAR_API_KEY=

curl -s "https://transfers.main.fastnear.com/v0/transfers" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{account_id: $account_id, desc: true, limit: 5}')" \
  | jq '{
      recent: [.transfers[] | {
        block_height,
        asset_id,
        human_amount,
        other_account_id,
        transfer_type,
        tx: .transaction_id
      }]
    }'
```

For `root.near`, the latest rows mix `FtTransfer` and `MtTransfer` assets. `asset_id` uses NEP-standard URIs (`native:near`, `nep141:...`, `nep245:...`), so one field tells you which standard to reach for next. Positive `human_amount` means the account received; negative means it sent. `other_account_id: null` is normal for multi-token shapes where the counterparty sits inside a contract boundary rather than as a top-level account.

### Filter and page a transfer feed for one account

`/v0/transfers` returns a filtered feed plus a `resume_token` you replay with *unchanged* filters to keep paging. Each row already carries `human_amount`, `usd_amount`, `transaction_id`, and `receipt_id`, so most audit questions land without a second call.

```bash
ACCOUNT_ID=root.near
FASTNEAR_API_KEY=

FEED="$(curl -s "https://transfers.main.fastnear.com/v0/transfers" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
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

curl -s "https://tx.main.fastnear.com/v0/receipt" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '.receipt | {receipt_id, transaction_hash, receiver_id, predecessor_id, tx_block_height, is_success}'
```

That's the same handoff covered in [Turn one receipt ID into a readable transaction story](/tx/examples#receipt-id-to-readable-story) — one call gets the receipt and its full parent transaction.

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
