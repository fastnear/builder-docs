---
sidebar_label: Examples
slug: /tx/examples
title: Transactions API Examples
description: Plain-language workflows for using Transactions API docs for transaction lookups, receipt investigation, account history, and block windows.
displayed_sidebar: transactionsApiSidebar
page_actions:
  - markdown
---

# Transactions API Examples

Use this page when the question is "what happened?" and you want indexed history before dropping to canonical RPC confirmation. Start with the identifier you already have, explain the execution story in readable order, and widen only if exact RPC semantics become necessary.

## When to start here

- You already have a transaction hash, receipt ID, account ID, or bounded block range.
- The user wants execution history, support/debug context, or a readable timeline.
- You need indexed history without rebuilding it from raw RPC calls.
- The first answer should explain what happened before it dives into protocol detail.

## Minimum inputs

- network: mainnet or testnet
- primary identifier: transaction hash, receipt ID, `account_id`, or block/range
- whether you are investigating one item or a history window
- whether canonical RPC confirmation is required before you stop

## Common jobs

### Look up one transaction

**Start here**

- [Transactions by Hash](/tx/transactions) when you already know the transaction ID.

**Next page if needed**

- [Receipt Lookup](/tx/receipt) if the interesting part is now a downstream receipt.
- [Block](/tx/block) if the block context matters.
- [Transaction Status](/rpc/transaction/tx-status) if you need canonical RPC confirmation.

**Stop when**

- You can explain the outcome, affected accounts, and the main execution takeaway.

**Widen when**

- The user asks for exact RPC-level status semantics or submission behavior.
- The transaction lookup alone is not enough to explain downstream execution.

### Investigate a receipt

**Start here**

- [Receipt Lookup](/tx/receipt) when the receipt ID is your best anchor.

**Next page if needed**

- [Transactions by Hash](/tx/transactions) to reconnect the receipt to the originating transaction story.
- [Account History](/tx/account) if you need to see the surrounding activity for one of the touched accounts.

**Stop when**

- You can say where the receipt fits in the execution flow and why it matters.

**Widen when**

- The user needs exact canonical confirmation beyond the indexed receipt view. Move to [RPC Reference](/rpc).
- The question shifts from one receipt to a broader history investigation.

### Review recent account activity

**Start here**

- [Account History](/tx/account) for an account-centric activity feed.

**Next page if needed**

- [Transactions by Hash](/tx/transactions) for a specific transaction from the feed.
- [Receipt Lookup](/tx/receipt) if one receipt becomes the real focus.

**Stop when**

- The account history already answers what the account has been doing.

**Widen when**

- The user actually wants transfer-only movement instead of broader execution context. Move to [Transfers API](/transfers).
- The user actually wants exact current state or holdings, not history. Move to [RPC Reference](/rpc) or [FastNear API](/api).

### Reconstruct a bounded block window

**Start here**

- [Blocks](/tx/blocks) for a bounded block-range scan.
- [Block](/tx/block) when you already know the exact block you want.

**Next page if needed**

- [Transactions by Hash](/tx/transactions) to inspect a specific item from the block window.
- [Receipt Lookup](/tx/receipt) when one receipt becomes the important follow-up.

**Stop when**

- The bounded history window answers the question without dropping into lower-level protocol details.

**Widen when**

- The user needs exact canonical block fields or transaction finality. Move to [RPC Reference](/rpc).
- The user really wants freshest polling-oriented block reads rather than indexed history. Move to [NEAR Data API](/neardata).

## Worked investigations

### Prove callback order in a staged release flow

Use this investigation when you staged async work first, released it later, and need to prove not just that the transactions succeeded, but that the downstream callbacks executed in a particular order.

**Goal**

- Turn two transaction hashes into a durable forensic record that covers receipt DAGs, block anchors, and contract state changes.

