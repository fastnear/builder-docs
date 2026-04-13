---
title: FastNear API
description: Indexed account, token, and public-key lookup APIs for wallets and explorers.
sidebar_position: 1
displayed_sidebar: fastnearApiSidebar
---

# FastNear API

Base URLs:
- `https://api.fastnear.com`
- `https://test.api.fastnear.com`

Authentication:
- FastNear public REST endpoints do not require an API key.
- The native docs UI can still use an optional `?apiKey=` override when you want to exercise authenticated behavior.

Interaction notes:
- Account and token pages open with seeded example values so the interaction is runnable immediately.
- Add `?network=testnet` to switch the page to the testnet server and testnet-friendly defaults.

Versioning:
- `v0` covers the original public-key and account asset endpoints.
- `v1` adds richer indexed account/token responses, top-holder queries, and combined account views.
- `v1` public-key lookup currently keeps the same `{ public_key, account_ids }` response shape as `v0`.

Operations:
- [Status](/docs/rpc-api/fastnear-api/status)
- [Health](/docs/rpc-api/fastnear-api/health)
- [V0 public key lookup](/docs/rpc-api/fastnear-api/v0-public-key)
- [V0 public key lookup, all accounts](/docs/rpc-api/fastnear-api/v0-public-key-all)
- [V0 account staking](/docs/rpc-api/fastnear-api/v0-account-staking)
- [V0 account fungible tokens](/docs/rpc-api/fastnear-api/v0-account-ft)
- [V0 account NFTs](/docs/rpc-api/fastnear-api/v0-account-nft)
- [V1 public key lookup](/docs/rpc-api/fastnear-api/v1-public-key)
- [V1 public key lookup, all accounts](/docs/rpc-api/fastnear-api/v1-public-key-all)
- [V1 account staking](/docs/rpc-api/fastnear-api/v1-account-staking)
- [V1 account fungible tokens](/docs/rpc-api/fastnear-api/v1-account-ft)
- [V1 account NFTs](/docs/rpc-api/fastnear-api/v1-account-nft)
- [V1 FT top holders](/docs/rpc-api/fastnear-api/v1-ft-top)
- [V1 full account view](/docs/rpc-api/fastnear-api/v1-account-full)
