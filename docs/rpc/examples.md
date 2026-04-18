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

Use this page when you already know the answer lives in RPC and you want the shortest path to it. The goal is not to memorize every method. It is to start with the right RPC read or write, stop as soon as the response answers the question, and only switch to a higher-level API when that would save time.

## Worked walkthroughs

### Audit and remove old Near Social function-call keys

Use this when you know an account has accumulated older `social.near` function-call keys and you want to inspect them, choose one intentionally, and remove it with raw RPC submission.

**What you're doing**

- Use RPC itself to list every access key on the account.
- Narrow that list to function-call keys scoped to `social.near`.
- Inspect one candidate key exactly before you delete it.
- Build and sign a `DeleteKey` transaction with a full-access key, then submit it through RPC and verify the key is gone.

Two caveats matter up front:

- The deleting key must be a full-access key. A function-call key cannot sign a `DeleteKey` action.
- This flow is about exact key state and cleanup. The optional Transactions API step below gives account-level context, not authoritative per-key “last used” forensics.

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export TX_BASE_URL=https://tx.main.fastnear.com
export ACCOUNT_ID=YOUR_ACCOUNT_ID
export SOCIAL_RECEIVER_ID=social.near
export DELETE_PUBLIC_KEY='ed25519:PASTE_THE_KEY_YOU_PLAN_TO_REMOVE'
export FULL_ACCESS_PUBLIC_KEY='ed25519:PASTE_THE_FULL_ACCESS_PUBLIC_KEY_YOU_WILL_SIGN_WITH'
export FULL_ACCESS_PRIVATE_KEY='ed25519:PASTE_THE_MATCHING_FULL_ACCESS_PRIVATE_KEY'
```

1. List all access keys on the account, then narrow to `social.near` function-call keys.

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
  | tee /tmp/fastnear-access-keys.json >/dev/null

jq -r --arg receiver "$SOCIAL_RECEIVER_ID" '
  .result.keys[]
  | select((.access_key.permission | type) == "object")
  | select(.access_key.permission.FunctionCall.receiver_id == $receiver)
  | {
      public_key,
      nonce: .access_key.nonce,
      receiver_id: .access_key.permission.FunctionCall.receiver_id,
      method_names: .access_key.permission.FunctionCall.method_names,
      allowance: (.access_key.permission.FunctionCall.allowance // "unlimited")
    }
' /tmp/fastnear-access-keys.json
```

Pick one `public_key` from that filtered list and set `DELETE_PUBLIC_KEY` to it.

2. Inspect the specific candidate key one more time before deleting it.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg public_key "$DELETE_PUBLIC_KEY" '{
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
  | jq '{nonce: .result.nonce, permission: .result.permission}'
```

3. Optional: pull recent function-call activity for the account to decide whether you want to investigate more before cleanup.

```bash
curl -s "$TX_BASE_URL/v0/account" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    account_id: $account_id,
    is_function_call: true,
    limit: 10
  }')" \
  | jq '{
    account_txs: [
      .account_txs[]
      | {
          transaction_hash,
          tx_block_height,
          is_success
        }
    ]
  }'
```

That query helps answer “has this account still been doing function-call work recently?”, but it does not prove that a specific access key was the one used.

4. Sign a `DeleteKey` transaction for `DELETE_PUBLIC_KEY` with a full-access key.

Run this in a directory where `near-api-js@5` is installed. The command reads the environment variables above, fetches the latest nonce for `FULL_ACCESS_PUBLIC_KEY`, fetches a fresh final block hash, signs a `DeleteKey` action, and stores the resulting `signed_tx_base64` in `SIGNED_TX_BASE64`.

```bash
SIGNED_TX_BASE64="$(
  node --input-type=module <<'EOF'
import { InMemorySigner, KeyPair, transactions, utils } from 'near-api-js';

