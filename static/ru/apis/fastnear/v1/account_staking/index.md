# FastNEAR API — V1 стейкинг аккаунта
Поиск индексированных стейкинг-пулов аккаунта
Получите строки по стейкинг-пулам для аккаунта, каждая с метаданными по высоте блока.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/fastnear/v1/account_staking
- https://docs.fastnear.com/ru/apis/fastnear/openapi/staking/account_staking_v1
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v1/account/{account_id}/staking`
## OpenAPI
- Эта операция: https://docs.fastnear.com/openapi/fastnear/account_staking_v1.json (https://docs.fastnear.com/openapi/fastnear/account_staking_v1.yaml)
- Полный документ API: https://docs.fastnear.com/openapi/fastnear.json
- Указатель в полном документе: https://docs.fastnear.com/openapi/fastnear.json#/paths/~1v1~1account~1%7Baccount_id%7D~1staking/get
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- Bearer-токен через заголовок `Authorization: Bearer <token>`
- API-ключ через query `apiKey`: API-ключ FastNEAR в параметре запроса `apiKey`. Удобно для curl и клиентов, которые не могут задавать заголовки, но ключ может попасть в URL, логи и историю команд оболочки.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/v1/account/root.near/staking
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

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Индексированные записи стейкинг-пулов для указанного аккаунта
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
          "type": "object",
          "required": [
            "pool_id",
            "last_update_block_height"
          ],
          "additionalProperties": false,
          "properties": [
            {
              "name": "last_update_block_height",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "pool_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "refName": "PoolRow"
        }
      }
    }
  ],
  "refName": "V1StakingResponse"
}
```
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
