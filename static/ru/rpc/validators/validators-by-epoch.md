# RPC протокола NEAR: Валидаторы по эпохе
Получить валидаторов по эпохе
Возвращает список валидаторов и их параметры для выбранной эпохи.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/validators/validators-by-epoch
- https://docs.fastnear.com/ru/rpcs/validators/validators_by_epoch
- https://docs.fastnear.com/ru/rpcs/validators/validators_by_epoch/other/validators_by_epoch
- https://docs.fastnear.com/ru/reference/operation/validators_by_epoch
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/validators/validators_by_epoch.yaml`
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
  "params": {
    "epoch_id": "9p3TzDhp6B5sRCaMi36TXqKWHfjEt4oyqaGoftHHaa8E"
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
    "method": "валидаторы",
    "params": {
      "epoch_id": "9p3TzDhp6B5sRCaMi36TXqKWHfjEt4oyqaGoftHHaa8E"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `epoch_id` (body, обязательный, string): Хеш-идентификатор эпохи в кодировке Base58.
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
        "type": "object",
        "required": [
          "epoch_id"
        ],
        "properties": [
          {
            "name": "epoch_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded epoch identifier hash"
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
        "description": "Information about this epoch валидаторы and next epoch валидаторы",
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
              "description": "Fishermen for the текущий epoch",
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
              "description": "Proposals in the текущий epoch",
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
              "description": "Валидаторы for the текущий epoch",
              "items": {
                "type": "object",
                "description": "Describes information about the текущий epoch валидатора"
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
              "description": "Epoch start блока height",
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
              "description": "Валидаторы for the next epoch",
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
