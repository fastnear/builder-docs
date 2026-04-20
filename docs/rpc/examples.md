---
sidebar_label: Examples
slug: /rpc/examples
title: RPC Examples
description: Task-first RPC examples for state checks, block inspection, contract reads, and transaction submission.
displayed_sidebar: rpcSidebar
page_actions:
  - markdown
---

# RPC Examples

Start with the RPC method that answers the question. Use `tx` to track inclusion and finality from a tx hash, and widen only when you need receipt trees, raw state, or shard-level tracing.

## Transaction Inclusion and Finality

### Track a transaction from hash to finality

Have a tx hash? Poll `tx` with the smallest `wait_until` threshold that answers your question.

```bash
RPC_URL=https://rpc.testnet.fastnear.com
TX_HASH=CVyG2xLJ6fuKCtULAxMnWTh2GL5ey2UUiTcgYT3M6Pow
SIGNER_ACCOUNT_ID=mike.testnet

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" --arg signer_id "$SIGNER_ACCOUNT_ID" '{
    jsonrpc: "2.0", id: "fastnear", method: "tx",
    params: {tx_hash: $tx_hash, sender_account_id: $signer_id, wait_until: "INCLUDED"}
  }')" \
  | jq '{
      asked: "INCLUDED",
      final_execution_status: .result.final_execution_status,
      status_class: (.result.status | keys[0]),
      receipts_outcome_count: (.result.receipts_outcome | length)
    }'
```

For the pinned historical tx (a 1-yocto self-transfer from `mike.testnet`), the response comes back `FINAL` even though we asked for `INCLUDED`. That's the rule: **`wait_until` is a minimum threshold, not a target.** The node returns whatever stage the tx actually reached — for a historical tx that's always `FINAL`; for one in flight, pick `INCLUDED` when you only need inclusion and want the earliest return, or `FINAL` when the real question is "is it done?"

Two handoffs from here:

- **Submitting live?** [`broadcast_tx_async`](/rpc/transaction/broadcast-tx-async) returns the hash as soon as the node accepts the payload — track separately with `tx`. [`send_tx`](/rpc/transaction/send-tx) submits and blocks on your chosen `wait_until` in a single call.
- **Need the receipt tree, not just outcomes?** `tx` already includes `receipts_outcome`; widen to [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status) only when you also need the raw receipt records.

## Tip Block Inspection

### Describe the first action of the first transaction at the current tip

Walk `status` → `block` → `chunk`, skipping empty chunks along the way. Most chunks in a tip block are empty — their `tx_root` is the sentinel `11111111111111111111111111111111` — so the selector has to filter.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
EMPTY_TX_ROOT=11111111111111111111111111111111

BLOCK_HASH="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":"fastnear","method":"status","params":[]}' \
  | jq -r '.result.sync_info.latest_block_hash')"

CHUNK_HASH="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg block_hash "$BLOCK_HASH" '{
    jsonrpc:"2.0",id:"fastnear",method:"block",params:{block_id:$block_hash}
  }')" \
  | jq -r --arg empty "$EMPTY_TX_ROOT" '
      first(.result.chunks[] | select(.tx_root != $empty) | .chunk_hash) // empty')"

if [ -z "$CHUNK_HASH" ]; then
  echo "tip block had no transactions in any chunk — rerun on the next head"
else
  curl -s "$RPC_URL" -H 'content-type: application/json' \
    --data "$(jq -nc --arg chunk_hash "$CHUNK_HASH" '{
      jsonrpc:"2.0",id:"fastnear",method:"chunk",params:{chunk_id:$chunk_hash}
    }')" \
    | jq '{
        chunk_shard: .result.header.shard_id,
        chunk_height: .result.header.height_included,
        first_tx: {
          hash: .result.transactions[0].hash,
          signer_id: .result.transactions[0].signer_id,
          receiver_id: .result.transactions[0].receiver_id
        },
        first_action: (
          .result.transactions[0].actions[0] as $a
          | if ($a | type) == "string" then {kind: $a}
            elif $a.FunctionCall then {kind: "FunctionCall", method_name: $a.FunctionCall.method_name}
            else {kind: ($a | keys[0])} end
        )
      }'
