---
sidebar_label: Examples
slug: /rpc/examples
title: RPC Examples
description: Plain-language workflows for using FastNear RPC docs for exact state checks, block inspection, contract views, and transaction submission.
displayed_sidebar: rpcSidebar
page_actions:
  - markdown
---

# RPC Examples

Use this page when you want one exact RPC answer fast. Start with one read, then move to transactions or raw state only when the simpler check stops being enough.

## Quick start

If you just landed here, start with one exact account read.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=near

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "view_account",
      finality: "final",
      account_id: $account_id
    }
  }')" \
  | jq '.result | {
      amount,
      locked,
      code_hash,
      storage_usage
    }'
```

This is the smallest reliable RPC example on the page: one request, one exact answer, no receipt tree.

## Transaction Submission and Tracking

### Two-part pattern: submit a transaction, or track a known tx hash to final execution

Default pattern:

- `broadcast_tx_async` to submit
- `tx` with `wait_until: "FINAL"` to track
- `EXPERIMENTAL_tx_status` only if the next question is about receipts

This walkthrough is intentionally split in two:

- submit a fresh signed transaction and keep the returned hash
- track one known historical tx hash with reproducible output

The tracking half uses one pinned historical transaction, so the status lookups use the archival host:

- transaction hash: `FLLmTvFx9vCof79scy2uUviF5WwYmevkz9TZ8azPGVQb`
- signer: `mike.near`
- receiver: `social.near`
- `https://archival-rpc.mainnet.fastnear.com`

1. Submit a fresh signed transaction and keep the returned hash.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data '{
    "jsonrpc": "2.0",
    "id": "fastnear",
    "method": "broadcast_tx_async",
    "params": ["BASE64_SIGNED_TX"]
  }' \
  | jq .
```

That first step is only about the submission shape. The returned hash is what you would track next for your own live transaction.

2. Track one known tx hash until you have the simplest final answer.

```bash
RPC_URL=https://archival-rpc.mainnet.fastnear.com
TX_HASH=FLLmTvFx9vCof79scy2uUviF5WwYmevkz9TZ8azPGVQb
SIGNER_ACCOUNT_ID=mike.near
```

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg tx_hash "$TX_HASH" \
    --arg signer_account_id "$SIGNER_ACCOUNT_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "tx",
      params: {
        tx_hash: $tx_hash,
        sender_account_id: $signer_account_id,
        wait_until: "FINAL"
      }
    }')" \
  | jq '{
      final_execution_status: .result.final_execution_status,
      transaction_status: .result.status,
      receipts_outcome_count: (.result.receipts_outcome | length)
    }'
```

3. Only switch to `EXPERIMENTAL_tx_status` when that known tx now needs receipt-tree detail.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg tx_hash "$TX_HASH" \
    --arg signer_account_id "$SIGNER_ACCOUNT_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "EXPERIMENTAL_tx_status",
      params: {
        tx_hash: $tx_hash,
        sender_account_id: $signer_account_id,
        wait_until: "FINAL"
      }
    }')" \
  | jq '{
      final_execution_status: .result.final_execution_status,
      transaction_handoff: .result.transaction_outcome.outcome.status,
      receipts_outcome_count: (.result.receipts_outcome | length)
    }'
