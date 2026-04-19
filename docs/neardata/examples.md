---
sidebar_label: Examples
slug: /neardata/examples
title: NEAR Data Examples
description: Plain-language workflows for recent contract-touch monitoring, optimistic confirmation, and shard-local change inspection.
displayed_sidebar: nearDataApiSidebar
page_actions:
  - markdown
---

NEAR Data is strongest when the real question is about recent chain activity: did a contract show up in the newest block family, did an optimistic signal survive finality, and which shard actually carried the change?

## Worked investigations

### Did my contract get touched in the latest finalized block?

Use this when your app, bot, or support tool needs one fast answer about a live contract. We will check `intents.near`, but the same summary works for any contract account.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Let NEAR Data answer the monitoring question first, then keep one tx hash or receipt ID for the next surface only if you need it.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">last-block-final</span> resolves the newest finalized height.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">block</span> gives one recent hydrated block document with shard payloads already attached.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>Summarize direct txs, incoming receipts, execution outcomes, and <span className="fastnear-example-strategy__code">state_changes</span> for your contract. Treat <span className="fastnear-example-strategy__code">state_changes</span> as the strongest signal that the contract was actually changed.</span></p>
  </div>
</div>

This can honestly return `touched: false` in a quiet block. That is still a useful answer: nothing in the newest finalized block currently needs deeper tracing.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_CONTRACT=intents.near

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

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

printf 'Latest finalized block: %s\n' "$FINAL_LOCATION"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | tee /tmp/neardata-final-block.json \
  | contract_touch_summary "$TARGET_CONTRACT"
```

Read the answer like this:

- `touched: false` means the newest finalized block did not mention or mutate the contract in any of the monitored ways.
- `sample_tx_hash` means you already have a good `/tx` anchor for the next question.
- `sample_receipt_id` without a tx hash usually means the contract showed up through receipt-driven execution, so NEAR Data already saved you the cheaper monitoring step.

### Did I see activity optimistically, and did it survive finality?

Use this when you want an early signal for a live contract, but the stable answer still needs finalized confirmation.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Use the same contract-touch vocabulary on both surfaces so the comparison stays honest.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">last-block-optimistic</span> resolves the newest optimistic height.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">block-optimistic</span> shows the early signal for the same contract.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">block</span> at the same height either confirms the same observation or proves finality has not caught up yet.</span></p>
  </div>
</div>

If finality has already caught up, the optimistic and finalized summaries may match immediately. That is still useful: it tells you the early signal already survived into stable history.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_CONTRACT=intents.near

contract_touch_summary() {
  jq -r --arg contract "$1" '
    [ .shards[] | {
        shard_id,
        direct_txs: ([.chunk.transactions[]? | select(.transaction.receiver_id == $contract)] | length),
        incoming_receipts: ([.chunk.receipts[]? | select(.receiver_id == $contract)] | length),
        execution_outcomes: ([.receipt_execution_outcomes[]? | select(.execution_outcome.outcome.executor_id == $contract)] | length),
        state_changes: ([.state_changes[]? | select(.change.account_id? == $contract)] | length)
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
        }
      }'
}

OPT_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

OPT_HEIGHT="${OPT_LOCATION##*/}"

printf 'Latest optimistic block: %s\n' "$OPT_LOCATION"

curl -s "$NEARDATA_BASE_URL$OPT_LOCATION" \
  | tee /tmp/neardata-optimistic-block.json \
  | contract_touch_summary "$TARGET_CONTRACT"

curl -s "$NEARDATA_BASE_URL/v0/block/$OPT_HEIGHT" \
  | tee /tmp/neardata-final-same-height.json >/dev/null

if jq -e 'type == "null"' /tmp/neardata-final-same-height.json >/dev/null; then
  printf 'Finalized block %s is not available yet; finality has not caught up.\n' "$OPT_HEIGHT"
else
  printf 'Finalized block %s is already available; compare the stable answer below.\n' "$OPT_HEIGHT"
  contract_touch_summary "$TARGET_CONTRACT" < /tmp/neardata-final-same-height.json
fi
```

That is the practical split:

- optimistic is the early signal that your monitoring loop can react to quickly;
- finalized is the stable answer you can show to users or use for durable automation.

### Which shard actually changed my contract in this block?

Use this when a recent block already showed contract activity and you now want the shard-local proof of where the change actually landed.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Use the full block to find the winning shard, then let <span className="fastnear-example-strategy__code">block-shard</span> prove the actual mutation.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span>Scan the finalized block’s shard list for <span className="fastnear-example-strategy__code">state_changes</span> on your contract.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span>Open only the shard that actually changed the contract.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>Keep the matching state changes and receipt execution outcomes as your shard-local proof.</span></p>
  </div>
</div>

At the time of writing, recent finalized block `194727131` gave a clean live `intents.near` example: the contract first appeared as an incoming receipt on shard `8`, then actually executed and changed state on shard `7`.

If you need a fresher block, reuse the same summary from the first example over a few nearby finalized heights and then plug the winning height into the same `block-shard` call.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_CONTRACT=intents.near
EXAMPLE_HEIGHT=194727131

curl -s "$NEARDATA_BASE_URL/v0/block/$EXAMPLE_HEIGHT" \
  | tee /tmp/neardata-block-194727131.json \
  | jq --arg contract "$TARGET_CONTRACT" '[
      .shards[] | {
        shard_id,
        incoming_receipts: ([.chunk.receipts[]? | select(.receiver_id == $contract)] | length),
        execution_outcomes: ([.receipt_execution_outcomes[]? | select(.execution_outcome.outcome.executor_id == $contract)] | length),
        state_changes: ([.state_changes[]? | select(.change.account_id? == $contract)] | length)
      }
      | select(.incoming_receipts + .execution_outcomes + .state_changes > 0)
    ]'

curl -s "$NEARDATA_BASE_URL/v0/block/$EXAMPLE_HEIGHT/shard/7" \
  | jq --arg contract "$TARGET_CONTRACT" '{
      shard_id,
      chunk_hash: .chunk.header.chunk_hash,
      matching_state_changes: [
        .state_changes[]
        | select(.change.account_id? == $contract)
        | {type, cause, account_id: .change.account_id}
      ][0:2],
      matching_execution_outcomes: [
        .receipt_execution_outcomes[]
        | select(.execution_outcome.outcome.executor_id == $contract)
        | {
            receipt_id: .execution_outcome.id,
            executor_id: .execution_outcome.outcome.executor_id,
            status: .execution_outcome.outcome.status,
            predecessor_id: .receipt.predecessor_id
          }
      ][0:2]
    }'
```

That is the practical rule:

- use `block` when the first question is “which shard mattered?”;
- use `block-shard` when the real question becomes “show me the actual state-changing shard payload.”

## When to widen

- Use [Transactions API](/tx) once you have a `tx_hash` and want the human-readable transaction story.
- Use [RPC Reference](/rpc) when the next question is about exact protocol-native receipt or block semantics.
- Use [Block Headers](/neardata/block-headers) when you only need head progression or finality lag, not contract-touch inspection.
