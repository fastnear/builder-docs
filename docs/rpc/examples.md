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

Use this page when you already know the answer needs canonical RPC behavior and you want the shortest doc path to get there. The goal is not to memorize every method. It is to pick the right starting page, stop as soon as the RPC result answers the question, and widen only when a higher-level surface would help.

## When to start here

- The user asked for exact on-chain state or protocol-native fields.
- You need a direct contract view call or transaction submission flow.
- You are inspecting blocks, chunks, validators, or protocol metadata.
- Correctness depends on node semantics rather than indexed summary data.

## Minimum inputs

- network: mainnet or testnet
- primary identifier: `account_id`, public key, contract ID plus method, transaction hash, or block height/hash
- whether you need current state, historical state, or submission/finality behavior
- whether the result should stay canonical or become a human-friendly summary afterward

## Common jobs

### Check exact account or access-key state

**Start here**

- [View Account](/rpc/account/view-account) for canonical account fields.
- [View Access Key](/rpc/account/view-access-key) or [View Access Key List](/rpc/account/view-access-key-list) for key inspection.

**Next page if needed**

- [FastNear API full account view](/api/v1/account-full) if you need a wallet-style summary after confirming the canonical state.
- [Transactions API account history](/tx/account) if the next question is "what has this account been doing?"

**Stop when**

- The RPC fields already answer the state or permission question.

**Widen when**

- The user wants balances, NFTs, staking, or other product-shaped output.
- The user really wants recent activity history rather than current canonical state.

### Inspect a block or protocol snapshot

**Start here**

- [Block by ID](/rpc/block/block-by-id) or [Block by Height](/rpc/block/block-by-height) for a specific block.
- [Latest Block](/rpc/protocol/latest-block) for the current canonical head.
- [Status](/rpc/protocol/status), [Health](/rpc/protocol/health), or [Network Info](/rpc/protocol/network-info) for node and network diagnostics.

**Next page if needed**

- [Block Effects](/rpc/block/block-effects) if the block lookup needs state-change context.
- [Transactions API block history](/tx/block) or [Transactions API block range](/tx/blocks) if you need a more readable execution window.

**Stop when**

- The canonical block or protocol payload answers the question directly.

**Widen when**

- The user wants recent polling-oriented block data instead of one canonical snapshot. Move to [NEAR Data API](/neardata).
- The user needs a history story across many transactions, not just one block payload. Move to [Transactions API](/tx).

### Run a contract view call

**Start here**

- [Call Function](/rpc/contract/call-function) for a contract view method.
- [View State](/rpc/contract/view-state) when the question is about raw contract storage.
- [View Code](/rpc/contract/view-code) if code presence or hash is the real question.

**Next page if needed**

- [FastNear API](/api) if the user actually wants a product-shaped answer such as holdings or account summary after the raw call.
- [KV FastData API](/fastdata/kv) if the next task is indexed key-value history rather than an exact RPC state read.

**Stop when**

- The contract view result already answers the question in canonical form.

**Widen when**

- The user wants indexed history or a simpler summary instead of raw contract output.
- The user starts asking "what changed over time?" rather than "what does it return right now?"

### Send and confirm a transaction

**Start here**

- [Send Transaction](/rpc/transaction/send-tx) when you want canonical submission behavior with explicit waiting semantics.
- [Broadcast Transaction Async](/rpc/transaction/broadcast-tx-async) or [Broadcast Transaction Commit](/rpc/transaction/broadcast-tx-commit) when those exact submission modes are the point.
- [Transaction Status](/rpc/transaction/tx-status) to confirm the canonical result.

**Next page if needed**

- [Transactions by Hash](/tx/transactions) for a readable history record after submission.
- [Receipt Lookup](/tx/receipt) when you need to investigate downstream execution or callback flow.

**Stop when**

- You have the submission result and final canonical status you needed.

**Widen when**

- The next question is about receipts, affected accounts, or execution history in a human-friendly order.
- You need a broader investigation workflow instead of one canonical status check.

## Worked walkthroughs

### Audit and remove old Near Social function-call keys

Use this when you know an account has accumulated older `social.near` function-call keys and you want to inspect them, choose one intentionally, and remove it with raw RPC submission.

**What you're doing**

- Use canonical RPC to list every access key on the account.
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

Re-running `view_access_key_list` closes the loop on the same canonical surface you used for discovery. If the delete succeeded there, you do not need a higher-level indexed summary to prove the cleanup.

### Register FT storage if needed, then transfer tokens

Use this when the user story is “send fungible tokens safely, but first prove whether the receiver is already registered for storage on that FT contract.”

**Network**

- testnet

**Official references**

- [FT storage and transfer](https://docs.near.org/integrations/fungible-tokens)
- [Pre-deployed FT contract](https://docs.near.org/tutorials/fts/predeployed-contract)

This walkthrough uses the safe public contract `ft.predeployed.examples.testnet`. Before you start, make sure the sender already holds some `gtNEAR` there. If not, mint a small balance first with the pre-deployed contract guide above and then come back to this flow.

**What you're doing**

- Use canonical RPC view calls to check whether the receiver already has FT storage on the contract.
- If needed, fetch the minimum storage requirement.
- Sign and submit `storage_deposit`, then `ft_transfer`.
- Verify the receiver balance with the same contract’s canonical view method.

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

6. Verify the receiver’s FT balance with the contract’s canonical view method.

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

This is a canonical RPC example because every step stays on exact contract state and exact transaction submission semantics: first prove storage state, then submit the minimum required change calls, then verify the post-transfer state directly on the contract.

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
