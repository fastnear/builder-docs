# Транзакции API - История аккаунта
Получить историю транзакций аккаунта
Получите историю транзакций аккаунта с необязательными фильтрами по подписанту, статусу успеха и порядку сортировки.
## Ссылки на источник
- https://docs.fastnear.com/ru/tx/account
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
- `account_id` (body, обязательный, string): NEAR account to query transactions for (may be a signer, predecessor, receiver, or related party).
- `desc` (body, boolean): Sort newest-first when true; oldest-first when false or omitted.
- `from_tx_block_height` (body, integer): Inclusive lower bound on the transaction's block height.
- `is_action_arg` (body, boolean): Restrict to transactions where this account appeared in action arguments.
- `is_any_signer` (body, boolean): Restrict to transactions where this account signed either the top-level transaction or a delegated action.
- `is_delegated_signer` (body, boolean): Restrict to transactions where this account signed a delegated action.
- `is_event_log` (body, boolean): Restrict to transactions where this account appeared in a JSON event log.
- `is_explicit_refund_to` (body, boolean): Restrict to transactions where this account was the explicit `refund_to` target of an action receipt.
- `is_function_call` (body, boolean): Restrict to transactions where this account was the target of a function-call action.
- `is_predecessor` (body, boolean): Restrict to transactions where this account was the predecessor of a receipt.
- `is_real_receiver` (body, boolean): Restrict to transactions where this account was the real receiver — excluding relayer receivers and gas refunds.
- `is_real_signer` (body, boolean): Restrict to transactions where this account was the real signer — direct or delegated, excluding relayer signers.
- `is_receiver` (body, boolean): Restrict to transactions where this account received a receipt.
- `is_signer` (body, boolean): Restrict to transactions where this account signed the top-level transaction.
- `is_success` (body, boolean): Restrict to transactions whose execution succeeded (true) or failed/pending (false).
- `limit` (body, integer): Maximum rows to return in one page (1–200).
- `resume_token` (body, string): Opaque pagination token returned on a prior page; omit for the first page.
- `to_tx_block_height` (body, integer): Exclusive upper bound on the transaction's block height.
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
        "type": "string",
        "description": "NEAR account to query transactions for (may be a signer, predecessor, receiver, or related party)."
      }
    },
    {
      "name": "desc",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Sort newest-first when true; oldest-first when false or omitted."
      }
    },
    {
      "name": "from_tx_block_height",
      "required": false,
      "schema": {
        "type": "integer",
        "description": "Inclusive lower bound on the transaction's block height.",
        "format": "uint64"
      }
    },
    {
      "name": "is_action_arg",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account appeared in action arguments."
      }
    },
    {
      "name": "is_any_signer",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account signed either the top-level transaction or a delegated action."
      }
    },
    {
      "name": "is_delegated_signer",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account signed a delegated action."
      }
    },
    {
      "name": "is_event_log",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account appeared in a JSON event log."
      }
    },
    {
      "name": "is_explicit_refund_to",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account was the explicit `refund_to` target of an action receipt."
      }
    },
    {
      "name": "is_function_call",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account was the target of a function-call action."
      }
    },
    {
      "name": "is_predecessor",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account was the predecessor of a receipt."
      }
    },
    {
      "name": "is_real_receiver",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account was the real receiver — excluding relayer receivers and gas refunds."
      }
    },
    {
      "name": "is_real_signer",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account was the real signer — direct or delegated, excluding relayer signers."
      }
    },
    {
      "name": "is_receiver",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account received a receipt."
      }
    },
    {
      "name": "is_signer",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions where this account signed the top-level transaction."
      }
    },
    {
      "name": "is_success",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Restrict to transactions whose execution succeeded (true) or failed/pending (false)."
      }
    },
    {
      "name": "limit",
      "required": false,
      "schema": {
        "type": "integer",
        "description": "Maximum rows to return in one page (1–200).",
        "format": "uint"
      }
    },
    {
      "name": "resume_token",
      "required": false,
      "schema": {
        "type": "string",
        "description": "Opaque pagination token returned on a prior page; omit for the first page.",
        "default": null
      }
    },
    {
      "name": "to_tx_block_height",
      "required": false,
      "schema": {
        "type": "integer",
        "description": "Exclusive upper bound on the transaction's block height.",
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
