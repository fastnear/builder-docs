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

Have a tx hash and need to know how far it got? Poll `tx` with the smallest `wait_until` threshold that answers the question. If you are submitting right now, use `broadcast_tx_async` only to get the hash.

Pinned testnet transaction:

- transaction hash: `CVyG2xLJ6fuKCtULAxMnWTh2GL5ey2UUiTcgYT3M6Pow`
- signer: `mike.testnet`
- receiver: `mike.testnet`
- first action: `Transfer` of `1` yoctoNEAR
- observed live on: `2026-04-19`

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Get the hash quickly, use `tx` for the actual stage question, and reach for `EXPERIMENTAL_tx_status` only when the receipt tree becomes the question.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC broadcast_tx_async</span> is the quick submit step when your client will track separately.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC tx</span> is the default surface for inclusion, optimistic execution, and finality.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC EXPERIMENTAL_tx_status</span> is the receipt-inspection follow-up, not the default tracking loop.</span></p>
  </div>
</div>

**Live rule**

`wait_until` is a minimum threshold. The node may answer with a later stage if the transaction advanced while it was waiting.

Observed when four `tx` polls for this transaction started at the same moment on `2026-04-19`:

| `wait_until` | returned `final_execution_status` | Takeaway |
| --- | --- | --- |
| `INCLUDED` | `EXECUTED_OPTIMISTIC` | inclusion was satisfied, and execution had already advanced |
| `EXECUTED_OPTIMISTIC` | `EXECUTED_OPTIMISTIC` | optimistic execution was the first stage observed |
| `INCLUDED_FINAL` | `FINAL` | the transaction advanced past included-final before the response came back |
| `FINAL` | `FINAL` | this is the simple “is it actually done?” threshold |

```bash
RPC_URL=https://rpc.testnet.fastnear.com
TX_HASH=CVyG2xLJ6fuKCtULAxMnWTh2GL5ey2UUiTcgYT3M6Pow
SIGNER_ACCOUNT_ID=mike.testnet
```

1. If you are submitting live, get the hash first.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data '{
    "jsonrpc": "2.0",
    "id": "fastnear",
    "method": "broadcast_tx_async",
    "params": ["BASE64_SIGNED_TX"]
  }' \
  | jq '{tx_hash: .result}'
```

This is the clean “submit now, track separately” surface. In live testnet runs, `send_tx` with `wait_until: "NONE"` returned only `final_execution_status: "NONE"` and no hash, so it is not the clearest default when the client owns tracking.

2. Use `INCLUDED` when the real question is “did this make it into a block yet?”

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
        wait_until: "INCLUDED"
      }
    }')" \
  | jq '{
      final_execution_status: .result.final_execution_status,
      status: .result.status,
      transaction_outcome_status: .result.transaction_outcome.outcome.status
    }'
```

What to notice:

- `INCLUDED` means “do not answer before inclusion,” not “freeze the reply at included”
- a live reply can already be `EXECUTED_OPTIMISTIC` or `FINAL`
- use this threshold when block inclusion is the question

3. Use `FINAL` when the real question is “is it actually done?”

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
      status: .result.status,
      receipts_outcome_count: (.result.receipts_outcome | length)
    }'
```

What to notice:

- `FINAL` is the simplest success threshold for most clients
- `tx` already gives you `receipts_outcome`, which is enough for most tracking loops
- for a historical transaction like this pinned one, the reply returns immediately because the work is already done

4. Only widen to `EXPERIMENTAL_tx_status` when you need the receipt tree itself.

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
      receipts_count: (.result.receipts | length),
      receipts_outcome_count: (.result.receipts_outcome | length)
    }'
```

`tx` already answers the stage question. `EXPERIMENTAL_tx_status` is the follow-up when you also need the receipt records that `tx` does not include.

**Use these defaults**

- Need a hash now: [`broadcast_tx_async`](/rpc/transaction/broadcast-tx-async)
- Need to know whether the transaction is included or final: [`tx`](/rpc/transaction/tx-status)
- Need the receipt tree: [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status)
- Need one blocking submission call instead: [`send_tx`](/rpc/transaction/send-tx)

## Tip Block Inspection

### Describe the first action of the first transaction at the current tip

Need one plain-English description of what the tip block starts with? Read the true tip with `status`, choose the first non-empty chunk from `block`, then inspect that chunk directly.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Use `status` for the live head, `block` for the ordered chunk list, then `chunk` for the first transaction and its first action.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC status</span> gives the node's current head hash.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC block</span> gives the chunk list, so you can pick the first chunk whose <span className="fastnear-example-strategy__code">tx_root</span> is not the empty sentinel.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC chunk</span> gives the transactions and actions. Use <span className="fastnear-example-strategy__code">transactions[0].actions[0]</span> as the exact answer.</span></p>
  </div>