const {
  ACCOUNT_ID,
  NETWORK_ID = 'mainnet',
  RPC_URL = 'https://rpc.mainnet.fastnear.com',
  DELETE_PUBLIC_KEY,
  FULL_ACCESS_PUBLIC_KEY,
  FULL_ACCESS_PRIVATE_KEY,
} = process.env;

for (const name of [
  'ACCOUNT_ID',
  'DELETE_PUBLIC_KEY',
  'FULL_ACCESS_PUBLIC_KEY',
  'FULL_ACCESS_PRIVATE_KEY',
]) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name}`);
  }
}

async function rpc(method, params) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'fastnear',
      method,
      params,
    }),
  });
  const json = await response.json();
  if (json.error) {
    throw new Error(JSON.stringify(json.error));
  }
  return json.result;
}

const keyPair = KeyPair.fromString(FULL_ACCESS_PRIVATE_KEY);
const derivedPublicKey = keyPair.getPublicKey().toString();

if (derivedPublicKey !== FULL_ACCESS_PUBLIC_KEY) {
  throw new Error(
    `FULL_ACCESS_PUBLIC_KEY does not match FULL_ACCESS_PRIVATE_KEY (${derivedPublicKey})`
  );
}

const signer = await InMemorySigner.fromKeyPair(NETWORK_ID, ACCOUNT_ID, keyPair);

const accessKey = await rpc('query', {
  request_type: 'view_access_key',
  account_id: ACCOUNT_ID,
  public_key: FULL_ACCESS_PUBLIC_KEY,
  finality: 'final',
});

const block = await rpc('block', { finality: 'final' });

const transaction = transactions.createTransaction(
  ACCOUNT_ID,
  utils.PublicKey.fromString(FULL_ACCESS_PUBLIC_KEY),
  ACCOUNT_ID,
  BigInt(accessKey.nonce) + 1n,
  [transactions.deleteKey(utils.PublicKey.fromString(DELETE_PUBLIC_KEY))],
  utils.serialize.base_decode(block.header.hash)
);

const [, signedTx] = await transactions.signTransaction(
  transaction,
  signer,
  ACCOUNT_ID,
  NETWORK_ID
);

process.stdout.write(Buffer.from(signedTx.encode()).toString('base64'));
EOF
)"
```

5. Submit the signed transaction through raw RPC and wait for `FINAL`.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg signed_tx_base64 "$SIGNED_TX_BASE64" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "send_tx",
    params: {
      signed_tx_base64: $signed_tx_base64,
      wait_until: "FINAL"
    }
  }')" \
  | jq '{
    final_execution_status: .result.final_execution_status,
    transaction_hash: .result.transaction.hash,
    status: .result.status
  }'
```

6. Re-run the access-key list and verify that the deleted key is gone.

```bash
if curl -s "$RPC_URL" \
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
  | jq -e --arg public_key "$DELETE_PUBLIC_KEY" '
      .result.keys[]
      | select(.public_key == $public_key)
    ' >/dev/null; then
  echo "Key is still present: $DELETE_PUBLIC_KEY"
else
  echo "Key deleted: $DELETE_PUBLIC_KEY"
fi
```

**Why this next step?**

Re-running `view_access_key_list` closes the loop on the same RPC method you used for discovery. If the delete succeeded there, you do not need an indexed API to prove the cleanup.

### Register FT storage if needed, then transfer tokens

Use this when the user story is “send fungible tokens safely, but first prove whether the receiver is already registered for storage on that FT contract.”

**Network**

- testnet

**Official references**

- [FT storage and transfer](https://docs.near.org/integrations/fungible-tokens)
- [Pre-deployed FT contract](https://docs.near.org/tutorials/fts/predeployed-contract)

This walkthrough uses the safe public contract `ft.predeployed.examples.testnet`. Before you start, make sure the sender already holds some `gtNEAR` there. If not, mint a small balance first with the pre-deployed contract guide above and then come back to this flow.

**What you're doing**

- Use exact RPC view calls to check whether the receiver already has FT storage on the contract.
- If needed, fetch the minimum storage requirement.
- Sign and submit `storage_deposit`, then `ft_transfer`.
- Verify the receiver balance with the same contract’s own view method.

```bash
export NETWORK_ID=testnet
export RPC_URL=https://rpc.testnet.fastnear.com
export TOKEN_CONTRACT_ID=ft.predeployed.examples.testnet
export SENDER_ACCOUNT_ID=YOUR_ACCOUNT_ID.testnet
export RECEIVER_ACCOUNT_ID=YOUR_RECEIVER_ID.testnet
export SENDER_PUBLIC_KEY='ed25519:YOUR_FULL_ACCESS_PUBLIC_KEY'
export SENDER_PRIVATE_KEY='ed25519:YOUR_MATCHING_PRIVATE_KEY'
export AMOUNT_YOCTO_GTNEAR='10000000000000000000000'
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

