---
title: Transfers API
description: Account-centric NEAR and fungible token transfer history.
sidebar_position: 1
displayed_sidebar: transfersApiSidebar
---

# Transfers API

Base URL: `https://transfers.main.fastnear.com`

Authentication: these pages do not use API keys or bearer tokens.

Pagination: responses include an opaque `resume_token` that can be passed back into the next request.

Interaction notes:
- the page opens with a seeded example body so the request is runnable immediately
- because this service is currently mainnet-only, `?network=` does not change the backend here

The sidebar for this section is intentionally scoped to Transfers so the endpoint stays easy to reach without the noise of unrelated APIs.

Operations:
- [Query transfers](/docs/rpc-api/transfers-api/transfers)
