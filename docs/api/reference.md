---
sidebar_label: API
slug: /api/reference
title: API Reference
description: Routing guide for FastNear's REST API families and how they differ from direct JSON-RPC methods.
displayed_sidebar: fastnearApiSidebar
---

# API Reference

This route explains what belongs in FastNear's REST layer and how to choose among the REST families before dropping to raw JSON-RPC.

The `/api` sidebar is intentionally the **FastNear API** sidebar, not a catch-all REST sidebar. Other REST families such as [Transactions API](/tx), [Transfers API](/transfers), [NEAR Data API](/neardata), and [KV FastData API](/fastdata/kv) each live at their own top-level section.

## REST families at a glance

| Family | Start here when... | Move elsewhere when... |
| --- | --- | --- |
| [FastNear API](/api) | you want indexed account, token, NFT, staking, or public-key views | you need canonical protocol-native RPC semantics |
| [Transactions API](/tx) | you want transaction, receipt, account, or block history | you only need transfer events or exact RPC-level behavior |
| [Transfers API](/transfers) | the question is specifically about NEAR or FT movement | the question broadens to general execution history |
| [NEAR Data API](/neardata) | you want recent optimistic or finalized block-family reads | you need exact canonical block or state follow-up |
| [KV FastData API](/fastdata/kv) | you want indexed key-value history or latest indexed key state | you need exact current on-chain contract state |

## What `/api` itself is for

Use the [FastNear API](/api) section when the user wants a product-shaped answer without stitching raw node responses together:

- account summaries
- FT balances
- NFT holdings
- staking positions
- public-key to account resolution

Good starting pages in this sidebar:

- [V1 Full Account View](/api/v1/account-full)
- [V1 Account FT](/api/v1/account-ft)
- [V1 Account NFT](/api/v1/account-nft)
- [V1 Account Staking](/api/v1/account-staking)
- [V1 Public Key](/api/v1/public-key)

## When not to use `/api`

Do not start in this sidebar when:

- the primary job is history; use [Transactions API](/tx) or [Transfers API](/transfers)
- the primary job is recent block polling; use [NEAR Data API](/neardata)
- the answer must stay close to canonical node request and response shapes; use [RPC Reference](/rpc)

## For agents

If the caller is an AI agent and the choice is still unclear, use:

- [Agents on FastNear](/agents)
- [Choosing the Right Surface](/agents/choosing-surfaces)