2. If the receiver is not registered yet, fetch the minimum storage deposit.

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

3. Define one reusable signer for contract function calls.

Run this in a directory where `near-api-js@5` is installed. The function below reads the exported shell variables above and turns each function call into a signed payload for raw RPC submission.

```bash
sign_function_call() {
  METHOD_NAME="$1" \
  ARGS_JSON="$2" \
  DEPOSIT_YOCTO="$3" \
  GAS_TGAS="$4" \
  node --input-type=module <<'EOF'
import { InMemorySigner, KeyPair, transactions, utils } from 'near-api-js';

const {
  NETWORK_ID = 'testnet',
  RPC_URL = 'https://rpc.testnet.fastnear.com',
  TOKEN_CONTRACT_ID,
  SENDER_ACCOUNT_ID,
  SENDER_PUBLIC_KEY,
  SENDER_PRIVATE_KEY,
  METHOD_NAME,
  ARGS_JSON,
  DEPOSIT_YOCTO = '0',
  GAS_TGAS = '100',
} = process.env;

for (const name of [
  'TOKEN_CONTRACT_ID',
  'SENDER_ACCOUNT_ID',
  'SENDER_PUBLIC_KEY',
  'SENDER_PRIVATE_KEY',
  'METHOD_NAME',
  'ARGS_JSON',
]) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name}`);
  }
}

async function rpc(method, params) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'fastnear',
      method,
      params,
    }),
  });
  const json = await response.json();
  if (json.error) {
    throw new Error(JSON.stringify(json.error));
  }
  return json.result;
}

const keyPair = KeyPair.fromString(SENDER_PRIVATE_KEY);
const signer = await InMemorySigner.fromKeyPair(
  NETWORK_ID,
  SENDER_ACCOUNT_ID,
  keyPair
);

const derivedPublicKey = keyPair.getPublicKey().toString();
if (derivedPublicKey !== SENDER_PUBLIC_KEY) {
  throw new Error(
    `SENDER_PUBLIC_KEY does not match SENDER_PRIVATE_KEY (${derivedPublicKey})`
  );
}

const accessKey = await rpc('query', {
  request_type: 'view_access_key',
  account_id: SENDER_ACCOUNT_ID,
  public_key: SENDER_PUBLIC_KEY,
  finality: 'final',
});

const block = await rpc('block', { finality: 'final' });

const action = transactions.functionCall(
  METHOD_NAME,
  Buffer.from(ARGS_JSON),
  BigInt(GAS_TGAS) * 10n ** 12n,
  BigInt(DEPOSIT_YOCTO)
);

const transaction = transactions.createTransaction(
  SENDER_ACCOUNT_ID,
  utils.PublicKey.fromString(SENDER_PUBLIC_KEY),
  TOKEN_CONTRACT_ID,
  BigInt(accessKey.nonce) + 1n,
  [action],
  utils.serialize.base_decode(block.header.hash)
);

const [, signedTx] = await transactions.signTransaction(
  transaction,
  signer,
  SENDER_ACCOUNT_ID,
  NETWORK_ID
);

