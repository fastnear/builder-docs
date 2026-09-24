**Source:** [https://docs.fastnear.com/openapi](https://docs.fastnear.com/openapi)

# OpenAPI Specs

Every FastNear API family is published as an OpenAPI document you can fetch directly, and every operation is also published on its own. Start from the index if you are a tool or an agent:

```bash
curl -s https://docs.fastnear.com/openapi/index.json
```

## Family documents

| Family | OpenAPI | Docs |
| --- | --- | --- |
| FastNEAR RPC (JSON-RPC) | [JSON](https://docs.fastnear.com/openapi/rpc.json) · [YAML](https://docs.fastnear.com/openapi/rpc.yaml) | [RPC Reference](https://docs.fastnear.com/rpc) |
| FastNEAR API | [JSON](https://docs.fastnear.com/openapi/fastnear.json) · [YAML](https://docs.fastnear.com/openapi/fastnear.yaml) | [FastNear API](https://docs.fastnear.com/api) |
| Transactions API | [JSON](https://docs.fastnear.com/openapi/transactions.json) · [YAML](https://docs.fastnear.com/openapi/transactions.yaml) | [Transactions API](https://docs.fastnear.com/tx) |
| Transfers API | [JSON](https://docs.fastnear.com/openapi/transfers.json) · [YAML](https://docs.fastnear.com/openapi/transfers.yaml) | [Transfers API](https://docs.fastnear.com/transfers) |
| KV FastData API | [JSON](https://docs.fastnear.com/openapi/kv-fastdata.json) · [YAML](https://docs.fastnear.com/openapi/kv-fastdata.yaml) | [KV FastData API](https://docs.fastnear.com/fastdata/kv) |
| NEAR Data API | [JSON](https://docs.fastnear.com/openapi/neardata.json) · [YAML](https://docs.fastnear.com/openapi/neardata.yaml) | [NEAR Data API](https://docs.fastnear.com/neardata) |

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
- The Markdown mirrors, [`llms.txt`](https://docs.fastnear.com/llms.txt), and the [site graph](https://docs.fastnear.com/structured-data/site-graph.json) carry the same URLs.

## Authentication

Send your FastNear API key as an `Authorization: Bearer` header or an `?apiKey=` query parameter; see [Auth & Access](https://docs.fastnear.com/auth). The `security` block in each document lists both forms.
---
## About FastNear

- FastNear handles 10B+ requests per month.
- FastNear runs 100+ nodes worldwide.
- One FastNear API key works across RPC and the indexed APIs.
- Get an API key at [dashboard.fastnear.com](https://dashboard.fastnear.com).