</div>

**Flow**

- Read the live head hash with `status`.
- Fetch that exact block with `block`.
- Scan the block's chunks in returned order and keep the first non-empty chunk.
- Fetch that chunk and read the first transaction's first action.
- Print one human sentence for that action.

`block` is only enough to choose the chunk. The transaction list lives on `chunk`, so you do not need `tx` for this job.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
EMPTY_TX_ROOT=11111111111111111111111111111111
```

1. Read the node's true tip and keep the latest block hash.

```bash
BLOCK_HASH="$(
  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data '{
      "jsonrpc": "2.0",
      "id": "fastnear",
      "method": "status",
      "params": []
    }' \
    | tee /tmp/tip-status.json \
    | jq -r '.result.sync_info.latest_block_hash'
)"

jq '{
  latest_block_height: .result.sync_info.latest_block_height,
  latest_block_hash: .result.sync_info.latest_block_hash
}' /tmp/tip-status.json
```

2. Fetch that block and pick the first non-empty chunk in returned order.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg block_hash "$BLOCK_HASH" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "block",
    params: {
      block_id: $block_hash
    }
  }')" \
  | tee /tmp/tip-block.json >/dev/null

CHUNK_HASH="$(
  jq -r --arg empty_tx_root "$EMPTY_TX_ROOT" '
    first(
      .result.chunks[]
      | select(.tx_root != $empty_tx_root)
      | .chunk_hash
    ) // empty
  ' /tmp/tip-block.json
)"

jq --arg empty_tx_root "$EMPTY_TX_ROOT" '{
  block: {
    height: .result.header.height,
    hash: .result.header.hash
  },
  first_non_empty_chunk: (
    first(
      .result.chunks[]
      | select(.tx_root != $empty_tx_root)
      | {
          chunk_hash,
          shard_id,
          tx_root
        }
    ) // null
  )
}' /tmp/tip-block.json

if [ -z "$CHUNK_HASH" ]; then
  echo "tip block had no transactions, rerun on the next block"
fi
```

That empty-block branch is intentional. A true tip block can be valid and still have no transactions.

3. If `CHUNK_HASH` is non-empty, fetch the chosen chunk and print the first transaction plus its first action type.

```bash
if [ -n "$CHUNK_HASH" ]; then
  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg chunk_hash "$CHUNK_HASH" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "chunk",
      params: {
        chunk_id: $chunk_hash
      }
    }')" \
    | tee /tmp/tip-chunk.json >/dev/null

  jq '{
    chunk: {
      chunk_hash: .result.header.chunk_hash,
      shard_id: .result.header.shard_id,
      height_included: .result.header.height_included
    },
    first_transaction: {
      hash: .result.transactions[0].hash,
      signer_id: .result.transactions[0].signer_id,
      receiver_id: .result.transactions[0].receiver_id
    },
    first_action_type: (.result.transactions[0].actions[0] | keys[0])
  }' /tmp/tip-chunk.json
fi
```

4. If the chunk fetch ran, turn that first action into one human sentence.

```bash
if [ -n "$CHUNK_HASH" ]; then
  FIRST_ACTION_TYPE="$(jq -r '.result.transactions[0].actions[0] | keys[0]' /tmp/tip-chunk.json)"
  SIGNER_ID="$(jq -r '.result.transactions[0].signer_id' /tmp/tip-chunk.json)"
  RECEIVER_ID="$(jq -r '.result.transactions[0].receiver_id' /tmp/tip-chunk.json)"

  if [ "$FIRST_ACTION_TYPE" = "FunctionCall" ]; then
    METHOD_NAME="$(jq -r '.result.transactions[0].actions[0].FunctionCall.method_name' /tmp/tip-chunk.json)"
    RENDERED_ARGS="$(
      jq -r '
        .result.transactions[0].actions[0].FunctionCall.args as $raw
        | try ($raw | @base64d | fromjson | tojson) catch $raw
      ' /tmp/tip-chunk.json
    )"

    printf '%s\n' "$SIGNER_ID called $METHOD_NAME on $RECEIVER_ID with args: $RENDERED_ARGS"
  else
    printf '%s\n' "$SIGNER_ID sent $FIRST_ACTION_TYPE to $RECEIVER_ID"
  fi
fi
```

That last step deliberately stays simple:

