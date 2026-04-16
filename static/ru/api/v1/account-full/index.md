# FastNear API - V1 Полный снимок аккаунта
Получить полный индексированный снимок аккаунта
Получите объединённое индексированное представление аккаунта, включая стейкинг-пулы, FT-балансы, NFT и состояние аккаунта.
## Ссылки на источник
- https://docs.fastnear.com/ru/api/v1/account-full
- https://docs.fastnear.com/ru/apis/fastnear/v1/account_full
- https://docs.fastnear.com/ru/apis/fastnear/openapi/accounts/account_full_v1
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v1/account/{account_id}/full`
- Исходная спецификация: `apis/fastnear/v1/account_full.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/v1/account/root.near/full
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

- `apiKey` (query, string): Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Полный индексированный снимок указанного аккаунта
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "account_id",
    "pools",
    "токены",
    "nfts",
    "состояние"
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
      "name": "nfts",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "contract_id",
            "last_update_block_height"
          ],
          "additionalProperties": false,
          "properties": [
            {
              "name": "contract_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "last_update_block_height",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            }
          ],
          "refName": "NftRow"
        }
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
    },
    {
      "name": "состояние",
      "required": true,
      "schema": {
        "type": "object"
      }
    },
    {
      "name": "токены",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "contract_id",
            "last_update_block_height",
            "balance"
          ],
          "additionalProperties": false,
          "properties": [
            {
              "name": "balance",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "contract_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "last_update_block_height",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            }
          ],
          "refName": "TokenRow"
        }
      }
    }
  ],
  "refName": "AccountFullResponse"
}
```
