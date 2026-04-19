---
sidebar_label: Examples
slug: /neardata/examples
title: NEAR Data Examples
description: Plain-language workflows for polling optimistic and finalized blocks and handing off to RPC when needed.
displayed_sidebar: nearDataApiSidebar
page_actions:
  - markdown
---

## Worked investigation

### Catch a new block early, then confirm it after finality

Use this investigation when you want to notice a new block as early as possible, but the final answer still needs a finalized block and sometimes an exact RPC read.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Strategy</span>
    <p className="fastnear-example-strategy__title">Let NEAR Data tell you something changed, then reuse the same block family for the stable confirmation.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">block-optimistic</span> or <span className="fastnear-example-strategy__code">last-block-optimistic</span> gives the earliest useful signal.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">block</span> or <span className="fastnear-example-strategy__code">last-block-final</span> confirms whether the same observation survived into finalized history.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC block</span> is only the last step, once you know the exact height or hash that matters.</span></p>
  </div>
</div>

**Goal**

- Notice one recent block-family change early, then confirm which finalized block caught up.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Fastest detection | NEAR Data [`block-optimistic`](/neardata/block-optimistic) | Poll optimistic block reads to notice a new block-family change as early as possible | Gives the earliest useful signal before finalized confirmation exists |
| Latest optimistic helper | NEAR Data [`last-block-optimistic`](/neardata/last-block-optimistic) | Use the redirect helper when the client should always follow the newest optimistic target | Keeps the polling client simple when “latest” matters more than explicit heights |
| Stable confirmation | NEAR Data [`block`](/neardata/block) or [`last-block-final`](/neardata/last-block-final) | Re-check the same block family once finality catches up | Confirms that the observed optimistic change survived into finalized history |
| Light block summary | NEAR Data [`block-headers`](/neardata/block-headers) | Read header-level data if only timing or progression is needed | Avoids wider block payloads when header-level confirmation is enough |
| Exact RPC follow-up | RPC [Block by ID](/rpc/block/block-by-id) or [Block by Height](/rpc/block/block-by-height) | Fetch the exact block once you know which one matters | This is the point where RPC becomes useful if you need the protocol's own block object |

**What a useful answer should include**

- which optimistic redirect target and resolved block first triggered the investigation
- when the finalized helper caught up and which block it resolved to
- whether the exact RPC block changed the interpretation

### Optimistic signal to finalized confirmation shell walkthrough

Use this when you want to notice a fresh block-family change immediately, then prove which finalized block caught up and confirm that exact height in RPC.

**What you're doing**

- Inspect the redirect returned by `GET /v0/last_block/optimistic`.
- Fetch the resolved optimistic block document and keep its height and hash.
- Inspect the redirect returned by `GET /v0/last_block/final` and keep the finalized counterpart.
- Compare the optimistic and finalized observations, then reuse the finalized height in RPC `block` by height.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
RPC_URL=https://rpc.mainnet.fastnear.com

OPTIMISTIC_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

printf 'Optimistic redirect target: %s\n' "$OPTIMISTIC_LOCATION"

curl -s "$NEARDATA_BASE_URL$OPTIMISTIC_LOCATION" \
  | tee /tmp/neardata-optimistic-block.json \
  | jq '{height: .block.header.height, hash: .block.header.hash}'

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

printf 'Final redirect target: %s\n' "$FINAL_LOCATION"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | tee /tmp/neardata-final-block.json \
  | jq '{height: .block.header.height, hash: .block.header.hash}'

jq -n \
  --slurpfile optimistic /tmp/neardata-optimistic-block.json \
  --slurpfile final /tmp/neardata-final-block.json '{
    optimistic: {
      height: $optimistic[0].block.header.height,
      hash: $optimistic[0].block.header.hash
    },
    final: {
      height: $final[0].block.header.height,
      hash: $final[0].block.header.hash
    },
    same_height: (
      $optimistic[0].block.header.height
      == $final[0].block.header.height
    )
  }'

BLOCK_HEIGHT="$(jq -r '.block.header.height' /tmp/neardata-final-block.json)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg block_height "$BLOCK_HEIGHT" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "block",
    params: {
      block_id: ($block_height | tonumber)
    }
  }')" \
  | jq '{height: .result.header.height, hash: .result.header.hash, chunks: (.result.chunks | length)}'
```

**Why this next step?**

This gives you both sides of the story: the earliest optimistic anchor and the later finalized anchor. Once the finalized helper gives you a concrete block height, RPC is the natural next read if you want the exact block object the protocol would return.

## Common jobs

### Monitor the optimistic head

**Start here**

- [Optimistic block](/neardata/block-optimistic) for the freshest block-family read.

**Next page if needed**

- [Last optimistic block redirect](/neardata/last-block-optimistic) if your client wants a helper route that always points at the newest optimistic block.

**Stop when**

- You can report the latest optimistic head or detect freshness drift.

**Switch when**

- The user needs finalized stability instead of maximum freshness. Move to [Final block by height](/neardata/block) or [Last final block redirect](/neardata/last-block-final).

### Track finalized block progress safely

**Start here**

- [Final block by height](/neardata/block) when you already know the height you want to confirm.
- [Block headers](/neardata/block-headers) when header-level polling is enough.

**Next page if needed**

- [Last final block redirect](/neardata/last-block-final) when the client should follow the newest finalized block without computing the height first.

**Stop when**

- You can show finalized progress without pulling in deeper protocol detail.

**Switch when**

- The user needs exact block fields or transaction semantics. Move to [RPC Reference](/rpc).

### Use redirect helpers in a polling client

**Start here**

- [Last final block redirect](/neardata/last-block-final) or [Last optimistic block redirect](/neardata/last-block-optimistic) depending on the freshness requirement.

**Next page if needed**

- Follow the block URL returned by the helper and keep reading from there.

**Stop when**

- The client can reliably follow the helper route and consume the final block resource.

**Switch when**

- Redirect behavior itself becomes a problem for the client. Move to the direct block routes instead.

### Move from recent block polling to exact RPC inspection

**Start here**

- Use the relevant NEAR Data block route to find the recent block or block-family event of interest.

**Next page if needed**

- [Block by Height](/rpc/block/block-by-height), [Block by ID](/rpc/block/block-by-id), or another RPC method once you know the exact block or follow-up object you need.

**Stop when**

- You can clearly name the recent block that deserves RPC follow-up.

**Switch when**

- The user asks for the exact protocol structure, not just recent block polling.

## Common mistakes

- Treating NEAR Data like a push stream instead of a polling API.
- Starting with RPC when the real need is a recent block monitor.
- Forgetting that redirect helpers may return `401` before redirecting if the key is invalid, or may be awkward for some HTTP clients.
- Staying on NEAR Data when the user has already asked for exact protocol-native block details.

## Related guides

- [NEAR Data API](/neardata)
- [RPC Reference](/rpc)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