```

If you want the node to wait for you instead of tracking separately, use [`send_tx`](/rpc/transaction/send-tx). The default pattern on this page is still: submit with `broadcast_tx_async`, then track a hash with `tx`.

## Account and Key Mechanics

Start here when the question is about exact permissions, exact key state, or whether one key can call one contract right now.

### Does this access key let me call this contract right now?

Use this when you already have an account, one public key, and one target contract, and you want a plain yes-or-no answer before you try to sign anything.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Filter the account’s keys first, inspect the exact key second, and classify the permission last.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC view_access_key_list</span> narrows the account down to keys that could matter for the target contract.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC view_access_key</span> gives the exact permission object for the one public key you might actually use.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">jq</span> turns that permission object into <span className="fastnear-example-strategy__code">full_access</span>, <span className="fastnear-example-strategy__code">function_call_match</span>, <span className="fastnear-example-strategy__code">receiver_mismatch</span>, or <span className="fastnear-example-strategy__code">method_not_allowed</span>.</span></p>
  </div>
</div>

**What you're doing**

- List the account’s access keys and narrow them to the contract you care about.
- Inspect the exact key you might sign with.
- Decide whether it can call this receiver and method without leaving RPC.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
TARGET_CONTRACT_ID=crossword.puzzle.near
TARGET_METHOD_NAME=new_puzzle
TARGET_PUBLIC_KEY='ed25519:PASTE_THE_KEY_YOU_WANT_TO_CHECK'

# Sample live values observed on April 19, 2026:
# ACCOUNT_ID=mike.near
# TARGET_CONTRACT_ID=crossword.puzzle.near
# TARGET_METHOD_NAME=new_puzzle
# TARGET_PUBLIC_KEY='ed25519:otwaB1X88ocpmUdC1B5XaifucfDLmLKaonb26KqTj96'
```

1. List the account’s keys and narrow them to the target contract.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "view_access_key_list",
      account_id: $account_id,
      finality: "final"
    }
  }')" \
  | tee /tmp/access-key-list.json >/dev/null

jq --arg target_contract_id "$TARGET_CONTRACT_ID" '{
  candidate_keys: [
    .result.keys[]
    | select(
        .access_key.permission == "FullAccess"
        or (
          (.access_key.permission | type) == "object"
          and .access_key.permission.FunctionCall.receiver_id == $target_contract_id
        )
      )
    | {
        public_key,
        nonce: .access_key.nonce,
        permission: .access_key.permission
      }
  ]
}' /tmp/access-key-list.json
```

2. Inspect the exact key you want to evaluate.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg public_key "$TARGET_PUBLIC_KEY" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "view_access_key",
        account_id: $account_id,
        public_key: $public_key,
        finality: "final"
      }
    }')" \
  | tee /tmp/exact-access-key.json >/dev/null

jq '{nonce: .result.nonce, permission: .result.permission}' /tmp/exact-access-key.json
```

3. Turn that exact permission object into a yes-or-no answer for this contract and method.

```bash
jq -n \
  --slurpfile key /tmp/exact-access-key.json \
  --arg target_contract_id "$TARGET_CONTRACT_ID" \
  --arg target_method_name "$TARGET_METHOD_NAME" '
  ($key[0].result.permission) as $permission
  | if $permission == "FullAccess" then
      {
        can_call_now: true,
        reason: "full_access"
      }
    elif $permission.FunctionCall.receiver_id != $target_contract_id then
      {
        can_call_now: false,
        reason: "receiver_mismatch",
        receiver_id: $permission.FunctionCall.receiver_id
      }
    elif (
      ($permission.FunctionCall.method_names | length) == 0
      or ($permission.FunctionCall.method_names | index($target_method_name))
    ) then
      {
        can_call_now: true,
        reason: (
          if ($permission.FunctionCall.method_names | length) == 0
          then "function_call_any_method"
          else "function_call_method_match"
          end
        ),
        allowance: ($permission.FunctionCall.allowance // "unlimited")
      }
    else
      {
        can_call_now: false,
        reason: "method_not_allowed",
        allowed_methods: $permission.FunctionCall.method_names
      }
    end'
```

For the sample `mike.near` key above on April 19, 2026, the answer is `can_call_now: true`: the key is a function-call key for `crossword.puzzle.near`, and `method_names: ["new_puzzle"]` explicitly allows the method we asked about.

**Why this next step?**

`view_access_key_list` is the fastest contract-level filter. `view_access_key` is the exact authority check for the one public key you may actually use. If the answer is `false`, you need a different key or a different permission setup, not a deeper history trace.

### Does this FT receiver need storage registration before I transfer?

