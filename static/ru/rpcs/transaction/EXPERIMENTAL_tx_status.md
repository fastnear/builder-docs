# RPC протокола NEAR: Подробный статус транзакции
Получить подробный статус транзакции
Запрашивает статус транзакции по хешу и возвращает итоговый результат транзакции вместе с деталями всех квитанций.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/transaction/EXPERIMENTAL_tx_status
- https://docs.fastnear.com/ru/rpcs/transaction/EXPERIMENTAL_tx_status/other/EXPERIMENTAL_tx_status
- https://docs.fastnear.com/ru/reference/operation/EXPERIMENTAL_tx_status
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/transaction/EXPERIMENTAL_tx_status.yaml`
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
  "method": "EXPERIMENTAL_tx_status",
  "params": {
    "wait_until": "EXECUTED_OPTIMISTIC",
    "sender_account_id": "intents.near",
    "tx_hash": "4EQZ5qoEJUbz8SRNkNwrAPtsn2VFhg9Ci1weaNNpiuR7"
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
    "method": "EXPERIMENTAL_tx_status",
    "params": {
      "wait_until": "EXECUTED_OPTIMISTIC",
      "sender_account_id": "intents.near",
      "tx_hash": "4EQZ5qoEJUbz8SRNkNwrAPtsn2VFhg9Ci1weaNNpiuR7"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `wait_until` (body, string): Желаемый уровень гарантии статуса исполнения.
- `signed_tx_base64` (body, string): Подписанная транзакция в кодировке Base64.
- `sender_account_id` (body, string): ID аккаунта NEAR.
- `tx_hash` (body, string): Хеш в кодировке Base58.
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
          "EXPERIMENTAL_tx_status"
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
              "description": "Desired level of execution статус guarantee",
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
              "description": "Подписанная транзакция в кодировке Base64"
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
              "description": "Desired level of execution статус guarantee",
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
              "description": "Receipts generated from the транзакции",
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
              "description": "The execution outcome of квитанции.",
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
            "name": "транзакции",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Signed Транзакция"
            }
          },
          {
            "name": "transaction_outcome",
            "required": false,
            "schema": {
              "type": "object",
              "description": "The execution outcome of the signed транзакции."
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