- if the first action is `FunctionCall`, print the method plus decoded JSON args when they decode cleanly
- otherwise print the action type, signer, and receiver without adding more protocol interpretation

## Account and Key Mechanics

### Audit and remove old Near Social function-call keys

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Use exact key reads to narrow the target first, then sign exactly one delete.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC view_access_key_list</span> finds only the function-call keys scoped to <span className="fastnear-example-strategy__code">social.near</span>.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC view_access_key</span> double-checks the one key you plan to remove, and <span className="fastnear-example-strategy__code">POST /v0/account</span> is only for optional account-level context.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC send_tx</span> submits the <span className="fastnear-example-strategy__code">DeleteKey</span>, then <span className="fastnear-example-strategy__code">RPC view_access_key_list</span> closes the loop.</span></p>
  </div>
</div>

**Flow**

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

3. Pull recent function-call activity for the account only if you want more context before cleanup.

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

**When to pivot**

Re-running `view_access_key_list` closes the loop on the same RPC method you used for discovery. If the delete succeeded there, you do not need an indexed API to prove the cleanup.

### Which transaction added this `social.near` function-call key, and who authorized it?

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Start from the live key, then walk backward only as far as you need.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC view_access_key</span> gives the current stored nonce, which is the best historical clue you have.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">POST /v0/account</span> turns that nonce into a tight candidate window instead of a whole-account search.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">POST /v0/transactions</span> tells you whether the key was added directly or through delegated authorization, and <span className="fastnear-example-strategy__code">POST /v0/receipt</span> is only for the exact <span className="fastnear-example-strategy__code">AddKey</span> execution block.</span></p>
  </div>
</div>

**Flow**

- Read the exact key first with RPC and keep its current nonce as the clue.
- Convert that nonce into a tight block-height window for the likely `AddKey` receipt.
- Search account history only inside that window instead of scanning the whole account.
- Hydrate the candidate transaction and distinguish three different keys:
  - the key that got added
  - the top-level signer public key
  - the delegated authorizing public key, if the change was wrapped in a `Delegate` action

Three nonce details matter up front:

- New access keys start with a nonce derived from block height at roughly `block_height * 1_000_000`, so dividing the current nonce by `1_000_000` gives a useful search window.
- The `AddKey` action payload often shows `access_key.nonce: 0`. That is not the stored nonce you later see from `view_access_key`.
- If the key has been used heavily since creation, widen the search window a bit more.

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export TX_BASE_URL=https://tx.main.fastnear.com
export ACCOUNT_ID=YOUR_ACCOUNT_ID
export TARGET_PUBLIC_KEY='ed25519:PASTE_THE_ACCESS_KEY_YOU_WANT_TO_TRACE'

# Sample live key observed on April 18, 2026:
# export ACCOUNT_ID=mike.near
# export TARGET_PUBLIC_KEY='ed25519:7GZgXkMPEyGXqRhxaLvHxWn6fVfeyuQGMqnLVQAh7bs'
```

1. Read the exact key first, then turn its current nonce into a search window.

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
  | tee /tmp/key-origin-view.json >/dev/null

CURRENT_NONCE="$(jq -r '.result.nonce' /tmp/key-origin-view.json)"
ESTIMATED_RECEIPT_BLOCK="$(( CURRENT_NONCE / 1000000 + 1 ))"
SEARCH_FROM="$(( ESTIMATED_RECEIPT_BLOCK - 20 ))"
SEARCH_TO="$(( ESTIMATED_RECEIPT_BLOCK + 5 ))"

jq -n \
  --arg account_id "$ACCOUNT_ID" \
  --arg target_public_key "$TARGET_PUBLIC_KEY" \
  --argjson current_nonce "$CURRENT_NONCE" \
  --argjson estimated_receipt_block "$ESTIMATED_RECEIPT_BLOCK" \
  --argjson search_from "$SEARCH_FROM" \
  --argjson search_to "$SEARCH_TO" \
  --arg permission "$(jq -c '.result.permission' /tmp/key-origin-view.json)" '{
    account_id: $account_id,
    target_public_key: $target_public_key,
    current_nonce: $current_nonce,
    estimated_receipt_block: $estimated_receipt_block,
    search_from_tx_block_height: $search_from,
    search_to_tx_block_height: $search_to,
    permission: ($permission | fromjson)
  }'
```

If you use the sample key above, the estimated receipt block should land at `112057392`.

2. Search account history only inside that block neighborhood.