fi
```

A live run returns the current tip's first chunk, first transaction, and first action — often a `FunctionCall` on a bridge or tg-bot contract (mainnet is active). A tip block can be valid and still have no transactions in any chunk, which is why the empty branch stays; it's the honest answer for a quiet moment on the network.

## Account and Key Mechanics

### Audit old Near Social function-call keys

Creators accumulate Social function-call keys from every wallet and BOS gateway they've used. `view_access_key_list` returns all of them; one filter narrows to `social.near`, and the **low six digits of the nonce** double as a usage counter — new keys start at `block_height * 10^6` and increment by one per transaction.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mike.near
RECEIVER_ID=social.near

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_access_key_list",account_id:$account_id,finality:"final"}
  }')" \
  | jq --arg receiver "$RECEIVER_ID" '
      {
        total_keys: (.result.keys | length),
        social_fcks: [
          .result.keys[]
          | select((.access_key.permission | type) == "object")
          | select(.access_key.permission.FunctionCall.receiver_id == $receiver)
          | {
              public_key,
              created_near_block: (.access_key.nonce / 1000000 | floor),
              tx_count: (.access_key.nonce % 1000000),
              method_names: (.access_key.permission.FunctionCall.method_names | if . == [] then "ANY" else . end),
              allowance: (.access_key.permission.FunctionCall.allowance // "unlimited")
            }
        ] | sort_by(.tx_count)
      }'
```

For `mike.near`, this returns dozens of `social.near` function-call keys. Entries with `tx_count: 0` were created and never used — prime candidates for cleanup. `method_names: "ANY"` means the key can call any method on `social.near`; a narrowed list like `["find_grants", "insert_grant", "delete_grant"]` means the key was scoped to a specific dapp's write surface.

To delete one, sign a `DeleteKey` action with a **full-access** key — a function-call key cannot authorize `DeleteKey` — then submit via [`send_tx`](/rpc/transaction/send-tx). Re-run the same list to confirm the deletion. The signing itself is standard near-api-js territory and not the interesting part of the audit.

### Which transaction added this `social.near` function-call key, and who authorized it?

The same nonce that tracks usage also anchors the `AddKey` in block time: new keys start at roughly `block_height * 10^6`, so dividing the current nonce by a million gives a tight search window. Hydrate the candidates once, and the response carries enough to distinguish a direct `AddKey` from a delegated (meta-tx) authorization — which tells you *which key signed the decision*, not just which account paid gas.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=mike.near
TARGET_PUBLIC_KEY=ed25519:7GZgXkMPEyGXqRhxaLvHxWn6fVfeyuQGMqnLVQAh7bs

CURRENT_NONCE="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" --arg public_key "$TARGET_PUBLIC_KEY" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_access_key",account_id:$account_id,public_key:$public_key,finality:"final"}
  }')" \
  | jq -r '.result.nonce')"

ADD_KEY_BLOCK=$((CURRENT_NONCE / 1000000))

TX_HASHES="$(curl -s "$TX_BASE_URL/v0/account" -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" \
    --argjson from $((ADD_KEY_BLOCK - 20)) --argjson to $((ADD_KEY_BLOCK + 5)) '{
      account_id: $account_id, is_real_signer: true,
      from_tx_block_height: $from, to_tx_block_height: $to, desc: false, limit: 50
    }')" \
  | jq -c '[.account_txs[].transaction_hash]')"

