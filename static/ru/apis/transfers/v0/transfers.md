# Transfers API - Запрос переводов
Запросить переводы для аккаунта
Возвращает строки переводов и непрозрачный токен продолжения для пагинации.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/transfers/v0/transfers
- https://docs.fastnear.com/ru/apis/transfers/openapi/transfers/get_transfers_by_account
## Операция
- Транспорт: http
- Метод: POST
- Путь: `/v0/transfers`
- Исходная спецификация: `apis/transfers/v0/transfers.yaml`
## Сети
- Mainnet: https://transfers.main.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: POST
- URL: https://transfers.main.fastnear.com/v0/transfers
- Активный пример: Недавние входящие переводы NEAR
### Тело запроса
```json
{
  "account_id": "root.near",
  "desc": true,
  "limit": 10
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "account_id": "intents.near",
    "asset_id": "near",
    "desc": true,
    "direction": "receiver",
    "limit": 10,
    "min_amount": "1000000000000000000000000"
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `account_id` (body, обязательный, string)
- `asset_id` (body, string)
- `desc` (body, boolean)
- `direction` (body, обязательный, string)
- `from_timestamp_ms` (body, integer)
- `ignore_system` (body, boolean)
- `limit` (body, integer)
- `min_amount` (body, string)
- `min_human_amount` (body, number)
- `min_usd_amount` (body, number)
- `resume_token` (body, string)
- `to_timestamp_ms` (body, integer)
### Схема запроса
```json
{
  "type": "object",
  "required": [
    "account_id",
    "direction"
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
      "name": "asset_id",
      "required": false,
      "schema": {
        "type": "string"
      }
    },
    {
      "name": "desc",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "direction",
      "required": true,
      "schema": {
        "type": "string",
        "enum": [
          "sender",
          "receiver"
        ]
      }
    },
    {
      "name": "from_timestamp_ms",
      "required": false,
      "schema": {
        "type": "integer",
        "format": "uint64"
      }
    },
    {
      "name": "ignore_system",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "limit",
      "required": false,
      "schema": {
        "type": "integer",
        "format": "uint"
      }
    },
    {
      "name": "min_amount",
      "required": false,
      "schema": {
        "type": "string",
        "default": null
      }
    },
    {
      "name": "min_human_amount",
      "required": false,
      "schema": {
        "type": "number",
        "format": "double"
      }
    },
    {
      "name": "min_usd_amount",
      "required": false,
      "schema": {
        "type": "number",
        "format": "double"
      }
    },
    {
      "name": "resume_token",
      "required": false,
      "schema": {
        "type": "string",
        "default": null
      }
    },
    {
      "name": "to_timestamp_ms",
      "required": false,
      "schema": {
        "type": "integer",
        "format": "uint64"
      }
    }
  ],
  "refName": "TransfersInput"
}
```
## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Строки переводов для запрошенного аккаунта
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "transfers",
    "resume_token"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "resume_token",
      "required": true,
      "schema": {
        "type": "string"
      }
    },
    {
      "name": "transfers",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "block_height",
            "block_timestamp",
            "receipt_id",
            "transfer_index",
            "signer_id",
            "predecessor_id",
            "receipt_account_id",
            "account_id",
            "asset_id",
            "asset_type",
            "amount",
            "transfer_type"
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
              "name": "action_index",
              "required": false,
              "schema": {
                "type": "integer",
                "format": "uint16"
              }
            },
            {
              "name": "amount",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "asset_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "asset_type",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "block_height",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "block_timestamp",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "end_of_block_balance",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "human_amount",
              "required": false,
              "schema": {
                "type": "number",
                "format": "double"
              }
            },
            {
              "name": "log_index",
              "required": false,
              "schema": {
                "type": "integer",
                "format": "uint16"
              }
            },
            {
              "name": "method_name",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "other_account_id",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "predecessor_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "receipt_account_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "receipt_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "signer_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "start_of_block_balance",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "transaction_id",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "transfer_index",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint32"
              }
            },
            {
              "name": "transfer_type",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "usd_amount",
              "required": false,
              "schema": {
                "type": "number",
                "format": "double"
              }
            }
          ],
          "refName": "TransferRow"
        }
      }
    }
  ],
  "refName": "TransfersResponse"
}
```
