# Транзакции API - История аккаунта
Получить историю транзакций аккаунта
Возвращает строки транзакций аккаунта, необязательное общее количество на первой странице и необязательный `resume_token`.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/transactions/v0/account
- https://docs.fastnear.com/ru/apis/transactions/openapi/account/get_account
## Операция
- Транспорт: http
- Метод: POST
- Путь: `/v0/account`
- Исходная спецификация: `apis/transactions/v0/account.yaml`
## Сети
- Mainnet: https://tx.main.fastnear.com/
- Testnet: https://tx.test.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: POST
- URL: https://tx.main.fastnear.com/v0/account
- Активный пример: Mainnet
### Тело запроса
```json
{
  "account_id": "intents.near",
  "desc": true,
  "is_real_signer": true,
  "is_success": true,
  "limit": 50
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "account_id": "intents.near",
    "desc": true,
    "is_real_signer": true,
    "is_success": true,
    "limit": 50
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `account_id` (body, обязательный, string)
- `desc` (body, boolean)
- `from_tx_block_height` (body, integer)
- `is_action_arg` (body, boolean)
- `is_any_signer` (body, boolean)
- `is_delegated_signer` (body, boolean)
- `is_event_log` (body, boolean)
- `is_explicit_refund_to` (body, boolean)
- `is_function_call` (body, boolean)
- `is_predecessor` (body, boolean)
- `is_real_receiver` (body, boolean)
- `is_real_signer` (body, boolean)
- `is_receiver` (body, boolean)
- `is_signer` (body, boolean)
- `is_success` (body, boolean)
- `limit` (body, integer)
- `resume_token` (body, string)
- `to_tx_block_height` (body, integer)
### Схема запроса
```json
{
  "type": "object",
  "required": [
    "account_id"
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
      "name": "desc",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "from_tx_block_height",
      "required": false,
      "schema": {
        "type": "integer",
        "format": "uint64"
      }
    },
    {
      "name": "is_action_arg",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_any_signer",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_delegated_signer",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_event_log",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_explicit_refund_to",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_function_call",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_predecessor",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_real_receiver",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_real_signer",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_receiver",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_signer",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "is_success",
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
      "name": "resume_token",
      "required": false,
      "schema": {
        "type": "string",
        "default": null
      }
    },
    {
      "name": "to_tx_block_height",
      "required": false,
      "schema": {
        "type": "integer",
        "format": "uint64"
      }
    }
  ],
  "refName": "AccountInput"
}
```
## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Набор результатов по истории аккаунта
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "account_txs",
    "resume_token",
    "txs_count"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "account_txs",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "account_id",
            "transaction_hash",
            "tx_block_height",
            "tx_block_timestamp",
            "tx_index",
            "is_signer",
            "is_delegated_signer",
            "is_real_signer",
            "is_any_signer",
            "is_predecessor",
            "is_explicit_refund_to",
            "is_receiver",
            "is_real_receiver",
            "is_function_call",
            "is_action_arg",
            "is_event_log",
            "is_success"
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
              "name": "is_action_arg",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_any_signer",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_delegated_signer",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_event_log",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_explicit_refund_to",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_function_call",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_predecessor",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_real_receiver",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_real_signer",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_receiver",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_signer",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_success",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "transaction_hash",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "tx_block_height",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "tx_block_timestamp",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "tx_index",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint32"
              }
            }
          ],
          "refName": "AccountTxRow"
        }
      }
    },
    {
      "name": "resume_token",
      "required": true,
      "schema": {
        "type": "string"
      }
    },
    {
      "name": "txs_count",
      "required": true,
      "schema": {
        "type": "integer",
        "format": "uint64"
      }
    }
  ],
  "refName": "AccountResponse"
}
```
