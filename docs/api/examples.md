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

Read this page as a short ladder: first resolve who the account is, then classify the wallet shape, then use one richer provenance flow when you want to turn a live BOS artifact into a minted record.

### Resolve a public key, then fetch the account snapshot

Use this when you have a public key first and the next user-facing question is “which account is this?” followed immediately by “what does that account look like right now?”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Resolve identity first, then reuse the same account ID for one readable wallet snapshot.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/public_key</span> gives the candidate <span className="fastnear-example-strategy__code">account_id</span> values for the key.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">jq</span> lifts the account you actually want to inspect next.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../full</span> answers balances, NFTs, and staking in one response.</span></p>
  </div>
</div>

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

### Am I locked or liquid?

Use this when the user story is “show me whether this wallet is exposed through direct staking pools, liquid staking tokens, or both.”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Compare staking positions and FT balances before you interpret the wallet.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../staking</span> finds direct pool exposure.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../ft</span> finds liquid staking tokens that sit beside or instead of direct pools.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">jq</span> turns those two indexed reads into <span className="fastnear-example-strategy__code">direct_only</span>, <span className="fastnear-example-strategy__code">liquid_only</span>, or <span className="fastnear-example-strategy__code">mixed</span>.</span></p>
  </div>
</div>

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

### Archive a BOS widget version as a provenance NFT

Use this when the user story is “this BOS widget is a real on-chain artifact. Mint an NFT that records exactly which version I archived.”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Read the exact widget first, then mint only after the provenance fields are deterministic.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../nft</span> checks whether the receiver already shows a holding from this archive collection.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC call_function get</span> on <span className="fastnear-example-strategy__code">social.near</span> reads the exact widget source and its SocialDB write block.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>Hash the source, mint <span className="fastnear-example-strategy__code">nft_mint</span> on testnet, then verify the exact provenance fields through <span className="fastnear-example-strategy__code">nft_token</span>.</span></p>
  </div>
</div>

**Networks**

- mainnet for reading the widget from `social.near`
- testnet for safely minting the provenance NFT on `nft.examples.testnet`

**Official references**