```bash
curl -s "$TX_BASE_URL/v0/account" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --argjson from_tx_block_height "$SEARCH_FROM" \
    --argjson to_tx_block_height "$SEARCH_TO" '{
      account_id: $account_id,
      is_real_signer: true,
      from_tx_block_height: $from_tx_block_height,
      to_tx_block_height: $to_tx_block_height,
      desc: false,
      limit: 50
    }')" \
  | tee /tmp/key-origin-candidates.json >/dev/null

jq '{
  txs_count,
  candidate_txs: [
    .account_txs[]
    | {
        transaction_hash,
        tx_block_height,
        is_signer,
        is_real_signer,
        is_predecessor,
        is_receiver
      }
  ]
}' /tmp/key-origin-candidates.json
```

With the sample `mike.near` key above, this window returns one candidate transaction: `6ZT8UGPRC6L3NGs2qHnECPVexKWNQ5LWLK9w95tgj3tV` at outer tx block `112057390`.

3. Hydrate those candidates and keep only the transaction that actually added your target key.

```bash
TX_HASHES_JSON="$(
  jq -c '[.account_txs[].transaction_hash]' /tmp/key-origin-candidates.json
)"

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --argjson tx_hashes "$TX_HASHES_JSON" '{tx_hashes: $tx_hashes}')" \
  | tee /tmp/key-origin-transactions.json >/dev/null

jq --arg target_public_key "$TARGET_PUBLIC_KEY" '
  .transactions[]
  | . as $tx
  | (
      ($tx.transaction.actions[]?
        | .AddKey?
        | select(.public_key == $target_public_key)
        | {
            authorization_mode: "direct",
            top_level_signer_id: $tx.transaction.signer_id,
            top_level_signer_public_key: $tx.transaction.public_key,
            authorizing_public_key: $tx.transaction.public_key,
            added_public_key: .public_key,
            add_key_payload_nonce: .access_key.nonce,
            permission: .access_key.permission
          }),
      ($tx.transaction.actions[]?
        | .Delegate?
        | .delegate_action as $delegate
        | $delegate.actions[]?
        | .AddKey?
        | select(.public_key == $target_public_key)
        | {
            authorization_mode: "delegated",
            top_level_signer_id: $tx.transaction.signer_id,
            top_level_signer_public_key: $tx.transaction.public_key,
            authorizing_public_key: $delegate.public_key,
            added_public_key: .public_key,
            add_key_payload_nonce: .access_key.nonce,
            permission: .access_key.permission
          })
    )
  | {
      transaction_hash: $tx.transaction.hash,
      tx_block_height: $tx.execution_outcome.block_height,
      tx_block_hash: $tx.execution_outcome.block_hash,
      receiver_id: $tx.transaction.receiver_id
    } + .
' /tmp/key-origin-transactions.json | tee /tmp/key-origin-match.json
```

If `authorization_mode` is `direct`, the top-level signer public key and the authorizing public key are the same. If `authorization_mode` is `delegated`, the key that actually authorized the `AddKey` lives inside `Delegate.delegate_action.public_key`.

With the sample `mike.near` key above, the match is delegated:

- `transaction_hash`: `6ZT8UGPRC6L3NGs2qHnECPVexKWNQ5LWLK9w95tgj3tV`
- `top_level_signer_public_key`: `ed25519:Ez817Dgs2uYP5a6GoijzFarcS3SWPT5eEB82VJXsd4oM`
- `authorizing_public_key`: `ed25519:GaYgzN1eZUgwA7t8a5pYxFGqtF4kon9dQaDMjPDejsiu`
- `added_public_key`: `ed25519:7GZgXkMPEyGXqRhxaLvHxWn6fVfeyuQGMqnLVQAh7bs`

4. If you need the exact `AddKey` receipt block too, pivot one more time by receipt ID.

```bash
ADD_KEY_RECEIPT_ID="$(
  jq -r --arg target_public_key "$TARGET_PUBLIC_KEY" '
    .transactions[]
    | .receipts[]
    | select(any((.receipt.receipt.Action.actions // [])[]; .AddKey.public_key? == $target_public_key))
    | .receipt.receipt_id
  ' /tmp/key-origin-transactions.json | head -n 1
)"

curl -s "$TX_BASE_URL/v0/receipt" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$ADD_KEY_RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '{
      receipt_id: .receipt.receipt_id,
      receipt_block_height: .receipt.block_height,
      tx_block_height: .receipt.tx_block_height,
      predecessor_id: .receipt.predecessor_id,
      receiver_id: .receipt.receiver_id,
      transaction_hash: .receipt.transaction_hash
    }'
```

