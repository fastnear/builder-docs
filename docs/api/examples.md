---
sidebar_label: Examples
slug: /api/examples
title: API Examples
description: Plain-language workflows for using FastNear API docs for account lookups, asset inventory, and direct staking checks.
displayed_sidebar: fastnearApiSidebar
page_actions:
  - markdown
---

## Quick start

Start with one identity lookup and one broad account read.

```bash
API_BASE_URL=https://api.fastnear.com
PUBLIC_KEY='ed25519:YOUR_PUBLIC_KEY'

ENCODED_PUBLIC_KEY="$(jq -rn --arg public_key "$PUBLIC_KEY" '$public_key | @uri')"

ACCOUNT_ID="$(
  curl -s "$API_BASE_URL/v1/public_key/$ENCODED_PUBLIC_KEY" \
    | jq -r '.account_ids[0]'
)"

echo "$ACCOUNT_ID"

curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/full" \
  | jq '{
      account_id,
      state,
      token_count: (.tokens | length),
      nft_count: (.nfts | length),
      pool_count: (.pools | length)
    }'
```

This is the shortest path to “which account is this key?” and “what does that wallet look like right now?”

## Worked walkthroughs

### Resolve a public key, then fetch the account snapshot

Use this when you have a public key first and the next user-facing question is “which account is this?” followed immediately by “what does that account look like right now?”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Resolve identity first, then either inspect one account immediately or fan out across the returned list when the key maps to more than one account.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/public_key</span> gives the candidate <span className="fastnear-example-strategy__code">account_id</span> values for the key.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">jq</span> lifts the account you actually want to inspect next.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../full</span> answers balances, NFTs, and staking in one response.</span></p>
  </div>
</div>

**What you're doing**

- Resolve the public key to one or more account IDs.
- Count how many account IDs came back before you commit to one.
- Reuse one account ID immediately, or loop through the full list when the key maps to multiple accounts.

```bash
API_BASE_URL=https://api.fastnear.com
PUBLIC_KEY='ed25519:YOUR_PUBLIC_KEY'
# Example public key from the docs page model:
# PUBLIC_KEY='ed25519:CCaThr3uokqnUs6Z5vVnaDcJdrfuTpYJHJWcAGubDjT'

ENCODED_PUBLIC_KEY="$(jq -rn --arg public_key "$PUBLIC_KEY" '$public_key | @uri')"

ACCOUNT_ID="$(
  curl -s "$API_BASE_URL/v1/public_key/$ENCODED_PUBLIC_KEY" \
    | tee /tmp/fastnear-public-key.json \
    | jq -r '.account_ids[0]'
)"

ACCOUNT_COUNT="$(
  jq -r '.account_ids | length' /tmp/fastnear-public-key.json
)"

jq '{
  account_ids,
  account_count: (.account_ids | length)
}' /tmp/fastnear-public-key.json

if [ "$ACCOUNT_COUNT" -eq 1 ]; then
  curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/full" \
    | jq '{
        account_id,
        state,
        token_count: (.tokens | length),
        nft_count: (.nfts | length),
        pool_count: (.pools | length)
      }'
else
  jq -r '.account_ids[]' /tmp/fastnear-public-key.json \
    | while read -r candidate_account_id; do
        curl -s "$API_BASE_URL/v1/account/$candidate_account_id/full" \
          | jq '{
              account_id,
              state,
              token_count: (.tokens | length),
              nft_count: (.nfts | length),
              pool_count: (.pools | length)
            }'
      done
fi
```

**Why this next step?**

The public-key lookup tells you which account or accounts you are dealing with. The full account snapshot is the natural next read when you want balances, NFTs, staking, and pools in one response. If the key maps to multiple accounts instead of one, this is the point where you either inspect each returned `account_id` or move to [V1 Public Key Lookup All](/api/v1/public-key-all) for the broader historical view.

### Does this account have direct staking right now?