In staged-release flows, the stage transaction usually remains the primary forensic anchor because the yielded callback receipts stay on its original transaction tree, not on the release transaction's tree.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Stage and release trace capture | RPC [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status) | Query the stage transaction hash and the release transaction hash with `wait_until: "FINAL"`, usually hot RPC first and archival RPC on `UNKNOWN_TRANSACTION` | The receipt DAG is the primary proof surface for callback order and tells you which receipts belong to which transaction tree |
| Stage materialization check | RPC [`query(call_function)`](/rpc/contract/call-function) | Poll the staging contract's view method, such as `staged_calls_for({ caller_id })`, with `finality: "final"` until the yielded steps appear | Confirms the yielded callbacks are actually live before the release transaction tries to resume them |
| Transaction enrichment | Transactions API [`POST /v0/transactions`](/tx/transactions) | Fetch both transaction hashes to recover `block_height`, `block_hash`, `receiver_id`, and indexed execution status | Gives each transaction a durable block anchor so later archival or human follow-up does not depend on memory |
| Recorder state snapshots | RPC [`query(call_function)`](/rpc/contract/call-function) | Read the downstream recorder state before the release, then poll it after release until the expected entries appear | Proves actual downstream effect order in contract state, not just metadata in the receipt tree |
| Receipt pivot | Transactions API [`POST /v0/receipt`](/tx/receipt) | Use any interesting yielded or downstream receipt ID to reconnect it to the originating transaction | Lets you move quickly from one receipt in the DAG back to the broader transaction story |
| Per-block reconstruction | Transactions API [`POST /v0/block`](/tx/block) | Fetch the included block and the cascade blocks with receipts enabled | Reconstructs the block-by-block execution timeline once you know which blocks matter |
| Account activity context | Transactions API [`POST /v0/account`](/tx/account) | Fetch function-call history for the contracts that participated in the cascade over the same window | Gives humans a simpler account-history view to compare against the trace |
| Block-pinned state replay | RPC [`query(call_function)`](/rpc/contract/call-function) | Re-run the recorder view with `block_id` pinned to the interesting heights | Turns final state into a time series so you can say when state changed, not just what it became |

**What a useful answer should include**

- why the stage transaction, not the release transaction, is usually the primary forensic anchor
- the callback order you observed
- the blocks where the observable state changed
- any receipt or account pivots the next investigator should keep

### Start from a receipt ID and rebuild the execution story

Use this investigation when the only thing you have is a receipt ID from a trace, error report, or callback tree and you need to get back to a readable story of what happened.

**Goal**

- Pivot from one receipt to the originating transaction, then widen just enough to explain the surrounding execution and state effects.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Receipt anchor | Transactions API [`POST /v0/receipt`](/tx/receipt) | Look up the receipt ID first and identify the receipt payload, status, and linked transaction context | Receipt IDs show up in traces and logs before humans know the full transaction story |
| Transaction story | Transactions API [`POST /v0/transactions`](/tx/transactions) | Pull the originating transaction by hash once the receipt lookup gives you the pivot | Turns one receipt into a readable execution story with receiver, block, and status context |
| Canonical confirmation | RPC [`tx`](/rpc/transaction/tx-status) or [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status) | Confirm the protocol-level result when the indexed view is not enough or the user needs canonical semantics | Useful when the investigation must distinguish between indexed interpretation and exact RPC behavior |
| Block context | Transactions API [`POST /v0/block`](/tx/block) | Fetch the containing block, and widen to nearby cascade blocks if the execution spilled over multiple heights | Places the receipt into a block timeline that is easier to explain |
| Account window | Transactions API [`POST /v0/account`](/tx/account) | Pull recent activity for the accounts touched by the receipt | Helps correlate the receipt with the surrounding account-level history |
| State replay | RPC [`query(call_function)`](/rpc/contract/call-function) | Re-run the relevant view method at a pinned `block_id` if the receipt changed contract-visible state | Lets you prove whether a receipt only existed in metadata or also changed durable contract state |

**What a useful answer should include**

- the originating transaction you recovered from the receipt
- whether the receipt was the main event or only one step in a larger cascade
- the minimum block and account context needed to explain it
- whether the state effect was durable and at which block height it became visible

### Prove that `mike.near` set `profile.name` to `Mike Purvis`, then recover the SocialDB profile write transaction

