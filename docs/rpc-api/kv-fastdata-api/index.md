---
title: KV FastData API
description: Read-only key-value lookups over FastData stored in ScyllaDB.
sidebar_position: 1
displayed_sidebar: kvFastDataSidebar
---

# KV FastData API

Base URLs:
- `https://kv.main.fastnear.com`
- `https://kv.test.fastnear.com`

Authentication: these embeds do not forward API keys or bearer tokens.
Authentication: these pages do not use API keys or bearer tokens.

Pagination: list responses omit `page_token` when there are no more results.

Interaction notes:
- add `?network=testnet` to switch the page to the testnet server and testnet defaults where supported
- body-based pages expose their editable request fields directly in the native UI

The sidebar for this section is intentionally scoped to KV FastData so the key-value operation list stays visible while you move between predecessor, account, key, and batch lookup flows.

Operations:
- [All by predecessor](/docs/rpc-api/kv-fastdata-api/all-by-predecessor)
- [History by predecessor](/docs/rpc-api/kv-fastdata-api/history-by-predecessor)
- [Latest by predecessor](/docs/rpc-api/kv-fastdata-api/latest-by-predecessor)
- [History by account](/docs/rpc-api/kv-fastdata-api/history-by-account)
- [Latest by account](/docs/rpc-api/kv-fastdata-api/latest-by-account)
- [History by key](/docs/rpc-api/kv-fastdata-api/history-by-key)
- [Multi lookup](/docs/rpc-api/kv-fastdata-api/multi)
- [GET history by exact key](/docs/rpc-api/kv-fastdata-api/get-history-key)
- [GET latest by exact key](/docs/rpc-api/kv-fastdata-api/get-latest-key)