process.stdout.write(Buffer.from(signedTx.encode()).toString('base64'));
EOF
}
```

4. If needed, register the receiver for storage first.

```bash
if jq -e '.result.result | implode | fromjson == null' /tmp/ft-storage-balance.json >/dev/null; then
  SIGNED_TX_BASE64="$(
    sign_function_call \
      storage_deposit \
      "$(jq -nc --arg account_id "$RECEIVER_ACCOUNT_ID" '{
        account_id: $account_id,
        registration_only: true
      }')" \
      "$MIN_STORAGE_YOCTO" \
      100
  )"

  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg signed_tx_base64 "$SIGNED_TX_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "send_tx",
      params: {
        signed_tx_base64: $signed_tx_base64,
        wait_until: "FINAL"
      }
    }')" \
    | jq '{
        final_execution_status: .result.final_execution_status,
        transaction_hash: .result.transaction.hash
      }'
fi
```

5. Transfer the FT after storage is ready.

```bash
SIGNED_TX_BASE64="$(
  sign_function_call \
    ft_transfer \
    "$(jq -nc \
      --arg receiver_id "$RECEIVER_ACCOUNT_ID" \
      --arg amount "$AMOUNT_YOCTO_GTNEAR" '{
        receiver_id: $receiver_id,
        amount: $amount,
        memo: "FastNear RPC example"
      }')" \
    1 \
    100
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg signed_tx_base64 "$SIGNED_TX_BASE64" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "send_tx",
    params: {
      signed_tx_base64: $signed_tx_base64,
      wait_until: "FINAL"
    }
  }')" \
  | jq '{
      final_execution_status: .result.final_execution_status,
      transaction_hash: .result.transaction.hash,
      status: .result.status
    }'
```

6. Verify the receiver’s FT balance with the contract’s own view method.

```bash
RECEIVER_BALANCE_ARGS_BASE64="$(
  jq -nc --arg account_id "$RECEIVER_ACCOUNT_ID" '{
    account_id: $account_id
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$TOKEN_CONTRACT_ID" \
    --arg args_base64 "$RECEIVER_BALANCE_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "ft_balance_of",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | jq '{
      receiver_balance: (.result.result | implode | fromjson)
    }'
```

**Why this next step?**

This is a good RPC example because every step stays close to the contract itself: first check storage state, then send the minimum required change calls, then verify the post-transfer balance directly on the contract.

### Can this account still publish to NEAR Social right now?

Use this when the user story is “I’m about to publish a profile change, widget update, or graph write under `mike.near`, and I want a plain go/no-go answer before I open wallet signing.”

This is the same question real NEAR Social clients have to answer before they try a write:

- does the target account already have storage on `social.near`?
- if it does, is there still room left in that storage?
- if a different signer is trying to write under that account, has write permission already been granted?

**Official references**

- [SocialDB API and contract surface](https://github.com/NearSocial/social-db#api)

**What you're doing**

- Check that the signer account itself exists and can pay gas.
- Ask `social.near` how much storage the target account has left.
- If the signer differs from the target account, ask `social.near` whether that delegated write is already allowed.
- Turn those exact RPC answers into one simple “ready now” or “fix this first” summary.

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export SOCIAL_CONTRACT_ID=social.near
export ACCOUNT_ID=mike.near
export SIGNER_ACCOUNT_ID=mike.near
```

1. Check the signer account itself first.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$SIGNER_ACCOUNT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "view_account",
      account_id: $account_id,
      finality: "final"
    }
  }')" \
  | tee /tmp/social-publish-signer.json >/dev/null

