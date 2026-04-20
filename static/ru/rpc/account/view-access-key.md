# RPC протокола NEAR: Просмотр ключа доступа
Просмотр ключа доступа аккаунта
Получите права и nonce одного ключа доступа аккаунта по его публичному ключу.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/account/view-access-key
- https://docs.fastnear.com/ru/rpcs/account/view_access_key
- https://docs.fastnear.com/ru/rpcs/account/view_access_key/other/view_access_key
- https://docs.fastnear.com/ru/reference/operation/view_access_key
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/account/view_access_key.yaml`
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
  "method": "query",
  "params": {
    "account_id": "root.near",
    "public_key": "ed25519:6666666666666666666666666666666666666666666",
    "request_type": "view_access_key",
    "finality": "final"
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
    "method": "query",
    "params": {
      "account_id": "root.near",
      "public_key": "ed25519:6666666666666666666666666666666666666666666",
      "request_type": "view_access_key",
      "finality": "final"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `account_id` (body, обязательный, string): ID аккаунта NEAR.
- `public_key` (body, обязательный, string): Публичный ключ в формате `ed25519:...` или `secp256k1:...`.
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
          "query"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "request_type",
          "account_id",
          "public_key",
          "финальность"
        ],
        "properties": [
          {
            "name": "account_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "ID аккаунта NEAR"
            }
          },
          {
            "name": "public_key",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Публичный ключ с префиксом ed25519: или secp256k1:"
            }
          },
          {
            "name": "request_type",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "view_access_key"
              ]
            }
          },
          {
            "name": "финальность",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Финальность блока",
              "enum": [
                "final",
                "near-final",
                "optimistic"
              ]
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
- Краткое описание: Информация о ключе доступа
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
        "description": "Описывает область действия ключа доступа и nonce.",
        "required": [
          "nonce",
          "permission"
        ],
        "properties": [
          {
            "name": "nonce",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint64"
            }
          },
          {
            "name": "permission",
            "required": true,
            "schema": {
              "type": "object",
              "description": "One of multiple possible types"
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
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
