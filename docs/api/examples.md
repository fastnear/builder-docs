---
sidebar_label: Examples
slug: /api/examples
title: API Examples
description: Plain-language workflows for using FastNear API docs for account lookups, holdings checks, NFT gating, and staking classification.
displayed_sidebar: fastnearApiSidebar
page_actions:
  - markdown
---

## Worked walkthroughs

### Resolve a public key, then fetch the account snapshot

Use this when you have a public key first and the next user-facing question is “which account is this?” followed immediately by “what does that account look like right now?”

**What you're doing**

- Resolve the public key to one or more account IDs.
- Extract the first matching account ID with `jq`.
- Reuse that value in the full account snapshot endpoint.

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

jq '{account_ids}' /tmp/fastnear-public-key.json

curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/full" \
  | jq '{
      account_id,
      state,
      token_count: (.tokens | length),
      nft_count: (.nfts | length),
      pool_count: (.pools | length)
    }'
```

**Why this next step?**

The public-key lookup tells you which account you are dealing with. The full account snapshot is the natural next read when you want balances, NFTs, staking, and pools in one response. If the key maps to multiple accounts instead of one, move to [V1 Public Key Lookup All](/api/v1/public-key-all) or loop through each returned `account_id`.

### Check collection membership, then mint a derivative NFT

Use this when the user story is “if this account already owns at least one NFT from collection X, mint one more NFT whose metadata records that relationship.”

**Network**

- testnet

**Official references**

- [Pre-deployed NFT contract](https://docs.near.org/tutorials/nfts/js/predeployed-contract)
- [NEP-171 NFT standard](https://docs.near.org/primitives/nft/standard)

Before you start, make sure the account already holds at least one token from `nft.examples.testnet`. If it does not, mint one first with the pre-deployed contract guide above and then come back to this workflow.

**What you're doing**

- Use FastNear API to answer the gate question quickly.
- Switch to RPC `nft_tokens_for_owner` to recover exact token IDs and metadata from the source collection.
- Build deterministic derived metadata from that source set.
- Mint the derivative token, then verify it with the same NFT view method.

```bash
API_BASE_URL=https://test.api.fastnear.com
RPC_URL=https://rpc.testnet.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID.testnet
SOURCE_COLLECTION_ID=nft.examples.testnet
DESTINATION_COLLECTION_ID=nft.examples.testnet
SIGNER_ACCOUNT_ID="$ACCOUNT_ID"
TOKEN_ID="derivative-$(date +%s)"
```

1. Use FastNear API to check whether the account holds any NFT from the source collection.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/nft" \
  | tee /tmp/testnet-account-nfts.json >/dev/null

jq --arg source_collection_id "$SOURCE_COLLECTION_ID" '{
  holds_collection: any(.tokens[]?; .contract_id == $source_collection_id),
  matching_contracts: [
    .tokens[]?
    | select(.contract_id == $source_collection_id)
  ]
}' /tmp/testnet-account-nfts.json
```

2. Switch to RPC so you can recover exact token IDs and source metadata from that collection.

```bash
NFT_TOKENS_ARGS_BASE64="$(
  jq -nc --arg account_id "$ACCOUNT_ID" '{
    account_id: $account_id,
    from_index: "0",
    limit: 50
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$SOURCE_COLLECTION_ID" \
    --arg args_base64 "$NFT_TOKENS_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "nft_tokens_for_owner",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | jq '.result.result | implode | fromjson' \
  | tee /tmp/source-collection-tokens.json >/dev/null

jq --arg source_collection_id "$SOURCE_COLLECTION_ID" '{
  source_collection_id: $source_collection_id,
  source_count: length,
  source_token_ids: (map(.token_id) | sort | .[:5])
}' /tmp/source-collection-tokens.json
```

3. Build deterministic derivative metadata from that source set.

```bash
DERIVATIVE_METADATA_JSON="$(
  jq -c --arg source_collection_id "$SOURCE_COLLECTION_ID" '{
    title: ("Derivative witness for " + $source_collection_id),
    description:
      ("Minted because the holder currently owns "
      + (length | tostring)
      + " token(s) from "
      + $source_collection_id),
    media: (
      map(.metadata.media)
      | map(select(. != null))
      | .[0]
    ),
    copies: 1,
    extra: ({
      source_collection_id: $source_collection_id,
      source_count: length,
      source_token_ids: (map(.token_id) | sort | .[:5])
    } | @json)
  }' /tmp/source-collection-tokens.json
)"

printf '%s\n' "$DERIVATIVE_METADATA_JSON" | jq '.'
```

4. Mint the derivative token on the destination collection.

```bash
near call "$DESTINATION_COLLECTION_ID" nft_mint "$(jq -nc \
  --arg token_id "$TOKEN_ID" \
  --arg receiver_id "$ACCOUNT_ID" \
  --argjson metadata "$DERIVATIVE_METADATA_JSON" '{
    token_id: $token_id,
    receiver_id: $receiver_id,
    metadata: $metadata
  }')" \
  --accountId "$SIGNER_ACCOUNT_ID" \
  --deposit 0.1 \
  --networkId testnet
```

5. Verify the new token with the same NFT view method.

Poll a few times instead of assuming failure if the token does not appear immediately after the mint transaction returns.

