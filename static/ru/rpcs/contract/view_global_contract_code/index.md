# RPC протокола NEAR: Глобальный код контракта
Получить глобальный код контракта
Найдите WebAssembly-байткод глобального контракта по SHA-256-хешу его кода в кодировке Base58.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/contract/view_global_contract_code
- https://docs.fastnear.com/ru/rpcs/contract/view_global_contract_code/other/view_global_contract_code
- https://docs.fastnear.com/ru/reference/operation/view_global_contract_code
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/contract/view_global_contract_code.yaml`
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
    "code_hash": "A2VxywASqbnarBAfTWobhDZjMXobjnYyJmkjhoXAiYBz",
    "request_type": "view_global_contract_code",
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
      "code_hash": "A2VxywASqbnarBAfTWobhDZjMXobjnYyJmkjhoXAiYBz",
      "request_type": "view_global_contract_code",
      "finality": "final"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `code_hash` (body, обязательный, string): Хеш в кодировке Base58.
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
          "code_hash",
          "финальность"
        ],
        "properties": [
          {
            "name": "code_hash",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "request_type",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "view_global_contract_code"
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
        "description": "Представление кода контракта.",
        "required": [
          "code_base64",
          "hash"
        ],
        "properties": [
          {
            "name": "code_base64",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "hash",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
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
