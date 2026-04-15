# RPC протокола NEAR: Уровень перегрузки
Получить уровень перегрузки
Запрашивает уровень перегрузки выбранного шарда.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/protocol/experimental-congestion-level
- https://docs.fastnear.com/ru/rpcs/protocol/EXPERIMENTAL_congestion_level
- https://docs.fastnear.com/ru/rpcs/protocol/EXPERIMENTAL_congestion_level/other/EXPERIMENTAL_congestion_level
- https://docs.fastnear.com/ru/reference/operation/EXPERIMENTAL_congestion_level
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/EXPERIMENTAL_congestion_level.yaml`
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
  "method": "EXPERIMENTAL_congestion_level",
  "params": {
    "block_id": "6sddgq8nkENAz4f8qR72qxRPM25QWNBVMrkYr63DgC2E",
    "shard_id": 10
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
    "method": "EXPERIMENTAL_congestion_level",
    "params": {
      "block_id": "6sddgq8nkENAz4f8qR72qxRPM25QWNBVMrkYr63DgC2E",
      "shard_id": 10
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `block_id` (body, обязательный, integer | string): Высота блока (целое число) или хеш блока (строка).
- `shard_id` (body, обязательный, integer): Идентификатор шарда.
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
          "EXPERIMENTAL_congestion_level"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "nullable": true,
        "required": [
          "block_id",
          "shard_id"
        ],
        "properties": [
          {
            "name": "block_id",
            "required": true,
            "schema": {
              "description": "Высота блока (целое число) или хеш блока (строка)",
              "oneOf": [
                {
                  "type": "integer",
                  "description": "Высота блока"
                },
                {
                  "type": "string",
                  "description": "Хеш блока в кодировке Base58"
                }
              ]
            }
          },
          {
            "name": "shard_id",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Shard identifier"
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
          "congestion_level"
        ],
        "properties": [
          {
            "name": "congestion_level",
            "required": true,
            "schema": {
              "type": "number",
              "format": "double"
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
