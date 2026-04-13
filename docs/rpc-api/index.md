---
sidebar_position: 1
id: rpc-api-landing
slug: /rpc-api
title: RPC / API Reference
description: Advanced documentation for interacting with the blockchain via Remote Procedure Calls (RPCs) and an API accessing helpful, indexed information.
sidebar_label: Endpoints
displayed_sidebar: null
keywords:
- blockchain
- RPC
- API reference
- developer guide
- smart contracts
- JSON-RPC
---

import RpcApiServiceLinks from '@site/src/components/RpcApiServiceLinks';

# RPC Endpoints

Need a FastNear API key for higher limits on RPC and API access? [Get one in the FastNear dashboard](https://dashboard.fastnear.com). Sign up and receive 500,000 trial credits.

## Regular RPCs

Regular RPCs have the last 3 epochs in the state (which is about 21 hours).

```bash title="Mainnet Regular RPC"
https://rpc.mainnet.fastnear.com
```

```bash title="Testnet Regular RPC"
https://rpc.testnet.fastnear.com
```

## Archival RPCs

Archival RPC endpoints contain the entire NEAR blockchain history from the genesis blocks.

```bash title="Mainnet Archival RPC"
https://archival-rpc.mainnet.fastnear.com
```

```bash title="Testnet Archival RPC"
https://archival-rpc.testnet.fastnear.com
```

## [BETA] Big Powerful RPCs

The Big Powerful RPCs have custom configuration that allows you to retrieve more data than regular limits:
- **10X more gas** for the view calls (up to `3 PGas`)
- **200X more state limit** for view_state calls (up to `10Mb` of contract state)
- **21+ epochs**. More recent state for you to query.

Note, the The Big Powerful RPCs are only available for paid customers. Non authorized requests will be rate-limited to 1 call in `2**16-1` seconds per IP.

```bash title="Mainnet Powerful Big RPC"
https://big.rpc.fastnear.com
```

## Indexed API Services

These indexed APIs complement JSON-RPC with higher-level queries and precomputed views:

<RpcApiServiceLinks />
