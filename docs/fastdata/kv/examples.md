---
sidebar_label: Examples
slug: /fastdata/kv/examples
title: KV FastData Examples
description: Plain-language workflows for checking exact storage keys, following indexed write history, and confirming current state with RPC.
displayed_sidebar: kvFastDataSidebar
page_actions:
  - markdown
---

## Worked investigation

### Inspect one predecessor’s indexed writes, then narrow to the key that changed

Use this investigation when you know the predecessor first and the real question is “what did this predecessor write, which row is interesting, and what happened to that key afterward?”

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Start from predecessor scope, narrow to one exact key only after it earns your attention, then use RPC only for the final exact check.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">all-by-predecessor</span> gives the latest indexed rows for one predecessor across the contracts it touched.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">get-history-key</span> or <span className="fastnear-example-strategy__code">history-by-predecessor</span> explains how the interesting row changed over time.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC view_state</span> is the optional exact read when you need canonical current state, not just indexed history.</span></p>
  </div>
</div>

**Goal**

- Explain what one predecessor wrote, which exact key became the focus, how that key changed, and whether you even need a canonical `view_state` check at the end.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Latest indexed rows by scope | KV FastData [`all-by-predecessor`](/fastdata/kv/all-by-predecessor) | Start with the predecessor’s current indexed writes across the contracts it touched | Answers the scope-first question before you pretend the exact key is already known |
| Indexed key history | KV FastData [`get-history-key`](/fastdata/kv/get-history-key) or [`history-by-predecessor`](/fastdata/kv/history-by-predecessor) | Pull the history for the exact key or keep the predecessor-wide write story broader for one more step | Shows whether the interesting row is stable, recent, or part of a larger write pattern |
| Exact state check | RPC [`view_state`](/rpc/contract/view-state) | Confirm the current on-chain state once the indexed pattern is clear | Separates indexed storage history from the exact state the chain would return now |

**What a useful answer should include**

- which predecessor scope you started from
- which exact key became the real focus
- how that key changed in history
- whether a final `view_state` check is still necessary

### Predecessor-scope shell walkthrough

Use this when one predecessor is already known and you want to move cleanly from “what did this predecessor write?” to “how did this exact key get here?”

**What you're doing**

- Read the latest indexed rows for one predecessor across the contracts it touched.
- Lift one interesting `current_account_id` plus exact `key` with `jq`.
- Reuse those exact values in the documented exact-key history route.
- Only after that decide whether you still need `view_state` for canonical current state.

```bash
KV_BASE_URL=https://kv.main.fastnear.com
PREDECESSOR_ID=james.near

curl -s "$KV_BASE_URL/v0/all/$PREDECESSOR_ID" \
  -H 'content-type: application/json' \
  --data '{"include_metadata":true,"limit":10}' \
  | tee /tmp/kv-predecessor.json >/dev/null

jq '{
  page_token,
  entries: [
    .entries[]
    | {
        current_account_id,
        predecessor_id,
        block_height,
        key,
        value
      }
  ]
}' /tmp/kv-predecessor.json

CURRENT_ACCOUNT_ID="$(jq -r '.entries[0].current_account_id' /tmp/kv-predecessor.json)"
EXACT_KEY="$(jq -r '.entries[0].key' /tmp/kv-predecessor.json)"
ENCODED_KEY="$(jq -rn --arg key "$EXACT_KEY" '$key | @uri')"

curl -s "$KV_BASE_URL/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY" \
  | jq '{
      entries: [
        .entries[]
        | {
            current_account_id,
            predecessor_id,
            block_height,
            key,
            value
          }
      ]
    }'
```

**Why this next step?**

The first lookup answers the scope-first question: what does this predecessor write right now? Narrowing from that feed to one exact key answers the more specific question: how did this row get here? If the write pattern is still broader than one key, stay on [History by Predecessor](/fastdata/kv/history-by-predecessor) a little longer before you switch to exact-key history or RPC.

## Common jobs

### Start from one predecessor’s writes

**Start here**

- [All by Predecessor](/fastdata/kv/all-by-predecessor) when you know who wrote the rows but not yet which exact key matters most.

**Next page if needed**

- [GET History by Exact Key](/fastdata/kv/get-history-key) if one row becomes the real focus.
- [History by Predecessor](/fastdata/kv/history-by-predecessor) if the broader predecessor write pattern is still the real question.

**Stop when**

- You can explain what this predecessor wrote and whether one row deserves deeper history.

**Switch when**

- The user needs canonical current chain state rather than indexed storage history. Move to [View State](/rpc/contract/view-state).

### Turn one exact key into a change history

**Start here**

- [GET History by Exact Key](/fastdata/kv/get-history-key) for path-based history lookup.
- [History by Key](/fastdata/kv/history-by-key) when the fully qualified key route is the better fit.

**Next page if needed**

- Revisit [GET Latest by Exact Key](/fastdata/kv/get-latest-key) if you want the current indexed value alongside the history.

**Stop when**

- You can explain how the key changed over time.

**Switch when**

- The user asks whether the latest indexed value matches the chain right now.

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
- Reusing pagination tokens or changing filters mid-scan.

## Related guides

- [KV FastData API](/fastdata/kv)
- [RPC Reference](/rpc)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
