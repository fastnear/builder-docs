---
name: fastnear
description: Read NEAR Protocol chain data through FastNear's RPC and REST APIs - account state and access keys, token and NFT holdings, staking, contract view calls and storage, transaction and receipt history, transfers, recent blocks, and node snapshots. Use when a task needs NEAR mainnet or testnet data, must submit a NEAR transaction, or asks which FastNear API to call.
metadata:
  author: fastnear
  version: "1.0"
  homepage: https://docs.fastnear.com
  docs-version-beacon: https://docs.fastnear.com/.well-known/docs-version.json
---

# FastNear

<!-- FASTNEAR-DOCS-VERSION:START (written by scripts/generate-well-known.js; do not edit) -->
_Docs version `7164fca279ff`. This is a content hash of the FastNear agent-facing docs. If it differs from `docs_version` at https://docs.fastnear.com/.well-known/docs-version.json, this copy is stale: refetch it and any reference you rely on._
<!-- FASTNEAR-DOCS-VERSION:END -->

FastNear runs NEAR Protocol infrastructure: JSON-RPC nodes (regular and archival), indexed REST APIs for account, token, transaction, and transfer data, a block-feed API, and node snapshots. One FastNear API key is used across the RPC and REST hosts.

Working rule: translate the request into one task, pick one API, fetch the smallest result that answers it, and widen to a second API only when you can name the missing piece. Canonical is not the same as helpful; an indexed summary is usually what a human wants first.

## Before the first request

Resolve these, assuming the common case when the choice does not change the starting API:

- **Network**: mainnet or testnet. Each API has a separate host per network (table below).
- **Identifier**: account ID, public key, transaction hash, receipt ID, block height or hash, or contract ID plus storage key.
- **Answer shape**: summary, history, canonical protocol fields, or operator steps.
- **Freshness**: historical, current, optimistic, or finalized.

Ask a clarifying question only when the wrong choice would materially change the result. If you assumed the network or the API, say so in the answer.

## Authenticate

