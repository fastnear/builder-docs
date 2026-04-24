---
sidebar_label: Examples
slug: /api/examples
title: API Examples
description: Task-first FastNear API examples for account lookup, holdings, and staking.
displayed_sidebar: fastnearApiSidebar
page_actions:
  - markdown
---

## Examples

All shell examples below work on the public FastNear API hosts as-is. If `FASTNEAR_API_KEY` is set in your shell, they pass it as an `apiKey` query parameter automatically; if it is unset, they fall back to the public unauthenticated path. Bearer auth with `Authorization: Bearer ${FASTNEAR_API_KEY}` is also supported when headers fit your client better.

### Summarize one account in one call

`/v1/account/{id}/full` is the FastNear API's account aggregator — one call bundles the account's NEAR state, every FT contract it's touched, every NFT collection it's received, and every validator pool it's delegated to. When you already have the `account_id`, this is the fastest "what does this account look like?" read.

```bash
ACCOUNT_ID=root.near

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/full?apiKey=${FASTNEAR_API_KEY:-}" \
  | jq '{
      account_id,
      near_balance_yocto: .state.balance,
      ft_contracts: (.tokens | length),
      nft_contracts: (.nfts | length),
      staking_pool_contracts: (.pools | length)
    }'
```

For `root.near`: 150 FT contracts in the list, 102 NFT collections, 2 staking pools. The contract counts alone tell you this is a busy mainnet account. Every example below drills into one of those surfaces — start here when all you have is the account ID.

### Resolve a public key, then fetch the account snapshot

Look up which account a key belongs to, then read that account's holdings in one call.

```bash
PUBLIC_KEY='ed25519:CCaThr3uokqnUs6Z5vVnaDcJdrfuTpYJHJWcAGubDjT'

LOOKUP="$(curl -s "https://api.fastnear.com/v1/public_key/$(jq -rn --arg k "$PUBLIC_KEY" '$k | @uri')?apiKey=${FASTNEAR_API_KEY:-}")"

echo "$LOOKUP" | jq '{matched: (.account_ids | length), account_ids}'

ACCOUNT_ID="$(echo "$LOOKUP" | jq -r '.account_ids[0]')"

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/full?apiKey=${FASTNEAR_API_KEY:-}" \
  | jq '{account_id, state, tokens: (.tokens|length), nfts: (.nfts|length), pools: (.pools|length)}'
```

If `matched` is greater than 1, switch to [V1 Public Key Lookup All](/api/v1/public-key-all) and loop over every returned account.

### How much of this account's NEAR is actually spendable?

NEAR account state has three buckets that wallet UIs tend to conflate: `balance` is the unstaked amount, `locked` is NEAR tied up in validator stake or a lockup contract, and `storage_bytes` implies a separate amount pinned to the trie at the current rate of 10^19 yoctoNEAR per byte. One pipeline over `/full` breaks them apart.

```bash
ACCOUNT_ID=root.near

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/full?apiKey=${FASTNEAR_API_KEY:-}" \
  | jq '
      (.state.balance | tonumber) as $amount
      | (.state.locked  | tonumber) as $locked
      | (.state.storage_bytes * 10000000000000000000) as $pinned
      | 1e24 as $ynear
      | {
          account_id,
          near: {
            total_owned:       (($amount + $locked) / $ynear),
            unstaked:          ($amount / $ynear),
            stake_or_lockup:   ($locked / $ynear),
            pinned_to_storage: ($pinned / $ynear),
            spendable:         (($amount - $pinned) / $ynear)
          }
        }'
```

For `root.near`: ~3914.67 NEAR total, all unstaked, ~0.28677 NEAR pinned to 28,677 bytes of on-chain state, and ~3914.38 NEAR spendable. New accounts feel this most acutely — a fresh named account of ~182 bytes has ~0.00182 NEAR stuck to storage, which is why CLI tools refuse to let you send an account's full balance.

