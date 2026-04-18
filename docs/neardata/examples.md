---
sidebar_label: Examples
slug: /neardata/examples
title: NEAR Data API Examples
description: Plain-language workflows for using NEAR Data API docs for polling, redirect helpers, and escalation to canonical RPC inspection.
displayed_sidebar: nearDataApiSidebar
page_actions:
  - markdown
---

# NEAR Data API Examples

Use this page when freshness matters more than protocol-native exactness. NEAR Data API is for polling and recent block-family reads: start with the freshest or most stable block mode that matches the job, stay on the polling-oriented surface as long as it answers the question, and widen to RPC only when canonical block or state semantics become necessary.

## When to start here

- You want recent optimistic or finalized block-family data.
- You are building a polling client, monitor, or freshness check.
- Redirect helpers are acceptable or useful in your client flow.
- The job is about “what changed recently?” rather than canonical historical confirmation.

## Minimum inputs

- network
- freshness mode: optimistic or finalized
- whether you have a specific height/hash or want the latest block-family object
- whether the client can follow redirects cleanly
- whether a later RPC follow-up may be required

## Common jobs

### Monitor the optimistic head

**Start here**

- [Optimistic block](/neardata/block-optimistic) for the freshest block-family read.

**Next page if needed**

- [Last optimistic block redirect](/neardata/last-block-optimistic) if your client wants a helper route that always points at the newest optimistic block.

**Stop when**

- You can report the latest optimistic head or detect freshness drift.

**Widen when**

- The user needs finalized stability instead of maximum freshness. Move to [Final block by height](/neardata/block) or [Last final block redirect](/neardata/last-block-final).

### Track finalized block progress safely

**Start here**

- [Final block by height](/neardata/block) when you already know the height you want to confirm.
- [Block headers](/neardata/block-headers) when header-level polling is enough.

**Next page if needed**

- [Last final block redirect](/neardata/last-block-final) when the client should follow the newest finalized block without computing the height first.

**Stop when**

- You can show finalized progress without pulling in deeper protocol detail.

**Widen when**

- The user needs exact canonical block fields or transaction semantics. Move to [RPC Reference](/rpc).

### Use redirect helpers in a polling client

**Start here**

- [Last final block redirect](/neardata/last-block-final) or [Last optimistic block redirect](/neardata/last-block-optimistic) depending on the freshness requirement.

**Next page if needed**

- Follow the canonical target returned by the helper and continue reading the block-family payload there.

**Stop when**

- The client can reliably follow the helper route and consume the final block resource.

**Widen when**

- Redirect behavior itself becomes a problem for the client. Move to the direct block routes instead.

### Escalate from fresh block polling to canonical RPC inspection

**Start here**

- Use the relevant NEAR Data block route to find the recent block or block-family event of interest.

**Next page if needed**

- [Block by Height](/rpc/block/block-by-height), [Block by ID](/rpc/block/block-by-id), or another RPC method once you know the exact block or follow-up object you need.

**Stop when**

- You can clearly name the recent block that deserves canonical follow-up.

**Widen when**

- The user asks for exact protocol-native structure, not just freshness-oriented reads.

## Worked investigation

### Start with an optimistic block, then confirm the finalized and canonical story

Use this investigation when you need early detection from the optimistic head, but the final answer still needs a stable finalized view and, sometimes, canonical RPC confirmation.

**Goal**

- Catch a recent change quickly, then narrow it into a finalized and canonical block story without overfetching.

| Surface | Endpoint | How we use it | Why we use it |
| --- | --- | --- | --- |
| Fastest detection | NEAR Data [`block-optimistic`](/neardata/block-optimistic) | Poll optimistic block reads to notice a new block-family change as early as possible | Gives the earliest useful signal before finalized confirmation exists |
| Latest optimistic helper | NEAR Data [`last-block-optimistic`](/neardata/last-block-optimistic) | Use the redirect helper when the client should always follow the newest optimistic target | Keeps the polling client simple when “latest” matters more than explicit heights |
| Stable confirmation | NEAR Data [`block`](/neardata/block) or [`last-block-final`](/neardata/last-block-final) | Re-check the same block family once finality catches up | Confirms that the observed optimistic change survived into finalized history |
| Light block summary | NEAR Data [`block-headers`](/neardata/block-headers) | Read header-level data if only timing or progression is needed | Avoids wider block payloads when header-level confirmation is enough |
| Canonical follow-up | RPC [Block by ID](/rpc/block/block-by-id) or [Block by Height](/rpc/block/block-by-height) | Fetch the exact canonical block once you know which one matters | Moves from freshness-oriented reads to protocol-native confirmation only when necessary |

**What a useful answer should include**

- which optimistic observation first triggered the investigation
- when the same observation became finalized
- whether canonical RPC inspection changed the interpretation

### Shell walkthrough

Use this when you want the polling helper to choose the latest finalized block for you, but the follow-up still needs canonical RPC confirmation.

**What you're doing**

- Inspect the redirect returned by `GET /v0/last_block/final`.
- Fetch the resolved block document.
- Extract `block.header.height` with `jq`.
- Reuse that height in RPC `block` by height.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
RPC_URL=https://rpc.mainnet.fastnear.com

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

printf 'Redirect target: %s\n' "$FINAL_LOCATION"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | tee /tmp/neardata-final-block.json \
  | jq '{height: .block.header.height, hash: .block.header.hash}'

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

The redirect helper is the easiest polling surface for “latest finalized.” Once it tells you the exact block height, RPC becomes the right place to ask for canonical block semantics without guessing which block to inspect.

## Common mistakes

- Treating NEAR Data API as a streaming product instead of a polling surface.
- Starting with canonical RPC when the real need is a recent block monitor.
- Forgetting that redirect helpers may return `401` before redirecting if the key is invalid, or may be awkward for some HTTP clients.
- Staying on NEAR Data when the user has already asked for exact protocol-native block details.

## Related guides

- [NEAR Data API](/neardata)
- [RPC Reference](/rpc)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
