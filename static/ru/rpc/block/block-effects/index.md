# RPC протокола NEAR: Эффекты блока
Получить эффекты блока
Возвращает изменения, вызванные блоком, для заданной высоты блока или хеша по всем типам транзакций.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/block/block-effects
- https://docs.fastnear.com/ru/rpcs/block/block_effects
- https://docs.fastnear.com/ru/rpcs/block/block_effects/other/block_effects
- https://docs.fastnear.com/ru/reference/operation/block_effects
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/block/block_effects.yaml`
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
  "method": "block_effects",
  "params": {
    "block_id": 193909529
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
    "method": "block_effects",
    "params": {
      "block_id": 193909529
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `block_id` (body, обязательный, integer | string): Высота блока (целое число) или хеш блока (строка).
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
          "block_effects"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "block_id"
        ],
        "properties": [
          {
            "name": "block_id",
            "required": true,
            "schema": {
              "description": "Блок height (integer) or блока hash (string)",
              "oneOf": [
                {
                  "type": "integer",
                  "description": "Блок height"
                },
                {
                  "type": "string",
                  "description": "Base58-encoded блока hash"
                }
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
                "description": "One of multiple possible types"
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