For the sample key above, the exact `AddKey` receipt is `C5jsTftYwPiibyxdoDKd4LXFFru8n4weDKLV4cfb1bcX` in receipt block `112057392`, while the outer transaction landed earlier in block `112057390`.

**When to pivot**

Start with exact current key state because it gives you the nonce clue. A tight `/v0/account` window turns that clue into a small candidate set. `/v0/transactions` tells you whether the key was added directly or through delegated authorization. `/v0/receipt` is the optional last step when you need the exact `AddKey` receipt block, not just the outer transaction.

### Register FT storage if needed, then transfer tokens

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Read storage first, then spend the minimum write calls needed to make the transfer stick.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC call_function storage_balance_of</span> tells you whether the receiver is already registered.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC call_function storage_balance_bounds</span> only matters if you need the exact minimum deposit before writing.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC send_tx</span> submits <span className="fastnear-example-strategy__code">storage_deposit</span> and <span className="fastnear-example-strategy__code">ft_transfer</span>, then <span className="fastnear-example-strategy__code">RPC call_function ft_balance_of</span> proves the result.</span></p>
  </div>
</div>

**Network**

- testnet

**Official references**

- [FT storage and transfer](https://docs.near.org/integrations/fungible-tokens)
- [Pre-deployed FT contract](https://docs.near.org/tutorials/fts/predeployed-contract)

This walkthrough uses the safe public contract `ft.predeployed.examples.testnet`. Before you start, make sure the sender already holds some `gtNEAR` there. If not, mint a small balance first with the pre-deployed contract guide above and then come back to this flow.

**Flow**

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

**When to pivot**

This is a good RPC example because every step stays close to the contract itself: first check storage state, then send the minimum required change calls, then verify the post-transfer balance directly on the contract.

## Contract Reads and Raw State

### How do I read a contract's raw storage directly?

This walkthrough uses the live public testnet contract `counter.near-examples.testnet`. The number can change over time. The useful part is the shape of the read:

- `view_state` reads the raw `STATE` entry directly from contract storage
- `call_function get_num` asks the contract for the same current number through its public view API

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Read the storage the hard way first, then let the contract confirm the same answer through its view method.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC view_state</span> reads the raw <span className="fastnear-example-strategy__code">STATE</span> entry without running contract code.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span>Decode the base64 value into bytes, then interpret those bytes with the contract’s known Borsh layout.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC call_function get_num</span> is the friendly cross-check that the raw-state read and the view method still agree.</span></p>
  </div>
</div>

Keep the distinction straight:

- `view_state` is a direct storage read from the trie
- `call_function` executes a read-only method on the contract
- both can answer the same question, but they do different work to get there

```mermaid
flowchart LR
    S["RPC view_state<br/>prefix STATE"] --> R["Raw STATE bytes"]
    R --> D["Decode base64 + Borsh"]
    D --> N["Signed counter value"]
    C["RPC call_function get_num"] --> J["JSON method result"]
    N --> X["Compare"]
    J --> X
    X --> A["Same current counter value"]
```

**Flow**

- Read the raw `STATE` key from contract storage.
- Decode the returned bytes into the current signed counter value.
- Call `get_num` through the view method and confirm that the method answer matches the raw-state decode.

```bash
export NETWORK_ID=testnet
export RPC_URL=https://rpc.testnet.fastnear.com
export CONTRACT_ID=counter.near-examples.testnet
export STATE_PREFIX_BASE64=U1RBVEU=
```

1. Read the raw contract state first.

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
  block_height: .result.block_height,
  key_base64: .result.values[0].key,
  value_base64: .result.values[0].value
}' /tmp/counter-view-state.json

jq -r '.result.values[0].key | @base64d' /tmp/counter-view-state.json
```

That last command should print `STATE`. This is the key family you already knew ahead of time, so `view_state` can go straight to the raw storage entry without asking the contract to execute any method.

2. Decode the returned value bytes into the signed counter.

```bash
RAW_VALUE_BASE64="$(jq -r '.result.values[0].value' /tmp/counter-view-state.json)"

python3 - "$RAW_VALUE_BASE64" <<'PY' | jq .
import base64
import json
import sys

raw = base64.b64decode(sys.argv[1])

print(json.dumps({
    "value_base64": sys.argv[1],
    "bytes": list(raw),
    "hex": raw.hex(),
    "signed_i8": int.from_bytes(raw, "little", signed=True),
    "unsigned_u8": int.from_bytes(raw, "little", signed=False),
}))
PY
```

For this specific contract, one byte is enough because the Rust counter stores `val: i8` inside the contract state. That is why a raw value like `CQ==` decodes to one byte `0x09`, which reads as the signed integer `9`.

One small signed-value note is worth keeping in your head: if the counter were negative, the same one-byte payload would still decode correctly as a signed two's-complement `i8`. For example, `/w==` is the single byte `0xff`, which means `-1` as `signed_i8`, not `255`.

The reusable recipe is small:

- `view_state` gives you base64-encoded raw bytes
- you decode those bytes with the contract’s known storage layout
- for larger contracts, that layout may be more complex, but the idea is the same: bytes first, schema second

3. Now ask the contract the friendly way and compare.

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

4. Compare both answers directly.

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

If `agrees_now` is `true`, you have proved the point of the example:

- `view_state` answered the question by reading storage directly
- `call_function get_num` answered the same question by running the contract’s public read method

**When to pivot**

Use `view_state` when the real question is about exact storage, missing view methods, or verifying a known key family. Use `call_function` when you want the contract’s public read API. If the next question becomes historical instead of “what is it right now?”, that is the moment to widen into [KV FastData API](/fastdata/kv).

## Chunk and Shard Tracing

### Trace a generated transfer receipt from one shard chunk to another

This walkthrough is pinned to:

- transaction `8xrcQU6Sr1jhnigenBbpfGzk9jN24rLmMqSWT7TF7xJP` from `7419369993.tg` to `game.hot.tg` calling `l2_claim`
- origin chunk `BfydTxiPbGY34pejscBytYSXpBsk9gWA2ixKoAe7VsVw` on shard `11` in block `194623170`
- first receipt chunk `FJWpAYzVXbZwqJUbGXELTnnBBkdvc6W8vWkwuUA3Zwz9` on shard `11` in block `194623171`
- generated `Transfer` receipt `TtRn4DzLKzFmGEn5YqoZ35ts411Hz6Ci6WQMjphPMn4`
- destination chunk `EPauY1GBaeAgGf1TikxFcPUhmYsVhLf1cwy14vAYsUuU` on shard `6` in block `194623172`

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Recover the receipt chain first, inspect the generated receipt directly, then map each leg back to the shard chunk that actually carried it.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC EXPERIMENTAL_tx_status</span> quickly shows the receipt graph and which later blocks the work moved into.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC EXPERIMENTAL_receipt</span> lets you inspect the generated receipt payload directly instead of inferring it from logs alone.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC chunk</span> by block-and-shard or by chunk hash proves which shard-local execution unit actually carried each step.</span></p>
  </div>
</div>

The two experimental methods here are a good fit for advanced tracing: `EXPERIMENTAL_tx_status` finds the receipt graph quickly, and `EXPERIMENTAL_receipt` shows the generated receipt body before you map it back to chunks.

```mermaid
flowchart LR
    A["Tx 8xrc...<br/>block 194623170<br/>chunk Bfyd...<br/>shard 11"] --> B["Receipt AFC2...<br/>block 194623171<br/>chunk FJWp...<br/>shard 11<br/>ft_mint logs"]
    B --> C["Generated receipt TtRn...<br/>Transfer 1800930478788300000000 yoctoNEAR"]
    C --> D["Chunk EPau...<br/>block 194623172<br/>shard 6<br/>receipt executes"]
```

**Flow**

- Recover the receipt chain from the transaction first.
- Inspect the generated `Transfer` receipt body directly.
- Use chunk coordinates when you know the block and shard.
- Use chunk hash when another tool already handed you the exact destination chunk.

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export TX_HASH=8xrcQU6Sr1jhnigenBbpfGzk9jN24rLmMqSWT7TF7xJP
export SIGNER_ACCOUNT_ID=7419369993.tg
export ORIGIN_BLOCK_HEIGHT=194623170
export ORIGIN_SHARD_ID=11
export RECEIPT_BLOCK_HEIGHT=194623171
export RECEIPT_SHARD_ID=11
export GENERATED_RECEIPT_ID=TtRn4DzLKzFmGEn5YqoZ35ts411Hz6Ci6WQMjphPMn4
export DESTINATION_CHUNK_HASH=EPauY1GBaeAgGf1TikxFcPUhmYsVhLf1cwy14vAYsUuU
```

1. Start with `EXPERIMENTAL_tx_status` so you can see the receipt graph before you think about chunks.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg tx_hash "$TX_HASH" \
    --arg signer_account_id "$SIGNER_ACCOUNT_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "EXPERIMENTAL_tx_status",
      params: [$tx_hash, $signer_account_id]
    }')" \
  | tee /tmp/chunk-trace-status.json >/dev/null

