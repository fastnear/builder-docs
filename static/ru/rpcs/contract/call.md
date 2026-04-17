# RPC протокола NEAR: Вызов view-метода
Вызвать view-метод контракта
Вызовите view-метод контракта без газа и изменений состояния — чтение вычисляемых значений из логики контракта.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/contract/call
- https://docs.fastnear.com/ru/rpcs/contract/call/other/call_function
- https://docs.fastnear.com/ru/reference/operation/call_function
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/contract/call.yaml`
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
    "request_type": "call_function",
    "finality": "final",
    "account_id": "contract.near",
    "method_name": "get_info",
    "args_base64": "e30="
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
      "request_type": "call_function",
      "finality": "final",
      "account_id": "contract.near",
      "method_name": "get_info",
      "args_base64": "e30="
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `account_id` (body, обязательный, string): ID аккаунта NEAR.
- `args_base64` (body, обязательный, string): Сырые аргументы метода в кодировке Base64. Контракты, работающие с JSON, обычно ожидают UTF-8-байты JSON-полезной нагрузки; пример `e30=` соответствует `{}`.
- `method_name` (body, обязательный, string): Имя view-метода контракта.
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
          "method_name",
          "args_base64",
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
            "name": "args_base64",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base64-кодированные сырые аргументы метода. Контракты, работающие с JSON, обычно ожидают UTF-8-байты JSON-полезной нагрузки; пример `e30=` соответствует `{}`."
            }
          },
          {
            "name": "method_name",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Name of the contract view method to invoke."
            }
          },
          {
            "name": "request_type",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "call_function"
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
        "description": "Результат, возвращённый методом контракта",
        "required": [
          "result",
          "logs"
        ],
        "properties": [
          {
            "name": "logs",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          {
            "name": "result",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "integer",
                "format": "uint8"
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
