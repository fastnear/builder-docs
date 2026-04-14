---
sidebar_position: 1
id: rpc-api-landing
slug: /rpc-api
title: RPC / API Reference
description: Choose the right FastNear surface for raw RPC, indexed balances, transaction history, snapshots, higher limits, and near-realtime reads.
sidebar_label: Endpoints
displayed_sidebar: null
hide_table_of_contents: true
page_actions:
  - markdown
keywords:
- blockchain
- RPC
- API reference
- developer guide
- smart contracts
- JSON-RPC
---

import Link from '@docusaurus/Link';
import RpcApiServiceLinks from '@site/src/components/RpcApiServiceLinks';

# Choose Your FastNear Surface

<!-- FASTNEAR_AI_DISCOVERY: Agent builders should start with /docs/ai-agents/choosing-surfaces, then use /docs/ai-agents/auth-for-agents for secure credentials, and /docs/ai-agents/playbooks for common workflows. -->

FastNear ships multiple docs surfaces because builders need different tradeoffs. Start from the job you need done, then drop into the detailed reference from there.

<div className="fastnear-doc-card-grid">
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Raw RPC</span>
    <strong>Direct NEAR node access</strong>
    <span>Use canonical JSON-RPC methods for protocol-native reads, transaction submission, and protocol inspection.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/docs/rpc/account/view-account">account state</Link></li>
      <li><Link to="/docs/rpc/block/block-by-id">block lookups</Link></li>
      <li><Link to="/docs/rpc/contract/call-function">contract view calls</Link></li>
      <li><Link to="/docs/rpc/validators/validators-current">validator data</Link></li>
    </ul>
    <Link className="fastnear-doc-card__cta" to="/docs/rpc">Open RPC reference</Link>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Indexed balances</span>
    <strong>Higher-level account and token views</strong>
    <span>Start here when you want wallet-friendly balances, NFTs, staking, or public-key lookups without raw JSON-RPC envelopes.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/docs/rpc-api/fastnear-api/v1-account-full">full account state</Link></li>
      <li><Link to="/docs/rpc-api/fastnear-api/v1-account-ft">fungible token balances</Link></li>
      <li><Link to="/docs/rpc-api/fastnear-api/v1-account-nft">NFT holdings</Link></li>
      <li><Link to="/docs/rpc-api/fastnear-api/v1-public-key">public key lookups</Link></li>
    </ul>
    <Link className="fastnear-doc-card__cta" to="/docs/api">Open FastNear API</Link>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Tx history</span>
    <strong>Indexed transactions and receipts</strong>
    <span>Query transaction history by account, receipt, block, or hash when you need a builder-facing history API instead of node polling.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/docs/rpc-api/transactions-api/account">account activity</Link></li>
      <li><Link to="/docs/rpc-api/transactions-api/transactions">transaction lookups</Link></li>
      <li><Link to="/docs/rpc-api/transactions-api/receipt">receipt tracing</Link></li>
      <li><Link to="/docs/rpc-api/transactions-api/blocks">block transaction history</Link></li>
    </ul>
    <Link className="fastnear-doc-card__cta" to="/docs/tx">Open Transactions API</Link>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Snapshots</span>
    <strong>Bootstrap infrastructure faster</strong>
    <span>Use curated snapshot flows when you need to stand up RPC or archival infrastructure without replaying the chain from scratch.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/docs/snapshots/mainnet">mainnet snapshots</Link></li>
      <li><Link to="/docs/snapshots/testnet">testnet snapshots</Link></li>
      <li><Link to="/docs/snapshots/">snapshot workflow overview</Link></li>
    </ul>
    <Link className="fastnear-doc-card__cta" to="/docs/snapshots/">Open snapshots docs</Link>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Higher limits</span>
    <strong>Auth, access, and safer production usage</strong>
    <span>See how FastNear API keys fit into the docs UI, and how to move from demo flows to secure backend usage.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/docs/rpc-api/api-key">auth overview</Link></li>
      <li><Link to="/docs/rpc-api/auth-browser-demo">browser demo auth</Link></li>
      <li><Link to="/docs/rpc-api/auth-production-backend">production backend auth</Link></li>
    </ul>
    <Link className="fastnear-doc-card__cta" to="/docs/rpc-api/api-key">Open auth docs</Link>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Realtime</span>
    <strong>Near-realtime block data and redirects</strong>
    <span>Use NEAR Data when you need optimistic or recently finalized block-family reads without presenting it as a streaming product.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/docs/rpc-api/neardata-api/block-optimistic">optimistic block reads</Link></li>
      <li><Link to="/docs/rpc-api/neardata-api/last-block-final">latest finalized block</Link></li>
      <li><Link to="/docs/rpc-api/neardata-api/block-headers">block header polling</Link></li>
    </ul>
    <Link className="fastnear-doc-card__cta" to="/docs/neardata">Open NEAR Data API</Link>
  </article>
</div>

## Quick chooser

| Need | Start here | Why |
| --- | --- | --- |
| Canonical NEAR protocol methods | [RPC Reference](/docs/rpc) | FastNear RPC keeps the request and response shapes closest to NEAR nodes. |
| Account balances, NFTs, staking, and public-key lookups | [FastNear API](/docs/api) | Indexed account views are easier to use than raw RPC for most product surfaces. |
| Transaction or receipt history | [Transactions API](/docs/tx) | Query by account, block, receipt, or transaction hash from a purpose-built history API. |
| Recent block-family reads | [NEAR Data API](/docs/neardata) | Optimistic and finalized block helpers work well for polling-based freshness checks. |
| Bootstrap node infrastructure | [Snapshots](/docs/snapshots/) | Snapshot flows shorten time-to-service for RPC and archival infra. |
| Paid access and safer auth patterns | [Auth & Access](/docs/rpc-api/api-key) | Separate the docs-demo flow from backend production usage. |

## Before you integrate

These are the operational details technical teams usually want up front:

- [Auth & Access](/docs/rpc-api/api-key): understand the difference between the in-docs demo flow and backend production auth.
- [Dashboard](https://dashboard.fastnear.com): manage API keys and move to higher-limit usage patterns.
- [Status](https://status.fastnear.com): check incidents or degraded service before debugging application behavior.
- [RPC Reference](/docs/rpc): choose regular versus archival RPC depending on how much chain history you need.
- [Snapshots](/docs/snapshots/): bootstrap infra faster when you are standing up RPC or archival nodes.

## Practical routing guidance

- Start with [RPC Reference](/docs/rpc) when you need canonical JSON-RPC requests, transaction submission, or protocol-native responses.
- Start with [FastNear API](/docs/api) when you are building wallet, explorer, or portfolio features and want indexed account views.
- Start with [Transactions API](/docs/tx) when you care about account-scoped activity, receipts, and execution history.
- Start with [NEAR Data API](/docs/neardata) when you are polling recent block-family data and do not need to present it as streaming infrastructure.

## Other API families

These complementary APIs stay useful once you know the core surfaces above:

<RpcApiServiceLinks />

## If you are building for AI or agents

- Start with [Choosing the Right Surface](/docs/ai-agents/choosing-surfaces) to map the job to the right FastNear surface.
- Use [Auth for Agents](/docs/ai-agents/auth-for-agents) when the caller is an automation, worker, or agent runtime.
- Borrow from [Agent Playbooks](/docs/ai-agents/playbooks) when you want a concrete workflow pattern.
- Use [Auth & Access](/docs/rpc-api/api-key) to keep agent credentials on the server side.
- Use page-level `Copy as Markdown` actions to move clean docs context into prompts, notes, and agent runtimes.
