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

## Best fit

- Polling for recent finalized or optimistic blocks.
- Block-family helpers and redirect flows.
- Lightweight freshness checks and monitoring paths.

## When not to use it

- Use [RPC Reference](/docs/rpc) for canonical JSON-RPC methods and transaction submission.
- Use [Snapshots](/docs/snapshots/) for infrastructure bootstrap rather than live reads.

## Base URLs

- `https://mainnet.neardata.xyz`
- `https://testnet.neardata.xyz`

## Auth and availability

- FastNear subscriptions can use an optional `apiKey` query parameter on supported traffic.
- Invalid API keys may return `401` before the NEAR Data application handles redirects.
- Add `?network=testnet` to switch compatible pages to testnet defaults.

## Common starting points

- `Optimistic block` for freshest block polling.
- `Final block by height` and `Block headers` for finalized block-family queries.
- `Last final block redirect` and `Last optimistic block redirect` when you want helper redirects.

## Troubleshooting

### Some endpoints redirect instead of returning the final payload directly

That is expected on redirect-style helpers. Follow the canonical target if your client needs the final resource.

### A block response is `null`

That usually means the requested height does not exist on that network or the request is outside the expected freshness/archive range.

### I need streaming, not polling

This surface is for polling-oriented near-realtime reads. Do not position it as a websocket or webhook product.
