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

## Account State

### Show an account's balance and storage at finality

`view_account` is the canonical RPC query for an account's current state. One call returns the unstaked balance, any stake-locked amount, storage consumed, and the block the reading was taken at. `finality: "final"` ensures you're reading stable state, not an optimistic view.

```bash
ACCOUNT_ID=root.near
FASTNEAR_API_KEY=your_api_key

curl -s "https://rpc.mainnet.fastnear.com" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_account",account_id:$account_id,finality:"final"}
  }')" \
  | jq '.result | {amount, locked, storage_usage, block_height, block_hash}'
```

For `root.near`, this returns `amount` (yoctoNEAR held unstaked), `locked: "0"` (nothing in validator stake or a lockup contract), and `storage_usage: 28677` — about 28.7 KB of on-chain state. The `block_height`/`block_hash` pair anchors the reading; to read multiple accounts at the *same* block, reuse the returned `block_hash` as `block_id` on follow-up queries.

## Transaction Inclusion and Finality

### Track a transaction from hash to finality

Have a tx hash? Poll `tx` with the smallest `wait_until` threshold that answers your question.

```bash
TX_HASH=CVyG2xLJ6fuKCtULAxMnWTh2GL5ey2UUiTcgYT3M6Pow
SIGNER_ACCOUNT_ID=mike.testnet
FASTNEAR_API_KEY=your_api_key

curl -s "https://archival-rpc.testnet.fastnear.com" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
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

A NEAR block is a header over N shard chunks, not a flat list of transactions. `block` returns chunk headers; the transactions live one level down, inside `chunk`. There's no `block → tx` shortcut — the block doesn't carry transaction hashes, so `tx` (which needs a hash) doesn't enter this flow at all. The canonical walk is `status` → `block` → `chunk`, skipping empty chunks along the way. Most chunks in a tip block are empty — their `tx_root` is the sentinel `11111111111111111111111111111111` — so the selector has to filter.

```bash
EMPTY_TX_ROOT=11111111111111111111111111111111
FASTNEAR_API_KEY=your_api_key

BLOCK_HASH="$(curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":"fastnear","method":"status","params":[]}' \
  | jq -r '.result.sync_info.latest_block_hash')"

CHUNK_HASH="$(curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
  --data "$(jq -nc --arg block_hash "$BLOCK_HASH" '{
    jsonrpc:"2.0",id:"fastnear",method:"block",params:{block_id:$block_hash}
  }')" \
  | jq -r --arg empty "$EMPTY_TX_ROOT" '
      first(.result.chunks[] | select(.tx_root != $empty) | .chunk_hash) // empty')"

if [ -z "$CHUNK_HASH" ]; then
  echo "tip block had no transactions in any chunk — rerun on the next head"
else
  curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
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

### Identify function-call keys you might want to remove

Every wallet, gateway, and dapp session you sign into tends to leave behind a function-call key. Most of them you'll never use again. `view_access_key_list` returns every key on an account; the structure of the nonce tells you which ones are stale.

New keys start at `block_height * 10^6` and the value increments by one per transaction the key signs, so:

- `nonce / 10^6` → the block the key was added at
- `nonce % 10^6` → the number of times the key has been used

Any key with `tx_count: 0` was created and never used — the clearest candidate for cleanup. Keys scoped to a contract you no longer interact with are the next tier. The filter below narrows to `social.near`, but `RECEIVER_ID` is the only line that changes to audit a different contract.

```bash
ACCOUNT_ID=root.near
RECEIVER_ID=social.near
FASTNEAR_API_KEY=your_api_key

curl -s "https://rpc.mainnet.fastnear.com" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_access_key_list",account_id:$account_id,finality:"final"}
  }')" \
  | jq --arg receiver "$RECEIVER_ID" '
      {
        total_keys: (.result.keys | length),
        fcks_for_receiver: [
          .result.keys[]
          | select((.access_key.permission | type) == "object")
          | select(.access_key.permission.FunctionCall.receiver_id == $receiver)
          | {
              public_key,
              added_at_block: (.access_key.nonce / 1000000 | floor),
              tx_count: (.access_key.nonce % 1000000),
              method_names: (.access_key.permission.FunctionCall.method_names | if . == [] then "ANY" else . end),
              allowance: (.access_key.permission.FunctionCall.allowance // "unlimited")
            }
        ] | sort_by(.tx_count)
      }'
```

For `root.near`, this returns 235 total keys, including 34 function-call keys for `social.near`; 21 of those were created and never used (`tx_count: 0`) and are prime cleanup candidates. `method_names: "ANY"` means the key can call any method on `social.near`; a narrowed list like `["find_grants", "insert_grant", "delete_grant"]` means the key was scoped to one dapp's write surface.

