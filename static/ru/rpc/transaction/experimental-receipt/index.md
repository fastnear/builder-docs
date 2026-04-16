# RPC протокола NEAR: Квитанция по ID
Получить квитанцию по ID
Получите одну квитанцию по её ID — межшардовую единицу исполнения, производимую транзакцией.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/transaction/experimental-receipt
- https://docs.fastnear.com/ru/rpcs/transaction/EXPERIMENTAL_receipt
- https://docs.fastnear.com/ru/rpcs/transaction/EXPERIMENTAL_receipt/other/EXPERIMENTAL_receipt
- https://docs.fastnear.com/ru/reference/operation/EXPERIMENTAL_receipt
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/transaction/EXPERIMENTAL_receipt.yaml`
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
  "method": "EXPERIMENTAL_receipt",
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
    "method": "EXPERIMENTAL_receipt",
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
- `receipt_id` (body, обязательный, string): Хеш в кодировке Base58.
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
          "EXPERIMENTAL_receipt"
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
            "name": "receipt_id",
            "required": true,
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
          "predecessor_id",
          "receiver_id",
          "receipt_id",
          "квитанция"
        ],
        "properties": [
          {
            "name": "predecessor_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "ID аккаунта NEAR"
            }
          },
          {
            "name": "priority",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Deprecated, retained for backward compatibility.",
              "format": "uint64",
              "default": 0
            }
          },
          {
            "name": "квитанция",
            "required": true,
            "schema": {
              "type": "object",
              "description": "One of multiple possible types"
            }
          },
          {
            "name": "receipt_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "receiver_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "ID аккаунта NEAR"
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
