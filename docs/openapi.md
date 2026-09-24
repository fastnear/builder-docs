---
title: OpenAPI Specs
description: Machine-readable OpenAPI documents for every FastNear API family and operation, with a JSON index for agents and tooling.
slug: /openapi
displayed_sidebar: rpcSidebar
page_actions:
  - markdown
keywords:
  - openapi
  - OpenAPI
  - swagger
  - api spec
  - json schema
  - agents
---

# OpenAPI Specs

Every FastNear API family is published as an OpenAPI document you can fetch directly, and every operation is also published on its own. Start from the index if you are a tool or an agent:

```bash
curl -s https://docs.fastnear.com/openapi/index.json
```

## Family documents

| Family | OpenAPI | Docs |
| --- | --- | --- |
| FastNEAR RPC (JSON-RPC) | [JSON](/openapi/rpc.json) · [YAML](/openapi/rpc.yaml) | [RPC Reference](/rpc) |
| FastNEAR API | [JSON](/openapi/fastnear.json) · [YAML](/openapi/fastnear.yaml) | [FastNear API](/api) |
| Transactions API | [JSON](/openapi/transactions.json) · [YAML](/openapi/transactions.yaml) | [Transactions API](/tx) |
| Transfers API | [JSON](/openapi/transfers.json) · [YAML](/openapi/transfers.yaml) | [Transfers API](/transfers) |
| KV FastData API | [JSON](/openapi/kv-fastdata.json) · [YAML](/openapi/kv-fastdata.yaml) | [KV FastData API](/fastdata/kv) |
| NEAR Data API | [JSON](/openapi/neardata.json) · [YAML](/openapi/neardata.yaml) | [NEAR Data API](/neardata) |

Each document carries its own `servers`, `security`, and component schemas, so it can be imported into any OpenAPI tool or client generator as-is. The RPC document models each JSON-RPC method as its own path, for example `/view_account`, all posted to the server root.

## Per-operation documents

Every operation is also available as a self-contained document at `/openapi/<family>/<operationId>.json` (or `.yaml`), for example:

```text
https://docs.fastnear.com/openapi/rpc/view_account.json
https://docs.fastnear.com/openapi/fastnear/account_full_v1.json
```

The index lists every operation with its `operationId`, its own document, its docs page, and a JSON-pointer link into the family document such as `/openapi/rpc.json#/paths/~1view_account/post`.

## Where the links live

- Every operation page shows an **OpenAPI** row with links to its own document and the family document.
- Every family landing page links its document under **Base URLs**.
- Page heads carry `<link rel="service-desc" type="application/vnd.oai.openapi+json">` for the family document and `rel="describedby"` for the operation document, so crawlers and agents can find the spec without reading the page.
- The Markdown mirrors, [`llms.txt`](/llms.txt), and the [site graph](/structured-data/site-graph.json) carry the same URLs.

## Authentication

Send your FastNear API key as an `Authorization: Bearer` header or an `?apiKey=` query parameter; see [Auth & Access](/auth). The `security` block in each document lists both forms.