Point the same pipeline at a validator pool like `astro-stakers.poolv1.near` and the numbers invert: ~730 K unstaked, ~27.68 M in `locked`. That `locked` is the pool's own protocol-level validator stake, not the delegators' funds (those are tracked inside the pool contract's state). The same field means different things on different account types.

jq uses IEEE-754 doubles, so the NEAR values above are display-precision only — keep the raw yocto strings if you need exact bookkeeping.

### When did anything about this account last change?

Every entry under `/full`'s `tokens`, `nfts`, and `pools` arrays carries its own `last_update_block_height` — the block at which the indexer last saw that row change for this account. Taking the max across all three arrays gives a cheap "latest activity" signal without touching the transaction API.

```bash
ACCOUNT_ID=root.near

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/full?apiKey=${FASTNEAR_API_KEY:-}" \
  | jq '
      [
        (.tokens // [])[].last_update_block_height,
        (.nfts   // [])[].last_update_block_height,
        (.pools  // [])[].last_update_block_height
      ] as $heights
      | ($heights | map(select(. != null))) as $tracked
      | {
          account_id,
          total_entries:        ($heights | length),
          tracked_entries:      ($tracked | length),
          most_recent_block:    ($tracked | max),
          oldest_tracked_block: ($tracked | min)
        }'
```

For `root.near`, this returns 254 total entries across FT, NFT, and pool contracts, 158 with a tracked block, and a most-recent block of `194301659`. That's enough to tell you the wallet is still active without touching transaction history.

This is the right question for "has this wallet been recently active?" or "has anything moved since block X?" — cheap, one call, no transaction history needed. For the transaction that caused the latest change, widen to the [Transactions API](/tx). Entries with `last_update_block_height: null` predate the indexer's per-row tracking (typically older airdrops) and are ignored here rather than counted as recent.

### Show NFT collections this wallet holds from a specific publisher

NEAR account names encode a hierarchy: `mint.sharddog.near` is a subaccount of `sharddog.near`, which is a subaccount of `near`. Publishers that ship multiple NFT collections usually deploy each one as its own subaccount, so a single suffix filter over the account's NFT list recovers everything under one publisher tree — no external collection registry required.

```bash
ACCOUNT_ID=root.near
PUBLISHER=sharddog.near

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/nft?apiKey=${FASTNEAR_API_KEY:-}" \
  | jq --arg publisher "$PUBLISHER" '
      ("." + $publisher) as $suffix
      | {
          account_id: .account_id,
          publisher: $publisher,
          collections: [
            .tokens[]
            | select(.contract_id | endswith($suffix))
            | {
                contract_id,
                last_update_block_height,
                status: (if .last_update_block_height == null then "dormant" else "active" end)
              }
          ] | sort_by(.last_update_block_height // 0)
        }'
```

For `root.near` and `sharddog.near`, this returns four subaccount contracts: `ndcconstellationnft`, `mint`, `harvestmoon`, and `claim`. Only `claim` carries a non-null `last_update_block_height` (`131402024`), so that's the one contract where the wallet's position clearly changed. The others are dormant — common for drop-era contracts an account received into but never interacted with again.

Swap `PUBLISHER` to any account to scope the filter to a different publisher tree.

### Does this wallet show direct staking, liquid staking tokens, or both?

Direct pool positions live on `/staking`; liquid staking tokens (stNEAR, LiNEAR, etc.) sit on `/ft` like any other FT. Read both, classify the wallet — `root.near` shows up as `mixed`.

```bash
ACCOUNT_ID=root.near
LIQUID_PROVIDERS_JSON='["meta-pool.near","lst.rhealab.near","linear-protocol.near"]'

STAKING="$(curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/staking?apiKey=${FASTNEAR_API_KEY:-}")"
FT="$(curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/ft?apiKey=${FASTNEAR_API_KEY:-}")"

jq -n \
  --argjson staking "$STAKING" \
  --argjson ft "$FT" \
  --argjson providers "$LIQUID_PROVIDERS_JSON" '
  ($staking.pools // []) as $direct
  | (($ft.tokens // []) | map(select(.contract_id as $id | $providers | index($id)))) as $liquid
  | {
      classification: (
        if ($direct|length)>0 and ($liquid|length)>0 then "mixed"
        elif ($direct|length)>0 then "direct_only"
        elif ($liquid|length)>0 then "liquid_only"
        else "no_visible_staking_position" end
      ),
      direct_pools: ($direct | map(.pool_id)),
      liquid_tokens: ($liquid | map({contract_id, balance}))
    }'
```

The classifier only knows what you teach it — extend `LIQUID_PROVIDERS_JSON` as new liquid-staking products ship, and treat the result as observational rather than exhaustive.

## Common mistakes

- Leading with the broad account snapshot when the user only asked about one asset family.
- Using FastNear API when the user explicitly needs exact RPC fields or permissions.
- Staying in account-summary pages after the question turns into transaction history.

## Related guides

- [FastNear API](/api)
- [API Reference](/api/reference)
- [RPC Reference](/rpc)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
