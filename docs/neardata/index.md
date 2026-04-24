---
title: NEAR Data API
description: Recent block and shard reads for contract-touch monitoring, optimistic confirmation, and shard-local inspection.
sidebar_position: 1
displayed_sidebar: nearDataApiSidebar
slug: /neardata
page_actions:
  - markdown
---

# NEAR Data API

NEAR Data API is the recent block and shard surface. Use it when you want fresh block slices, contract-touch monitoring, helper redirects, or optimistic-versus-finalized confirmation without turning the product into a streaming API.

## Base URLs

```bash title="NEAR Data API Mainnet"
https://mainnet.neardata.xyz
```

```bash title="NEAR Data API Testnet"
https://testnet.neardata.xyz
```

## Best fit

- Polling for recent finalized or optimistic blocks.
- Detecting whether a live contract showed up or changed state in a recent block.
- Comparing optimistic signals with finalized confirmation.
- Inspecting one recent shard after you already know which block matters.

## When not to use it

- Use [RPC Reference](/rpc) for canonical JSON-RPC methods and transaction submission.
- Use [Snapshots](/snapshots/) for infrastructure bootstrap rather than live reads.

## Auth and availability

- The same FastNear API key works here too; public reads can still use an optional `apiKey` query parameter on supported traffic.
- An invalid API key returns `401` before the redirect helpers run, so invalid-key debugging will not surface the canonical target URL.
- Add `?network=testnet` to switch compatible pages to testnet defaults.

## Common starting points

- [Last final block redirect](/neardata/last-block-final) and [Last optimistic block redirect](/neardata/last-block-optimistic) when you want the newest recent block quickly.
- [Final block by height](/neardata/block) for one recent hydrated block document with shard payloads attached.
- [Block Shard](/neardata/block-shard) when a recent block already identified the shard you need to inspect more closely.
- [Block Headers](/neardata/block-headers) when head progression matters more than the wider block payload.

## Need a workflow?

Use [NEAR Data API Examples](/neardata/examples) for worked examples like contract-touch detection, optimistic-versus-finalized comparison, and shard-local change inspection.

## Troubleshooting

### Some endpoints redirect instead of returning the final payload directly

That is expected on redirect-style helpers. Follow the canonical target if your client needs the final resource.

### A block response is `null`

That usually means the requested height does not exist on that network or the request is outside the expected freshness/archive range.

### I need streaming, not polling

This surface is for polling-oriented near-realtime reads. Do not position it as a websocket or webhook product.
