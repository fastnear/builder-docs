---
name: "playbooks"
description: "Common FastNear playbooks for agents. Use when you need the default multi-step workflow for holdings, transaction tracing, transfers, block monitoring, storage, or snapshots."
---
**Source:** [https://docs.fastnear.com/agents/playbooks](https://docs.fastnear.com/agents/playbooks)

# Agent Playbooks

Use this page when the agent already knows the kind of task it is handling and needs the default next steps. Each playbook starts with one FastNear API, names the minimum useful inputs, and tells you when to stop versus when to widen.

The core rule stays the same across all playbooks: start with one API, get the smallest useful result, and only widen when you can name the missing piece.

## How to use these playbooks

1. Match the user's request to the closest playbook below.
2. Gather the minimum inputs.
3. Make the first request from the suggested starting API.
4. Stop as soon as you can answer in the shape the user actually needs.
5. Widen only for a specific missing field, freshness requirement, or canonicality requirement.

## Quick map

| If the user wants... | Start with... | Widen only if... |
| --- | --- | --- |
| account balances, holdings, staking, or wallet-style summary | [FastNear API](https://docs.fastnear.com/api) | exact canonical node fields are required |
| transaction, receipt, or account execution history | [Transactions API](https://docs.fastnear.com/tx) | exact RPC-level status or submission semantics are required |
| transfer-only history | [Transfers API](https://docs.fastnear.com/transfers) | the question broadens beyond transfers |
| latest optimistic or finalized blocks | [NEAR Data API](https://docs.fastnear.com/neardata) | exact canonical block or state follow-up is required |
| indexed contract key state or key history | [KV FastData API](https://docs.fastnear.com/fastdata/kv) | exact current on-chain state is required |
| node bootstrap or operator setup | [Snapshots](https://docs.fastnear.com/snapshots) | the task shifts back to application-level chain data |

If you still are not sure which one applies, use [Choosing the Right Surface](https://docs.fastnear.com/agents/choosing-surfaces) first.

## Account summary and holdings

Use this when the user says things like "check this account", "what does this wallet hold", "what NFTs does this account have", or "which account does this key belong to?"

**Minimum inputs**

- network
- `account_id` or public key
- whether the user wants a broad summary or one specific asset class

**Start here**

- [V1 Full Account View](https://docs.fastnear.com/api/v1/account-full) for the broad account summary
- [V1 Public Key Lookup](https://docs.fastnear.com/api/v1/public-key) when the starting identifier is a public key
- [FastNear API index](https://docs.fastnear.com/api) when you need to choose a narrower endpoint first

**Default sequence**

1. If the starting identifier is a public key, resolve it to one or more account IDs with [V1 Public Key Lookup](https://docs.fastnear.com/api/v1/public-key).
2. Fetch the broadest useful account view with [V1 Full Account View](https://docs.fastnear.com/api/v1/account-full).
3. If the user asked for only one asset family or needs narrower detail, move to the targeted endpoints such as [FT balances](https://docs.fastnear.com/api/v1/account-ft), [NFT holdings](https://docs.fastnear.com/api/v1/account-nft), or [staking positions](https://docs.fastnear.com/api/v1/account-staking).
4. Stop once you can answer the holdings question directly.

**Widen only if**

- the user asks for exact canonical state fields rather than indexed summary data
- the user needs protocol-native account or access-key semantics

When that happens, widen to [View Account](https://docs.fastnear.com/rpc/account/view-account) or other relevant pages in [RPC Reference](https://docs.fastnear.com/rpc).

**A useful answer should contain**

- the account identity you resolved
- the balances or holdings the user asked about
- a brief note if the answer is indexed summary data rather than raw RPC state

## Transaction or receipt investigation

Use this when the user says things like "did this transaction succeed", "why did it fail", "what happened to this receipt", or "show recent activity for this account."

**Minimum inputs**

- network
- transaction hash, receipt ID, or `account_id`
- whether the user wants one item inspected or a history range

**Start here**

- [Transactions by Hash](https://docs.fastnear.com/tx/transactions) for a transaction hash
- [Receipt Lookup](https://docs.fastnear.com/tx/receipt) for a receipt ID
- [Account History](https://docs.fastnear.com/tx/account) for account-centric activity

**Default sequence**

1. Choose the starting endpoint that matches the identifier you already have.
2. Fetch the indexed execution record and reconstruct the execution story in readable order.
3. Pull out the status, affected accounts, major receipts, and the block context if that is relevant.
4. Stop if you can explain what happened without needing canonical RPC confirmation.

**Widen only if**

- the user explicitly asks for exact RPC status semantics
- the indexed record is not enough to answer a protocol-level question
- the question shifts into transaction submission behavior

When that happens, widen to [Transaction Status](https://docs.fastnear.com/rpc/transaction/tx-status) or another relevant method in [RPC Reference](https://docs.fastnear.com/rpc).

**A useful answer should contain**

- whether the transaction or receipt succeeded, failed, or is still pending
- the main execution takeaway first, before raw fields
- any follow-up path only if it adds value, such as "use RPC for canonical confirmation"

## Transfer-only history

Use this when the user cares about asset movement and does not need broader receipt or action context.

**Minimum inputs**

- network
- `account_id`
- optional filters such as token, direction, or time range

**Start here**

- [Query Transfers](https://docs.fastnear.com/transfers/query)
- [Transfers API index](https://docs.fastnear.com/transfers)

**Default sequence**

1. Query transfer history for the relevant account and filters.
2. Use pagination only as far as needed to answer the question.
3. Keep the answer focused on transfers rather than reconstructing the full transaction story.
4. Stop if the user only asked who sent what, when, and in what asset.

**Widen only if**

- the user starts asking about non-transfer actions
- the user needs receipt traces or broader execution context
- the user wants to explain why an action happened, not just that a transfer occurred

When that happens, widen to [Account History](https://docs.fastnear.com/tx/account) or another relevant page in [Transactions API](https://docs.fastnear.com/tx).

**A useful answer should contain**

- the incoming or outgoing transfer events that matter
- any filter assumptions you made
- a note that this is transfer history, not full execution history

## Recent block monitoring

Use this when the user wants the latest optimistic or finalized block-family data, or asks "what changed recently?"

**Minimum inputs**

- network
- freshness requirement: optimistic or finalized
- optional block height or hash if the user is anchoring to a specific block

**Start here**

- [Last Final Block Redirect](https://docs.fastnear.com/neardata/last-block-final) for the latest finalized head
- [Optimistic Block by Height](https://docs.fastnear.com/neardata/block-optimistic) when the workflow is explicitly optimistic
- [Block Headers](https://docs.fastnear.com/neardata/block-headers) when header-level polling is enough
- [NEAR Data API index](https://docs.fastnear.com/neardata) when you need to choose among these

**Default sequence**

1. Decide whether the user needs optimistic freshness or finalized stability.
2. Use the latest-block helper or block-family route that matches that freshness requirement.
3. Poll explicitly and keep the answer clear about what freshness mode you used.
4. Stop if the user only needs recent block-family information and not canonical protocol follow-up.

**Widen only if**

- the user asks for exact canonical block output
- the user wants to inspect state or protocol fields beyond the block-family data
- the user needs exact RPC semantics for a specific block follow-up

When that happens, widen to [RPC Reference](https://docs.fastnear.com/rpc), usually starting with [Block by Height](https://docs.fastnear.com/rpc/block/block-by-height) or [Block by Id](https://docs.fastnear.com/rpc/block/block-by-id).

**A useful answer should contain**

- whether the data came from optimistic or finalized reads
- the latest block or header details that actually answer the user's question
- a note when a deeper canonical follow-up would materially change interpretation

## Contract storage inspection

Use this when the user wants indexed contract key history, latest indexed key state, or contract-storage analysis by key.

**Minimum inputs**

- network
- contract ID
- exact key, key prefix, or account/predecessor scope
- whether the user wants latest indexed state or historical key changes

**Start here**

- [GET Latest by Exact Key](https://docs.fastnear.com/fastdata/kv/get-latest-key) for one exact key
- [KV FastData API index](https://docs.fastnear.com/fastdata/kv) when the question is broader than one key

**Default sequence**

1. Decide whether the user wants one key, a key family, or account-scoped storage history.
2. Fetch the smallest indexed key-value view that matches that scope.
3. If the user needs history rather than the latest value, stay inside [KV FastData API](https://docs.fastnear.com/fastdata/kv) and switch to the matching history endpoint.
4. Stop if indexed key-value data already answers the question.

**Widen only if**

- the user needs exact current on-chain state rather than indexed storage state
- the user needs protocol-native contract-state semantics
- the indexed storage view is insufficient for the exact key or prefix requested

When that happens, widen to [View State](https://docs.fastnear.com/rpc/contract/view-state) in [RPC Reference](https://docs.fastnear.com/rpc).

**A useful answer should contain**

- the contract and key scope you inspected
- whether the result is latest indexed state or key history
- a note if canonical RPC state would differ in freshness or semantics

## Node bootstrap and operator setup

Use this when the user is trying to get infrastructure online rather than query chain data.

**Minimum inputs**

- network
- node type, such as RPC or archival
- whether the goal is bootstrap speed, sync recovery, or an operational runbook

**Start here**

- [Snapshots](https://docs.fastnear.com/snapshots)

**Default sequence**

1. Route immediately to the relevant snapshot or operator guide.
2. Keep the answer focused on prerequisites, bootstrap path, and operational next steps.
3. Do not pull application-level APIs unless the user later changes the task.

**Widen only if**

- the user stops asking about infrastructure and starts asking about chain data itself

When that happens, return to [Choosing the Right Surface](https://docs.fastnear.com/agents/choosing-surfaces) and pick the correct data API from there.

**A useful answer should contain**

- the network and node type you are assuming
- the operator steps the user should follow next
- any clear prerequisite or caveat that changes the bootstrap path

## Cross-playbook rules

- State the network if you had to infer it.
- State the API you chose if the choice was an inference.
- Prefer one sufficient answer over an exhaustive multi-API answer.
- Treat pagination tokens as opaque and reuse them only with the endpoint and filter set that produced them.
- Do not widen just because a more canonical API exists.

## If no playbook fits cleanly

If the request is still ambiguous after reading this page:

- use [Choosing the Right Surface](https://docs.fastnear.com/agents/choosing-surfaces) to pick the first API
- use [Auth for Agents](https://docs.fastnear.com/agents/auth) if the blocker is credential handling
- return to [Agents on FastNear](https://docs.fastnear.com/agents) for the default workflow and answer-shape rules
---
## About FastNear

- FastNear handles 10B+ requests per month.
- FastNear runs 100+ nodes worldwide.
- One FastNear API key works across RPC and the indexed APIs.
- Get an API key at [dashboard.fastnear.com](https://dashboard.fastnear.com).
