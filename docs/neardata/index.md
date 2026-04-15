---
title: NEAR Data API
description: Cached and archived block-family reads for optimistic, finalized, and redirect-style block access patterns.
sidebar_position: 1
displayed_sidebar: nearDataApiSidebar
slug: /neardata
page_actions:
  - markdown
---

# NEAR Data API

NEAR Data API is the near-realtime and block-family surface. Use it when you want fresh block slices, redirect helpers, or recent finalized and optimistic block reads without presenting it as a streaming product.

## Base URLs

```bash title="NEAR Data API Mainnet"
https://mainnet.neardata.xyz
```

```bash title="NEAR Data API Testnet"
https://testnet.neardata.xyz
```

## Best fit

- Polling for recent finalized or optimistic blocks.
- Block-family helpers and redirect flows.
- Lightweight freshness checks and monitoring paths.

## When not to use it

- Use [RPC Reference](/rpc) for canonical JSON-RPC methods and transaction submission.
- Use [Snapshots](/snapshots/) for infrastructure bootstrap rather than live reads.

## Auth and availability

- FastNear subscriptions can use an optional `apiKey` query parameter on supported traffic.
- An invalid API key returns `401` before the redirect helpers run, so invalid-key debugging will not surface the canonical target URL.
- Add `?network=testnet` to switch compatible pages to testnet defaults.

## Common starting points

- [Optimistic block](/neardata/block-optimistic) for freshest block polling.
- [Final block by height](/neardata/block) and [Block headers](/neardata/block-headers) for finalized block-family queries.
- [Last final block redirect](/neardata/last-block-final) and [Last optimistic block redirect](/neardata/last-block-optimistic) when you want helper redirects.

## Troubleshooting

### Some endpoints redirect instead of returning the final payload directly

That is expected on redirect-style helpers. Follow the canonical target if your client needs the final resource.

### A block response is `null`

That usually means the requested height does not exist on that network or the request is outside the expected freshness/archive range.

### I need streaming, not polling

This surface is for polling-oriented near-realtime reads. Do not position it as a websocket or webhook product.
