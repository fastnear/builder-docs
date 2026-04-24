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

NEAR Data returns each block fully hydrated as one JSON document — header plus per-shard chunks, receipts, execution outcomes, and state changes — so a single `curl` gives you everything you need to filter for a specific contract without a second call.

All shell examples below work on the public NEAR Data hosts as-is. If `FASTNEAR_API_KEY` is set in your shell, they add it as a bearer header automatically; if it is unset, they fall back to the public unauthenticated path.

### What block is NEAR on right now?

`/v0/last_block/final` 302-redirects to the current finalized block. Before filtering for a specific contract, it's worth seeing what one block looks like at the protocol level: transactions arrive sharded, so the tx count for a block is a sum across shards — not a single top-level number.

```bash
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -sL "https://mainnet.neardata.xyz/v0/last_block/final" \
  "${AUTH_HEADER[@]}" \
  | jq '{
      height: .block.header.height,
      timestamp_nanosec: .block.header.timestamp_nanosec,
      txs_per_shard: [.shards[] | {shard_id, tx_count: (.chunk.transactions | length)}],
      total_txs: ([.shards[].chunk.transactions[]?] | length)
    }'
```

A live block shows 9 shards and a handful of transactions scattered across them — most shards are empty in any given block, and activity tends to cluster on whichever shards host the busy contracts. `timestamp_nanosec` is a Unix time in nanoseconds (divide by 1e9 for seconds). With this one call you already have everything needed to dig deeper — the filtering examples below are just jq over this same response.

### Did my contract get touched in the latest finalized block?

`/v0/last_block/final` 302-redirects to the current finalized block. Contracts can show up in a chunk's `transactions` (when they are the `receiver_id`) or in its `receipts` (when a cross-shard call lands), so one jq pass over the shards covers both.

```bash
TARGET_CONTRACT=intents.near
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -sL "https://mainnet.neardata.xyz/v0/last_block/final" \
  "${AUTH_HEADER[@]}" \
  | jq --arg contract "$TARGET_CONTRACT" '{
      height: .block.header.height,
      contract: $contract,
      touched_shards: [
        .shards[] | {
          shard_id,
          txs:      [.chunk.transactions[]? | select(.transaction.receiver_id == $contract) | .transaction.hash],
          receipts: [.chunk.receipts[]?     | select(.receiver_id == $contract)             | .receipt_id]
        } | select((.txs | length) + (.receipts | length) > 0)
      ]
    }'
```

`touched_shards: []` is a complete answer for a quiet block. A non-empty list names the shards where the contract showed up and gives you the concrete `tx` hashes or `receipt_id`s — pipe a hash into the [Transactions API](/tx) when you want the human-readable story. Receipts without matching `txs` are normal: a cross-contract call shows up as an incoming receipt in this block even if the originating transaction landed earlier.

### Did activity show up optimistically, and did finality catch up?

Optimistic blocks ship at `/v0/block_opt/{height}` about a second ahead of `/v0/block/{height}`. A monitoring loop can act on the optimistic signal and expect the same answer to arrive at the finalized endpoint one block later — unless network stress widens the gap, in which case the finalized fetch returns `null` and you wait.

```bash
TARGET_CONTRACT=intents.near
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

count_touches() {
  jq --arg contract "$1" '
    [.shards[]
     | ([.chunk.transactions[]? | select(.transaction.receiver_id == $contract)] | length)
     + ([.chunk.receipts[]?     | select(.receiver_id == $contract)]             | length)]
    | add // 0'
}

OPT_LOCATION="$(
  curl -s -D - -o /dev/null "${AUTH_HEADER[@]}" "https://mainnet.neardata.xyz/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' | tr -d '\r'
)"
OPT_HEIGHT="${OPT_LOCATION##*/}"

echo "optimistic @ $OPT_HEIGHT: $(curl -s "https://mainnet.neardata.xyz$OPT_LOCATION" \
  "${AUTH_HEADER[@]}" | count_touches "$TARGET_CONTRACT") touches"
FINAL="$(curl -s "https://mainnet.neardata.xyz/v0/block/$OPT_HEIGHT" \
  "${AUTH_HEADER[@]}")"
if [ "$(printf '%s' "$FINAL" | jq 'type')" = '"null"' ]; then
  echo "finalized @ $OPT_HEIGHT: not caught up yet"
else
  echo "finalized @ $OPT_HEIGHT: $(printf '%s' "$FINAL" | count_touches "$TARGET_CONTRACT") touches"
fi
```

On a healthy mainnet the two counts match within a second. The value is in the *pattern* — the optimistic stream gives you an answer you can act on immediately, with the finalized stream arriving a block later as durable confirmation.

### Which shard actually changed my contract's state?

Most finalized blocks show no state mutation for any given contract — activity is sparse and shard-local. Walk back from the finalized head until the contract's state actually changes, then open that shard for the mutation payload. The block-level call tells you *which* shard; the shard-level call tells you *how*.

```bash
TARGET_CONTRACT=intents.near
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

HEAD="$(curl -sL "https://mainnet.neardata.xyz/v0/last_block/final" \
  "${AUTH_HEADER[@]}" | jq '.block.header.height')"
FOUND_HEIGHT=""
FOUND_SHARD=""

for OFFSET in $(seq 0 15); do
  H=$((HEAD - OFFSET))
  SHARD="$(curl -s "https://mainnet.neardata.xyz/v0/block/$H" \
    "${AUTH_HEADER[@]}" \
    | jq -r --arg contract "$TARGET_CONTRACT" '
        .shards[]
        | select([.state_changes[]? | select(.change.account_id? == $contract)] | length > 0)
        | .shard_id
      ' | head -1)"
  if [ -n "$SHARD" ]; then
    FOUND_HEIGHT=$H; FOUND_SHARD=$SHARD
    break
  fi
done

if [ -z "$FOUND_HEIGHT" ]; then
  echo "no state mutation for $TARGET_CONTRACT in the last 16 finalized blocks"
else
  curl -s "https://mainnet.neardata.xyz/v0/block/$FOUND_HEIGHT/shard/$FOUND_SHARD" \
    "${AUTH_HEADER[@]}" \
    | jq --arg contract "$TARGET_CONTRACT" --argjson height "$FOUND_HEIGHT" --argjson shard_id "$FOUND_SHARD" '{
        height: $height,
        shard_id: $shard_id,
        state_changes:      [.state_changes[]              | select(.change.account_id?                        == $contract) | {type, cause: (.cause | keys[0])}][0:3],
        execution_outcomes: [.receipt_execution_outcomes[] | select(.execution_outcome.outcome.executor_id     == $contract) | {receipt_id: .execution_outcome.id, status: (.execution_outcome.outcome.status | keys[0])}][0:3]
      }'
fi
```

On mainnet, `intents.near` lives on shard 7, so the walk typically lands within a handful of blocks. The shard payload names the actual state-change types (`account_update`, `data_update`, etc.) and the receipt outcomes that caused them — shard-local proof without guessing. Widen the offset range for contracts with lighter traffic.

## When to widen

- Use the [Transactions API](/tx) once you have a `tx_hash` and want the human-readable transaction story.
- Use the [RPC Reference](/rpc) when the next question is about exact protocol-native receipt or block semantics.
- Use [Block Headers](/neardata/block-headers) when you only need head progression or finality lag, not contract-touch inspection.