jq '{
  final_execution_status: .result.final_execution_status,
  transaction_handoff: .result.transaction_outcome.outcome.status,
  receipts: (
    .result.receipts_outcome
    | map({
        receipt_id: .id,
        executor_id: .outcome.executor_id,
        block_hash,
        status: .outcome.status
      })
  )
}' /tmp/chunk-trace-status.json
```

What to notice:

- the signed transaction hands off into receipt `AFC2xUPuuA6BKMMvAV47LLPtzsg3Moh7frvLSuyMeZ2Y`
- later in the same receipt graph, `TtRn4DzLKzFmGEn5YqoZ35ts411Hz6Ci6WQMjphPMn4` executes for `7419369993.tg`
- the high-level tx status is already enough to tell you that the real work continued after the original signed transaction

2. Inspect the generated receipt directly so you can prove that the follow-up object is a real `Transfer` receipt.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$GENERATED_RECEIPT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "EXPERIMENTAL_receipt",
    params: {
      receipt_id: $receipt_id
    }
  }')" \
  | tee /tmp/chunk-trace-receipt.json >/dev/null

jq '{
  predecessor_id: .result.predecessor_id,
  receiver_id: .result.receiver_id,
  signer_id: .result.receipt.Action.signer_id,
  signer_public_key: .result.receipt.Action.signer_public_key,
  actions: .result.receipt.Action.actions
}' /tmp/chunk-trace-receipt.json
```

