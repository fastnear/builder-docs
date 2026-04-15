---
sidebar_position: 1
slug: /
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

import Link from '@site/src/components/LocalizedLink';
import RpcApiServiceLinks from '@site/src/components/RpcApiServiceLinks';

# FastNear RPC / APIs

<!-- FASTNEAR_AI_DISCOVERY: Agent builders should start with /agents/choosing-surfaces, then use /agents/auth for secure credentials, and /agents/playbooks for common workflows. -->

FastNear ships multiple docs surfaces because builders need different tradeoffs.
Start from the job you need done, then drop into the detailed reference from there.

<div className="fastnear-doc-card-grid fastnear-doc-card-grid--surface">
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Canonical JSON-RPC</span>
    <Link className="fastnear-doc-card__title" to="/rpc"><strong>RPC</strong></Link>
    <span>Use canonical JSON-RPC methods for protocol-native reads, transaction submission, and protocol inspection.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/rpc/account/view-account">account state</Link></li>
      <li><Link to="/rpc/block/block-by-id">block lookups</Link></li>
      <li><Link to="/rpc/contract/call-function">contract view calls</Link></li>
      <li><Link to="/rpc/validators/validators-current">validator data</Link></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Indexed balances</span>
    <Link className="fastnear-doc-card__title" to="/api"><strong>FastNear API</strong></Link>
    <span>Start here when you want wallet-friendly balances, NFTs, staking, or public-key lookups without raw JSON-RPC envelopes.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/api/v1/account-full">full account state</Link></li>
      <li><Link to="/api/v1/account-ft">fungible token balances</Link></li>
      <li><Link to="/api/v1/account-nft">NFT holdings</Link></li>
      <li><Link to="/api/v1/public-key">public key lookups</Link></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Tx history</span>
    <Link className="fastnear-doc-card__title" to="/tx"><strong>Transactions API</strong></Link>
    <span>Query transaction history by account, receipt, block, or hash when you need a builder-facing history API instead of node polling.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/tx/account">account activity</Link></li>
      <li><Link to="/tx/transactions">transaction lookups</Link></li>
      <li><Link to="/tx/receipt">receipt tracing</Link></li>
      <li><Link to="/tx/blocks">block transaction history</Link></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Snapshots</span>
    <Link className="fastnear-doc-card__title" to="/snapshots/"><strong>Snapshots</strong></Link>
    <span>Use curated snapshot flows when you need to stand up RPC or archival infrastructure without replaying the chain from scratch.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/snapshots/mainnet">mainnet snapshots</Link></li>
      <li><Link to="/snapshots/testnet">testnet snapshots</Link></li>
      <li><Link to="/snapshots/">snapshot workflow overview</Link></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Higher limits</span>
    <Link className="fastnear-doc-card__title" to="/auth"><strong>Auth &amp; Access</strong></Link>
    <span>One FastNear API key works across the RPC and REST APIs; send it as an Authorization Bearer header or as an apiKey URL parameter.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/auth">auth overview</Link></li>
      <li><a href="https://dashboard.fastnear.com">get an API key</a></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Realtime</span>
    <Link className="fastnear-doc-card__title" to="/neardata"><strong>NEAR Data API</strong></Link>
    <span>Use NEAR Data when you need optimistic or recently finalized block-family reads without presenting it as a streaming product.</span>
    <span className="fastnear-doc-card__bestfor-label">Best for:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/neardata/block-optimistic">optimistic block reads</Link></li>
      <li><Link to="/neardata/last-block-final">latest finalized block</Link></li>
      <li><Link to="/neardata/block-headers">block header polling</Link></li>
    </ul>
  </article>
</div>

## Before you integrate

These are the operational details technical teams usually want up front:

- [Auth & Access](/auth): send a FastNear API key as an `Authorization: Bearer` header or `?apiKey=` URL parameter.
- [Dashboard](https://dashboard.fastnear.com): manage API keys and move to higher-limit usage patterns.
- [Status](https://status.fastnear.com): check incidents or degraded service before debugging application behavior.
- [RPC Reference](/rpc): choose regular versus archival RPC depending on how much chain history you need.
- [Snapshots](/snapshots/): bootstrap infra faster when you are standing up RPC or archival nodes.
## Practical routing guidance

- Start with [RPC Reference](/rpc) when you need canonical JSON-RPC requests, transaction submission, or protocol-native responses.
- Start with [FastNear API](/api) when you are building wallet, explorer, or portfolio features and want indexed account views.
- Start with [Transactions API](/tx) when you care about account-scoped activity, receipts, and execution history.
- Start with [NEAR Data API](/neardata) when you are polling recent block-family data and do not need to present it as streaming infrastructure.
## Other API families

These complementary APIs stay useful once you know the core surfaces above:

<RpcApiServiceLinks />
## If you are building for AI or agents

- Start at the [Agents hub](/agents) for an overview of routing, credentials, and playbook patterns.
- Use [Choosing the Right Surface](/agents/choosing-surfaces) to map the agent's job to one FastNear surface.
- Use [Auth for Agents](/agents/auth) when the caller is an automation, worker, or agent runtime.
- Borrow from [Agent Playbooks](/agents/playbooks) when you want a concrete workflow pattern.
- Use page-level `Copy as Markdown` actions to move clean docs context into prompts, notes, and agent runtimes.