Use this when the user story is “I am about to send fungible tokens, and I want a plain yes-or-no answer about whether the receiver needs `storage_deposit` first.”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Read the receiver storage state first, then stop as soon as you know whether `ft_transfer` can proceed.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC call_function storage_balance_of</span> tells you whether the receiver is already registered.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC call_function storage_balance_bounds</span> only matters if you need the exact minimum deposit before writing.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">jq</span> turns those two reads into one answer: “transfer can proceed” or “send `storage_deposit` first”.</span></p>
  </div>
</div>

**Network**

- testnet

**Official references**

- [FT storage and transfer](https://docs.near.org/integrations/fungible-tokens)
- [Pre-deployed FT contract](https://docs.near.org/tutorials/fts/predeployed-contract)

This walkthrough uses the safe public contract `ft.predeployed.examples.testnet`. The point here is the read-only decision: do you need a `storage_deposit` first, or can your transfer path proceed already?

**What you're doing**

- Use exact RPC view calls to check whether the receiver already has FT storage on the contract.
- Fetch the exact minimum storage requirement from the same contract.
- Stop once you know whether `ft_transfer` can proceed or whether `storage_deposit` has to come first.

```bash
export NETWORK_ID=testnet
export RPC_URL=https://rpc.testnet.fastnear.com
export TOKEN_CONTRACT_ID=ft.predeployed.examples.testnet
export RECEIVER_ACCOUNT_ID=YOUR_RECEIVER_ID.testnet
```

1. Check whether the receiver is already registered on the FT contract.

```bash
STORAGE_BALANCE_ARGS_BASE64="$(
  jq -nc --arg account_id "$RECEIVER_ACCOUNT_ID" '{
    account_id: $account_id
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$TOKEN_CONTRACT_ID" \
    --arg args_base64 "$STORAGE_BALANCE_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "storage_balance_of",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/ft-storage-balance.json >/dev/null

jq '{
  registered: ((.result.result | implode | fromjson) != null),
  storage_balance: (.result.result | implode | fromjson)
}' /tmp/ft-storage-balance.json
```

2. Fetch the minimum storage deposit from the same contract.

```bash
MIN_STORAGE_YOCTO="$(
  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg account_id "$TOKEN_CONTRACT_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "storage_balance_bounds",
        args_base64: "e30=",
        finality: "final"
      }
    }')" \
    | tee /tmp/ft-storage-bounds.json \
    | jq -r '.result.result | implode | fromjson | .min'
)"

printf 'Minimum storage deposit: %s yoctoNEAR\n' "$MIN_STORAGE_YOCTO"
```

3. Turn those two reads into one transfer-readiness answer.

```bash
jq -n \
  --slurpfile balance /tmp/ft-storage-balance.json \
  --slurpfile bounds /tmp/ft-storage-bounds.json \
  --arg receiver_account_id "$RECEIVER_ACCOUNT_ID" '
  (
    $balance[0].result.result
    | if length == 0 then null else (implode | fromjson) end
  ) as $storage
  | (
    $bounds[0].result.result
    | implode
    | fromjson
  ) as $bounds
  | {
      receiver_account_id: $receiver_account_id,
      receiver_registered: ($storage != null),
      current_storage: $storage,
      minimum_storage_deposit_yocto: $bounds.min,
      next_step: (
        if $storage != null
        then "receiver already registered; ft_transfer can proceed"
        else "send storage_deposit before ft_transfer"
        end
      )
    }'
```

**Why this next step?**

This is the clean RPC question in this workflow: “is the receiver already registered, and if not, what minimum deposit will the contract require?” The signed write path depends on your wallet, CLI, or backend integration, so it does not belong in the smallest core RPC example.

## Contract Reads and Raw State

Start here when the question is “does this contract method tell me enough?” versus “should I read the storage directly?”

### Read a counter straight from contract state, then confirm it with the view method

Use this when you already know the exact storage key family and want the smallest possible contrast between raw state and the contract’s public read API.

This uses the live public testnet contract `counter.near-examples.testnet`:

- `view_state` reads the raw `STATE` entry directly
- `call_function get_num` asks the contract for the same current number

```bash
export NETWORK_ID=testnet
export RPC_URL=https://rpc.testnet.fastnear.com
export CONTRACT_ID=counter.near-examples.testnet
export STATE_PREFIX_BASE64=U1RBVEU=
```

1. Read the raw `STATE` entry.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$CONTRACT_ID" \
    --arg prefix_base64 "$STATE_PREFIX_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "view_state",
        account_id: $account_id,
        prefix_base64: $prefix_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/counter-view-state.json >/dev/null

jq '{
  key: (.result.values[0].key | @base64d),
  value_base64: .result.values[0].value
}' /tmp/counter-view-state.json
```

That should show `key: "STATE"`. This is the case where `view_state` makes sense: you already know the exact key family.

2. Decode the raw bytes.

```bash
RAW_VALUE_BASE64="$(jq -r '.result.values[0].value' /tmp/counter-view-state.json)"

python3 - "$RAW_VALUE_BASE64" <<'PY'
import base64
import sys

raw = base64.b64decode(sys.argv[1])
print(int.from_bytes(raw, "little", signed=True))
PY
```

For this contract, `STATE` is a one-byte signed counter, so decoding is trivial. On other contracts the layout may be more complex, but the rule stays the same: bytes first, schema second.

3. Ask the contract the friendly way and compare.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$CONTRACT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: $account_id,
      method_name: "get_num",
      args_base64: "e30=",
      finality: "final"
    }
  }')" \
  | tee /tmp/counter-call-function.json >/dev/null

jq '{
  block_height: .result.block_height,
  view_method_value: (.result.result | implode | fromjson)
}' /tmp/counter-call-function.json
```

4. Compare both answers.

```bash
RAW_STATE_NUMBER="$(
  python3 - "$RAW_VALUE_BASE64" <<'PY'
import base64
import sys

raw = base64.b64decode(sys.argv[1])
print(int.from_bytes(raw, "little", signed=True))
PY
)"

VIEW_METHOD_NUMBER="$(
  jq -r '.result.result | implode | fromjson' /tmp/counter-call-function.json
)"

jq -n \
  --argjson raw_state "$RAW_STATE_NUMBER" \
  --argjson view_method "$VIEW_METHOD_NUMBER" '{
    raw_state: $raw_state,
    view_method: $view_method,
    agrees_now: ($raw_state == $view_method)
  }'
```

**Why this next step?**

Use `view_state` when you already know the exact storage key family and want raw bytes. Use `call_function` when you want the contract’s public read API. If the next question becomes historical instead of “what is it right now?”, widen into [KV FastData API](/fastdata/kv).

### Which Rainbow Bridge ERC-20 tokens exist on NEAR, and how much of one token is out there?

Use this when you want to discover Rainbow Bridge ERC-20 contracts and inspect one token's live supply on NEAR. Rainbow Bridge deploys one NEAR contract per bridged ERC-20 token, and `factory.bridge.near` lists them.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">One factory read lists the token contracts. Two small view calls on one token tell you what it is and how much is on NEAR right now.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC call_function get_tokens_accounts</span> on <span className="fastnear-example-strategy__code">factory.bridge.near</span> returns the deployed bridged token contracts.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC call_function ft_metadata</span> on one bridged token contract returns its <span className="fastnear-example-strategy__code">name</span>, <span className="fastnear-example-strategy__code">symbol</span>, and <span className="fastnear-example-strategy__code">decimals</span>.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC call_function ft_total_supply</span> on the same contract returns the current raw supply on NEAR.</span></p>
  </div>
</div>

**What you're doing**

- Ask the bridge factory for every bridged token contract it has created.
- Pick one bridged token contract and read its metadata.
- Read the same contract's total supply and convert it to human units using `decimals`.

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export FACTORY_ID=factory.bridge.near
export TOKENS_FILE=/tmp/rainbow-bridge-tokens.json
```

1. List the bridged token contracts.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$FACTORY_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: $account_id,
      method_name: "get_tokens_accounts",
      args_base64: "e30=",
      finality: "final"
    }
  }')" \
  | tee "$TOKENS_FILE" >/dev/null

jq -r '.result.result | implode | fromjson | .[]' "$TOKENS_FILE"
```

Each line is one bridged FT contract on NEAR in the form `<hex_eth_address>.factory.bridge.near`. For example, bridged ERC-20 USDT on Ethereum address `0xdAC17F958D2ee523a2206206994597C13D831ec7` appears as `dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near`.

2. Read metadata for one token contract.

```bash
export TOKEN_ID=dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$TOKEN_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: $account_id,
      method_name: "ft_metadata",
      args_base64: "e30=",
      finality: "final"
    }
  }')" \
  | tee /tmp/rainbow-bridge-token-metadata.json >/dev/null

jq '.result.result | implode | fromjson | {name, symbol, decimals}' /tmp/rainbow-bridge-token-metadata.json
```

3. Read the current total supply on NEAR and convert it to human units.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$TOKEN_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: $account_id,
      method_name: "ft_total_supply",
      args_base64: "e30=",
      finality: "final"
    }
  }')" \
  | tee /tmp/rainbow-bridge-token-supply.json >/dev/null