This is the point where the shard story becomes concrete: the contract flow generated a `Transfer` action receipt from `system` to `7419369993.tg` with deposit `1800930478788300000000`.

3. Use chunk by block and shard to locate the original signed transaction on shard `11`.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --argjson block_id "$ORIGIN_BLOCK_HEIGHT" \
    --argjson shard_id "$ORIGIN_SHARD_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "chunk",
      params: {
        block_id: $block_id,
        shard_id: $shard_id
      }
    }')" \
  | jq --arg tx_hash "$TX_HASH" '{
      header: {
        chunk_hash: .result.header.chunk_hash,
        shard_id: .result.header.shard_id,
        height_created: .result.header.height_created
      },
      matching_transaction: (
        .result.transactions[]
        | select(.hash == $tx_hash)
        | {
            hash,
            signer_id,
            receiver_id
          }
      )
    }'
```

This is the cleanest use of `chunk` by block and shard: you already know the coordinates, and you want the exact shard-local execution unit that carried the original signed transaction.

4. Stay on the same route for the next block and watch the first receipt execute on the same shard.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --argjson block_id "$RECEIPT_BLOCK_HEIGHT" \
    --argjson shard_id "$RECEIPT_SHARD_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "chunk",
      params: {
        block_id: $block_id,
        shard_id: $shard_id
      }
    }')" \
  | jq '{
      header: {
        chunk_hash: .result.header.chunk_hash,
        shard_id: .result.header.shard_id,
        height_created: .result.header.height_created,
        tx_root: .result.header.tx_root,
        gas_used: .result.header.gas_used
      },
      tx_count: (.result.transactions | length),
      receipt_count: (.result.receipts | length),
      matching_receipt: (
        .result.receipts[]
        | select(.receipt_id == "AFC2xUPuuA6BKMMvAV47LLPtzsg3Moh7frvLSuyMeZ2Y")
        | {
            receipt_id,
            predecessor_id,
            receiver_id
          }
      )
    }'
```

This is the chunk moment that makes the whole concept natural:

- the chunk has `tx_root = 11111111111111111111111111111111`
- `tx_count` is `0`
- but the shard still burned gas and executed receipt `AFC2...`

In other words, this shard did real work in that block even though no new signed transaction appeared directly inside the chunk.

5. Switch to chunk by hash once another tool has already given you the exact destination chunk.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg chunk_id "$DESTINATION_CHUNK_HASH" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "chunk",
    params: {
      chunk_id: $chunk_id
    }
  }')" \
  | jq --arg receipt_id "$GENERATED_RECEIPT_ID" '{
      header: {
        chunk_hash: .result.header.chunk_hash,
        shard_id: .result.header.shard_id,
        height_created: .result.header.height_created,
        tx_root: .result.header.tx_root,
        gas_used: .result.header.gas_used
      },
      tx_count: (.result.transactions | length),
      receipt_count: (.result.receipts | length),
      matching_receipt: (
        .result.receipts[]
        | select(.receipt_id == $receipt_id)
        | {
            receipt_id,
            predecessor_id,
            receiver_id
          }
      )
    }'
