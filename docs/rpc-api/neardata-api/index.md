---
title: NEAR Data API
description: Cached and archived NEAR block data with redirect helpers.
sidebar_position: 1
displayed_sidebar: nearDataApiSidebar
---

# NEAR Data API

Base URLs:
- `https://mainnet.neardata.xyz`
- `https://testnet.neardata.xyz`

Authentication:
- Optional `apiKey` query parameter for FastNear subscription traffic.
- Invalid API keys may return `401` before the neardata app handles redirects.

Behavior notes:
- Some endpoints redirect to canonical block URLs.
- Some block-by-height routes may also redirect depending on archive and freshness topology.
- Block responses may be `null` when the requested height does not exist.
- Examples seed known block heights so you can try the block-family endpoints immediately.
- Add `?network=testnet` to switch the page to testnet and seed testnet-friendly defaults.

The sidebar for this section is intentionally NEAR Data-only so the block-family operations stay grouped together as you move between redirect, health, and block-slice endpoints.

Operations:
- [First block redirect](/docs/rpc-api/neardata-api/first-block)
- [Final block by height](/docs/rpc-api/neardata-api/block)
- [Block headers](/docs/rpc-api/neardata-api/block-headers)
- [Block chunk](/docs/rpc-api/neardata-api/block-chunk)
- [Block shard](/docs/rpc-api/neardata-api/block-shard)
- [Optimistic block](/docs/rpc-api/neardata-api/block-optimistic)
- [Last final block redirect](/docs/rpc-api/neardata-api/last-block-final)
- [Last optimistic block redirect](/docs/rpc-api/neardata-api/last-block-optimistic)
- [Health](/docs/rpc-api/neardata-api/health)