```bash
for attempt in 1 2 3 4 5; do
  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$DESTINATION_COLLECTION_ID" \
      --arg args_base64 "$NFT_TOKENS_ARGS_BASE64" '{
        jsonrpc: "2.0",
        id: "fastnear",
        method: "query",
        params: {
          request_type: "call_function",
          account_id: $account_id,
          method_name: "nft_tokens_for_owner",
          args_base64: $args_base64,
          finality: "final"
        }
      }')" \
    | jq '.result.result | implode | fromjson' \
    | jq --arg token_id "$TOKEN_ID" '
        map(select(.token_id == $token_id))
      ' \
    | tee /tmp/derivative-token-verification.json >/dev/null

  if jq -e 'length > 0' /tmp/derivative-token-verification.json >/dev/null; then
    break
  fi

  sleep 1
done

jq '.' /tmp/derivative-token-verification.json
```

**Why this next step?**

FastNear API is the quick gate check. Once the account qualifies, RPC is the right next step because that is where you can read exact token IDs and call the collection's own NFT views.

### Am I locked or liquid?

Use this when the user story is “show me whether this wallet is exposed through direct staking pools, liquid staking tokens, or both.”

**Network**

- mainnet

**Official references**

- [Validator staking](https://docs.near.org/concepts/basics/staking)
- [Using liquid staking](https://docs.near.org/primitives/liquid-staking)

This example is intentionally observational. It classifies what FastNear can see from staking positions and FT balances today. It does not prove every possible synthetic or off-platform staking exposure.

**What you're doing**

- Read indexed direct staking positions from the account staking endpoint.
- Read indexed FT balances from the account FT endpoint.
- Classify the account into `direct_only`, `liquid_only`, `mixed`, or `no_visible_staking_position`.
- Print the direct pool list and the liquid staking token list that informed the classification.

```bash
API_BASE_URL=https://api.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
LIQUID_PROVIDERS_JSON='["meta-pool.near","lst.rhealab.near","linear-protocol.near"]'
```

1. Fetch the direct staking view.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/staking" \
  | tee /tmp/account-staking.json \
  | jq '{account_id, pools}'
```

2. Fetch fungible token balances so you can detect liquid staking positions.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/ft" \
  | tee /tmp/account-ft.json >/dev/null
```

3. Classify the account from those two indexed views.

```bash
jq -n \
  --slurpfile staking /tmp/account-staking.json \
  --slurpfile ft /tmp/account-ft.json \
  --argjson providers "$LIQUID_PROVIDERS_JSON" '
  ($staking[0].pools // []) as $direct_pools
  | ($ft[0].tokens // []) as $tokens
  | ($tokens | map(select(.contract_id as $id | $providers | index($id)))) as $liquid_tokens
  | {
      classification:
        if (($direct_pools | length) > 0 and ($liquid_tokens | length) > 0) then "mixed"
        elif (($direct_pools | length) > 0) then "direct_only"
        elif (($liquid_tokens | length) > 0) then "liquid_only"
        else "no_visible_staking_position"
        end,
      direct_pools: ($direct_pools | map(.pool_id)),
      liquid_tokens: (
        $liquid_tokens
        | map({
            contract_id,
            balance,
            last_update_block_height
          })
      )
    }'
```

**Why this next step?**

If the classification is `direct_only`, the next operational question is usually about unstake and withdraw timing. If it is `liquid_only`, the next question is usually about redeeming or swapping the liquid token. If it is `mixed`, you should treat those as two separate exit paths rather than assuming one flow covers both.

## Common jobs

### What does this account actually hold right now?

**Start here**

- [V1 Full Account View](/api/v1/account-full) when you want the fastest readable answer to “what is in this account right now?”

**Next page if needed**

- [V1 Account FT](/api/v1/account-ft), [V1 Account NFT](/api/v1/account-nft), or [V1 Account Staking](/api/v1/account-staking) if the broad summary is useful but you now want to stay on just one asset family.
- [Transactions API account history](/tx/account) if the next question becomes “how did this account get here?” instead of “what does it hold?”

**Stop when**

- The summary already answers the holdings question in one response.

**Switch when**

- The user asks for exact account state, access-key semantics, or protocol-native fields. Move to [RPC Reference](/rpc).
- The user asks for activity or execution history rather than current holdings. Move to [Transactions API](/tx).

### Resolve a public key to one or more accounts

**Start here**

- [V1 Public Key Lookup](/api/v1/public-key) when you want the primary account match.
- [V1 Public Key Lookup All](/api/v1/public-key-all) when you need the full set of associated accounts.

**Next page if needed**

- [V1 Full Account View](/api/v1/account-full) after resolution if the user immediately wants balances or holdings for the returned accounts.

**Stop when**

- You have identified the account or accounts that belong to the key.

**Switch when**

- The user starts asking about exact access-key permissions, nonces, or current key state. Move to [View Access Key](/rpc/account/view-access-key) or [View Access Key List](/rpc/account/view-access-key-list).
- The user wants recent activity for the resolved accounts rather than just identity resolution. Move to [Transactions API](/tx).

### Does this account hold FTs, NFTs, or staking positions?

**Start here**

- [V1 Account FT](/api/v1/account-ft) when the question is just about fungible-token balances.
- [V1 Account NFT](/api/v1/account-nft) when the question is specifically about NFT holdings.
- [V1 Account Staking](/api/v1/account-staking) when the question is really about staking positions, not the whole wallet picture.

**Next page if needed**

- [V1 Full Account View](/api/v1/account-full) if the user later wants the whole account picture after starting from one asset family.
- [Transactions API account history](/tx/account) if the user stops asking “what does this account hold?” and starts asking how it got there.

**Stop when**

- The asset-specific endpoint already answers the holdings question without making you rebuild the whole account picture.

**Switch when**

- The indexed view is not enough and the user needs the exact on-chain answer. Move to [RPC Reference](/rpc).
- The question becomes historical or execution-oriented instead of “what does this account hold now?” Move to [Transactions API](/tx).

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
