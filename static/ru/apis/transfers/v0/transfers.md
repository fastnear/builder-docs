# API переводов: запрос переводов
Запросить переводы аккаунта
Получите строки переводов для одного аккаунта с необязательными фильтрами по направлению, активу, сумме и времени.
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
    "asset_id": "native:near",
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
- `account_id` (body, обязательный, string): Идентификатор аккаунта NEAR, для которого нужно получить переводы.
- `asset_id` (body, string): Необязательный идентификатор актива, например `near` или ID FT-контракта.
- `desc` (body, boolean): Если `true`, сначала возвращаются более новые переводы.
- `direction` (body, обязательный, string): Какие переводы вернуть: исходящие (`sender`) или входящие (`receiver`).
- `from_timestamp_ms` (body, integer): Нижняя граница времени в миллисекундах UNIX.
- `ignore_system` (body, boolean): Если `true`, исключает системные переводы.
- `limit` (body, integer): Максимальное количество строк в ответе.
- `min_amount` (body, string): Минимальная сумма в базовых единицах актива.
- `min_human_amount` (body, number): Минимальная сумма в человекочитаемом виде.
- `min_usd_amount` (body, number): Минимальная сумма в долларах США.
- `resume_token` (body, string): Непрозрачный токен продолжения из предыдущего ответа.
- `to_timestamp_ms` (body, integer): Верхняя граница времени в миллисекундах UNIX.
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
        "type": "string",
        "description": "NEAR account to query transfers for (the signer or receiver, depending on `direction`)."
      }
    },
    {
      "name": "asset_id",
      "required": false,
      "schema": {
        "type": "string",
        "description": "Asset identifier such as `native:near` for NEAR or `<contract_id>` for fungible tokens."
      }
    },
    {
      "name": "desc",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "When true, sort newest-first; when false or omitted, sort oldest-first."
      }
    },
    {
      "name": "direction",
      "required": true,
      "schema": {
        "type": "string",
        "description": "Restrict to transfers where the account acts as `sender` or `receiver`; omit for both sides.",
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
        "description": "Inclusive lower bound on block timestamp in milliseconds since the Unix epoch.",
        "format": "uint64"
      }
    },
    {
      "name": "ignore_system",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "When true, hide system transfers (validator rewards, implicit account creation, refunds)."
      }
    },
    {
      "name": "limit",
      "required": false,
      "schema": {
        "type": "integer",
        "description": "Maximum number of transfer rows to return in one page (1–100).",
        "format": "uint"
      }
    },
    {
      "name": "min_amount",
      "required": false,
      "schema": {
        "type": "string",
        "description": "Minimum absolute transfer amount in the asset's base units (e.g. yoctoNEAR), stringified u128.",
        "default": null
      }
    },
    {
      "name": "min_human_amount",
      "required": false,
      "schema": {
        "type": "number",
        "description": "Minimum transfer amount in human-readable units (decimals already applied).",
        "format": "double"
      }
    },
    {
      "name": "min_usd_amount",
      "required": false,
      "schema": {
        "type": "number",
        "description": "Minimum transfer amount in USD-equivalent at time of transfer.",
        "format": "double"
      }
    },
    {
      "name": "resume_token",
      "required": false,
      "schema": {
        "type": "string",
        "description": "Opaque pagination token returned as `resume_token` on a prior page; omit for the first page.",
        "default": null
      }
    },
    {
      "name": "to_timestamp_ms",
      "required": false,
      "schema": {
        "type": "integer",
        "description": "Exclusive upper bound on block timestamp in milliseconds since the Unix epoch.",
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
- Краткое описание: Строки переводов для указанного аккаунта.
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
