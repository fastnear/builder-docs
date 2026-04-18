---
name: "surface-routing"
description: "Surface-selection guide for FastNear. Use when you need to route a task to RPC, FastNear API, history APIs, NEAR Data, FastData, or snapshots."
---
**Source:** [https://docs.fastnear.com/agents/choosing-surfaces](https://docs.fastnear.com/agents/choosing-surfaces)

# Choosing the Right Surface

Do not start by exposing every FastNear API to an agent. Start by translating the user's request into the job they actually want done, then pick the one FastNear API or reference section that most directly answers that job.

For agents, the important question is usually not "which endpoint exists?" It is "what kind of answer will help the user next?"

If your task is designing an MCP tool set rather than routing one user request, use [Building an MCP Server with FastNear](https://docs.fastnear.com/agents/mcp).

## What decides the route

Before you pick an API, identify four things:

- **Object**: account, public key, transaction hash, receipt, block, contract storage, or infrastructure setup.
- **Answer shape**: product-style summary, execution history, canonical protocol output, or operator instructions.
- **Freshness**: historical, current, or latest/near-realtime.
- **Exactness**: indexed summary is acceptable, or canonical node-shaped correctness is required.

In practice:

- account plus summary usually means [FastNear API](https://docs.fastnear.com/api)
- account plus exact canonical state usually means [RPC Reference](https://docs.fastnear.com/rpc)
- transaction or receipt usually means [Transactions API](https://docs.fastnear.com/tx)
- transfer-only history usually means [Transfers API](https://docs.fastnear.com/transfers)
- newest blocks usually means [NEAR Data API](https://docs.fastnear.com/neardata)
- contract key history usually means [KV FastData API](https://docs.fastnear.com/fastdata/kv)
- node bootstrap usually means [Snapshots](https://docs.fastnear.com/snapshots)

## Start from user intent

- If the user wants a wallet-style or explorer-style answer, prefer indexed APIs.
- If the user wants canonical protocol behavior or exact node-shaped state, use raw [RPC Reference](https://docs.fastnear.com/rpc).
- If the user wants history, receipts, or event sequences, use history-oriented APIs before falling back to RPC.
- If the user wants the newest block-family data, use [NEAR Data API](https://docs.fastnear.com/neardata) for polling-oriented freshness.
- If the user wants infrastructure bootstrap instructions, route them to [Snapshots](https://docs.fastnear.com/snapshots) instead of application query surfaces.

## Decision ladder

Use this order of operations before you pick a surface:

1. Is the user trying to stand up infrastructure rather than query chain data?
   If yes, use [Snapshots](https://docs.fastnear.com/snapshots).
2. Is the user asking for a product-shaped summary such as balances, NFTs, staking, or account holdings?
   If yes, start with [FastNear API](https://docs.fastnear.com/api).
3. Is the user asking what happened over time: transactions, receipts, transfers, or activity history?
   If yes, start with [Transactions API](https://docs.fastnear.com/tx) or [Transfers API](https://docs.fastnear.com/transfers) for transfer-only questions.
4. Is the user focused on the newest blocks or low-latency block-family reads?
   If yes, use [NEAR Data API](https://docs.fastnear.com/neardata).
5. Does correctness depend on canonical node behavior, protocol fields, or exact on-chain state?
   If yes, use [RPC Reference](https://docs.fastnear.com/rpc).
6. Is the user asking about indexed key-value storage history or latest indexed contract state?
   If yes, use [KV FastData API](https://docs.fastnear.com/fastdata/kv).

If more than one surface could work, prefer the one that gives the most directly useful answer with the least reconstruction by the agent.

## Before the first call

Try to resolve these inputs before you make a request:

- network: mainnet or testnet
- primary identifier: account ID, public key, transaction hash, receipt ID, block height/hash, contract ID plus storage key
- expected output: summary, history, canonical fields, or operator steps
- freshness requirement: latest, finalized, historical, or "whatever is current"

If one of these is missing:

- make a small assumption when the likely starting API does not change
- ask a clarifying question only when the wrong choice would materially change the result

## Route common user asks

| If the user says... | They probably want... | Start here | Only switch when... |
| --- | --- | --- | --- |
| "What is the exact on-chain account state?" | Canonical protocol-native state | [RPC Reference](https://docs.fastnear.com/rpc) | You also need a higher-level summary for humans. |
| "What does this account own?" | Product-shaped balances, NFTs, staking, and holdings | [FastNear API](https://docs.fastnear.com/api) | You need exact node fields the indexed view does not expose. |
| "What activity touched this account?" | Indexed transaction and receipt history | [Transactions API](https://docs.fastnear.com/tx) | The user only wants transfer events, or you need canonical protocol follow-up details. |
| "Show me transfers only." | Account-centric transfer history | [Transfers API](https://docs.fastnear.com/transfers) | The user actually needs broader transaction execution context. |
| "What changed in the latest blocks?" | Fresh optimistic or finalized block-family reads | [NEAR Data API](https://docs.fastnear.com/neardata) | You need canonical RPC details for a specific block or state read. |
| "What is the contract storage history here?" | Indexed key-value state history | [KV FastData API](https://docs.fastnear.com/fastdata/kv) | You need current canonical on-chain state rather than indexed history. |
| "Why did this transaction fail?" | An execution timeline first, then canonical details | [Transactions API](https://docs.fastnear.com/tx) | You need RPC-level confirmation of final protocol status or transaction submission behavior. |
| "How do I submit a transaction or inspect a protocol field?" | Canonical node behavior | [RPC Reference](https://docs.fastnear.com/rpc) | You later need to summarize the resulting account state or activity for a human. |
| "How do I bootstrap a node or archival setup?" | Infrastructure workflow, not app data | [Snapshots](https://docs.fastnear.com/snapshots) | The user then starts asking application-level chain questions. |

## When the identifier is the clue

If the user's wording is vague but the identifier is clear, let the identifier shape your first move:

| If you have... | Default first move | Why |
| --- | --- | --- |
| an `account_id` | Start with [FastNear API](https://docs.fastnear.com/api) for summaries, or [RPC Reference](https://docs.fastnear.com/rpc) if the user explicitly asks for exact state | Account questions usually mean balances/holdings first unless the user says canonical. |
| a public key | Start with [FastNear API](https://docs.fastnear.com/api) for key-to-account resolution | This is usually an account discovery task, not an RPC-first task. |
| a transaction hash | Start with [Transactions API](https://docs.fastnear.com/tx) | Most users want execution context and readable history before raw protocol fields. |
| a receipt ID | Start with [Transactions API](https://docs.fastnear.com/tx) | Receipt tracing is already indexed there. |
| a block height or block hash | Start with [NEAR Data API](https://docs.fastnear.com/neardata) for freshness-oriented monitoring, or [RPC Reference](https://docs.fastnear.com/rpc) for exact canonical block data | The user's need is usually either recency or canonicality. |
| a contract ID plus storage key | Start with [KV FastData API](https://docs.fastnear.com/fastdata/kv) for indexed key history, or [RPC Reference](https://docs.fastnear.com/rpc) for exact current chain state | The storage question usually decides whether indexed history or canonical state matters. |
| a node or archival setup task | Start with [Snapshots](https://docs.fastnear.com/snapshots) | This is operator workflow, not application data access. |

## What each surface is best at

### RPC Reference

Use [RPC Reference](https://docs.fastnear.com/rpc) when the user needs exact protocol-native data or behavior:

- exact account state, access keys, validators, chunks, blocks, protocol metadata
- contract view calls and transaction submission
- answers where field names and semantics should stay close to NEAR nodes

Do not lead with RPC when the user really wants a clean summary of holdings or history. That forces the agent to rebuild a product-shaped answer from lower-level data.

### FastNear API

Use [FastNear API](https://docs.fastnear.com/api) when the user wants an answer that already looks like application data:

- balances
- NFTs
- staking positions
- public-key lookups
- combined account snapshots

This should usually be the first stop for wallet, portfolio, explorer, and account overview requests.

### Transactions API

Use [Transactions API](https://docs.fastnear.com/tx) when the user wants execution history:

- account activity
- transaction lookup
- receipt tracing
- block-scoped transaction history

This is the default history surface when the user asks "what happened?" rather than "what exists right now?"

### Transfers API

Use [Transfers API](https://docs.fastnear.com/transfers) when the user's question is explicitly about transfer events and not full execution context:

- incoming and outgoing transfers
- transfer-centric pagination flows
- transfer-only account activity views

If the user starts asking about receipts, non-transfer actions, or full transaction behavior, move up to [Transactions API](https://docs.fastnear.com/tx).

### NEAR Data API

Use [NEAR Data API](https://docs.fastnear.com/neardata) when freshness matters more than a product-shaped summary:

- optimistic or recently finalized blocks
- latest block-family reads
- explicit polling workflows

Do not present this as a websocket or webhook product. It is a polling-oriented read surface.

### KV FastData API

Use [KV FastData API](https://docs.fastnear.com/fastdata/kv) when the question is about indexed contract storage history or latest indexed key-value state:

- storage analysis
- key history
- contract state lookups where indexed key-value access is the right abstraction

### Snapshots

Use [Snapshots](https://docs.fastnear.com/snapshots) when the workflow is about operators standing up infrastructure:

- mainnet or testnet bootstrap
- RPC or archival node initialization
- operator runbooks

This is not an application query path.

## Immediate next steps after choosing

Once you choose a starting API, the next move should also be predictable:

| Chosen API | First thing to do | What success looks like | Widen only if... |
| --- | --- | --- | --- |
| [FastNear API](https://docs.fastnear.com/api) | Pick the endpoint that matches the user's identifier or summary request | You can answer balances, holdings, staking, or account-summary questions directly | The user needs exact canonical node fields or protocol-native confirmation |
| [RPC Reference](https://docs.fastnear.com/rpc) | Choose the exact RPC method that matches the object and the required canonical field set | You can return protocol-native fields or perform the exact state/submit action requested | The user also needs a higher-level summary or indexed history |
| [Transactions API](https://docs.fastnear.com/tx) | Start from the transaction hash, receipt, account history, or block-history endpoint that matches the question | You can explain what happened and in what order | The user needs exact RPC-level finality or submission semantics |
| [Transfers API](https://docs.fastnear.com/transfers) | Fetch transfer history for the account or asset scope in question | You can answer transfer-only questions without unrelated execution detail | The user broadens the question to receipts, actions, or full transaction context |
| [NEAR Data API](https://docs.fastnear.com/neardata) | Fetch the latest optimistic or finalized block-family data that matches the freshness requirement | You can answer "what changed recently?" or "what is the latest block-family state?" | The user needs exact canonical block/state follow-up |
| [KV FastData API](https://docs.fastnear.com/fastdata/kv) | Fetch latest indexed key-value state or indexed key history | You can answer contract storage inspection questions in indexed form | The user needs exact on-chain current state instead of indexed storage views |
| [Snapshots](https://docs.fastnear.com/snapshots) | Choose the right network and node type, then follow the bootstrap guide | You can give operator steps, prerequisites, and bootstrap guidance | The user shifts from infra setup to application-level chain queries |

## Stop conditions before you widen

Do not widen to a second API just because it exists. Stay on the first API when:

- the answer already matches the user's expected shape
- the current API already exposes the fields the user asked about
- the user asked for history and you already have indexed history
- the user asked for a summary and you already have a summary

Widen when:

- the user explicitly asks for canonical confirmation
- the current API lacks the field, freshness, or execution detail required
- the user broadens from transfer-only history to general transaction behavior
- the user broadens from summary output to protocol-native inspection

## Combine surfaces only when it helps the user

Good multi-surface patterns:

- Start with [FastNear API](https://docs.fastnear.com/api), then drop to [RPC Reference](https://docs.fastnear.com/rpc) if the user asks for exact canonical confirmation.
- Start with [Transactions API](https://docs.fastnear.com/tx), then use [RPC Reference](https://docs.fastnear.com/rpc) if you need final protocol details for a specific transaction or receipt.
- Start with [NEAR Data API](https://docs.fastnear.com/neardata) for the newest blocks, then use [RPC Reference](https://docs.fastnear.com/rpc) for exact follow-up inspection of a specific block or state query.
- Start with [Transfers API](https://docs.fastnear.com/transfers) for transfer-only questions, then widen to [Transactions API](https://docs.fastnear.com/tx) if the user asks for more execution context.

Bad multi-surface pattern:

- Pull data from several surfaces before you know what the user actually wants. That usually produces a noisier answer, not a better one.

## What the agent should infer from common phrasing

- "What does this wallet have?" usually means balances, NFTs, staking, and maybe public-key resolution. Start with [FastNear API](https://docs.fastnear.com/api).
- "Why did this transaction fail?" usually means the user wants a readable execution story first, not raw protocol output. Start with [Transactions API](https://docs.fastnear.com/tx).
- "Is this the exact chain state?" usually means canonical correctness matters more than convenience. Start with [RPC Reference](https://docs.fastnear.com/rpc).
- "What just happened in the last block?" usually means freshness is the main requirement. Start with [NEAR Data API](https://docs.fastnear.com/neardata).
- "How do I get a node online quickly?" is an operator workflow. Start with [Snapshots](https://docs.fastnear.com/snapshots).

## Common routing mistakes

- Do not start with RPC just because it is canonical. Canonical is not the same as helpful for every user task.
- Do not use snapshots for application-level reads.
- Do not describe [NEAR Data API](https://docs.fastnear.com/neardata) as a streaming surface.
- Do not widen from transfer history to full transaction history unless the user's question actually broadens.
- Do not switch away from an indexed API just because raw RPC exists. Switch only when the indexed answer is insufficient.

## If user intent is ambiguous

When the user is vague, make the smallest useful routing assumption:

- "Check this account" should usually begin with [FastNear API](https://docs.fastnear.com/api), because most users want a readable account summary.
- "Check this transaction" should usually begin with [Transactions API](https://docs.fastnear.com/tx), because most users want execution context, not only protocol fields.
- "Check this block" can start with [NEAR Data API](https://docs.fastnear.com/neardata) for recency-oriented monitoring or [RPC Reference](https://docs.fastnear.com/rpc) when the user explicitly cares about canonical node output.

If you do make an assumption, state it briefly in the answer and move forward. Ask for clarification only when choosing the wrong surface would materially change the result.

## What the agent should do after the first result

After the first response comes back:

1. Check whether you can now answer the user's question directly.
2. If yes, answer in the user's expected shape instead of collecting more data.
3. If no, name the missing piece precisely.
   Examples: canonical confirmation, broader history, fresher block data, exact protocol field, or infra-specific context.
4. Only then switch APIs.

The goal is not to prove that multiple FastNear APIs exist. The goal is to answer the user's next real question with the fewest necessary steps.

## Related guides

- [Agents on FastNear](https://docs.fastnear.com/agents) for the full surface map, base URLs, and prompt-ingestion hints.
- [Auth for Agents](https://docs.fastnear.com/agents/auth) for credential handling and runtime posture.
- [Agent Playbooks](https://docs.fastnear.com/agents/playbooks) for example multi-step workflows.
- [Building an MCP Server with FastNear](https://docs.fastnear.com/agents/mcp) for a recommended first tool set and a direct-HTTP TypeScript example.