RAW_SUPPLY="$(
  jq -r '.result.result | implode | fromjson' /tmp/rainbow-bridge-token-supply.json
)"

DECIMALS="$(
  jq -r '.result.result | implode | fromjson | .decimals' /tmp/rainbow-bridge-token-metadata.json
)"

HUMAN_SUPPLY="$(
  python3 - "$RAW_SUPPLY" "$DECIMALS" <<'PY'
from decimal import Decimal
import sys

raw = Decimal(sys.argv[1])
decimals = int(sys.argv[2])
human = raw / (Decimal(10) ** decimals)
print(human)
PY
)"

jq -n \
  --arg token_id "$TOKEN_ID" \
  --arg raw_supply "$RAW_SUPPLY" \
  --argjson decimals "$DECIMALS" \
  --arg human_supply "$HUMAN_SUPPLY" '{
    token_id: $token_id,
    raw_supply: $raw_supply,
    decimals: $decimals,
    human_supply: $human_supply
  }'
```

The `ft_total_supply` result is in the token's smallest units. Use the `decimals` from `ft_metadata` to convert it into a human-readable supply.

#### Optional extension: print the first few bridged tokens with metadata and supply

Use this when you want a quick sample inventory without leaving RPC.

```bash
export TOKEN_SAMPLE_COUNT=5

