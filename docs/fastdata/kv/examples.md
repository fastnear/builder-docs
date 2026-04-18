---
sidebar_label: Examples
slug: /fastdata/kv/examples
title: KV FastData Examples
description: Plain-language workflows for using KV FastData docs for exact keys, key history, predecessor-scoped inspection, and canonical RPC follow-up.
displayed_sidebar: kvFastDataSidebar
page_actions:
  - markdown
---

# KV FastData Examples

Use this page when the question is about indexed contract storage and you already have a precise scope in mind. The key decision on this surface is choosing the narrowest useful scope first: exact key, account, predecessor, or batch of known keys. Stay within KV FastData while the answer is still about indexed key-value data, then widen to RPC only when canonical on-chain state is required.

## When to start here

- You want indexed contract storage instead of broad account or asset views.
- You already know a contract, exact key, predecessor, or account scope.
- You need latest indexed rows or indexed history over time.
- You want faster storage-oriented answers before deciding whether canonical RPC state is necessary.

## Minimum inputs

- network
- contract ID plus one of: exact key, account scope, predecessor scope, or known set of keys
- whether you need latest indexed state or historical changes
- whether canonical follow-up may be required

## Common jobs

### Look up one exact key right now

**Start here**

- [GET Latest by Exact Key](/fastdata/kv/get-latest-key) when one fully qualified key is already known.

**Next page if needed**

- [GET History by Exact Key](/fastdata/kv/get-history-key) if the question becomes “how did this key change?”

**Stop when**

- The latest indexed row already answers the storage question.

**Widen when**

- The user needs exact current chain state rather than indexed storage. Move to [View State](/rpc/contract/view-state).

### Turn one exact key into a change history

**Start here**

- [GET History by Exact Key](/fastdata/kv/get-history-key) for path-based history lookup.
- [History by Key](/fastdata/kv/history-by-key) when the fully qualified key route is the better fit.

**Next page if needed**

- Revisit [GET Latest by Exact Key](/fastdata/kv/get-latest-key) if you want the current indexed value alongside the history.

**Stop when**

- You can explain how the key changed over time.

**Widen when**

- The user asks whether the latest indexed value matches canonical on-chain state right now.

### Trace writes from one predecessor

**Start here**

- [All by Predecessor](/fastdata/kv/all-by-predecessor) for latest rows across contracts touched by one predecessor.
- [History by Predecessor](/fastdata/kv/history-by-predecessor) when you need the write history over time.

**Next page if needed**

- Narrow to an exact key if one row becomes the real focus.

**Stop when**

- You can answer what this predecessor changed and where.

**Widen when**

- The user stops asking about indexed writes and starts asking about present canonical state.

### Batch-check several known keys

**Start here**

- [Multi Lookup](/fastdata/kv/multi) when you already know a fixed set of fully qualified keys.

**Next page if needed**

- Move one interesting key to [GET History by Exact Key](/fastdata/kv/get-history-key) if the batch result raises a historical question.

**Stop when**

- The batch response already answers which of the keys matter.

**Widen when**

- The user wants broader contract inspection instead of a known set of keys.

## Worked investigation

### Start with one indexed key, then confirm history and canonical state

Use this investigation when one contract key looks suspicious and you need to connect its latest indexed value, indexed history, and canonical `view_state` follow-up into one clear story.

**Goal**

- Explain what a contract key looks like now, how it got there in indexed history, and whether the canonical RPC state agrees.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Latest indexed value | KV FastData [`get-latest-key`](/fastdata/kv/get-latest-key) | Fetch the newest indexed row for the exact key first | Gives the fastest narrow answer before widening into history |
| Indexed key history | KV FastData [`get-history-key`](/fastdata/kv/get-history-key) or [`history-by-key`](/fastdata/kv/history-by-key) | Pull the same key’s change history over time | Shows whether the current value is stable, recent, or part of a suspicious sequence |
| Scope expansion | KV FastData [`latest-by-account`](/fastdata/kv/latest-by-account) or [`history-by-predecessor`](/fastdata/kv/history-by-predecessor) | Widen to account or predecessor scope if the one key is only part of a larger pattern | Helps explain whether the key changed in isolation or as part of a wider write set |
| Canonical confirmation | RPC [`view_state`](/rpc/contract/view-state) | Confirm the current on-chain state once the indexed pattern is clear | Separates indexed storage history from exact current chain state |

**What a useful answer should include**

- the exact key and contract scope investigated
- the latest indexed value and what changed in history
- whether canonical `view_state` matched the indexed current value

### Shell walkthrough

Use this when one fully qualified key is already known and you want to move cleanly from “what is the latest indexed row?” to “what is the broader indexed history for this key?”

**What you're doing**

- Read one latest indexed key with the exact contract, predecessor, and key path.
- Extract the exact `key` with `jq`.
- Reuse that key in `POST /v0/history` to widen into history.

```bash
KV_BASE_URL=https://kv.main.fastnear.com
CURRENT_ACCOUNT_ID=social.near
PREDECESSOR_ID=james.near
KEY='graph/follow/sleet.near'

ENCODED_KEY="$(jq -rn --arg key "$KEY" '$key | @uri')"

EXACT_KEY="$(
  curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY" \
    | tee /tmp/kv-latest.json \
    | jq -r '.entries[0].key'
)"

jq '{
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
}' /tmp/kv-latest.json

curl -s "$KV_BASE_URL/v0/history" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg key "$EXACT_KEY" '{key: $key, limit: 10}')" \
  | jq '{
      page_token,
      entries: [
        .entries[]
        | {
            current_account_id,
            predecessor_id,
            block_height,
            value
          }
      ]
    }'
```

**Why this next step?**

The latest lookup gives the narrowest possible answer. Reusing the exact `key` in `POST /v0/history` shows whether that key also appears in a wider indexed pattern. If that result is too broad, narrow back down with [GET History by Exact Key](/fastdata/kv/get-history-key).

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
