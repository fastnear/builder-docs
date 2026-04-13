---
sidebar_label: API
id: api
slug: api
title: API Reference
displayed_sidebar: fastnearApiSidebar
---

# API Reference

This top-level API section is the FastNear REST API surface. It complements JSON-RPC with indexed account, token, NFT, and public-key views that are often easier to use for wallets, explorers, analytics, and backend integrations.

The sidebar for this section is intentionally FastNear-only. Other REST families such as Transactions, Transfers, NEAR Data, and FastData each have their own top-level navbar entry and their own section-specific sidebar.

## FastNear API

- [FastNear API](/docs/rpc-api/fastnear-api) for indexed account, token, NFT, and public-key lookups.

## How To Think About This Section

Use these APIs when you want:

- indexed responses instead of raw JSON-RPC envelopes
- workflow-specific views like “account full”, “transactions by account”, or transfer history
- docs pages with service-specific Try-It presets and richer guided examples

Use the separate RPC section when you want direct NEAR node methods and protocol-native request/response shapes.