jq --arg signer_account_id "$SIGNER_ACCOUNT_ID" '{
  signer_account_id: $signer_account_id,
  amount: .result.amount,
  locked: .result.locked,
  storage_usage: .result.storage_usage
}' /tmp/social-publish-signer.json
```

If this query fails, you do not have a signer account to work with. If it succeeds, you know the signer exists and can at least pay gas.

2. Ask `social.near` how much storage is already available for the account you want to write under.

```bash
SOCIAL_STORAGE_ARGS_BASE64="$(
  jq -nc --arg account_id "$ACCOUNT_ID" '{
    account_id: $account_id
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$SOCIAL_CONTRACT_ID" \
    --arg args_base64 "$SOCIAL_STORAGE_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "get_account_storage",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/social-account-storage.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" '{
  account_id: $account_id,
  storage: (.result.result | implode | fromjson),
  storage_ready: ((.result.result | implode | fromjson | .available_bytes) > 0)
}' /tmp/social-account-storage.json
```

If `available_bytes` is greater than zero, storage is not the blocker. If this method returns `null` or `available_bytes` is zero, the account needs a `storage_deposit` top-up before a new write can land.

3. If the signer is different from the target account, check delegated write permission too.

```bash
if [ "$SIGNER_ACCOUNT_ID" = "$ACCOUNT_ID" ]; then
  jq -n --arg account_id "$ACCOUNT_ID" '{
    account_id: $account_id,
    signer_matches_target: true,
    permission_granted: true,
    reason: "owner write"
  }'
else
  WRITE_PERMISSION_ARGS_BASE64="$(
    jq -nc \
      --arg predecessor_id "$SIGNER_ACCOUNT_ID" \
      --arg key "$ACCOUNT_ID" '{
        predecessor_id: $predecessor_id,
        key: $key
      }' | base64 | tr -d '\n'
  )"

  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$SOCIAL_CONTRACT_ID" \
      --arg args_base64 "$WRITE_PERMISSION_ARGS_BASE64" '{
        jsonrpc: "2.0",
        id: "fastnear",
        method: "query",
        params: {
          request_type: "call_function",
          account_id: $account_id,
          method_name: "is_write_permission_granted",
          args_base64: $args_base64,
          finality: "final"
        }
      }')" \
    | jq '{
        signer_matches_target: false,
        permission_granted: (.result.result | implode | fromjson)
      }'
fi
```

4. Turn the storage and permission checks into one readable answer.

```bash
AVAILABLE_BYTES="$(
  jq -r '
    .result.result
    | if length == 0 then "0"
      else (implode | fromjson | .available_bytes // 0 | tostring)
      end
  ' /tmp/social-account-storage.json
)"

if [ "$SIGNER_ACCOUNT_ID" = "$ACCOUNT_ID" ]; then
  PERMISSION_GRANTED=true
else
  PERMISSION_GRANTED="$(
    curl -s "$RPC_URL" \
      -H 'content-type: application/json' \
      --data "$(jq -nc \
        --arg account_id "$SOCIAL_CONTRACT_ID" \
        --arg args_base64 "$WRITE_PERMISSION_ARGS_BASE64" '{
          jsonrpc: "2.0",
          id: "fastnear",
          method: "query",
          params: {
            request_type: "call_function",
            account_id: $account_id,
            method_name: "is_write_permission_granted",
            args_base64: $args_base64,
            finality: "final"
          }
        }')" \
      | jq -r '.result.result | implode | fromjson'
  )"
fi

jq -n \
  --arg account_id "$ACCOUNT_ID" \
  --arg signer_account_id "$SIGNER_ACCOUNT_ID" \
  --argjson available_bytes "$AVAILABLE_BYTES" \
  --argjson permission_granted "$PERMISSION_GRANTED" '{
    account_id: $account_id,
    signer_account_id: $signer_account_id,
    storage_ready: ($available_bytes > 0),
    permission_ready: $permission_granted,
    ready_to_publish_now: (($available_bytes > 0) and $permission_granted)
  }'
