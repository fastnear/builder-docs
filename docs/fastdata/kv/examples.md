---
sidebar_label: Examples
slug: /fastdata/kv/examples
title: KV FastData Examples
description: Task-first KV FastData examples for exact-key checks, scoped writes, key history, and exact state follow-up.
displayed_sidebar: kvFastDataSidebar
page_actions:
  - markdown
---

## Examples

All shell examples below work on the public KV FastData hosts as-is. If `FASTNEAR_API_KEY` is set in your shell, they add it as a bearer header automatically; if it is unset, they fall back to the public unauthenticated path.

### Check one exact key, then replay its history

When you already know the contract, predecessor, and exact key, start narrow. `latest` answers the present-tense question; `history` shows whether that one row changed over time.

```bash
CURRENT_ACCOUNT_ID=social.near
PREDECESSOR_ID=james.near
KEY='graph/follow/sleet.near'
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

ENCODED_KEY="$(jq -rn --arg key "$KEY" '$key | @uri')"

LATEST="$(curl -s "https://kv.main.fastnear.com/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY" \
  "${AUTH_HEADER[@]}")"

echo "$LATEST" | jq '{
  latest: (
    .entries[0]
    | {
        current_account_id,
        predecessor_id,
        block_height,
        key,
        value
      }
  )
}'

curl -s "https://kv.main.fastnear.com/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY" \
  "${AUTH_HEADER[@]}" \
  | jq '{writes: [.entries[] | {block_height, value}]}'
```

For an exact follow-edge style key like this, `latest` tells you the current indexed value in one row and `history` shows whether the edge was written once or toggled over time. Start here when you already know the storage path; widen to predecessor scans only when you need discovery rather than proof.

### Inspect one predecessor's indexed writes, then narrow to the key that changed

`all-by-predecessor` returns the latest indexed writes one account made across every contract it touched. Lift an interesting key and replay it through `history` to see how that row changed over time.

```bash
PREDECESSOR_ID=jemartel.near
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

FIRST="$(curl -s "https://kv.main.fastnear.com/v0/all/$PREDECESSOR_ID" \
  "${AUTH_HEADER[@]}" \
  -H 'content-type: application/json' \
  --data '{"include_metadata":true,"limit":10}')"

echo "$FIRST" | jq '{
  page_token,
  entries: [.entries[] | {current_account_id, predecessor_id, block_height, key, value, tx_hash}]
}'
```

For `jemartel.near`, the listing mixes an `account_id` identity assertion on `contextual.near` with a run of `graph/follow/*` additions to the same contract. The `tx_hash` on each row is the direct handoff into [/tx/examples](/tx/examples#i-have-one-transaction-hash-what-happened) if you want the full transaction story behind any write.

Lift the most recent row and replay it through `history`:

```bash
PREDECESSOR_ID=jemartel.near
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi
FIRST="$(curl -s "https://kv.main.fastnear.com/v0/all/$PREDECESSOR_ID" \
  "${AUTH_HEADER[@]}" \
  -H 'content-type: application/json' \
  --data '{"include_metadata":true,"limit":10}')"

CURRENT_ACCOUNT_ID="$(echo "$FIRST" | jq -r '.entries[0].current_account_id')"
EXACT_KEY="$(echo "$FIRST" | jq -r '.entries[0].key')"
ENCODED_KEY="$(jq -rn --arg key "$EXACT_KEY" '$key | @uri')"

curl -s "https://kv.main.fastnear.com/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY" \
  "${AUTH_HEADER[@]}" \
  | jq '{entries: [.entries[] | {block_height, value}]}'
```

For the `account_id` row, `history` returns a single write at block `185965311` with value `"jemartel.near:mainnet"` — the identity assertion stands, stable since that block. KV preserves every write equally: a quiet key shows one row, a busy key shows many — same shape, no summarization.

## Common mistakes

- Starting with broad account or predecessor scans when an exact key is already known.
- Using KV FastData when the user really wants balances or holdings.
- Confusing indexed history with exact current chain state.
- Reusing pagination tokens or changing filters mid-scan.

## Related guides

- [KV FastData API](/fastdata/kv)
- [RPC Reference](/rpc)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
