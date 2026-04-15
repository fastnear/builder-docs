---
title: "Transfers API"
description: "Аккаунт-centric NEAR and fungible-token transfer история for product feeds and investigative tooling."
sidebar_position: 1
displayed_sidebar: transfersApiSidebar
slug: /transfers
page_actions:
  - markdown
---

# Transfers API

Transfers API focuses on аккаунта-centric transfer история. It is the simplest starting point when the question is specifically about movement of NEAR or fungible tokens.

## Best fit

- Transfer feeds.
- Wallet история views.
- Compliance or support tooling focused on sends and receives.

## When not to use it

- Use [Транзакции API](/tx) when you need broader транзакции or квитанция история.
- Use [FastNear API](/api) when you need balances or holdings rather than transfer events.

## Base URL

- `https://transfers.main.fastnear.com`

## Авторизация and availability

- These pages do not use API ключи or bearer tokens.
- Responses include an opaque `resume_token` for pagination.

## Troubleshooting

### Мне нужны полные метаданные транзакции

Переходите к [Transactions API](/tx), если одной истории переводов вам недостаточно.

### Я ожидал переключение на testnet

Сейчас эта поверхность ориентирована на mainnet, поэтому `?network=` не переключает здесь бэкенд.