Read the key from `FASTNEAR_API_KEY` (or the runtime's secret manager) and send it on every request, as a Bearer header or an `apiKey` query parameter:

```bash
curl https://rpc.mainnet.fastnear.com \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","id":1,"method":"block","params":{"finality":"final"}}'

curl "https://api.fastnear.com/v1/account/example.near/full?apiKey=$FASTNEAR_API_KEY"
```

Prefer the header; URLs travel through logs. The same key and transport apply to the regular and archival RPC hosts.

If no key is configured, tell your human to create one at https://dashboard.fastnear.com and place it in an environment variable or secret manager, then stop. Do not ask them to paste a key into chat, do not read a key out of a browser's `localStorage`, and never put a key in a prompt, a URL you will share, a file you commit, or your reply. If a key has already landed in one of those places, say so and ask for it to be rotated.

A FastNear API key is a rate-limit and billing credential, not a NEAR account key. It cannot sign transactions. Signing keys stay with your human.

A `429` means the key is over its rate limit: wait for `Retry-After` when present, otherwise back off, and do not fan out parallel requests to get around it.

## Choose the API

| Task | Start here | Mainnet host | Testnet host | Widen only if |
| --- | --- | --- | --- | --- |
| Balances, FT and NFT holdings, staking, public key to account, account summary | FastNear API | `api.fastnear.com` | `test.api.fastnear.com` | you need exact node fields |
| Exact account or access-key state, contract view calls, validators, protocol config, transaction submission | RPC | `rpc.mainnet.fastnear.com` | `rpc.testnet.fastnear.com` | you also need a readable summary or history |
| Blocks, chunks, receipts, or transaction status older than roughly 29 hours | Archival RPC | `archival-rpc.mainnet.fastnear.com` | `archival-rpc.testnet.fastnear.com` | the data is recent, then use the regular host |
| Transaction by hash, receipt tracing, account activity, block execution history | Transactions API | `tx.main.fastnear.com` | `tx.test.fastnear.com` | you need RPC-level finality or submission semantics |
| Transfer-only history for an account | Transfers API | `transfers.main.fastnear.com` | none | the question broadens beyond transfers |
| Newest optimistic or final blocks, headers, shards, explicit polling | NEAR Data API | `mainnet.neardata.xyz` | `testnet.neardata.xyz` | you need a canonical block or state read |
| Indexed contract key-value history or latest indexed key state | KV FastData API | `kv.main.fastnear.com` | `kv.test.fastnear.com` | you need exact current on-chain state |
| Bootstrapping an RPC or archival node | Snapshots | docs only | docs only | the task turns into a data question |

Defaults when the wording is short: "check this account" starts with the FastNear API; "check this transaction" or "this receipt" starts with the Transactions API; "check this block" starts with NEAR Data for recency and RPC for canonical fields; "this contract key" starts with KV FastData; "get a node online" is Snapshots. NEAR Data is polled, never streamed; do not describe it as a websocket or webhook.

## First calls

Account summary (FastNear API):

```bash
curl "https://api.fastnear.com/v1/account/example.near/full" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY"
```

Canonical account state (RPC). Contract reads use the same `query` method with `request_type: "call_function"`, `method_name`, and base64 `args_base64`; the `result` is a byte array to decode:

```bash
curl https://rpc.mainnet.fastnear.com \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"view_account","finality":"final","account_id":"example.near"}}'
```

Transaction by hash (Transactions API):

```bash
curl https://tx.main.fastnear.com/v0/transactions \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{"tx_hashes":["<transaction hash>"]}'
```

Account activity uses `POST /v0/account` with `{"account_id":"example.near"}` on the same host. Latest finalized block (NEAR Data API):

```bash
curl "https://mainnet.neardata.xyz/v0/last_block/final" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY"
```

## Rules

- Stop after the first sufficient answer. Name the API you used when the choice was an inference.
- Say "indexed" when the answer came from an indexed API. Indexed data can lag the chain; only RPC reads with `finality: "final"` are canonical.
- Pagination tokens are opaque. Reuse them verbatim, and only with the endpoint and filter set that produced them.
- Transaction submission is a write. Do it only when the task calls for it, with a transaction your human authorized. After a timeout or ambiguous error, check the status by hash (`tx_status` on RPC, or `/v0/transactions` on the Transactions API) before constructing a new transaction; a new nonce can double-spend.
- Do not pull from several APIs before the first result shows what is missing. It produces a noisier answer, not a better one.

## Load a reference only when needed

Every docs page has a Markdown mirror at the same path plus `.md`.

| Need | Fetch |
| --- | --- |
| Routing depth: decision ladder, identifier-driven defaults, stop conditions | https://docs.fastnear.com/agents/choosing-surfaces.md |
| Step-by-step playbooks: account summary, transaction investigation, transfers, block monitoring, storage, node bootstrap | https://docs.fastnear.com/agents/playbooks.md |
| Credential posture for workers, proxies, and multi-tenant services | https://docs.fastnear.com/agents/auth.md |
| RPC method reference and per-method pages | https://docs.fastnear.com/rpc.md and https://docs.fastnear.com/rpcs/llms.txt |
| REST reference for every API family | https://docs.fastnear.com/apis/llms.txt |
| OpenAPI documents, one per family and per operation | https://docs.fastnear.com/openapi/index.json |
| Node snapshots for mainnet and testnet | https://docs.fastnear.com/snapshots.md |
| Everything in one file | https://docs.fastnear.com/llms-full.txt |

## Stay current

In a new session, compare the docs version stamped at the top of this file with `docs_version` at https://docs.fastnear.com/.well-known/docs-version.json. A different value means the docs changed: refetch this file from https://docs.fastnear.com/SKILL.md and any reference you rely on. The beacon lists a hash per file, so you can tell which one moved.

Service status: https://status.fastnear.com. Docs issues: https://github.com/fastnear/builder-docs/issues.