curl -s "$TX_BASE_URL/v0/transactions" -H 'content-type: application/json' \
  --data "$(jq -nc --argjson tx_hashes "$TX_HASHES" '{tx_hashes: $tx_hashes}')" \
  | jq --arg target "$TARGET_PUBLIC_KEY" '
      [ .transactions[]
        | . as $tx
        | (
            ($tx.transaction.actions[]? | .AddKey? | select(.public_key == $target)
              | {mode: "direct", authorizing_public_key: $tx.transaction.public_key, permission: .access_key.permission}),
            ($tx.transaction.actions[]? | .Delegate? | .delegate_action as $d
              | $d.actions[]? | .AddKey? | select(.public_key == $target)
              | {mode: "delegated", authorizing_public_key: $d.public_key, permission: .access_key.permission})
          )
        | {
            transaction_hash: $tx.transaction.hash,
            tx_block_height: $tx.execution_outcome.block_height,
            signer_id: $tx.transaction.signer_id,
            receiver_id: $tx.transaction.receiver_id,
            add_key_receipt: ([$tx.receipts[]
              | select(any((.receipt.receipt.Action.actions // [])[]?; .AddKey.public_key? == $target))
              | {receipt_id: .receipt.receipt_id, receipt_block: .execution_outcome.block_height}][0])
          } + .
      ]'
```

For `mike.near`'s `ed25519:7GZg…` key (the first `social.near` FCK from the audit above), this resolves to transaction `6ZT8UGPRC6L3NGs2qHnECPVexKWNQ5LWLK9w95tgj3tV` at outer tx block `112057390`. The outer signer is `app.herewallet.near` — HERE Wallet's relayer — and `mode: "delegated"` tells the rest of the story: the relayer paid gas, but the *authorizing* key inside the Delegate is `ed25519:GaYgzN1eZUgwA7t8a5pYxFGqtF4kon9dQaDMjPDejsiu`, a `mike.near` full-access key that signed the underlying `AddKey`. That's the meta-tx distinction the top-level `signer_id` alone would hide.

`add_key_receipt` completes the picture: the `AddKey` executed in block `112057392`, two blocks after the outer tx, because the Delegate hops from the relayer's shard to the target account's. Widen the `-20/+5` window if the key has been used heavily since creation.

### Register FT storage if needed, then transfer tokens

NEP-141 tokens require each recipient to pre-register storage on the contract before they can hold a balance. Two view calls answer the registration question authoritatively *before* you send — skipping that check is how `ft_transfer` ends up quietly refunded to the sender.

```bash
RPC_URL=https://rpc.testnet.fastnear.com
TOKEN_CONTRACT_ID=ft.predeployed.examples.testnet
RECEIVER_ACCOUNT_ID=mike.testnet

ACCOUNT_ARGS_B64="$(jq -nc --arg account_id "$RECEIVER_ACCOUNT_ID" '{account_id:$account_id}' | base64 | tr -d '\n')"

REGISTERED="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$TOKEN_CONTRACT_ID" --arg args "$ACCOUNT_ARGS_B64" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:$contract,method_name:"storage_balance_of",args_base64:$args,finality:"final"}
  }')" \
  | jq '(.result.result | implode | fromjson) != null')"

MIN_DEPOSIT="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$TOKEN_CONTRACT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:$contract,method_name:"storage_balance_bounds",args_base64:"e30=",finality:"final"}
  }')" \
  | jq -r '.result.result | implode | fromjson | .min')"