```

If that final object says `ready_to_publish_now: true`, RPC has already answered the question. If it says `false`, you know whether the blocker is storage, delegated permission, or both.

**Why this next step?**

This keeps the whole question on exact on-chain reads. `social.near` itself answers whether the target account has room left and whether a delegated signer is already allowed to write. That is a better NEAR Social readiness check than guessing from wallet state alone.

### Did `efiz.near` really publish `DonateNEARtoEfiz`, and what does it do?

Use this when the user story is lighter and more playful: “my friend says `efiz.near` once published a widget literally called `DonateNEARtoEfiz`. Check whether that is true, then show me what the widget actually does without leaving RPC.”

This one is intentionally fun. It does not teach anything deep about async execution. It just shows how to use exact SocialDB reads to browse a BOS author's catalog and answer one very specific question from live on-chain data.

**Official references**

- [SocialDB API and contract surface](https://github.com/NearSocial/social-db#api)

**What you're doing**

- Ask `social.near` for the widget catalog under `efiz.near`.
- Keep the block heights, because they tell you when each widget key was last written.
- Confirm that `DonateNEARtoEfiz` is really there, then read its exact source code through the same contract.
- End with one clean handoff: if the next question becomes “which transaction wrote this widget?”, switch to the NEAR Social proof recipes in [Transactions Examples](/tx/examples).

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export SOCIAL_CONTRACT_ID=social.near
export ACCOUNT_ID=efiz.near
export WIDGET_NAME=DonateNEARtoEfiz
```

1. List the widget catalog and keep the last-write block heights.

```bash
WIDGET_KEYS_ARGS_BASE64="$(
  jq -nc --arg account_id "$ACCOUNT_ID" '{
    keys: [($account_id + "/widget/*")],
    options: {return_type: "BlockHeight"}
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$SOCIAL_CONTRACT_ID" \
    --arg args_base64 "$WIDGET_KEYS_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "keys",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/social-widget-keys.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" '
  .result.result
  | implode
  | fromjson
  | .[$account_id].widget
  | to_entries
  | sort_by(.value * -1)
  | map({
      widget_name: .key,
      last_write_block: .value
    })
  | .[0:20]
' /tmp/social-widget-keys.json
```

That gives you a compact BOS inventory. At the time of writing, `efiz.near` had a wonderfully eclectic widget catalog including names like `ReversedFeed`, `HelloWorld`, `PotlockDonateAll`, and `DonateNEARtoEfiz`, but the live query is the real source of truth.

2. Confirm that `DonateNEARtoEfiz` is really in the catalog, then print the exact source stored in SocialDB.

```bash
WIDGET_GET_ARGS_BASE64="$(
  jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg widget_name "$WIDGET_NAME" '{
      keys: [($account_id + "/widget/" + $widget_name)]
    }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$SOCIAL_CONTRACT_ID" \
    --arg args_base64 "$WIDGET_GET_ARGS_BASE64" '{
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
  | tee /tmp/social-widget-source.json >/dev/null

jq -r \
  --arg account_id "$ACCOUNT_ID" \
  --arg widget_name "$WIDGET_NAME" '
    .result.result
    | implode
    | fromjson
    | .[$account_id].widget[$widget_name]
    | split("\n")[0:25]
    | join("\n")
  ' /tmp/social-widget-source.json
```

That prints the first 25 lines of the widget source so you can quickly tell what kind of component it is. In the live version at the time of writing, the source initializes `reciever: "efiz.near"` and builds a button that calls `donate` with the chosen amount. The widget name is not subtle.

3. Pull the last-write block for the same widget so you keep one useful historical anchor.

```bash
jq -r \
  --arg account_id "$ACCOUNT_ID" \
  --arg widget_name "$WIDGET_NAME" '
    .result.result
    | implode
    | fromjson
    | .[$account_id].widget[$widget_name]
  ' /tmp/social-widget-keys.json \
  | xargs -I{} printf 'Last write block for %s/%s: %s\n' "$ACCOUNT_ID" "$WIDGET_NAME" "{}"
```

At the time of writing, the live last-write block for `efiz.near/widget/DonateNEARtoEfiz` was `92543301`.