- [Pre-deployed NFT contract](https://docs.near.org/tutorials/nfts/js/predeployed-contract)
- [NEP-171 NFT standard](https://docs.near.org/primitives/nft/standard)
- [SocialDB API and contract surface](https://github.com/NearSocial/social-db#api)

**What you're doing**

- Check whether the receiver already shows a holding from the archive collection.
- Read one exact BOS widget from `social.near`, including its widget-level SocialDB block.
- Hash the widget source and turn that into provenance metadata.
- Mint a testnet NFT whose metadata records the author, widget path, SocialDB block, and source hash.
- Verify that the minted token still carries those provenance fields.

Pinned source widget:

- author account: `mob.near`
- widget path: `mob.near/widget/Profile`
- widget-level SocialDB block: `86494825`

```bash
API_BASE_URL=https://test.api.fastnear.com
MAINNET_RPC_URL=https://rpc.mainnet.fastnear.com
TESTNET_RPC_URL=https://rpc.testnet.fastnear.com
AUTHOR_ACCOUNT_ID=mob.near
WIDGET_NAME=Profile
DESTINATION_COLLECTION_ID=nft.examples.testnet
RECEIVER_ACCOUNT_ID=YOUR_ACCOUNT_ID.testnet
SIGNER_ACCOUNT_ID="$RECEIVER_ACCOUNT_ID"
```

1. Use FastNear API to see whether the receiver already shows a holding from the archive collection.

```bash
curl -s "$API_BASE_URL/v1/account/$RECEIVER_ACCOUNT_ID/nft" \
  | tee /tmp/provenance-account-nfts.json >/dev/null

jq --arg destination_collection_id "$DESTINATION_COLLECTION_ID" '{
  existing_archive_collection_entries: [
    .tokens[]?
    | select(.contract_id == $destination_collection_id)
    | {
        contract_id,
        last_update_block_height
      }
  ]
}' /tmp/provenance-account-nfts.json
```

This is a quick collection-presence check, not an exact token inventory. The exact minted token is verified later through `nft_token`.

2. Read the exact widget body and widget-level SocialDB block from mainnet.

```bash
WIDGET_ARGS_BASE64="$(
  jq -nc --arg author_account_id "$AUTHOR_ACCOUNT_ID" --arg widget_name "$WIDGET_NAME" '{
    keys: [($author_account_id + "/widget/" + $widget_name)],
    options: {with_block_height: true}
  }' | base64 | tr -d '\n'
)"

curl -s "$MAINNET_RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg args_base64 "$WIDGET_ARGS_BASE64" '{
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
  | jq '.result.result | implode | fromjson' \
  | tee /tmp/bos-widget.json >/dev/null

jq --arg author_account_id "$AUTHOR_ACCOUNT_ID" --arg widget_name "$WIDGET_NAME" '{
  widget_path: ($author_account_id + "/widget/" + $widget_name),
  socialdb_block_height: .[$author_account_id].widget[$widget_name][":block"],
  source_preview: (
    .[$author_account_id].widget[$widget_name][""]
    | split("\n")[0:8]
  )
}' /tmp/bos-widget.json
```

3. Hash the widget source and build deterministic provenance metadata.

```bash
jq -r --arg author_account_id "$AUTHOR_ACCOUNT_ID" --arg widget_name "$WIDGET_NAME" '
  .[$author_account_id].widget[$widget_name][""]
' /tmp/bos-widget.json > /tmp/bos-widget-source.jsx

WIDGET_BLOCK_HEIGHT="$(
  jq -r --arg author_account_id "$AUTHOR_ACCOUNT_ID" --arg widget_name "$WIDGET_NAME" '
    .[$author_account_id].widget[$widget_name][":block"]
  ' /tmp/bos-widget.json
)"

SOURCE_SHA256="$(shasum -a 256 /tmp/bos-widget-source.jsx | awk '{print $1}')"
SOURCE_HASH_SHORT="$(printf '%s' "$SOURCE_SHA256" | cut -c1-12)"
TOKEN_ID="bos-widget-$SOURCE_HASH_SHORT"

PROVENANCE_METADATA_JSON="$(
  jq -nc \
    --arg author_account_id "$AUTHOR_ACCOUNT_ID" \
    --arg widget_name "$WIDGET_NAME" \
    --arg widget_path "$AUTHOR_ACCOUNT_ID/widget/$WIDGET_NAME" \
    --arg block_height "$WIDGET_BLOCK_HEIGHT" \
    --arg source_sha256 "$SOURCE_SHA256" '{
      title: ("BOS widget archive: " + $widget_path),
      description: ("Archived from social.near on mainnet at block " + $block_height),
      copies: 1,
      extra: ({
        author_account_id: $author_account_id,
        widget_name: $widget_name,
        widget_path: $widget_path,
        source_contract_id: "social.near",
        source_network: "mainnet",
        socialdb_block_height: ($block_height | tonumber),
        source_sha256: $source_sha256
      } | @json)
    }'
)"

printf '%s\n' "$PROVENANCE_METADATA_JSON" | jq '.'
```

4. Mint the provenance NFT on testnet.

```bash
near call "$DESTINATION_COLLECTION_ID" nft_mint "$(jq -nc \
  --arg token_id "$TOKEN_ID" \
  --arg receiver_id "$RECEIVER_ACCOUNT_ID" \
  --argjson metadata "$PROVENANCE_METADATA_JSON" '{
    token_id: $token_id,
    receiver_id: $receiver_id,
    metadata: $metadata
  }')" \
  --accountId "$SIGNER_ACCOUNT_ID" \
  --deposit 0.1 \
  --networkId testnet
```

5. Verify through the exact `nft_token` read that the minted NFT carries the provenance fields you expect.

Poll a few times instead of assuming failure if the token does not appear immediately after the mint transaction returns.

```bash
NFT_TOKEN_ARGS_BASE64="$(
  jq -nc --arg token_id "$TOKEN_ID" '{token_id: $token_id}' \
    | base64 | tr -d '\n'
)"

for attempt in 1 2 3 4 5; do
  curl -s "$TESTNET_RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$DESTINATION_COLLECTION_ID" \
      --arg args_base64 "$NFT_TOKEN_ARGS_BASE64" '{
        jsonrpc: "2.0",
        id: "fastnear",
        method: "query",
        params: {
          request_type: "call_function",
          account_id: $account_id,
          method_name: "nft_token",
          args_base64: $args_base64,
          finality: "final"
        }
      }')" \
    | jq '.result.result | implode | fromjson' \
    | tee /tmp/bos-widget-provenance-token.json >/dev/null

  if jq -e '. != null' /tmp/bos-widget-provenance-token.json >/dev/null; then
    break
  fi

  sleep 1
done

jq '{
  token_id,
  owner_id,
  title: .metadata.title,
  provenance: (.metadata.extra | fromjson)
}' /tmp/bos-widget-provenance-token.json
```

**Why this next step?**

FastNear API gives you the quick receiver-side collection check. Mainnet RPC gives you the exact widget body and SocialDB block. The exact `nft_token` read on testnet confirms that minting turned that into a durable NFT record. If you later want to prove which historical transaction wrote the widget, hand off to the NEAR Social proof investigations on [Transactions API examples](/tx/examples).

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
