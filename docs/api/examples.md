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

### Resolve a public key, then fetch the account snapshot

Look up which account a key belongs to, then read that account's holdings in one call.

```bash
API_BASE_URL=https://api.fastnear.com
PUBLIC_KEY='ed25519:CCaThr3uokqnUs6Z5vVnaDcJdrfuTpYJHJWcAGubDjT'

LOOKUP="$(curl -s "$API_BASE_URL/v1/public_key/$(jq -rn --arg k "$PUBLIC_KEY" '$k | @uri')")"

echo "$LOOKUP" | jq '{matched: (.account_ids | length), account_ids}'

ACCOUNT_ID="$(echo "$LOOKUP" | jq -r '.account_ids[0]')"

curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/full" \
  | jq '{account_id, state, tokens: (.tokens|length), nfts: (.nfts|length), pools: (.pools|length)}'
```

If `matched` is greater than 1, switch to [V1 Public Key Lookup All](/api/v1/public-key-all) and loop over every returned account.

### Does this wallet show direct staking, liquid staking tokens, or both?

Direct pool positions live on `/staking`; liquid staking tokens (stNEAR, LiNEAR, etc.) sit on `/ft` like any other FT. Read both, classify the wallet — `root.near` shows up as `mixed`.

```bash
API_BASE_URL=https://api.fastnear.com
ACCOUNT_ID=root.near
LIQUID_PROVIDERS_JSON='["meta-pool.near","lst.rhealab.near","linear-protocol.near"]'

STAKING="$(curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/staking")"
FT="$(curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/ft")"

jq -n \
  --argjson staking "$STAKING" \
  --argjson ft "$FT" \
  --argjson providers "$LIQUID_PROVIDERS_JSON" '
  ($staking.pools // []) as $direct
  | (($ft.tokens // []) | map(select(.contract_id as $id | $providers | index($id)))) as $liquid
  | {
      classification:
        if ($direct|length)>0 and ($liquid|length)>0 then "mixed"
        elif ($direct|length)>0 then "direct_only"
        elif ($liquid|length)>0 then "liquid_only"
        else "no_visible_staking_position" end,
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