python3 <<'PY'
import json
import os
from decimal import Decimal

TOKENS_FILE = os.environ["TOKENS_FILE"]
LIMIT = int(os.environ.get("TOKEN_SAMPLE_COUNT", "5"))
RPC_URL = os.environ["RPC_URL"]

def decode_result(result):
    return json.loads("".join(chr(b) for b in result))

with open(TOKENS_FILE) as fh:
    token_ids = decode_result(json.load(fh)["result"]["result"])[:LIMIT]

def rpc_call(account_id, method_name):
    payload = {
        "jsonrpc": "2.0",
        "id": "fastnear",
        "method": "query",
        "params": {
            "request_type": "call_function",
            "account_id": account_id,
            "method_name": method_name,
            "args_base64": "e30=",
            "finality": "final",
        },
    }
    import subprocess
    raw = subprocess.check_output([
        "curl", "-s", RPC_URL,
        "-H", "content-type: application/json",
        "--data", json.dumps(payload),
    ], text=True)
    return decode_result(json.loads(raw)["result"]["result"])

print(f"{'token_id':<56} {'symbol':<12} {'decimals':>8} {'raw_supply':>24} {'human_supply':>24}  name")
for token_id in token_ids:
    metadata = rpc_call(token_id, "ft_metadata")
    raw_supply = rpc_call(token_id, "ft_total_supply")
    human_supply = Decimal(raw_supply) / (Decimal(10) ** metadata["decimals"])
    print(
        f"{token_id:<56} "
        f"{metadata['symbol']:<12} "
        f"{metadata['decimals']:>8} "
        f"{raw_supply:>24} "
        f"{str(human_supply):>24}  "
        f"{metadata['name']}"
    )
