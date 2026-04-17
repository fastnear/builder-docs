# RPC протокола NEAR: Статус транзакции
Проверить статус транзакции
Проверьте итоговый результат транзакции по её хешу в кодировке Base58 — успех, сбой или ещё не завершена.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/transaction/tx-status
- https://docs.fastnear.com/ru/rpcs/transaction/tx_status
- https://docs.fastnear.com/ru/rpcs/transaction/tx_status/other/tx_status
- https://docs.fastnear.com/ru/reference/operation/tx_status
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/transaction/tx_status.yaml`
## Сети
- Mainnet: https://rpc.mainnet.fastnear.com/
- Testnet: https://rpc.testnet.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Контракт OpenAPI описывает API-ключ FastNear как параметр запроса `apiKey`.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Финальность: final
- Эндпоинт: https://rpc.mainnet.fastnear.com/
### Тело запроса
```json
{
  "jsonrpc": "2.0",
  "id": "fastnear",
  "method": "tx",
  "params": {
    "tx_hash": "34E7weKCDqXh3xPKdBgSWRqo44yTWjbka9deMK8JbAxx",
    "sender_account_id": "escrow.ai.near"
  }
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "jsonrpc": "2.0",
    "id": "fastnear",
    "method": "tx",
    "params": {
      "tx_hash": "34E7weKCDqXh3xPKdBgSWRqo44yTWjbka9deMK8JbAxx",
      "sender_account_id": "escrow.ai.near"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `wait_until` (body, string): Желаемый уровень гарантии статуса исполнения.
- `signed_tx_base64` (body, string): Подписанная транзакция в кодировке Base64. Сгенерируйте свежеподписанный payload для подписывающего аккаунта непосредственно перед отправкой или запросом статуса.
- `sender_account_id` (body, string): ID аккаунта NEAR.
- `tx_hash` (body, string): Хеш транзакции в кодировке Base58.
### Схема запроса
```json
{
  "type": "object",
  "required": [
    "jsonrpc",
    "id",
    "method",
    "params"
  ],
  "properties": [
    {
      "name": "jsonrpc",
      "required": true,
      "schema": {
        "type": "string",
        "enum": [
          "2.0"
        ]
      }
    },
    {
      "name": "id",
      "required": true,
      "schema": {
        "type": "string",
        "example": "fastnear"
      }
    },
    {
      "name": "method",
      "required": true,
      "schema": {
        "type": "string",
        "enum": [
          "tx"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "properties": [
          {
            "name": "wait_until",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Желаемый уровень гарантии статуса исполнения",
              "default": "EXECUTED_OPTIMISTIC",
              "enum": [
                "NONE",
                "INCLUDED",
                "INCLUDED_FINAL",
                "EXECUTED",
                "EXECUTED_OPTIMISTIC",
                "FINAL"
              ]
            }
          },
          {
            "name": "signed_tx_base64",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Подписанная транзакция в кодировке Base64. Сгенерируйте свежеподписанный payload для подписывающего аккаунта непосредственно перед отправкой или запросом статуса."
            }
          },
          {
            "name": "sender_account_id",
            "required": false,
            "schema": {
              "type": "string",
              "description": "ID аккаунта NEAR"
            }
          },
          {
            "name": "tx_hash",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          }
        ]
      }
    }
  ]
}
```
## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Успешный ответ
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "jsonrpc",
    "id"
  ],
  "properties": [
    {
      "name": "jsonrpc",
      "required": true,
      "schema": {
        "type": "string",
        "enum": [
          "2.0"
        ]
      }
    },
    {
      "name": "id",
      "required": true,
      "schema": {
        "oneOf": [
          {
            "type": "string"
          },
          {
            "type": "number"
          }
        ]
      }
    },
    {
      "name": "result",
      "required": false,
      "schema": {
        "type": "object",
        "required": [
          "final_execution_status"
        ],
        "properties": [
          {
            "name": "final_execution_status",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Желаемый уровень гарантии статуса исполнения",
              "enum": [
                "NONE",
                "INCLUDED",
                "INCLUDED_FINAL",
                "EXECUTED",
                "EXECUTED_OPTIMISTIC",
                "FINAL"
              ]
            }
          },
          {
            "name": "квитанции",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Квитанции, порождённые транзакцией",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "receipts_outcome",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Результаты исполнения квитанций.",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "статус",
            "required": false,
            "schema": {
              "type": "object",
              "description": "One of multiple possible types"
            }
          },
          {
            "name": "транзакция",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Подписанная транзакция"
            }
          },
          {
            "name": "transaction_outcome",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Результат исполнения подписанной транзакции."
            }
          }
        ]
      }
    },
    {
      "name": "error",
      "required": false,
      "schema": {
        "type": "object",
        "properties": [
          {
            "name": "код",
            "required": false,
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "message",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "data",
            "required": false,
            "schema": {
              "type": "object"
            }
          }
        ]
      }
    }
  ],
  "refName": "JsonRpcResponse"
}
```
