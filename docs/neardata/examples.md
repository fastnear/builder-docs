---
sidebar_label: Examples
slug: /neardata/examples
title: NEAR Data Examples
description: Task-first NEAR Data examples for live monitoring, optimistic checks, and shard-local proof.
displayed_sidebar: nearDataApiSidebar
page_actions:
  - markdown
---

## Examples

Each hydrated NEAR Data block document carries per-shard transactions, receipts, execution outcomes, and state changes. The three scenarios below share one `bash` helper that rolls those four signals into a single summary with handoff fields. Define it once, then pipe blocks through it:

```bash
contract_touch_summary() {
  jq -r --arg contract "$1" '
    [ .shards[] | {
        shard_id,
        direct_txs: ([.chunk.transactions[]? | select(.transaction.receiver_id == $contract)] | length),
        incoming_receipts: ([.chunk.receipts[]? | select(.receiver_id == $contract)] | length),
        execution_outcomes: ([.receipt_execution_outcomes[]? | select(.execution_outcome.outcome.executor_id == $contract)] | length),
        state_changes: ([.state_changes[]? | select(.change.account_id? == $contract)] | length),
        sample_tx_hash: ([.chunk.transactions[]? | select(.transaction.receiver_id == $contract) | .transaction.hash] | .[0]),
        sample_receipt_id: (
          [ .chunk.receipts[]? | select(.receiver_id == $contract) | .receipt_id ] +
          [ .receipt_execution_outcomes[]? | select(.execution_outcome.outcome.executor_id == $contract) | .execution_outcome.id ] +
          [ .state_changes[]? | select(.change.account_id? == $contract) | (.cause.receipt_hash? // empty) ]
          | .[0]
        )
      }
      | select(.direct_txs + .incoming_receipts + .execution_outcomes + .state_changes > 0)
    ] as $rows
    | {
        height: .block.header.height,
        hash: .block.header.hash,
        contract: $contract,
        touched: (($rows | length) > 0),
        shards: ($rows | map(.shard_id)),
        evidence: {
          direct_txs: (($rows | map(.direct_txs) | add) // 0),
          incoming_receipts: (($rows | map(.incoming_receipts) | add) // 0),
          execution_outcomes: (($rows | map(.execution_outcomes) | add) // 0),
          state_changes: (($rows | map(.state_changes) | add) // 0)
        },
        sample_tx_hash: ([ $rows[] | .sample_tx_hash | select(.) ] | .[0]),
        sample_receipt_id: ([ $rows[] | .sample_receipt_id | select(.) ] | .[0])
      }'
}
```

### Did my contract get touched in the latest finalized block?

`/v0/last_block/final` 302-redirects to the current finalized block; follow it and pipe straight through the helper.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_CONTRACT=intents.near

curl -sL "$NEARDATA_BASE_URL/v0/last_block/final" \
  | contract_touch_summary "$TARGET_CONTRACT"
```

Read `touched: false` as a complete, unambiguous answer for a quiet block. On `true`, the handoff fields (`sample_tx_hash`, `sample_receipt_id`) drop you straight into [/tx/examples](/tx/examples) for the readable story. One call replaces scanning chunks by hand — and note that `touched: true` with `state_changes: 0` is a real shape: a receipt can land in a chunk without producing state mutation in the same block.

### Did I see activity optimistically, and did it survive finality?

Optimistic blocks live at `/v0/block_opt/{height}`; once finality catches up (usually within one block, ~1s on mainnet), the same height is also served at `/v0/block/{height}`. Run the helper on both and compare.

```bash
OPT_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' | tr -d '\r'
)"
OPT_HEIGHT="${OPT_LOCATION##*/}"

echo "Optimistic view at $OPT_HEIGHT:"
curl -s "$NEARDATA_BASE_URL$OPT_LOCATION" | contract_touch_summary "$TARGET_CONTRACT"

echo "Finalized view at $OPT_HEIGHT:"
FINAL="$(curl -s "$NEARDATA_BASE_URL/v0/block/$OPT_HEIGHT")"
if [ "$(echo "$FINAL" | jq 'type')" = '"null"' ]; then
  echo "finality has not caught up to $OPT_HEIGHT yet"
else
  echo "$FINAL" | contract_touch_summary "$TARGET_CONTRACT"
fi
```

On a healthy network the two summaries match immediately; the value is in the pattern, not the dramatic difference. A monitoring loop that reacts to the optimistic signal knows the same answer is one block away from durable. Use the `finality has not caught up` branch when you really do need to distinguish "seen optimistically" from "confirmed" — during chain stress, that gap widens.

### Which shard actually changed my contract in this block?

Blocks are thin — most finalized blocks show no state mutation for any given contract. Walk back from the finalized head until the helper reports `state_changes > 0`, then open the winning shard with `/v0/block/{height}/shard/{shard_id}` for the actual mutation payload.

```bash
HEAD="$(curl -sL "$NEARDATA_BASE_URL/v0/last_block/final" | jq '.block.header.height')"
TARGET_HEIGHT=""
WINNING_SHARD=""

for OFFSET in 0 1 2 3 4 5 6 7 8 9; do
  H=$((HEAD - OFFSET))
  SUMMARY="$(curl -s "$NEARDATA_BASE_URL/v0/block/$H" | contract_touch_summary "$TARGET_CONTRACT")"
  if [ "$(echo "$SUMMARY" | jq '.evidence.state_changes')" -gt 0 ]; then
    TARGET_HEIGHT=$H
    WINNING_SHARD="$(echo "$SUMMARY" | jq -r '.shards[0]')"
    echo "$SUMMARY"
    break
  fi
done

curl -s "$NEARDATA_BASE_URL/v0/block/$TARGET_HEIGHT/shard/$WINNING_SHARD" \
  | jq --arg contract "$TARGET_CONTRACT" '{
      shard_id,
      chunk_hash: .chunk.header.chunk_hash,
      matching_state_changes: [.state_changes[] | select(.change.account_id? == $contract) | {type, cause_type: (.cause | keys[0]), account_id: .change.account_id}][0:3],
      matching_execution_outcomes: [.receipt_execution_outcomes[] | select(.execution_outcome.outcome.executor_id == $contract) | {receipt_id: .execution_outcome.id, status: (.execution_outcome.outcome.status | keys[0]), predecessor_id: .receipt.predecessor_id}][0:3]
    }'
```

On mainnet, `intents.near` consistently executes on shard 7, so the walk-back typically lands within a few blocks. The shard payload then names the actual state-change types (`account_update`, `data_update`, and the like) and the receipt execution outcomes that produced them — shard-local proof without guessing. Widen the `OFFSET` range for less-active contracts.

## When to widen

- Use [Transactions API](/tx) once you have a `tx_hash` and want the human-readable transaction story.
- Use [RPC Reference](/rpc) when the next question is about exact protocol-native receipt or block semantics.
- Use [Block Headers](/neardata/block-headers) when you only need head progression or finality lag, not contract-touch inspection.
