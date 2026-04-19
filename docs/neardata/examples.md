---
sidebar_label: Examples
slug: /neardata/examples
title: NEAR Data Examples
description: Plain-language workflows for checking contract touches, comparing optimistic and final heads, and walking forward block by block.
displayed_sidebar: nearDataApiSidebar
page_actions:
  - markdown
---

## Quick start

Start with one recent finalized block and ask for the smallest possible touch summary first.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_ACCOUNT_ID=intents.near

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | jq --arg target "$TARGET_ACCOUNT_ID" '{
      height: .block.header.height,
      hash: .block.header.hash,
      direct_tx_count: ([.shards[].chunk.transactions[]?
        | select(.transaction.receiver_id == $target)] | length),
      incoming_receipt_count: ([.shards[].chunk.receipts[]?
        | select(.receiver_id == $target)] | length),
      outcome_hit_count: ([.shards[].receipt_execution_outcomes[]?
        | select(
            (.receipt.receiver_id // "") == $target
            or (.execution_outcome.outcome.executor_id // "") == $target
          )] | length),
      state_change_count: ([.shards[].state_changes[]?
        | select((.change.account_id // "") == $target)] | length),
      state_change_types: ([.shards[].state_changes[]?
        | select((.change.account_id // "") == $target)
        | .type] | unique | sort)
    } | . + {
      touched: (
        (.direct_tx_count > 0)
        or (.incoming_receipt_count > 0)
        or (.outcome_hit_count > 0)
        or (.state_change_count > 0)
      )
    }'
```

This is the smallest useful NEAR Data summary for an app team: one finalized block, one yes-or-no answer, and a few counts before you widen. `intents.near` is pinned here so the first run is likely to return a real touched block before you swap in your own contract.

NEAR blocks are sharded, so the filter walks `.shards[]` before it inspects transactions, receipts, outcomes, or state changes. `chunk.receipts` means work that landed in this block; `receipt_execution_outcomes` means work that executed in this block, even if it was scheduled earlier.

## Worked investigation

### Did my contract get touched in the latest finalized block?

Use this investigation when you want a concrete yes/no answer before you widen into Transactions API or RPC.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Answer the contract-touch question first, then keep only one tx hash or receipt id for the next step.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">last-block-final</span> gives you one stable block height without guessing.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">block</span> is the main read: it already contains the transactions, incoming receipts, receipt execution outcomes, and state changes you need to answer “touched or not?”.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>Only if the answer is “yes” do you widen: keep one exact tx hash or receipt id from the same cached block, then hand that identifier to [Transactions API](/tx) or [RPC Reference](/rpc).</span></p>
  </div>
</div>

**Goal**

- Decide whether one target contract was touched in the latest finalized block, and keep only the compact counts plus one exact identifier worth investigating next.

**What a useful answer should include**

- finalized height and hash
- touched or not touched
- counts for direct txs, incoming receipts, outcome hits, and state changes
- a compact `state_change_types` list
- one sample tx hash or receipt id when present

### Final block to contract-touch answer shell walkthrough

Use this when the target account is already known and you want one recent finalized answer, not a long polling loop.

**What you're doing**

- Get the latest finalized block redirect target.
- Fetch the full block document once.
- Build one small touch summary for one `TARGET_ACCOUNT_ID`.
- Return a yes/no answer plus the smallest useful counts, state-change types, and sample identifiers.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_ACCOUNT_ID=intents.near

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

printf 'Final redirect target: %s\n' "$FINAL_LOCATION"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | tee /tmp/neardata-block.json >/dev/null

jq --arg target "$TARGET_ACCOUNT_ID" '
  (
    [
      .shards[]
      | .chunk.transactions[]?
      | select(.transaction.receiver_id == $target)
      | .transaction.hash
    ]
  ) as $txs
  | (
    [
      .shards[]
      | .chunk.receipts[]?
      | select(.receiver_id == $target)
      | .receipt_id
    ]
  ) as $receipts
  | (
    [
      .shards[]
      | .receipt_execution_outcomes[]?
      | select(
          (.receipt.receiver_id // "") == $target
          or (.execution_outcome.outcome.executor_id // "") == $target
        )
      | .tx_hash
      | select(. != null)
    ]
    | unique
  ) as $outcomes
  | (
    [
      .shards[]
      | .state_changes[]?
      | select((.change.account_id // "") == $target)
      | .type
    ]
  ) as $state_changes
  | (
    $state_changes
    | unique
    | sort
  ) as $state_change_types
  | {
      height: .block.header.height,
      hash: .block.header.hash,
      touched: (
        ($txs | length) > 0
        or ($receipts | length) > 0
        or ($outcomes | length) > 0
        or ($state_changes | length) > 0
      ),
      direct_tx_count: ($txs | length),
      incoming_receipt_count: ($receipts | length),
      outcome_hit_count: ($outcomes | length),
      state_change_count: ($state_changes | length),
      state_change_types: $state_change_types,
      sample_direct_tx: ($txs[0] // null),
      sample_incoming_receipt: ($receipts[0] // null),
      sample_outcome_tx_hash: ($outcomes[0] // null)
    }
' /tmp/neardata-block.json | tee /tmp/neardata-touch-summary.json
```

If you need richer detail later, keep reusing `/tmp/neardata-block.json`. The point of this first pass is to answer “touched or not?” before you widen into longer arrays or deeper traces.

Common `state_change_types` include `account_update`, `access_key_update`, `data_update`, and the corresponding `*_deletion` variants. That is often enough to tell whether you are looking at storage writes, key churn, or broader account-level changes before you leave NEAR Data.

#### Optional follow-up: Which tx hash or receipt id should I inspect next?

Keep the same cached block and summary, then lift one exact identifier for the next surface.

```bash
FOLLOW_UP_KIND="$(
  jq -r '
    if .sample_direct_tx != null then "tx_hash"
    elif .sample_incoming_receipt != null then "receipt_id"
    elif .sample_outcome_tx_hash != null then "tx_hash"
    else "none"
    end
  ' /tmp/neardata-touch-summary.json
)"

FOLLOW_UP_VALUE="$(
  jq -r '
    .sample_direct_tx
    // .sample_incoming_receipt
    // .sample_outcome_tx_hash
    // empty
  ' /tmp/neardata-touch-summary.json
)"

printf 'Next identifier kind: %s\n' "$FOLLOW_UP_KIND"
printf 'Next identifier value: %s\n' "$FOLLOW_UP_VALUE"
```

If the identifier is a `tx_hash`, hand it to [Transactions API](/tx) or RPC `tx` status. If it is a `receipt_id`, hand it to [Transactions API: Receipt by ID](/tx/receipt). Only after that should you decide whether shard-level reopening is still necessary.

**Why this next step?**

This keeps the question as small as possible: first answer “was my contract touched?”, then widen only if one exact tx hash or receipt id justifies a deeper trace. NEAR Data is the discovery layer here, not just a block monitor.

### How far ahead is optimistic right now?

Use this when you need to choose between low-latency reads and settled reads before you start polling.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

OPTIMISTIC_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

jq -n \
  --arg final_location "$FINAL_LOCATION" \
  --arg optimistic_location "$OPTIMISTIC_LOCATION" '{
    final_location: $final_location,
    optimistic_location: $optimistic_location,
    final_height: ($final_location | split("/") | last | tonumber),
    optimistic_height: ($optimistic_location | split("/") | last | tonumber)
  } | . + {
    optimistic_minus_final: (.optimistic_height - .final_height)
  }'
```

Use `last_block/optimistic` when the app values speed more than settled finality, for example reactive status views or early alerting. Use `last_block/final` when the answer feeds accounting, reconciliation, or any workflow that should not rewind.

### How do I walk forward block by block?

Use this when the job is “start at height N, fetch, process, increment, repeat.” For a deterministic bootstrap floor, read [`first-block`](/neardata/first-block) once before you begin.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

FINAL_HEIGHT="$(printf '%s' "$FINAL_LOCATION" | awk -F/ '{print $4}')"
NEXT_HEIGHT=$((FINAL_HEIGHT + 1))

while true; do
  HTTP_CODE="$(
    curl -s -o /tmp/neardata-next-block.json -w '%{http_code}' \
      "$NEARDATA_BASE_URL/v0/block/$NEXT_HEIGHT"
  )"

  if [ "$HTTP_CODE" = "200" ]; then
    jq '{height: .block.header.height, hash: .block.header.hash}' \
      /tmp/neardata-next-block.json
    NEXT_HEIGHT=$((NEXT_HEIGHT + 1))
  elif [ "$HTTP_CODE" = "404" ]; then
    sleep 2
  else
    printf 'Unexpected status: %s\n' "$HTTP_CODE" >&2
    break
  fi
done
```

That is the canonical polling shape for finalized data: fetch by height, process one block, advance, and treat `404` as “not finalized yet, back off and try again.” If you need the same loop at optimistic speed, switch to `/v0/block_opt/<height>` and accept optimistic semantics instead of final ones.


## Common mistakes

- Treating NEAR Data like a push stream instead of a polling or point-read API.
- Starting with RPC before checking whether one finalized block already answers the contract-touch question.
- Looking only for direct transactions and forgetting that contracts are often touched through receipts or state changes.
- Using optimistic data for settled accounting or reconciliation.
- Assuming one hard-coded shard id should be checked before you inspect the block family itself.
- Widening to Transactions API or RPC before extracting one exact tx hash or receipt id from NEAR Data.

## Related guides

- [NEAR Data API](/neardata)
- [Transactions API](/tx)
- [RPC Reference](/rpc)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
