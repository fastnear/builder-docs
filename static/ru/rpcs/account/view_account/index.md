# RPC протокола NEAR: Просмотр аккаунта
Просмотр аккаунта
Получите баланс аккаунта, размер хранилища и хеш кода на выбранной высоте блока или финальности.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/account/view_account
- https://docs.fastnear.com/ru/rpcs/account/view_account/other/view_account
- https://docs.fastnear.com/ru/reference/operation/view_account
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/account/view_account.yaml`
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
    "request_type": "view_account",
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
      "request_type": "view_account",
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
            "name": "request_type",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "view_account"
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
- Краткое описание: Сведения об аккаунте
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
        "description": "Представление аккаунта",
        "required": [
          "amount",
          "locked",
          "code_hash",
          "storage_usage"
        ],
        "properties": [
          {
            "name": "amount",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Amount in yoctoNEAR"
            }
          },
          {
            "name": "code_hash",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "global_contract_account_id",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "ID аккаунта NEAR"
            }
          },
          {
            "name": "global_contract_hash",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "locked",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Amount in yoctoNEAR"
            }
          },
          {
            "name": "storage_paid_at",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "TODO(2271): deprecated.",
              "format": "uint64",
              "default": 0
            }
          },
          {
            "name": "storage_usage",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint64"
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
