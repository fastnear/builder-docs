---
sidebar_label: Examples
slug: /fastdata/kv/examples
title: KV FastData Examples
description: Task-first KV FastData examples for scoped writes, key history, and exact state checks.
displayed_sidebar: kvFastDataSidebar
page_actions:
  - markdown
---

## Example

### Inspect one predecessor's indexed writes, then narrow to the key that changed

`all-by-predecessor` returns the latest indexed writes one account made across every contract it touched. Lift an interesting key and replay it through `history` to see how that row changed over time.

```bash
KV_BASE_URL=https://kv.main.fastnear.com
PREDECESSOR_ID=jemartel.near

FIRST="$(curl -s "$KV_BASE_URL/v0/all/$PREDECESSOR_ID" \
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
CURRENT_ACCOUNT_ID="$(echo "$FIRST" | jq -r '.entries[0].current_account_id')"
EXACT_KEY="$(echo "$FIRST" | jq -r '.entries[0].key')"
ENCODED_KEY="$(jq -rn --arg key "$EXACT_KEY" '$key | @uri')"

curl -s "$KV_BASE_URL/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY" \
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
