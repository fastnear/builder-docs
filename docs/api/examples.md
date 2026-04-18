---
sidebar_label: Examples
slug: /api/examples
title: FastNear API Examples
description: Plain-language workflows for using FastNear API docs for account summaries, key lookups, and asset-specific follow-up.
displayed_sidebar: fastnearApiSidebar
page_actions:
  - markdown
---

# FastNear API Examples

Use this page when the user wants a readable account- or asset-shaped answer and you want the shortest path through the FastNear API docs. Start with the smallest endpoint that can answer the question, then widen only if you need canonical RPC detail or indexed history.

## When to start here

- The user wants balances, holdings, staking, or a broad wallet-style account summary.
- You need to resolve a public key to one or more accounts.
- The answer should look like application data, not raw JSON-RPC envelopes.
- You want a fast first answer before deciding whether canonical RPC detail is necessary.

## Minimum inputs

- network: mainnet or testnet
- primary identifier: `account_id` or public key
- whether the user wants a broad summary or one specific asset family
- whether you may need exact canonical follow-up or recent activity history afterward

## Common jobs

### Get a wallet-style account summary

**Start here**

- [V1 Full Account View](/api/v1/account-full) for the broadest account snapshot.

**Next page if needed**

- [V1 Account FT](/api/v1/account-ft), [V1 Account NFT](/api/v1/account-nft), or [V1 Account Staking](/api/v1/account-staking) for narrower follow-up.
- [Transactions API account history](/tx/account) if the next question becomes "how did this account get here?"

**Stop when**

- The summary already answers the holdings or portfolio question in the shape the user wanted.

**Widen when**

- The user asks for exact canonical account or access-key semantics. Move to [RPC Reference](/rpc).
- The user asks for activity or execution history rather than current holdings. Move to [Transactions API](/tx).

### Resolve a public key to one or more accounts

**Start here**

- [V1 Public Key Lookup](/api/v1/public-key) when you want the primary account match.
- [V1 Public Key Lookup All](/api/v1/public-key-all) when you need the broader set of associated accounts.

**Next page if needed**

- [V1 Full Account View](/api/v1/account-full) after resolution if the user immediately wants balances or holdings for the returned accounts.

**Stop when**

- You have identified the account or accounts that belong to the key.

**Widen when**

- The user starts asking about exact access-key permissions, nonces, or canonical key state. Move to [View Access Key](/rpc/account/view-access-key) or [View Access Key List](/rpc/account/view-access-key-list).
- The user wants recent activity for the resolved accounts rather than just identity resolution. Move to [Transactions API](/tx).

### Follow one asset family instead of the whole account

**Start here**

- [V1 Account FT](/api/v1/account-ft) for fungible-token balances.
- [V1 Account NFT](/api/v1/account-nft) for NFT holdings.
- [V1 Account Staking](/api/v1/account-staking) for staking positions.

**Next page if needed**

- [V1 Full Account View](/api/v1/account-full) if the user later wants the broader account picture.
- [Transactions API account history](/tx/account) if the user asks how those holdings changed over time.

**Stop when**

- The asset-specific endpoint already answers the product question without extra reconstruction.

**Widen when**

- The indexed view is not enough and the user needs exact on-chain semantics. Move to [RPC Reference](/rpc).
- The question becomes historical or execution-oriented instead of "what does this account hold now?" Move to [Transactions API](/tx).

## Common mistakes

- Leading with the broad account snapshot when the user only asked about one asset family.
- Using FastNear API when the user explicitly needs canonical RPC fields or permissions.
- Staying in account-summary pages after the question turns into transaction history.
- Forgetting that `?network=testnet` works only on compatible pages.

## Related guides

- [FastNear API](/api)
- [API Reference](/api/reference)
- [RPC Reference](/rpc)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
