# NEAR Protocol RPC: Resolve receipt to transaction
Resolve receipt to transaction
Resolve a receipt ID to the transaction hash and signer that produced it. Requires a node with `save_receipt_to_tx` enabled; unindexed receipts return `UNKNOWN_RECEIPT`.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/transaction/experimental-receipt-to-tx
- https://docs.fastnear.com/ru/rpcs/transaction/EXPERIMENTAL_receipt_to_tx
- https://docs.fastnear.com/ru/rpcs/transaction/EXPERIMENTAL_receipt_to_tx/other/EXPERIMENTAL_receipt_to_tx
- https://docs.fastnear.com/ru/reference/operation/EXPERIMENTAL_receipt_to_tx
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/transaction/EXPERIMENTAL_receipt_to_tx.yaml`
## Сети
- Mainnet: https://rpc.mainnet.fastnear.com/
- Testnet: https://rpc.testnet.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Контракт OpenAPI описывает API-ключ FastNEAR как параметр запроса с именем apiKey.
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
  "method": "EXPERIMENTAL_receipt_to_tx",
  "params": {
    "receipt_id": "FcFKrKQziMPCgYMFiLMZwecBtA7vqxdkatkhc1j3GYj8"
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
    "method": "EXPERIMENTAL_receipt_to_tx",
    "params": {
      "receipt_id": "FcFKrKQziMPCgYMFiLMZwecBtA7vqxdkatkhc1j3GYj8"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `block_height` (body, integer): Optional hint: block height near where the receipt was created, to bound the fallback scan.
- `receipt_id` (body, обязательный, string): Base58-encoded receipt ID to resolve to its originating transaction.
- `shard_id` (body, integer): Optional hint: shard to scan at the hint height; omit to scan all tracked shards.
- `window` (body, integer): Optional hint: ± block-height window scanned around the hint before walking ancestor blocks.
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
          "EXPERIMENTAL_receipt_to_tx"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "receipt_id"
        ],
        "properties": [
          {
            "name": "block_height",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true,
              "description": "Optional hint: block height near where the receipt was created, to bound the fallback scan.",
              "format": "uint64"
            }
          },
          {
            "name": "receipt_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded receipt ID to resolve to its originating transaction."
            }
          },
          {
            "name": "shard_id",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true,
              "description": "Optional hint: shard to scan at the hint height; omit to scan all tracked shards."
            }
          },
          {
            "name": "window",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true,
              "description": "Optional hint: ± block-height window scanned around the hint before walking ancestor blocks.",
              "format": "uint64"
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
          "transaction_hash",
          "sender_account_id"
        ],
        "properties": [
          {
            "name": "sender_account_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "ID аккаунта NEAR"
            }
          },
          {
            "name": "transaction_hash",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
