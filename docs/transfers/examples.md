---
sidebar_label: Examples
slug: /transfers/examples
title: Transfers Examples
description: Plain-language workflows for filtering transfers, reading humanized amounts and running balances, and pivoting into receipt or transaction context.
displayed_sidebar: transfersApiSidebar
page_actions:
  - markdown
---

## Quick start

Start with one filtered incoming query and surface the fields that make Transfers API worth using.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
ACCOUNT_ID=intents.near
ASSET_ID=native:near
MIN_AMOUNT_YOCTO=1000000000000000000000000

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg asset_id "$ASSET_ID" \
    --arg min_amount "$MIN_AMOUNT_YOCTO" '{
      account_id: $account_id,
      direction: "receiver",
      asset_id: $asset_id,
      ignore_system: true,
      min_amount: $min_amount,
      desc: true,
      limit: 5
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
            human_amount: (
              if .human_amount == null then null
              else (.human_amount * 1000 | round / 1000)
              end
            ),
            usd_amount: (
              if .usd_amount == null then null
              else (.usd_amount * 100 | round / 100)
              end
            ),
            block_timestamp,
            method_name,
            transfer_type,
            start_of_block_balance,
            end_of_block_balance,
            other_account_id,
            block_height
          }
      ]
    }'
```

This is the shortest way to answer “which 1+ NEAR transfers hit this account, what were they worth, and which row should I inspect next?” `usd_amount` can be `null` when pricing is not available for that row.

## Worked walkthrough

### Which incoming transfers of 1+ NEAR hit this account, and which row should I inspect?

Use this when the user story is “I need one narrow transfer search first, I want the row fields that already look like wallet or analytics data, and only after that will I decide whether one row needs deeper follow-up.”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Use Transfers API for the filtered movement answer first, then widen only when one row still needs chain context.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">POST /v0/transfers</span> does the filtering work first: receiver-side rows, one asset, system transfers hidden, and a minimum amount threshold.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span>Print the distinctive row fields first: <span className="fastnear-example-strategy__code">human_amount</span>, <span className="fastnear-example-strategy__code">usd_amount</span>, <span className="fastnear-example-strategy__code">method_name</span>, <span className="fastnear-example-strategy__code">transfer_type</span>, and the running balances.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>If you need more rows, reuse the opaque <span className="fastnear-example-strategy__code">resume_token</span> with the exact same filters.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">04</span><span>Only then choose one row and decide whether you want its <span className="fastnear-example-strategy__code">receipt_id</span> as an execution anchor or its <span className="fastnear-example-strategy__code">transaction_id</span> as a readable story anchor.</span></p>
  </div>
</div>

**What you're doing**

- Query a filtered incoming transfer window for one active mainnet account.
- Print the row fields that Transfers API already normalizes for you.
- Reuse the same filters with `resume_token` if you need another page.
- Lift either `receipt_id` or `transaction_id` only when one row still needs a deeper story.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=intents.near
ASSET_ID=native:near
MIN_AMOUNT_YOCTO=1000000000000000000000000
TRANSFER_INDEX=0

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg asset_id "$ASSET_ID" \
    --arg min_amount "$MIN_AMOUNT_YOCTO" '{
      account_id: $account_id,
      direction: "receiver",
      asset_id: $asset_id,
      ignore_system: true,
      min_amount: $min_amount,
      desc: true,
      limit: 5
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
        human_amount: (
          if .value.human_amount == null then null
          else (.value.human_amount * 1000 | round / 1000)
          end
        ),
        usd_amount: (
          if .value.usd_amount == null then null
          else (.value.usd_amount * 100 | round / 100)
          end
        ),
        block_timestamp: .value.block_timestamp,
        method_name: .value.method_name,
        transfer_type: .value.transfer_type,
        start_of_block_balance: .value.start_of_block_balance,
        end_of_block_balance: .value.end_of_block_balance,
        other_account_id: .value.other_account_id,
        block_height: .value.block_height
      }
  ]
}' /tmp/transfers-window.json

RESUME_TOKEN="$(
  jq -r '.resume_token // empty' /tmp/transfers-window.json
)"

if [ -n "$RESUME_TOKEN" ]; then
  curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$ACCOUNT_ID" \
      --arg asset_id "$ASSET_ID" \
      --arg min_amount "$MIN_AMOUNT_YOCTO" \
      --arg resume_token "$RESUME_TOKEN" '{
        account_id: $account_id,
        direction: "receiver",
        asset_id: $asset_id,
        ignore_system: true,
        min_amount: $min_amount,
        desc: true,
        limit: 5,
        resume_token: $resume_token
      }')" \
    | jq '{
        next_page_resume_token: .resume_token,
        next_transfers: [
          .transfers[]
          | {
              transaction_id,
              receipt_id,
              human_amount: (
                if .human_amount == null then null
                else (.human_amount * 1000 | round / 1000)
                end
              ),
              transfer_type,
              other_account_id,
              block_height
            }
        ]
      }'
fi

TRANSACTION_ID="$(
  jq -r --argjson transfer_index "$TRANSFER_INDEX" \
    '.transfers[$transfer_index].transaction_id // empty' \
    /tmp/transfers-window.json
)"

RECEIPT_ID="$(
  jq -r --argjson transfer_index "$TRANSFER_INDEX" \
    '.transfers[$transfer_index].receipt_id // empty' \
    /tmp/transfers-window.json
)"

printf 'Chosen transfer index: %s\n' "$TRANSFER_INDEX"
printf 'Chosen transaction id: %s\n' "$TRANSACTION_ID"
printf 'Chosen receipt id: %s\n' "$RECEIPT_ID"
```

That answers the first question: which filtered rows match, what were they worth, and which transfer row should you inspect next?

#### Optional follow-up: Receipt anchor or transaction story?

Use `receipt_id` when you want the execution anchor for the row itself. Use `transaction_id` when you want the readable story of what the signer submitted.

```bash
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

if [ -n "$TRANSACTION_ID" ]; then
  curl -s "$TX_BASE_URL/v0/transactions" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg tx_hash "$TRANSACTION_ID" '{tx_hashes: [$tx_hash]}')" \
    | jq '{
        transaction: {
          hash: .transactions[0].transaction.hash,
          signer_id: .transactions[0].transaction.signer_id,
          receiver_id: .transactions[0].transaction.receiver_id,
          included_block_height: .transactions[0].execution_outcome.block_height
        },
        actions: (
          .transactions[0].transaction.actions
          | map(if type == "string" then . else keys[0] end)
        )
      }'
fi
```

**Why this next step?**

This is where Transfers API earns its keep. The first query already answers the movement question in wallet- or analytics-friendly terms: filtered rows, humanized amounts, transfer type, method clue, and running balances. If you still need another page, reuse the same `resume_token` with the same filters. If you need chain context, follow `receipt_id` for the execution anchor or `transaction_id` for the readable transaction story.


## Common mistakes

- Using Transfers API when the user really wants balances, holdings, or account summaries.
- Treating transfer history as full execution history instead of a filtered movement view.
- Reusing a `resume_token` with different filters.
- Ignoring `method_name`, `transfer_type`, or running balances even though they are often the reason to use this API over raw transaction history.
- Starting here for testnet questions; this API is mainnet-only today.

## Related guides

- [Transfers API](/transfers)
- [Transactions API](/tx)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