Use this investigation when the user story is “I can see `Mike Purvis` on `mike.near`'s NEAR Social profile, but I want to prove exactly when that field was written and which transaction wrote it.”

**Goal**

- Start from one readable SocialDB profile field, then recover the exact receipt and originating transaction that wrote it.

**Official references**

- [SocialDB API and contract surface](https://github.com/NearSocial/social-db#api)
- [NEAR Social live read surface](https://api.near.social)

This follows the same proof recipe as the follow-edge investigation, but it teaches one extra SocialDB nuance: for historical proof, the field-level `:block` is usually more precise than the parent object's `:block`. In this live case, `mike.near/profile/name` was written at block `78675795`, while the broader `mike.near/profile` object later advanced to a different block because unrelated sibling fields changed. FastNear's role is to turn that field-level block into a receipt, then a transaction, and then a readable write payload.

For this live example, the current `profile.name` value is `Mike Purvis`, the field-level SocialDB write block is `78675795`, the receipt ID is `2gbAmEEdcCNARuCorquXStftqvWFmPG2GSaMJXFw5qiN`, the originating transaction hash is `6zMb9L6rLNufZGUgCmeHTh5LvFsn3R92dPxuubH6MRsZ`, and the outer transaction block is `78675794`.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Semantic field lookup | NEAR Social `POST /get` | Read `mike.near/profile/name` with block metadata enabled | Gives the human-readable field value and the field-level SocialDB `:block` anchor where that value was written |
| Receipt bridge | Transactions API [`POST /v0/block`](/tx/block) | Use the SocialDB field block with `with_receipts: true`, then filter the block receipts back down to `mike.near -> social.near` | Turns the field-level write block into a concrete receipt and originating transaction hash |
| Transaction story | Transactions API [`POST /v0/transactions`](/tx/transactions) | Fetch the originating transaction by hash and decode the first `FunctionCall.args` payload | Proves that the underlying write was a `social.near set` call that carried `profile.name` and the surrounding profile fields in the same payload |
| Canonical current-state confirmation | RPC [`query(call_function)`](/rpc/contract/call-function) | Call `social.near get` directly at `final` | Confirms the field still has that value now, even though the earlier steps already proved the specific historical write |

**What a useful answer should include**

- whether `mike.near/profile/name` still resolves to `Mike Purvis`
- the field-level SocialDB write block height (`78675795`) and why that anchor is better than the parent profile block for this question
- the specific receipt ID and originating transaction hash behind that write
- proof that the write was a `set` call carrying `profile.name` and other profile fields in the same payload
- the distinction between the receipt execution block (`78675795`) and the outer transaction inclusion block (`78675794`)

### NEAR Social profile-proof shell walkthrough

Use this when you want a concrete, repeatable proof chain from one readable NEAR Social profile field to the exact SocialDB write transaction behind it.

**What you're doing**

- Read the current `profile.name` field from NEAR Social and capture its field-level SocialDB write block.
- Reuse that block height in FastNear block receipts to recover the receipt ID and transaction hash.
- Reuse the transaction hash in `POST /v0/transactions` to prove the payload was a `social.near set` write carrying `profile.name`.
- Finish with canonical RPC confirmation that the field still resolves to the same value at `final`.

```bash
SOCIAL_API_BASE_URL=https://api.near.social
TX_BASE_URL=https://tx.main.fastnear.com
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mike.near
PROFILE_FIELD=profile/name
```

1. Read the profile field from NEAR Social and capture the field-level SocialDB write block.

```bash
PROFILE_BLOCK_HEIGHT="$(
  curl -s "$SOCIAL_API_BASE_URL/get" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$ACCOUNT_ID" \
      --arg profile_field "$PROFILE_FIELD" '{
        keys: [($account_id + "/" + $profile_field)],
        options: {with_block_height: true}
      }')" \
    | tee /tmp/mike-profile-name.json \
    | jq -r --arg account_id "$ACCOUNT_ID" \
        '.[ $account_id ].profile.name[":block"]'
)"

jq --arg account_id "$ACCOUNT_ID" '{
  current_name: .[$account_id].profile.name[""],
  field_block_height: .[$account_id].profile.name[":block"],
  parent_profile_block_height: .[$account_id].profile[":block"]
}' /tmp/mike-profile-name.json

# Expected current_name: "Mike Purvis"
# Expected field block height: 78675795
```

2. Reuse that block height in FastNear block receipts and recover the receipt and transaction bridge.

```bash
PROFILE_TX_HASH="$(
  curl -s "$TX_BASE_URL/v0/block" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --argjson block_id "$PROFILE_BLOCK_HEIGHT" '{
      block_id: $block_id,
      with_transactions: false,
      with_receipts: true
    }')" \
    | tee /tmp/mike-profile-block.json \
    | jq -r --arg account_id "$ACCOUNT_ID" '
        first(
          .block_receipts[]
          | select(.predecessor_id == $account_id and .receiver_id == "social.near")
          | .transaction_hash
        )'
)"

jq --arg account_id "$ACCOUNT_ID" '{
  profile_receipt: (
    first(
      .block_receipts[]
      | select(.predecessor_id == $account_id and .receiver_id == "social.near")
      | {
          receipt_id,
          transaction_hash,
          block_height,
          tx_block_height
        }
    )
  )
}' /tmp/mike-profile-block.json

# Expected receipt ID: 2gbAmEEdcCNARuCorquXStftqvWFmPG2GSaMJXFw5qiN
# Expected transaction hash: 6zMb9L6rLNufZGUgCmeHTh5LvFsn3R92dPxuubH6MRsZ
```

3. Reuse the derived transaction hash in `POST /v0/transactions` and decode the SocialDB write payload.

```bash
curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$PROFILE_TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | tee /tmp/mike-profile-transaction.json >/dev/null

jq '{
  transaction: {
    hash: .transactions[0].transaction.hash,
    signer_id: .transactions[0].transaction.signer_id,
    receiver_id: .transactions[0].transaction.receiver_id,
    included_block_height: .transactions[0].execution_outcome.block_height
  },
  write_proof: (
    .transactions[0].receipts[0].receipt.receipt.Action.actions[0].FunctionCall
    | {
        method_name,
        profile_name: (.args | @base64d | fromjson | .data["mike.near"].profile.name),
        description: (.args | @base64d | fromjson | .data["mike.near"].profile.description),
        tags: (
          .args
          | @base64d
          | fromjson
          | .data["mike.near"].profile.tags
          | keys
        )
      }
  )
}' /tmp/mike-profile-transaction.json
```

4. Finish with canonical current-state confirmation via raw RPC.

```bash
SOCIAL_GET_ARGS_BASE64="$(
  jq -nr --arg account_id "$ACCOUNT_ID" --arg profile_field "$PROFILE_FIELD" '{
    keys: [($account_id + "/" + $profile_field)]
  } | @base64'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg args_base64 "$SOCIAL_GET_ARGS_BASE64" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: "social.near",
      method_name: "get",
      args_base64: $args_base64,
      finality: "final"
    }
  }')" \
  | tee /tmp/mike-profile-rpc.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" '{
  finality: "final",
  current_name: (
    .result.result
    | implode
    | fromjson
    | .[$account_id].profile.name
  )
}' /tmp/mike-profile-rpc.json
```

That last step confirms the field still resolves to `Mike Purvis` now. The earlier NEAR Social and FastNear steps are what proved which historical write set that field and which transaction carried the write.

**Why this next step?**

NEAR Social gives you the semantic field value. FastNear block receipts give you the bridge to a specific write. FastNear transaction lookup turns that write into a readable profile payload. RPC gives you canonical current-state confirmation.

### Prove that `mike.near` followed `mob.near`, then recover the SocialDB write transaction

Use this investigation when the user story is “I can see that `mike.near` follows `mob.near`, but I want to prove exactly when that follow edge was written and which transaction wrote it.”

**Goal**

- Start from the readable NEAR Social follow edge, then recover the exact receipt and originating transaction that wrote it into SocialDB.

**Official references**

- [SocialDB API and contract surface](https://github.com/NearSocial/social-db#api)
- [NEAR Social live read surface](https://api.near.social)

The readable follow edge comes from NEAR Social data, not from FastNear. The important bridge is the SocialDB `:block` metadata: it tells you the receipt execution block where that value was written. That block is not the same thing as the original outer transaction inclusion block. FastNear's job in this workflow is to turn that block height into a receipt, then into a transaction, and finally into a readable execution story.

For this live example, the current edge is `mike.near -> mob.near`, the SocialDB write block is `79574924`, the receipt ID is `UiyiQaqHbkkMxkrB6rDkYr7X5EQLt8QG9MDATrES7Th`, the originating transaction hash is `FLLmTvFx9vCof79scy2uUviF5WwYmevkz9TZ8azPGVQb`, and the outer transaction block is `79574923`.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Semantic edge lookup | NEAR Social `POST /get` | Read `mike.near/graph/follow/mob.near` with block metadata enabled | Gives the human-readable follow edge and the SocialDB `:block` anchor where that value was written |
| Receipt bridge | Transactions API [`POST /v0/block`](/tx/block) | Use the SocialDB block height with `with_receipts: true`, then filter the block receipts back down to `mike.near -> social.near` | Turns the SocialDB write block into a concrete receipt and originating transaction hash |
| Transaction story | Transactions API [`POST /v0/transactions`](/tx/transactions) | Fetch the originating transaction by hash and decode the first `FunctionCall.args` payload | Proves that the underlying write was a `social.near set` call that wrote both `graph.follow` and `index.graph` entries |
| Canonical current-state confirmation | RPC [`query(call_function)`](/rpc/contract/call-function) | Call `social.near get` directly at `final` | Confirms the follow edge still exists now, even though the earlier steps already proved the specific historical write |

**What a useful answer should include**

- whether the `mike.near -> mob.near` follow edge exists now
- the SocialDB write block height (`79574924`) and why it is a receipt execution block
- the specific receipt ID and originating transaction hash behind that write
- proof that the write was a `set` call carrying both `graph.follow.mob.near` and the matching `index.graph` entry
- the distinction between the receipt execution block (`79574924`) and the outer transaction inclusion block (`79574923`)

### NEAR Social follow-proof shell walkthrough

Use this when you want a concrete, repeatable proof chain from one readable NEAR Social follow edge to the exact SocialDB write transaction behind it.

**What you're doing**

- Read the current follow edge from NEAR Social and capture the SocialDB write block.
- Reuse that block height in FastNear block receipts to recover the receipt ID and transaction hash.
- Reuse the transaction hash in `POST /v0/transactions` to prove the payload was a `social.near set` write.
- Finish with canonical RPC confirmation that the edge still exists at `final`.

```bash
SOCIAL_API_BASE_URL=https://api.near.social
TX_BASE_URL=https://tx.main.fastnear.com
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mike.near
TARGET_ACCOUNT_ID=mob.near
```

1. Read the follow edge from NEAR Social and capture the SocialDB write block.

```bash
FOLLOW_BLOCK_HEIGHT="$(
  curl -s "$SOCIAL_API_BASE_URL/get" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$ACCOUNT_ID" \
      --arg target_account_id "$TARGET_ACCOUNT_ID" '{
        keys: [($account_id + "/graph/follow/" + $target_account_id)],
        options: {with_block_height: true}
      }')" \
    | tee /tmp/mike-follow-edge.json \
    | jq -r --arg account_id "$ACCOUNT_ID" --arg target_account_id "$TARGET_ACCOUNT_ID" \
        '.[ $account_id ].graph.follow[ $target_account_id ][":block"]'
)"

jq --arg account_id "$ACCOUNT_ID" --arg target_account_id "$TARGET_ACCOUNT_ID" '{
  follow_edge: .[$account_id].graph.follow[$target_account_id][""],
  follow_block_height: .[$account_id].graph.follow[$target_account_id][":block"]
}' /tmp/mike-follow-edge.json

# Expected follow block height: 79574924
```

2. Reuse that block height in FastNear block receipts and recover the receipt and transaction bridge.

```bash
FOLLOW_TX_HASH="$(
  curl -s "$TX_BASE_URL/v0/block" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --argjson block_id "$FOLLOW_BLOCK_HEIGHT" '{
      block_id: $block_id,
      with_transactions: false,
      with_receipts: true
    }')" \
    | tee /tmp/mike-follow-block.json \
    | jq -r --arg account_id "$ACCOUNT_ID" '
        first(
          .block_receipts[]
          | select(.predecessor_id == $account_id and .receiver_id == "social.near")
          | .transaction_hash
        )'
)"

jq --arg account_id "$ACCOUNT_ID" '{
  follow_receipt: (
    first(
      .block_receipts[]
      | select(.predecessor_id == $account_id and .receiver_id == "social.near")
      | {
          receipt_id,
          transaction_hash,
          block_height,
          tx_block_height
        }
    )
  )
}' /tmp/mike-follow-block.json

# Expected receipt ID: UiyiQaqHbkkMxkrB6rDkYr7X5EQLt8QG9MDATrES7Th
# Expected transaction hash: FLLmTvFx9vCof79scy2uUviF5WwYmevkz9TZ8azPGVQb
```

3. Reuse the derived transaction hash in `POST /v0/transactions` and decode the SocialDB write payload.

```bash
curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$FOLLOW_TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | tee /tmp/mike-follow-transaction.json >/dev/null

jq '{
  transaction: {
    hash: .transactions[0].transaction.hash,
    signer_id: .transactions[0].transaction.signer_id,
    receiver_id: .transactions[0].transaction.receiver_id,
    included_block_height: .transactions[0].execution_outcome.block_height
  },
  write_proof: (
    .transactions[0].receipts[0].receipt.receipt.Action.actions[0].FunctionCall
    | {
        method_name,
        follow_edge: (.args | @base64d | fromjson | .data["mike.near"].graph.follow["mob.near"]),
        index_graph: (
          .args
          | @base64d
          | fromjson
          | .data["mike.near"].index.graph
          | fromjson
          | map(select(.value.accountId == "mob.near"))
        )
      }
  )
}' /tmp/mike-follow-transaction.json
```

4. Finish with canonical current-state confirmation via raw RPC.

```bash
SOCIAL_GET_ARGS_BASE64="$(
  jq -nr --arg account_id "$ACCOUNT_ID" --arg target_account_id "$TARGET_ACCOUNT_ID" '{
    keys: [($account_id + "/graph/follow/" + $target_account_id)]
  } | @base64'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg args_base64 "$SOCIAL_GET_ARGS_BASE64" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: "social.near",
      method_name: "get",
      args_base64: $args_base64,
      finality: "final"
    }
  }')" \
  | tee /tmp/mike-follow-rpc.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" --arg target_account_id "$TARGET_ACCOUNT_ID" '{
  finality: "final",
  current_follow_edge: (
    .result.result
    | implode
    | fromjson
    | .[$account_id].graph.follow[$target_account_id]
  )
}' /tmp/mike-follow-rpc.json
```

That last step confirms the follow edge still exists now. The earlier NEAR Social and FastNear steps are what proved which historical write created the edge and which transaction carried that write.

**Why this next step?**

NEAR Social gives you the semantic edge. FastNear block receipts give you the bridge to a specific write. FastNear transaction lookup turns that write into a readable story. RPC gives you canonical current-state confirmation.

### Understand a two-party `token_diff` match, then trace a live NEAR Intents settlement

Use this investigation when the user story is “show me what NEAR Intents is doing under the hood, but keep the trace anchored in public data I can inspect myself.”

**Goal**

- Explain the matching model first, then turn one real `intents.near` settlement into a readable execution story across Transactions API and canonical RPC.

**Official references**

- [NEAR Intents overview](https://docs.near.org/chain-abstraction/intents/overview)
- [Intent types and execution](https://docs.near-intents.org/integration/verifier-contract/intent-types-and-execution)
- [Account abstraction](https://docs.near-intents.org/integration/verifier-contract/account-abstraction)

#### Part 1: protocol anatomy

The core matching shape is the `token_diff` intent. One side declares which assets it is willing to give and receive, and the matching side declares the opposite diff. In the official verifier docs, a two-party USDC/USDT swap is expressed as one signed payload that says “I will give `-10` USDC and receive `+10` USDT” and another that says the reverse. Those signed intents can be bundled through the Message Bus or through any other off-chain coordination channel, then submitted together to `intents.near`.

That conceptual part is useful for understanding the protocol, but the signed examples in the official docs are illustrative and time-bound. For an operational FastNear workflow, it is better to trace one real mainnet settlement than to pretend the documentation sample is a reusable live transaction.

#### Part 2: live FastNear trace

For the live trace below, use this fixed settlement anchor captured on **April 18, 2026**:

- transaction hash: `4cfei8p4HBeNxJnCLjfShhDYGmXZwFVwFgY1sYpyygE7`
- signer and receiver: `intents.near`
- included block height: `194573310`

The public FastNear surfaces are enough to reconstruct a lot:

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Settlement anchor | Transactions API [`POST /v0/transactions`](/tx/transactions) | Start from the fixed transaction hash and recover the main transaction plus the downstream receipt list | Gives you one readable settlement skeleton without decoding raw receipts first |
| Included block context | Transactions API [`POST /v0/block`](/tx/block) | Fetch the included block with receipts enabled and filter it back down to the same transaction hash | Places the settlement into the surrounding block window and shows which receipts appeared there |
| Canonical receipt DAG | RPC [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status) | Ask for the same transaction with `wait_until: "FINAL"` and inspect `receipts_outcome` | Gives you the protocol-native DAG, executor IDs, and raw event logs |
| Event classification | RPC [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status) | Pull event names such as `token_diff`, `intents_executed`, `mt_transfer`, and `mt_withdraw` out of the logged `EVENT_JSON` lines | Lets you explain the settlement by event type instead of by opaque receipt IDs alone |

**What a useful answer should include**

- how the conceptual two-party `token_diff` model maps onto the real `execute_intents` settlement
- which downstream contracts and methods appeared after `intents.near`
- which event families the trace emitted
- which block heights formed the main cascade

This example intentionally stays on public FastNear surfaces. NEAR Intents Explorer and the 1Click Explorer are useful too, but their Explorer API is JWT-gated and not the right default for a public docs walkthrough.

### Live NEAR Intents trace shell walkthrough

Use this when you want one concrete `intents.near` settlement that you can inspect immediately with public FastNear endpoints.

**What you're doing**

- Pull the transaction story from Transactions API.
- Reuse the included block hash in `POST /v0/block` to inspect the containing block.
- Confirm the canonical receipt DAG and event log families with `EXPERIMENTAL_tx_status`.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
RPC_URL=https://rpc.mainnet.fastnear.com
INTENTS_TX_HASH=4cfei8p4HBeNxJnCLjfShhDYGmXZwFVwFgY1sYpyygE7
INTENTS_SIGNER_ID=intents.near
```

1. Start with the settlement transaction itself.

```bash
INTENTS_BLOCK_HASH="$(
  curl -s "$TX_BASE_URL/v0/transactions" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg tx_hash "$INTENTS_TX_HASH" '{tx_hashes: [$tx_hash]}')" \
    | tee /tmp/intents-transaction.json \
    | jq -r '.transactions[0].execution_outcome.block_hash'
)"

jq '{
  transaction: {
    hash: .transactions[0].transaction.hash,
    signer_id: .transactions[0].transaction.signer_id,
    receiver_id: .transactions[0].transaction.receiver_id,
    included_block_height: .transactions[0].execution_outcome.block_height
  },
  receipt_flow: [
    .transactions[0].receipts[:6][]
    | {
        receipt_id: .receipt.receipt_id,
        receiver_id: .receipt.receiver_id,
        block_height: .execution_outcome.block_height,
        methods: (
          [.receipt.receipt.Action.actions[]?.FunctionCall.method_name]
          | map(select(. != null))
        ),
        first_log: (.execution_outcome.outcome.logs[0] // null)
      }
  ]
}' /tmp/intents-transaction.json
```

2. Reuse the block hash to inspect the containing block with receipts enabled.

```bash
curl -s "$TX_BASE_URL/v0/block" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg block_id "$INTENTS_BLOCK_HASH" '{
    block_id: $block_id,
    with_receipts: true,
    with_transactions: false
  }')" \
  | tee /tmp/intents-block.json >/dev/null

jq --arg tx_hash "$INTENTS_TX_HASH" '{
  block_height: .block.block_height,
  block_hash: .block.block_hash,
  tx_receipts: [
    .block_receipts[]
    | select(.transaction_hash == $tx_hash)
    | {
        receipt_id,
        predecessor_id,
        receiver_id,
        block_height
      }
  ]
}' /tmp/intents-block.json
```

3. Confirm the canonical receipt DAG and extract the event families from RPC.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg tx_hash "$INTENTS_TX_HASH" \
    --arg sender_account_id "$INTENTS_SIGNER_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "EXPERIMENTAL_tx_status",
      params: {
        tx_hash: $tx_hash,
        sender_account_id: $sender_account_id,
        wait_until: "FINAL"
      }
    }')" \
  | tee /tmp/intents-rpc.json >/dev/null

jq '{
  final_execution_status: .result.final_execution_status,
  receipts_outcome: [
    .result.receipts_outcome[:6][]
    | {
        receipt_id: .id,
        executor_id: .outcome.executor_id,
        first_log: (.outcome.logs[0] // null)
      }
  ]
}' /tmp/intents-rpc.json

jq -r '
  .result.receipts_outcome[]
  | .outcome.logs[]
  | select(startswith("EVENT_JSON:"))
  | capture("event\":\"(?<event>[^\"]+)\"").event
' /tmp/intents-rpc.json | sort -u
```

**Why this next step?**

`POST /v0/transactions` gives you the readable settlement skeleton. `POST /v0/block` shows how that settlement sits inside the containing block. `EXPERIMENTAL_tx_status` is the canonical follow-up when you need executor IDs, receipt-DAG structure, and raw event logs instead of just indexed summaries.

### Receipt pivot shell walkthrough

Use this when you already have one `receipt_id` and want the shortest path back to a readable transaction story.

**What you're doing**

- Resolve the receipt first.
- Extract `receipt.transaction_hash` with `jq`.
- Reuse that transaction hash in `POST /v0/transactions`.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
RECEIPT_ID=YOUR_RECEIPT_ID
# Example receipt ID from a recent mainnet transfer:
# RECEIPT_ID='5GhZcpfKWhrpaZo5Am74QfEUFQnZBz48G7hfoLPVDXcq'

TX_HASH="$(
  curl -s "$TX_BASE_URL/v0/receipt" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
    | tee /tmp/receipt-lookup.json \
    | jq -r '.receipt.transaction_hash'
)"

jq '{
  receipt: {
    receipt_id: .receipt.receipt_id,
    predecessor_id: .receipt.predecessor_id,
    receiver_id: .receipt.receiver_id,
    transaction_hash: .receipt.transaction_hash,
    tx_block_height: .receipt.tx_block_height
  }
}' /tmp/receipt-lookup.json

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      transaction_hash: .transactions[0].transaction.hash,
      signer_id: .transactions[0].transaction.signer_id,
      receiver_id: .transactions[0].transaction.receiver_id,
      tx_block_height: .transactions[0].execution_outcome.block_height,
      receipt_count: (.transactions[0].receipts | length)
    }'
```

**Why this next step?**

`POST /v0/receipt` gives you the pivot. `POST /v0/transactions` turns that pivot into a readable story with signer, receiver, block, and receipt context. Only after that should you widen to block or account windows.

## Common mistakes

- Trying to submit a transaction from the history API instead of raw RPC.
- Using Transactions API when the user only wants current balances or holdings.
- Dropping to raw RPC before indexed history has answered the readable "what happened?" question.
- Reusing opaque pagination tokens in a different endpoint or filter context.

## Related guides

- [Transactions API](/tx)
- [RPC Reference](/rpc)
- [FastNear API](/api)
- [NEAR Data API](/neardata)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