Use this when the user story is simple: “tell me whether this account has visible direct staking pools right now, and show me which pools they are.”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Read the staking endpoint once, then turn the visible pool list into a yes/no answer.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../staking</span> returns the account’s visible direct staking positions.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">jq</span> turns that response into <span className="fastnear-example-strategy__code">has_direct_staking_now</span>, <span className="fastnear-example-strategy__code">pool_count</span>, and <span className="fastnear-example-strategy__code">pool_ids</span>.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>If <span className="fastnear-example-strategy__code">pools</span> is empty, the answer from this surface is simply “no visible direct staking right now.”</span></p>
  </div>
</div>

**Network**

- mainnet

**Official references**

- [Validator staking](https://docs.near.org/concepts/basics/staking)

**What you're doing**

- Read indexed direct staking positions from the account staking endpoint.
- Print a small yes/no summary plus the visible pool IDs.
- Stop there unless the next question becomes pool-specific unstake or withdraw timing.

```bash
API_BASE_URL=https://api.fastnear.com
ACCOUNT_ID=mike.near
```

1. Fetch the direct staking view.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/staking" \
  | tee /tmp/account-staking.json >/dev/null

jq '{
  account_id,
  has_direct_staking_now: ((.pools // []) | length > 0),
  pool_count: ((.pools // []) | length),
  pool_ids: ((.pools // []) | map(.pool_id))
}' /tmp/account-staking.json
```

At the time of writing, `mike.near` returned visible direct staking pools here. If `pool_ids` comes back empty for your target account, this endpoint is answering “no visible direct staking right now.”

**Why this next step?**

This keeps the question narrow and operational. If the answer is `true`, remember what that means on chain: the account usually delegated into a staking-pool contract such as `polkachu.poolv1.near` by sending a `FunctionCall` like `deposit_and_stake` with attached deposit. The pool contract later performs the actual `Stake` action on its own account. If the answer is `false`, do not infer liquid staking from this example alone; liquid staking positions usually show up first as FT holdings in specific LST contracts, so the right follow-up is the FT holdings example below. Also note the scope boundary here: this endpoint does not currently surface pending-unstake or withdraw-ready amounts, so it is not the place to answer epoch-delay timing questions.

#### Optional follow-up: What did this contract call for delegation do?

Use this when the staking endpoint already showed a pool like `polkachu.poolv1.near` and you want to see the transaction shape behind one real delegation.

This pinned mainnet tx is useful because it shows the full pattern clearly:

- transaction hash: `5Qo96GonLaAfuh6eHWdi8zPRk92TFW8W2xWqSAoYKBVz`
- top-level receiver: `polkachu.poolv1.near`
- top-level method: `deposit_and_stake`
- attached deposit: `34650000000000000000000000` (≈34.65 NEAR)

The important chain shape is:

- the delegator sends a `FunctionCall deposit_and_stake` into the pool contract
- the pool contract records the deposit and staking shares
- the pool later emits a self-receipt with a real `Stake` action

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=5Qo96GonLaAfuh6eHWdi8zPRk92TFW8W2xWqSAoYKBVz

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | tee /tmp/staking-delegation-tx.json >/dev/null

jq '{
  top_level_call: {
    hash: .transactions[0].transaction.hash,
    signer_id: .transactions[0].transaction.signer_id,
    receiver_id: .transactions[0].transaction.receiver_id,
    method_name: .transactions[0].transaction.actions[0].FunctionCall.method_name,
    attached_deposit: .transactions[0].transaction.actions[0].FunctionCall.deposit
  },
  pool_side_effects: [
    .transactions[0].receipts[]
    | select(.receipt.receiver_id == "polkachu.poolv1.near")
    | {
        predecessor_id: .receipt.predecessor_id,
        receiver_id: .receipt.receiver_id,
        actions: (
          .receipt.receipt.Action.actions
          | map(if type == "string" then . else keys[0] end)
        ),
        first_logs: (.execution_outcome.outcome.logs[:3])
      }
  ]
}' /tmp/staking-delegation-tx.json
```

The answer you want is simple: the delegator did not sign a raw `Stake` action directly. They called the staking-pool contract with `deposit_and_stake` and attached deposit, and the pool contract later executed the `Stake` action on its own account.

### What FT balances and NFT collections does this account show right now?

Use this when a wallet view, support tool, or agent already has an `account_id` and needs a fast indexed holdings summary: FT balances plus the NFT collections this account currently shows holdings from.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Read FT balances first, read NFT collections second, then combine them into one compact indexed inventory.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../ft</span> gives the wallet’s indexed FT balances.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../nft</span> gives the NFT collections the wallet currently shows holdings from.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">jq</span> turns those two indexed reads into one wallet-friendly inventory.</span></p>
  </div>
</div>

**What you're doing**

- Read the account’s fungible token balances.
- Read the account’s NFT collection-level holdings.
- Print one short indexed inventory that a wallet or support flow could reuse.

This example does not answer native balance, staking, pools, exact NFT token IDs, or metadata.

The FT endpoint here is balance-first. It does not include display metadata such as token `symbol` or `decimals`; when you need to format a balance for UI, call the token contract’s `ft_metadata` read method over RPC.

The NFT endpoint here is collection-level. Treat it as “which NFT contracts does this account currently hold from?” rather than a full per-token crawl.

```bash
API_BASE_URL=https://api.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID

# Sample live value observed on April 19, 2026:
# ACCOUNT_ID=mike.near
```

1. Read fungible token balances for the account.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/ft" \
  | tee /tmp/account-ft.json >/dev/null

jq '{
  account_id,
  ft_contracts: (
    .tokens
    | map(select((.balance // "0") != "0") | {
        contract_id,
        balance,
        last_update_block_height
      })
    | .[:10]
  )
}' /tmp/account-ft.json
```

2. Read NFT collection holdings for the same account.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/nft" \
  | tee /tmp/account-nft.json >/dev/null

jq '{
  account_id,
  nft_collections: (
    (.tokens // [])
    | map({
        contract_id,
        last_update_block_height
      })
    | unique_by(.contract_id)
    | .[:10]
  )
}' /tmp/account-nft.json
```

3. Turn those two reads into one compact inventory.

```bash
jq -n \
  --slurpfile ft /tmp/account-ft.json \
  --slurpfile nft /tmp/account-nft.json '
  ($ft[0].tokens // []) as $ft_tokens
  | ($nft[0].tokens // []) as $nft_tokens
  | {
      account_id: ($ft[0].account_id // $nft[0].account_id),
      ft_contract_count: (
        $ft_tokens
        | map(select((.balance // "0") != "0"))
        | length
      ),
      nft_collection_count: (
        $nft_tokens
        | map(.contract_id)
        | unique
        | length
      ),
      ft_contracts: (
        $ft_tokens
        | map(select((.balance // "0") != "0") | {
            contract_id,
            balance,
            last_update_block_height
          })
        | .[:10]
      ),
      nft_collections: (
        $nft_tokens
        | map({
            contract_id,
            last_update_block_height
          })
        | unique_by(.contract_id)
        | .[:10]
      )
    }'
```

For `mike.near` on April 19, 2026, these reads returned dozens of FT contracts and NFT collections. That is enough for the common wallet question: “which FT balances and NFT collections does this account currently show?”

**Why this next step?**

Use [`GET /v1/account/{account_id}/full`](/api/v1/account-full) when the next question also needs staking, pools, or native account state. Use contract-specific reads only when the question becomes “which exact NFT token IDs or metadata do I own?”

## Common mistakes

- Leading with the broad account snapshot when the user only asked about one asset family.
- Using FastNear API when the user explicitly needs exact RPC fields or permissions.
- Staying in account-summary pages after the question turns into transaction history.
- Forgetting that `?network=testnet` works only on compatible pages.

## Related guides

- [FastNear API](/api)
- [API Reference](/api/reference)
- [RPC Reference](/rpc)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
