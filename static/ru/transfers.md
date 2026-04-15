**Источник:** [https://docs.fastnear.com/ru/transfers](https://docs.fastnear.com/ru/transfers)

# Transfers API

Transfers API focuses on аккаунта-centric transfer история. It is the simplest starting point when the question is specifically about movement of NEAR or fungible tokens.

## Best fit

- Transfer feeds.
- Wallet история views.
- Compliance or support tooling focused on sends and receives.

## When not to use it

- Use [Транзакции API](https://docs.fastnear.com/ru/tx) when you need broader транзакции or квитанция история.
- Use [FastNear API](https://docs.fastnear.com/ru/api) when you need balances or holdings rather than transfer events.

## Base URL

- `https://transfers.main.fastnear.com`

## Авторизация and availability

- These pages do not use API ключи or bearer tokens.
- Responses include an opaque `resume_token` for pagination.

## Troubleshooting

### Мне нужны полные метаданные транзакции

Переходите к [Transactions API](https://docs.fastnear.com/ru/tx), если одной истории переводов вам недостаточно.

### Я ожидал переключение на testnet

Сейчас эта поверхность ориентирована на mainnet, поэтому `?network=` не переключает здесь бэкенд.