To remove one, sign a `DeleteKey` action with a **full-access** key (a function-call key cannot authorize `DeleteKey`) and submit via [`send_tx`](/rpc/transaction/send-tx). Re-run the query to confirm the key is gone.

## Contract Reads and Raw State

### Read a contract's storage without executing it

A view method like `get_num` still makes the node load the contract's wasm and run it. If you already know the storage key, `view_state` returns the raw serialized bytes directly — no execution, and no dependency on whether the contract exposes a getter for that field at all.

Contracts built with `near-sdk-rs` store the top-level `#[near_bindgen]` struct under the key `STATE`. Pass `STATE` as `prefix_base64` (`U1RBVEU=` is base64 for those four ASCII bytes) and the node returns the serialized value.

```bash
CONTRACT_ID=counter.near-examples.testnet
FASTNEAR_API_KEY=your_api_key

RAW_B64="$(curl -s "https://rpc.testnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$CONTRACT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_state",account_id:$contract,prefix_base64:"U1RBVEU=",finality:"final"}
  }')" \
  | jq -r '.result.values[0].value')"

DECODED_I8="$(python3 -c "import base64; print(int.from_bytes(base64.b64decode('$RAW_B64'),'little',signed=True))")"

jq -n --arg raw "$RAW_B64" --argjson val "$DECODED_I8" '{raw_bytes_base64: $raw, decoded_i8: $val}'
```

For the live counter, this returns `"CQ=="` — one byte `0x09`, decoded as signed i8 to `9`. That's the same number `get_num` would return, but read straight from the trie without running any contract code. `signed=True` matters: a negative counter serializes as `"/w=="` (byte `0xff` → i8 `-1`, not u8 `255`).

Reach for `view_state` when a contract doesn't expose a view method for the data you need, or when you want a key family the contract doesn't publish. For most reads `call_function` is still lower ceremony. If the question turns historical rather than current, widen to [KV FastData API](/fastdata/kv).

## NEAR Social and BOS Exact Reads

These stay on exact SocialDB reads and on-chain readiness checks until the question turns historical.

### Can this account still publish to NEAR Social right now?

`social.near` knows two things a wallet UI can only guess at: how much storage each account has left, and whether a delegated signer is allowed to write under it. Two view calls collapse the readiness question to a single boolean.

```bash
ACCOUNT_ID=root.near         # account you're writing under
SIGNER_ACCOUNT_ID=root.near  # account signing the transaction
FASTNEAR_API_KEY=your_api_key

STORAGE_ARGS_B64="$(jq -nc --arg account_id "$ACCOUNT_ID" '{account_id:$account_id}' | base64 | tr -d '\n')"

STORAGE="$(curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
  --data "$(jq -nc --arg args "$STORAGE_ARGS_B64" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:"social.near",method_name:"get_account_storage",args_base64:$args,finality:"final"}
  }')" \
  | jq '.result.result | implode | fromjson')"

if [ "$SIGNER_ACCOUNT_ID" = "$ACCOUNT_ID" ]; then
  PERMISSION=true
else
  PERM_ARGS_B64="$(jq -nc --arg pred "$SIGNER_ACCOUNT_ID" --arg key "$ACCOUNT_ID" '{predecessor_id:$pred,key:$key}' | base64 | tr -d '\n')"
  PERMISSION="$(curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
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

For `root.near` signing under itself, this returns `storage: {used_bytes: 136245, available_bytes: 42484}`, `permission_granted: true` (owner write), and `ready_to_publish: true`. If `storage` comes back `null` or `available_bytes: 0`, the account needs a `storage_deposit` on `social.near` before any new write can stick. If the signer differs from the target, the permission branch asks `is_write_permission_granted({predecessor_id, key})` — the same on-chain answer a dapp sees before writing on a user's behalf. See the [SocialDB API](https://github.com/NearSocial/social-db#api) for the full contract surface.

### What does `mob.near/widget/Profile` actually contain right now?

SocialDB stores BOS widgets as `<account>/widget/<name>` keys on `social.near`. One `keys` call with the `BlockHeight` return type returns the catalog plus per-widget last-write anchors; one `get` call returns the exact source.

```bash
ACCOUNT_ID=mob.near
WIDGET_NAME=Profile
FASTNEAR_API_KEY=your_api_key

KEYS_ARGS="$(jq -nc --arg account_id "$ACCOUNT_ID" '{
  keys: [($account_id + "/widget/*")],
  options: {return_type: "BlockHeight"}
}' | base64 | tr -d '\n')"

curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
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

curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
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
