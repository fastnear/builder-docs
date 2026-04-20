# FastNear API - V0 стейкинг аккаунта
Получить ID стейкинг-пулов аккаунта
Получите ID стейкинг-пулов для одного аккаунта — только ID пулов, без метаданных по высоте блока.
## Ссылки на источник
- https://docs.fastnear.com/ru/api/v0/account-staking
- https://docs.fastnear.com/ru/apis/fastnear/v0/account_staking
- https://docs.fastnear.com/ru/apis/fastnear/openapi/staking/account_staking_v0
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/account/{account_id}/staking`
- Исходная спецификация: `apis/fastnear/v0/account_staking.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ, который передают встроенные клиенты портала. Публичный FastNear API его не требует.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/v0/account/root.near/staking
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "account_id": "root.near"
  },
  "query": {}
}
```
### Входные данные
- `account_id` (путь, обязательный, string): ID аккаунта NEAR для проверки.
### Параметры пути

- `account_id` (путь, обязательный, string): ID аккаунта NEAR для проверки.

### Параметры запроса

- `apiKey` (query, string): Необязательный API-ключ, который передают встроенные клиенты портала. Публичный FastNear API его не требует.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: ID стейкинг-пулов для запрошенного аккаунта
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "account_id",
    "pools"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "account_id",
      "required": true,
      "schema": {
        "type": "string"
      }
    },
    {
      "name": "pools",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    }
  ],
  "refName": "V0StakingResponse"
}
```
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
