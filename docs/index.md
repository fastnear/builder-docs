---
sidebar_position: 1
slug: /
title: RPC / API Reference
description: Choose the right FastNear API, RPC reference, or operator guide for balances, transaction history, snapshots, higher limits, and near-realtime reads.
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

<!-- FASTNEAR_AI_DISCOVERY: Agent builders should start with /agents/choosing-surfaces, then use /agents/auth for secure credentials, and /agents/playbooks for common workflows. -->

<div className="fastnear-home">
  <div className="fastnear-home-hero">
    <div className="fastnear-home-hero__content">
      <span className="fastnear-home-section-label">FastNear docs overview</span>
      <p className="fastnear-home-hero__title">Choosing the FastNear API or reference.</p>
      <p className="fastnear-home-hero__lede">
        Use RPC for canonical JSON-RPC state reads, contract calls, and transaction submission. Use indexed APIs for balances, holdings, activity history, and recent block-family data.
      </p>
      <div className="fastnear-home-hero__actions">
        <Link className="fastnear-home-button fastnear-home-button--primary" to="/api">Start with FastNear API</Link>
        <Link className="fastnear-home-button fastnear-home-button--secondary" to="/rpc">Start with RPC</Link>
        <Link className="fastnear-home-button fastnear-home-button--ghost" to="/auth">Get API key</Link>
      </div>
      <div className="fastnear-home-auth-callout">
        <div className="fastnear-home-auth-callout__header">
          <span className="fastnear-home-auth-callout__eyebrow">Authentication</span>
          <p className="fastnear-home-auth-callout__title">FastNear API keys work across the RPC and APIs.</p>
        </div>
        <div className="fastnear-home-auth-callout__methods">
          <div className="fastnear-home-auth-callout__method">
            <span className="fastnear-home-auth-callout__method-label">Header</span>
            <span className="fastnear-home-auth-callout__code">Authorization: Bearer ...</span>
          </div>
          <div className="fastnear-home-auth-callout__method">
            <span className="fastnear-home-auth-callout__method-label">Query parameter</span>
            <span className="fastnear-home-auth-callout__code">?apiKey=...</span>
          </div>
        </div>
      </div>
    </div>

    <div className="fastnear-home-hero__panel">
      <span className="fastnear-home-section-label">Quick routing</span>
      <div className="fastnear-home-route-stack">
        <div className="fastnear-home-route-card fastnear-home-route-card--primary">
          <span className="fastnear-home-route-card__tag">Most teams start here</span>
          <Link className="fastnear-home-route-card__title" to="/api">FastNear API</Link>
          <p>Indexed account, asset, staking, and public-key endpoints for account-centric application reads.</p>
        </div>
        <div className="fastnear-home-route-card">
          <span className="fastnear-home-route-card__tag">Protocol-native</span>
          <Link className="fastnear-home-route-card__title" to="/rpc">RPC Reference</Link>
          <p>Canonical JSON-RPC methods for blocks, contract calls, validators, and transaction submission.</p>
        </div>
        <div className="fastnear-home-route-card">
          <span className="fastnear-home-route-card__tag">Execution history</span>
          <Link className="fastnear-home-route-card__title" to="/tx">Transactions API</Link>
          <p>Account activity, receipts, transaction lookups, and block-scoped history from indexed execution data.</p>
        </div>
        <div className="fastnear-home-route-card">
          <span className="fastnear-home-route-card__tag">Low-latency reads</span>
          <Link className="fastnear-home-route-card__title" to="/neardata">NEAR Data API</Link>
          <p>Recent optimistic and finalized blocks, headers, and redirect helpers for polling and lightweight monitoring.</p>
        </div>
      </div>
    </div>
  </div>

  <div className="fastnear-home-section">
    <div className="fastnear-home-section-heading">
      <span className="fastnear-home-section-label">Main APIs and references</span>
      <p className="fastnear-home-section-title">These are the main FastNear entry points.</p>
      <p>
        Start with the API or reference section that matches the data you need, then move into the detailed reference for the specific endpoint.
      </p>
    </div>

    <div className="fastnear-home-surface-grid">
      <div className="fastnear-home-surface-card fastnear-home-surface-card--api fastnear-home-surface-card--wide">
        <span className="fastnear-home-surface-card__eyebrow">Indexed account views</span>
        <Link className="fastnear-home-surface-card__title" to="/api">FastNear API</Link>
        <p>
          Use indexed REST endpoints for balances, NFTs, staking positions, and public-key lookups without raw JSON-RPC request and response envelopes.
        </p>
        <div className="fastnear-home-surface-links">
          <span className="fastnear-home-surface-links__label">Try out</span>
          <Link to="/api/v1/account-full">Full account state</Link>
          <Link to="/api/v1/account-ft">Fungible token balances</Link>
          <Link to="/api/v1/account-nft">NFT holdings</Link>
          <Link to="/api/v1/public-key">Public key lookups</Link>
        </div>
      </div>

      <div className="fastnear-home-surface-card fastnear-home-surface-card--rpc fastnear-home-surface-card--narrow">
        <span className="fastnear-home-surface-card__eyebrow">Canonical JSON-RPC</span>
        <Link className="fastnear-home-surface-card__title" to="/rpc">RPC Reference</Link>
        <p>
          Use protocol-native methods for direct state reads, transaction submission, contract calls, and chain inspection.
        </p>
        <div className="fastnear-home-surface-links">
          <span className="fastnear-home-surface-links__label">Try out</span>
          <Link to="/rpc/account/view-account">Account state</Link>
          <Link to="/rpc/block/block-by-id">Block lookups</Link>
          <Link to="/rpc/contract/call-function">Contract view calls</Link>
          <Link to="/rpc/validators/validators-current">Validator data</Link>
        </div>
      </div>

      <div className="fastnear-home-surface-card fastnear-home-surface-card--tx fastnear-home-surface-card--narrow">
        <span className="fastnear-home-surface-card__eyebrow">Execution history</span>
        <Link className="fastnear-home-surface-card__title" to="/tx">Transactions API</Link>
        <p>
          Use indexed endpoints for account activity, receipts, transaction lookups, and block-scoped execution history.
        </p>
        <div className="fastnear-home-surface-links">
          <span className="fastnear-home-surface-links__label">Try out</span>
          <Link to="/tx/account">Account activity</Link>
          <Link to="/tx/transactions">Transaction lookups</Link>
          <Link to="/tx/receipt">Receipt tracing</Link>
          <Link to="/tx/blocks">Block transaction history</Link>
        </div>
      </div>

      <div className="fastnear-home-surface-card fastnear-home-surface-card--data fastnear-home-surface-card--wide">
        <span className="fastnear-home-surface-card__eyebrow">Recent block-family reads</span>
        <Link className="fastnear-home-surface-card__title" to="/neardata">NEAR Data API</Link>
        <p>
          Use NEAR Data for recent optimistic and finalized blocks, block headers, and latest-block helper routes when you need near-realtime reads or lightweight monitoring.
        </p>
        <div className="fastnear-home-surface-links">
          <span className="fastnear-home-surface-links__label">Try out</span>
          <Link to="/neardata/block-optimistic">Optimistic block reads</Link>
          <Link to="/neardata/last-block-final">Latest finalized block</Link>
          <Link to="/neardata/block-headers">Block header polling</Link>
        </div>
      </div>
    </div>
  </div>

  <div className="fastnear-home-section">
    <div className="fastnear-home-section-heading">
      <span className="fastnear-home-section-label">Ops and access</span>
      <p className="fastnear-home-section-title">What teams ask before going live.</p>
      <p>Keep these close when you are moving from exploration to production.</p>
    </div>

    <div className="fastnear-home-utility-grid">
      <div className="fastnear-home-utility-card">
        <span className="fastnear-home-utility-card__eyebrow">Higher limits</span>
        <Link className="fastnear-home-utility-card__title" to="/auth">Auth &amp; Access</Link>
        <p>Use one FastNear API key across both the RPC and REST APIs.</p>
      </div>
      <div className="fastnear-home-utility-card">
        <span className="fastnear-home-utility-card__eyebrow">Keys and billing</span>
        <Link className="fastnear-home-utility-card__title" to="https://dashboard.fastnear.com">FastNear Dashboard</Link>
        <p>Sign in, create keys, and move to higher-limit usage patterns when you need them.</p>
      </div>
      <div className="fastnear-home-utility-card">
        <span className="fastnear-home-utility-card__eyebrow">Live operations</span>
        <Link className="fastnear-home-utility-card__title" to="https://status.fastnear.com">Status</Link>
        <p>Check incidents or degraded service before you start debugging application behavior.</p>
      </div>
      <div className="fastnear-home-utility-card">
        <span className="fastnear-home-utility-card__eyebrow">Infra bootstrap</span>
        <Link className="fastnear-home-utility-card__title" to="/snapshots/">Snapshots</Link>
        <p>Stand up RPC or archival infrastructure faster without replaying the chain from scratch.</p>
      </div>
    </div>
  </div>

  <div className="fastnear-home-agent-callout">
    <div>
      <span className="fastnear-home-section-label">Agents and automation</span>
      <p className="fastnear-home-agent-callout__title">Building with AI agents or background workers?</p>
      <p>
        Use the agent docs for credential posture, routing logic, and prompt-friendly markdown exports.
      </p>
    </div>
    <div className="fastnear-home-agent-callout__actions">
      <Link className="fastnear-home-button fastnear-home-button--secondary" to="/agents">Open Agents hub</Link>
      <Link className="fastnear-home-button fastnear-home-button--ghost" to="/agents/choosing-surfaces">Routing guide</Link>
    </div>
  </div>
</div>