```

This confirms the cross-shard hop:

- the generated `Transfer` receipt executes in chunk `EPau...`
- that chunk lives on shard `6`, not shard `11`
- the signed transaction started on one shard, but the later receipt finished on another

**When to pivot**

Use [`Chunk by Block and Shard`](/rpc/protocol/chunk-by-block-shard) when you know the block and shard coordinates and want to ask “what did this shard execute in this block?” Use [`Chunk by Hash`](/rpc/protocol/chunk-by-hash) when another tool has already handed you the exact chunk hash. Use [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status) and [`EXPERIMENTAL_receipt`](/rpc/transaction/experimental-receipt) when the real question is receipt-driven tracing. If you also need state changes and produced receipts, widen to [Block Shard](/neardata/block-shard).

## NEAR Social and BOS Exact Reads

These stay on exact SocialDB reads and on-chain readiness checks until the question turns historical.

### Can this account still publish to NEAR Social right now?

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Ask <span className="fastnear-example-strategy__code">social.near</span> for the two things that matter before you sign anything.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC view_account</span> makes sure the signer account exists and can actually submit a transaction.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC call_function get_account_storage</span> tells you whether the target account has room left on <span className="fastnear-example-strategy__code">social.near</span>.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC call_function is_write_permission_granted</span> only comes into play when a different signer is trying to write on that account’s behalf.</span></p>
  </div>
</div>

Required checks:

- does the target account already have storage on `social.near`?
- if it does, is there still room left in that storage?
- if a different signer is trying to write under that account, has write permission already been granted?

**Official references**

- [SocialDB API and contract surface](https://github.com/NearSocial/social-db#api)

**Flow**

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

**When to pivot**

This keeps the whole question on exact on-chain reads. `social.near` itself answers whether the target account has room left and whether a delegated signer is already allowed to write. That is a better NEAR Social readiness check than guessing from wallet state alone.

### What does `mob.near/widget/Profile` actually contain right now?

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Flow</span>
    <p className="fastnear-example-strategy__title">Stay on exact SocialDB reads, and only widen into history if the question turns forensic.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC call_function keys</span> shows the widget catalog and the last-write blocks under <span className="fastnear-example-strategy__code">mob.near/widget/*</span>.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC call_function get</span> reads the exact source for <span className="fastnear-example-strategy__code">widget/Profile</span>.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>If the next question becomes “which transaction wrote this?”, hand off to the widget proof recipe in <span className="fastnear-example-strategy__code">/tx/examples</span>.</span></p>
  </div>
</div>

**Official references**

- [SocialDB API and contract surface](https://github.com/NearSocial/social-db#api)

**Flow**

- Ask `social.near` for the widget catalog under `mob.near`.
- Keep the block heights so you know when each widget key last changed.
- Confirm that `Profile` is really there, then read its exact source through the same contract.
- If the next question becomes “which transaction wrote this widget?”, switch to the NEAR Social proof recipes in [Transactions Examples](/tx/examples).

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export SOCIAL_CONTRACT_ID=social.near
export ACCOUNT_ID=mob.near
export WIDGET_NAME=Profile
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

2. Confirm that `Profile` is really in the catalog, then print the exact source stored in SocialDB.

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

At the time of writing, the live last-write block for `mob.near/widget/Profile` was `86494825`. Keep that block if you later want to prove which transaction wrote this version.

**When to pivot**

Sometimes the right RPC answer is just: here is the widget, here is the live source, and here is the block height to keep if provenance matters later.

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

### Trace shard-local execution through chunks

**Start here**

- Start with the chunk-tracing example above when the real question is “which chunk or shard actually executed this receipt?”
- [Chunk by Block and Shard](/rpc/protocol/chunk-by-block-shard) when you already know the block and shard coordinates.
- [Chunk by Hash](/rpc/protocol/chunk-by-hash) when another tool already handed you the exact chunk hash.

**Next page if needed**

- [Experimental Receipt](/rpc/transaction/experimental-receipt) when you need the generated receipt body itself.
- [Block Shard](/neardata/block-shard) when chunk data alone is not enough and you need state changes or produced receipts too.
- [Transactions Examples](/tx/examples) when the question turns into a broader async or callback investigation.

**Stop when**

- You can name which chunk and shard carried the work that mattered.

**Switch when**

- The user really wants a readable transaction story instead of shard-local execution details. Move to [Transactions API](/tx).

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

- Start with the counter example above when the real decision is “should I use `call_function` or `view_state`?” or “can I read this storage directly instead of calling a method?”
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

- Start with the worked example above when the real question is which submission endpoint to use and how to track the transaction through completion.
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