jq -n --argjson registered "$REGISTERED" --arg min "$MIN_DEPOSIT" '{
  registered: $registered,
  min_storage_deposit_yocto: $min
}'
```

For the pinned testnet contract, `storage_balance_of({account_id: "mike.testnet"})` returns `null` (not registered) and `storage_balance_bounds` returns `{min: "1250000000000000000000", max: "1250000000000000000000"}` — a flat 0.00125 NEAR registration fee. That's the contract's own answer, and it's all the read side you need before you write.

The write side is two signed function calls (near-api-js `transactions.functionCall` or any NEAR signer library works identically):

- `storage_deposit({account_id: "<receiver>", registration_only: true})` with deposit `<min>` yocto and 100 Tgas — skip if `registered: true`.
- `ft_transfer({receiver_id: "<receiver>", amount: "<yocto>", memo: "..."})` with deposit 1 yocto (required by NEP-141) and 100 Tgas.

Submit each signed transaction through [`send_tx`](/rpc/transaction/send-tx) with `wait_until: "FINAL"`. Verify afterward with the contract's own view method — no need for indexed history to prove the transfer stuck:

```bash
curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$TOKEN_CONTRACT_ID" --arg args "$ACCOUNT_ARGS_B64" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:$contract,method_name:"ft_balance_of",args_base64:$args,finality:"final"}
  }')" \
  | jq '{receiver_balance: (.result.result | implode | fromjson)}'
```

## Contract Reads and Raw State

### How do I read a contract's raw storage directly?

Two RPC methods answer the same counter question from different layers: `view_state` pulls raw trie bytes without executing code, and `call_function` runs the contract's own view method. When they agree, you've proved the contract's view method matches its stored state.

```bash
RPC_URL=https://rpc.testnet.fastnear.com
CONTRACT_ID=counter.near-examples.testnet

RAW_B64="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$CONTRACT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_state",account_id:$contract,prefix_base64:"U1RBVEU=",finality:"final"}
  }')" \
  | jq -r '.result.values[0].value')"

RAW_I8="$(python3 -c "import base64,sys;print(int.from_bytes(base64.b64decode('$RAW_B64'),'little',signed=True))")"

METHOD_VALUE="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$CONTRACT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:$contract,method_name:"get_num",args_base64:"e30=",finality:"final"}
  }')" \
  | jq -r '.result.result | implode | fromjson')"

jq -n --arg raw_b64 "$RAW_B64" --argjson raw_i8 "$RAW_I8" --argjson method "$METHOD_VALUE" '{
  raw_state_b64: $raw_b64,
  raw_state_decoded: $raw_i8,
  view_method_value: $method,
  agree: ($raw_i8 == $method)
}'
```

For the live counter, `view_state` at key `STATE` (base64 `U1RBVEU=`) returns `"CQ=="` — one byte `0x09`, decoded as signed i8 to `9`; `get_num` also returns `9`. They agree because the contract stores `val: i8` at that key. The `signed=True` matters: a negative counter would show up as `"/w=="` (byte `0xff` → i8 `-1`, not u8 `255`).

`view_state` is the right tool when a contract lacks a view method for the data you need, when you want to verify a view method against actual storage, or when you need a key family the contract doesn't expose publicly. For everything else, `call_function` is lower ceremony. If the next question becomes historical rather than current, widen to [KV FastData API](/fastdata/kv).

## NEAR Social and BOS Exact Reads

These stay on exact SocialDB reads and on-chain readiness checks until the question turns historical.

### Can this account still publish to NEAR Social right now?

`social.near` knows two things a wallet UI can only guess at: how much storage each account has left, and whether a delegated signer is allowed to write under it. Two view calls collapse the readiness question to a single boolean.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mike.near         # account you're writing under
SIGNER_ACCOUNT_ID=mike.near  # account signing the transaction

STORAGE_ARGS_B64="$(jq -nc --arg account_id "$ACCOUNT_ID" '{account_id:$account_id}' | base64 | tr -d '\n')"

STORAGE="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg args "$STORAGE_ARGS_B64" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:"social.near",method_name:"get_account_storage",args_base64:$args,finality:"final"}
  }')" \
  | jq '.result.result | implode | fromjson')"

if [ "$SIGNER_ACCOUNT_ID" = "$ACCOUNT_ID" ]; then
  PERMISSION=true
else
  PERM_ARGS_B64="$(jq -nc --arg pred "$SIGNER_ACCOUNT_ID" --arg key "$ACCOUNT_ID" '{predecessor_id:$pred,key:$key}' | base64 | tr -d '\n')"
  PERMISSION="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
    --data "$(jq -nc --arg args "$PERM_ARGS_B64" '{
      jsonrpc:"2.0",id:"fastnear",method:"query",
      params:{request_type:"call_function",account_id:"social.near",method_name:"is_write_permission_granted",args_base64:$args,finality:"final"}
    }')" \
    | jq '.result.result | implode | fromjson')"
fi

jq -n --argjson storage "$STORAGE" --argjson permission "$PERMISSION" \
  --arg account_id "$ACCOUNT_ID" --arg signer "$SIGNER_ACCOUNT_ID" '{
    account_id: $account_id,
    signer_account_id: $signer,
    storage: $storage,
    permission_granted: $permission,
    ready_to_publish: (($storage.available_bytes // 0) > 0 and $permission)
  }'
```

