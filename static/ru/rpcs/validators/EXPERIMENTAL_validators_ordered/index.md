# RPC протокола NEAR: Упорядоченные валидаторы
Получить упорядоченных валидаторов
Получите список валидаторов, упорядоченный по размеру стейка на выбранном блоке — шире, чем только активный набор.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/validators/EXPERIMENTAL_validators_ordered
- https://docs.fastnear.com/ru/rpcs/validators/EXPERIMENTAL_validators_ordered/other/EXPERIMENTAL_validators_ordered
- https://docs.fastnear.com/ru/reference/operation/EXPERIMENTAL_validators_ordered
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/validators/EXPERIMENTAL_validators_ordered.yaml`
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
  "method": "EXPERIMENTAL_validators_ordered",
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
    "method": "EXPERIMENTAL_validators_ordered",
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
- `block_id` (body, integer | string): Высота блока (целое число) или хеш блока (строка).
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
          "EXPERIMENTAL_validators_ordered"
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
            "name": "block_id",
            "required": false,
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
                },
                {
                  "nullable": true
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
        "type": "array",
        "items": {
          "type": "object",
          "description": "One of multiple possible types"
        }
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
