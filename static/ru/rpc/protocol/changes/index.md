# RPC протокола NEAR: Изменения состояния
Получить изменения состояния
Возвращает изменения для выбранного аккаунта, контракта или кода контракта по заданной высоте блока или хешу.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/protocol/changes
- https://docs.fastnear.com/ru/rpcs/protocol/changes
- https://docs.fastnear.com/ru/rpcs/protocol/changes/other/changes
- https://docs.fastnear.com/ru/reference/operation/changes
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/changes.yaml`
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
  "method": "changes",
  "params": {
    "finality": "final",
    "changes_type": "account_changes",
    "account_ids": [
      "root.near"
    ]
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
    "method": "changes",
    "params": {
      "finality": "final",
      "changes_type": "account_changes",
      "account_ids": [
        "root.near"
      ]
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
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
          "changes"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "description": "One of multiple possible types"
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
          "block_hash",
          "changes"
        ],
        "properties": [
          {
            "name": "block_hash",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "changes",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "cause"
                ],
                "properties": [
                  {
                    "name": "cause",
                    "required": true,
                    "schema": {
                      "type": "object",
                      "description": "One of multiple possible types"
                    }
                  }
                ]
              }
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
