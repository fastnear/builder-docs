---
sidebar_label: Examples
slug: /fastdata/kv/examples
title: KV FastData Examples
description: Plain-language workflows for checking exact storage keys, following indexed write history, and deciding when exact RPC state follow-up is practical.
displayed_sidebar: kvFastDataSidebar
page_actions:
  - markdown
---

## Worked investigation

### Check one contract key, then follow its history

Use this investigation when one contract storage key looks suspicious and you want the latest indexed value and the write history for that same key, and need to know whether a raw RPC state check is practical for this contract.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Start with one exact key, widen only into that key’s history, then decide whether raw RPC state is realistic for this contract.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">get-latest-key</span> gives the newest indexed row for the exact key you care about.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">get-history-key</span> or <span className="fastnear-example-strategy__code">history-by-key</span> shows how that same key changed over time.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC view_state</span> is only the final step on contracts whose raw state is practical to query directly.</span></p>
  </div>
</div>

**Goal**

- Explain what this storage key looks like in the index, how it changed, and whether an exact RPC state check is practical here.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Latest indexed value | KV FastData [`get-latest-key`](/fastdata/kv/get-latest-key) | Fetch the newest indexed row for the exact key first | Gives the fastest narrow answer before widening into history |
| Indexed key history | KV FastData [`get-history-key`](/fastdata/kv/get-history-key) or [`history-by-key`](/fastdata/kv/history-by-key) | Pull the same key’s change history over time | Shows whether the current value is stable, recent, or part of a suspicious sequence |
| Broader write pattern | KV FastData [`latest-by-account`](/fastdata/kv/latest-by-account) or [`history-by-predecessor`](/fastdata/kv/history-by-predecessor) | Check the account or predecessor if the one key is only part of a larger pattern | Helps explain whether the key changed by itself or as part of a bigger write set |
| Contract-specific exact state check | RPC [`view_state`](/rpc/contract/view-state) | Use it only on contracts whose raw state can actually be queried directly | Keeps you from promising a raw-state confirmation that the target contract cannot serve |

**What a useful answer should include**

- the exact key and contract scope investigated
- the latest indexed value and what changed in history
- whether an exact raw-state follow-up is practical for this contract

### Exact key history shell walkthrough

Use this when one fully qualified key is already known and you want to move cleanly from “what is the latest indexed row?” to “how did this exact key get here?”

**What you're doing**

- Read one latest indexed key with the exact contract, predecessor, and key path.
- Extract the exact `key` with `jq`.
- Reuse that key in `POST /v0/history` to pull the write history for the same key.

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

The first lookup answers “what do we have right now?” Reusing the exact `key` in `POST /v0/history` answers “how did it get here?” For this exact `social.near` key, the indexed history is the correct finish: a raw `view_state` follow-up is not practical here because the contract state is too large. If you need exact chain-state confirmation on a smaller contract, that is the moment to pivot to [View State](/rpc/contract/view-state).

## Common jobs

### Look up one exact key right now

**Start here**

- [GET Latest by Exact Key](/fastdata/kv/get-latest-key) when one fully qualified key is already known.

**Next page if needed**

- [GET History by Exact Key](/fastdata/kv/get-history-key) if the question becomes “how did this key change?”

**Stop when**

- The latest indexed row already answers the storage question.

**Switch when**

- The user needs exact current chain state on a contract small enough for direct raw-state inspection. Move to [View State](/rpc/contract/view-state) or the contract's own read method.

### Turn one exact key into a change history

**Start here**

- [GET History by Exact Key](/fastdata/kv/get-history-key) for path-based history lookup.
- [History by Key](/fastdata/kv/history-by-key) when the fully qualified key route is the better fit.

**Next page if needed**

- Revisit [GET Latest by Exact Key](/fastdata/kv/get-latest-key) if you want the current indexed value alongside the history.

**Stop when**

- You can explain how the key changed over time.

**Switch when**

- The user now needs exact current chain state, not just indexed history. On smaller contracts, move to [View State](/rpc/contract/view-state); otherwise use the contract's own read method.

### Trace writes from one predecessor

**Start here**

- [All by Predecessor](/fastdata/kv/all-by-predecessor) for latest rows across contracts touched by one predecessor.
- [History by Predecessor](/fastdata/kv/history-by-predecessor) when you need the write history over time.

**Next page if needed**

- Narrow to an exact key if one row becomes the real focus.

**Stop when**

- You can answer what this predecessor changed and where.

**Switch when**

- The user stops asking about indexed writes and starts asking about the current chain state.

### Batch-check several known keys

**Start here**

- [Multi Lookup](/fastdata/kv/multi) when you already know a fixed set of fully qualified keys.

**Next page if needed**

- Move one interesting key to [GET History by Exact Key](/fastdata/kv/get-history-key) if the batch result raises a historical question.

**Stop when**

- The batch response already answers which of the keys matter.

**Switch when**

- You no longer have a fixed key list and need to inspect the contract or predecessor more broadly.

## Common mistakes

- Starting with broad account or predecessor scans when an exact key is already known.
- Using KV FastData when the user really wants balances or holdings.
- Confusing indexed history with exact current chain state.
- Promising a raw `view_state` proof on very large contracts such as `social.near`.
- Reusing pagination tokens or changing filters mid-scan.

## Related guides

- [KV FastData API](/fastdata/kv)
- [RPC Reference](/rpc)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
