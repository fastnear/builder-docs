# RPC протокола NEAR: Текущие валидаторы
Получить текущих валидаторов
Получите активный набор валидаторов текущей эпохи со стейками и статистикой производительности.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/validators/validators_current
- https://docs.fastnear.com/ru/rpcs/validators/validators_current/other/validators_current
- https://docs.fastnear.com/ru/reference/operation/validators_current
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/validators/validators_current.yaml`
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
  "method": "валидаторы",
  "params": [
    null
  ]
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "jsonrpc": "2.0",
    "id": "fastnear",
    "method": "валидаторы",
    "params": [
      null
    ]
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
          "валидаторы"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "array",
        "example": [
          null
        ],
        "items": {
          "nullable": true
        }
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
        "description": "Информация о валидаторах текущей и следующей эпохи",
        "required": [
          "current_validators",
          "next_validators",
          "current_fishermen",
          "next_fishermen",
          "current_proposals",
          "prev_epoch_kickout",
          "epoch_start_height",
          "epoch_height"
        ],
        "properties": [
          {
            "name": "current_fishermen",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Fishermen текущей эпохи",
              "items": {
                "type": "object",
                "description": "One of multiple possible types"
              }
            }
          },
          {
            "name": "current_proposals",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Заявки (proposals) в текущей эпохе",
              "items": {
                "type": "object",
                "description": "One of multiple possible types"
              }
            }
          },
          {
            "name": "current_validators",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Валидаторы текущей эпохи",
              "items": {
                "type": "object",
                "description": "Описывает сведения о валидаторе текущей эпохи"
              }
            }
          },
          {
            "name": "epoch_height",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Epoch height",
              "format": "uint64"
            }
          },
          {
            "name": "epoch_start_height",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Высота блока начала эпохи",
              "format": "uint64"
            }
          },
          {
            "name": "next_fishermen",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Fishermen for the next epoch",
              "items": {
                "type": "object",
                "description": "One of multiple possible types"
              }
            }
          },
          {
            "name": "next_validators",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Валидаторы следующей эпохи",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "prev_epoch_kickout",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Kickout in the previous epoch",
              "items": {
                "type": "object"
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