PY
```

**Why this next step?**

Stay on RPC while the question is “what bridged token contracts exist and how much of one token is out there?” The factory is the source of truth for the bridged token set, and each token contract answers its own metadata and supply through standard NEP-141 view methods. If the next question becomes “who holds this token?”, move to [V1 FT Top Holders](/api/v1/ft-top) instead of trying to walk holders through RPC.

## SocialDB Exact Reads

Stay on exact `call_function get` reads when you already know the SocialDB key you want. On standard RPC, raw `view_state` against `social.near` is not a practical teaching path because the contract state is too large to scan directly.

### Read one SocialDB post exactly as stored right now

Use this when a product, support tool, or agent already knows the account and wants the live SocialDB post payload without widening into transaction history.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Read the current post key first, then fetch that exact post payload from <span className="fastnear-example-strategy__code">social.near</span>.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC call_function get</span> on <span className="fastnear-example-strategy__code">mike.near/index/post</span> tells you which post key is current.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC call_function get</span> on <span className="fastnear-example-strategy__code">mike.near/post/main</span> returns the exact stored post payload.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>If the next question becomes “which transaction wrote this?”, switch to [Transactions Examples](/tx/examples).</span></p>
  </div>
</div>

**Official references**

- [SocialDB API and contract surface](https://github.com/NearSocial/social-db#api)

**What you're doing**

- Read the current post pointer under `mike.near/index/post`.
- Reuse that key to fetch the exact post payload under `mike.near/post/<key>`.
- Stop once you have the exact stored JSON and only widen into history if provenance matters.

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export SOCIAL_CONTRACT_ID=social.near
export ACCOUNT_ID=mike.near
```

1. Read the current post pointer first.

```bash
INDEX_POST_ARGS_BASE64="$(
  jq -nc --arg account_id "$ACCOUNT_ID" '{
    keys: [($account_id + "/index/post")]
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$SOCIAL_CONTRACT_ID" \
    --arg args_base64 "$INDEX_POST_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "get",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/social-index-post.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" '
  .result.result
  | implode
  | fromjson
  | {
      account_id: $account_id,
      index_entry: (.[$account_id].index.post | fromjson),
      current_post_key: (.[$account_id].index.post | fromjson | .key)
    }
' /tmp/social-index-post.json
```

At the time of writing, the current post key for `mike.near` was `main`.

2. Read that exact post payload.

```bash
POST_KEY="$(
  jq -r --arg account_id "$ACCOUNT_ID" '
    .result.result
    | implode
    | fromjson
    | .[$account_id].index.post
    | fromjson
    | .key
  ' /tmp/social-index-post.json
)"

POST_ARGS_BASE64="$(
  jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg post_key "$POST_KEY" '{
      keys: [($account_id + "/post/" + $post_key)]
    }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$SOCIAL_CONTRACT_ID" \
    --arg args_base64 "$POST_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "get",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/social-post-main.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" --arg post_key "$POST_KEY" '
  .result.result
  | implode
  | fromjson
  | {
      account_id: $account_id,
      post_key: $post_key,
      post: (.[$account_id].post[$post_key] | fromjson)
    }
' /tmp/social-post-main.json
```

That gives you the exact JSON stored for the current post, including fields like `type`, `text`, and `image`.

**Why this next step?**

This is the clean RPC pattern for SocialDB: ask the contract for one exact key, decode the returned JSON, and stop. If the question turns into “who wrote this and when?”, move to the transaction examples instead of trying to brute-force raw `social.near` state.


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