For `mike.near` signing under itself, this returns `storage: {used_bytes: 139803, available_bytes: 83891}`, `permission_granted: true` (owner write), and `ready_to_publish: true`. If `storage` comes back `null` or `available_bytes: 0`, the account needs a `storage_deposit` on `social.near` before any new write can stick. If the signer differs from the target, the permission branch asks `is_write_permission_granted({predecessor_id, key})` — the same on-chain answer a dapp sees before writing on a user's behalf. See the [SocialDB API](https://github.com/NearSocial/social-db#api) for the full contract surface.

### What does `mob.near/widget/Profile` actually contain right now?

SocialDB stores BOS widgets as `<account>/widget/<name>` keys on `social.near`. One `keys` call with the `BlockHeight` return type returns the catalog plus per-widget last-write anchors; one `get` call returns the exact source.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mob.near
WIDGET_NAME=Profile

KEYS_ARGS="$(jq -nc --arg account_id "$ACCOUNT_ID" '{
  keys: [($account_id + "/widget/*")],
  options: {return_type: "BlockHeight"}
}' | base64 | tr -d '\n')"

curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg args "$KEYS_ARGS" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:"social.near",method_name:"keys",args_base64:$args,finality:"final"}
  }')" \
  | jq --arg account_id "$ACCOUNT_ID" --arg widget "$WIDGET_NAME" '
      .result.result | implode | fromjson | .[$account_id].widget as $map
      | {
          total_widgets: ($map | length),
          most_recently_written: ($map | to_entries | sort_by(-.value) | .[0:5] | map({widget: .key, last_write_block: .value})),
          target_last_write_block: $map[$widget]
        }'

GET_ARGS="$(jq -nc --arg account_id "$ACCOUNT_ID" --arg widget "$WIDGET_NAME" '{
  keys: [($account_id + "/widget/" + $widget)]
}' | base64 | tr -d '\n')"

curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg args "$GET_ARGS" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:"social.near",method_name:"get",args_base64:$args,finality:"final"}
  }')" \
  | jq -r --arg account_id "$ACCOUNT_ID" --arg widget "$WIDGET_NAME" '
      .result.result | implode | fromjson | .[$account_id].widget[$widget] | split("\n")[0:20] | join("\n")'
```

For `mob.near`, the catalog shows 264 widgets; `Profile` last wrote at block `86494825` — years ago, stable since — and the source begins with `const accountId = props.accountId ?? context.accountId;`. The `BlockHeight` return type costs nothing extra and turns the key listing into a cheap staleness check. Keep the last-write block if you later want to prove *which transaction* wrote this version — hand it to [Advanced SocialDB write lookup](/tx/socialdb-proofs).

## Common mistakes

- Starting in RPC when the user really wants a holdings summary or indexed history.
- Forgetting to switch from regular RPC to archival RPC for older state.
- Treating docs UI browser auth as a production backend pattern.
- Staying in low-level transaction status calls after the question becomes forensic or history-oriented.

## Related guides

- [RPC Reference](/rpc)
- [Auth & Access](/auth)
- [FastNear API](/api)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
