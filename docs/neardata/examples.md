---
sidebar_label: Examples
slug: /neardata/examples
title: NEAR Data Examples
description: Plain-language workflows for checking whether a contract was touched in the latest finalized block and extracting the exact hashes worth following up.
displayed_sidebar: nearDataApiSidebar
page_actions:
  - markdown
---

## Quick start

Start with one recent finalized block and ask for the smallest possible touch summary first.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_ACCOUNT_ID=YOUR_CONTRACT_ID

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
        | select((.transaction.receiver_id // .receiver_id) == $target)] | length),
      incoming_receipt_count: ([.shards[].chunk.receipts[]?
        | select(.receiver_id == $target)] | length),
      outcome_hit_count: ([.shards[].receipt_execution_outcomes[]?
        | select(
            (.receipt.receiver_id // "") == $target
            or (.execution_outcome.outcome.executor_id // "") == $target
          )] | length),
      state_change_count: ([.shards[].state_changes[]?
        | select((.change.account_id // "") == $target)] | length)
    } | . + {
      touched: (
        (.direct_tx_count > 0)
        or (.incoming_receipt_count > 0)
        or (.outcome_hit_count > 0)
        or (.state_change_count > 0)
      )
    }'
```

This is the smallest useful NEAR Data summary for an app team: one finalized block, one yes-or-no answer, and a few counts before you widen.

## Worked investigation

### Did my contract get touched in the latest finalized block?

Use this investigation when you want a concrete yes/no answer before you widen into Transactions API or RPC.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Anchor on one finalized block, scan the whole block family for your target account, then keep only one small summary plus the identifiers worth following up.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">last-block-final</span> gives you one stable block height without guessing.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">block</span> is the main read: it already contains the transactions, receipts, receipt execution outcomes, and state changes you need to answer “touched or not?”.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>Only if the answer is “yes” do you widen: keep the shard ids, tx hashes, and receipt ids you discovered, then hand those exact identifiers to [Transactions API](/tx) or [RPC Reference](/rpc).</span></p>
  </div>
</div>

**Goal**

- Decide whether one target contract was touched in the latest finalized block, and keep only the shard ids, counts, and sample identifiers worth investigating next.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Latest stable anchor | NEAR Data [`last-block-final`](/neardata/last-block-final) | Get one finalized block height without guessing | Gives you a stable starting point for the whole question |
| Whole block family | NEAR Data [`block`](/neardata/block) | Scan transactions, receipts, receipt execution outcomes, and state changes for the target account | This is the main answer surface for “was my contract touched?” |
| Light block summary | NEAR Data [`block-headers`](/neardata/block-headers) | Use when you only need the height, hash, timing, or chunk headers | Avoids the wider block payload when contract-level filtering is not needed |
| Optional shard follow-up | NEAR Data [`block-chunk`](/neardata/block-chunk) or [`block-shard`](/neardata/block-shard) | Re-open only the touched shard if you need deeper payload details | Useful after you already know which shard mattered |
| Exact follow-up surfaces | [Transactions API](/tx) or [RPC Reference](/rpc) | Reuse the discovered tx hashes or receipt ids only if you need the full execution story | NEAR Data tells you whether widening is necessary at all |

**What a useful answer should include**

- finalized height and hash
- touched or not touched
- counts for direct txs, incoming receipts, outcome hits, and state changes
- one sample tx hash or receipt id per category when present

### Final block to contract-touch answer shell walkthrough

Use this when the target account is already known and you want one recent finalized answer, not a long polling loop.

**What you're doing**

- Get the latest finalized block redirect target.
- Fetch the full block document once.
- Build one small touch summary for one `TARGET_ACCOUNT_ID`.
- Return a yes/no answer plus the smallest useful counts and sample identifiers.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_ACCOUNT_ID=YOUR_CONTRACT_ID

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

BLOCK_HEIGHT="$(printf '%s' "$FINAL_LOCATION" | sed -E 's#.*/([0-9]+)$#\1#')"

printf 'Final redirect target: %s\n' "$FINAL_LOCATION"
printf 'Final block height: %s\n' "$BLOCK_HEIGHT"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | tee /tmp/neardata-block.json >/dev/null

jq --arg target "$TARGET_ACCOUNT_ID" '
  (
    [
      .shards[]
      | .chunk.transactions[]?
      | select((.transaction.receiver_id // .receiver_id) == $target)
      | (.transaction.hash // .hash)
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
      sample_direct_tx: ($txs[0] // null),
      sample_incoming_receipt: ($receipts[0] // null),
      sample_outcome_tx_hash: ($outcomes[0] // null)
    }
' /tmp/neardata-block.json | tee /tmp/neardata-touch-summary.json
```

If you need richer shard-by-shard or full-list detail later, keep reusing `/tmp/neardata-block.json`. The point of this first pass is to answer “touched or not?” before you widen into longer arrays or deeper traces.

Optional extension: if you still want the touched shard ids, compute them from the same cached block without changing the main answer shape:

```bash
jq --arg target "$TARGET_ACCOUNT_ID" '
  [
    .shards[]
    | .shard_id as $shard_id
    | select(
        ([.chunk.transactions[]? | (.transaction.receiver_id // .receiver_id)] | index($target))
        or ([.chunk.receipts[]? | .receiver_id] | index($target))
        or ([.receipt_execution_outcomes[]? | .receipt.receiver_id, .execution_outcome.outcome.executor_id] | index($target))
        or ([.state_changes[]? | .change.account_id] | index($target))
      )
    | $shard_id
  ] | unique
' /tmp/neardata-block.json
```

If that answer says `touched: true` and you want one shard-level follow-up, reopen only the first touched shard:

```bash
TOUCHED_SHARD_ID="$(
  jq -r --arg target "$TARGET_ACCOUNT_ID" '
    first(
      .shards[]
      | .shard_id as $shard_id
      | select(
          ([.chunk.transactions[]? | (.transaction.receiver_id // .receiver_id)] | index($target))
          or ([.chunk.receipts[]? | .receiver_id] | index($target))
          or ([.receipt_execution_outcomes[]? | .receipt.receiver_id, .execution_outcome.outcome.executor_id] | index($target))
          or ([.state_changes[]? | .change.account_id] | index($target))
        )
      | $shard_id
    ) // empty
  ' /tmp/neardata-block.json
)"

if [ -n "$TOUCHED_SHARD_ID" ]; then
  curl -s "$NEARDATA_BASE_URL/v0/block/$BLOCK_HEIGHT/chunk/$TOUCHED_SHARD_ID" \
    | jq '{
        shard_id: .header.shard_id,
        chunk_hash: .header.chunk_hash,
        tx_hashes: ([.transactions[]? | (.transaction.hash // .hash)] | .[:5]),
        receipt_ids: ([.receipts[]? | .receipt_id] | .[:5]),
        receipt_receivers: ([.receipts[]? | .receiver_id] | .[:5])
      }'
fi
```

**Why this next step?**

This keeps the question as small as possible: first answer “was my contract touched?”, then widen only if one of the sample identifiers justifies a deeper trace. NEAR Data is the discovery layer here, not just a block monitor.


## Common mistakes

- Treating NEAR Data like a push stream instead of a polling or point-read API.
- Starting with RPC before checking whether one finalized block already answers the contract-touch question.
- Looking only for direct transactions and forgetting that contracts are often touched through receipts or state changes.
- Assuming one hard-coded shard id should be checked before you inspect the block family itself.
- Widening to Transactions API or RPC before extracting the exact shard ids, tx hashes, or receipt ids from NEAR Data.

## Related guides

- [NEAR Data API](/neardata)
- [Transactions API](/tx)
- [RPC Reference](/rpc)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
