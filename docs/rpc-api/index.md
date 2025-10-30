---
sidebar_position: 1
id: rpc-api-landing
slug: /rpc-api
title: RPC / API Reference
description: Advanced documentation for interacting with the blockchain via Remote Procedure Calls (RPCs) and an API accessing helpful, indexed information.
sidebar_label: Endpoints
displayed_sidebar: rpcApiSidebar
keywords:
- blockchain
- RPC
- API reference
- developer guide
- smart contracts
- JSON-RPC
---

# RPC Endpoints

## Regular RPCs

Regular RPCs have the last 3 epochs in the state (which is about 21 hours).

### Mainnet Regular RPC

```bash title="mainnet-rpc"
https://rpc.mainnet.fastnear.com
```

### Testnet Regular RPC

```bash title="testnet-rpc"
https://rpc.testnet.fastnear.com
```

## Archival RPCs

Archival RPC endpoints contain the entire NEAR blockchain history from the genesis blocks.

### Mainnet Archival RPC

```bash title="archival-mainnet-rpc"
https://archival-rpc.mainnet.fastnear.com
```

### Testnet Archival RPC

```bash title="archival-testnet-rpc"
https://archival-rpc.testnet.fastnear.com
```

## [BETA] Big Powerful RPCs

The Big Powerful RPCs have custom configuration that allows you to retrieve more data than regular limits:
- **10X more gas** for the view calls (up to `3 PGas`)
- **200X more state limit** for view_state calls (up to `10Mb` of contract state)
- **21+ epochs**. More recent state for you to query.

Note, the The Big Powerful RPCs are only available for paid customers. Non authorized requests will be rate-limited to 1 call in `2**16-1` seconds per IP.

### Mainnet Powerful Big RPC

```bash title="big-mainnet-rpc"
https://big.rpc.fastnear.com
```
