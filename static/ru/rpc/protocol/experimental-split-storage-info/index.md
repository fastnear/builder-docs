# RPC протокола NEAR: Информация о разделённом хранилище
Получить сведения о разделённом хранилище
Содержит сведения о разделённом хранилище для архивных узлов.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/protocol/experimental-split-storage-info
- https://docs.fastnear.com/ru/rpcs/protocol/EXPERIMENTAL_split_storage_info
- https://docs.fastnear.com/ru/rpcs/protocol/EXPERIMENTAL_split_storage_info/other/EXPERIMENTAL_split_storage_info
- https://docs.fastnear.com/ru/reference/operation/EXPERIMENTAL_split_storage_info
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/EXPERIMENTAL_split_storage_info.yaml`
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
  "method": "EXPERIMENTAL_split_storage_info",
  "params": []
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "jsonrpc": "2.0",
    "id": "fastnear",
    "method": "EXPERIMENTAL_split_storage_info",
    "params": []
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
          "EXPERIMENTAL_split_storage_info"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "array",
        "description": "Empty array as this method takes no parameters",
        "example": []
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
        "description": "Contains the split storage information.",
        "properties": [
          {
            "name": "cold_head_height",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true,
              "format": "uint64"
            }
          },
          {
            "name": "final_head_height",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true,
              "format": "uint64"
            }
          },
          {
            "name": "head_height",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true,
              "format": "uint64"
            }
          },
          {
            "name": "hot_db_kind",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true
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