If your next question becomes “which transaction wrote that version of the widget?”, keep that block height and switch to the NEAR Social proof workflows in [Transactions Examples](/tx/examples).

**Why this next step?**

This is a nice reminder that RPC can be fun, not just forensic. `keys` lets you browse a BOS author's catalog like a developer, and `get` lets you inspect the exact widget body that lives on chain. Sometimes the answer really is “yes, your friend did publish a widget called `DonateNEARtoEfiz`, and here is the code.”

## Common jobs

### Check exact account or access-key state

**Start here**

- [View Account](/rpc/account/view-account) for exact account fields.
- [View Access Key](/rpc/account/view-access-key) or [View Access Key List](/rpc/account/view-access-key-list) for key inspection.

**Next page if needed**

- [FastNear API full account view](/api/v1/account-full) if you want a readable holdings summary after checking the exact RPC state.
- [Transactions API account history](/tx/account) if the next question is "what has this account been doing?"

**Stop when**

- The RPC fields already answer the state or permission question.

**Switch when**

- The user wants balances, NFTs, staking, or another readable account summary.
- The user really wants recent activity history rather than current state.

### Check one exact block or protocol snapshot

**Start here**

- [Block by ID](/rpc/block/block-by-id) or [Block by Height](/rpc/block/block-by-height) when you already know which block you care about.
- [Latest Block](/rpc/protocol/latest-block) when the question is “what is the current head right now?”
- [Status](/rpc/protocol/status), [Health](/rpc/protocol/health), or [Network Info](/rpc/protocol/network-info) when the real question is about node or network condition, not transaction history.

**Next page if needed**

- [Block Effects](/rpc/block/block-effects) if the block payload tells you what block you are looking at but not what changed in it.
- [Transactions API block history](/tx/block) or [Transactions API block range](/tx/blocks) if the question becomes “what actually happened around this block?” rather than “what does this block payload say?”

**Stop when**

- One exact block or protocol response already answers the question directly.

**Switch when**

- The user wants to watch fresh blocks arrive rather than inspect one exact snapshot. Move to [NEAR Data API](/neardata).
- The user needs a readable story across many transactions, not just one block payload. Move to [Transactions API](/tx).

### What does this contract return right now?

**Start here**

- [Call Function](/rpc/contract/call-function) when you already know the view method you want and just need the exact return value.
- [View State](/rpc/contract/view-state) when the real question is about raw contract storage or key prefixes, not a method result.
- [View Code](/rpc/contract/view-code) when the real question is “is there code here at all?” or “which code hash is deployed?”

**Next page if needed**

- [FastNear API](/api) if the raw contract answer is technically correct but the user actually wanted a readable holdings or account summary.
- [KV FastData API](/fastdata/kv) if the next question becomes “what did this storage key look like over time?” instead of “what is it right now?”

**Stop when**

- The view call, storage read, or code hash already answers the contract question exactly.

**Switch when**

- The user wants indexed history or a simpler summary instead of raw contract output.
- The user stops asking “what does it return right now?” and starts asking “what changed over time?”

### Send and confirm a transaction

**Start here**

- [Send Transaction](/rpc/transaction/send-tx) when you want RPC submission with explicit waiting semantics.
- [Broadcast Transaction Async](/rpc/transaction/broadcast-tx-async) or [Broadcast Transaction Commit](/rpc/transaction/broadcast-tx-commit) when those exact submission modes are the point.
- [Transaction Status](/rpc/transaction/tx-status) to confirm the final result.

**Next page if needed**

- [Transactions by Hash](/tx/transactions) for a readable history record after submission.
- [Receipt Lookup](/tx/receipt) when you need to investigate downstream execution or callback flow.
- [Transactions Examples](/tx/examples) when the next question is “one batched action failed, did the earlier actions roll back too?”

**Stop when**

- You have the submission result and final status you needed.

**Switch when**

- The next question is about receipts, affected accounts, or execution history in a human-friendly order.
- You need a fuller investigation workflow instead of one status check.

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
