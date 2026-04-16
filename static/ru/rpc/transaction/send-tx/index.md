# RPC протокола NEAR: Отправить транзакцию
Отправить транзакцию
Отправьте подписанную транзакцию и дождитесь её итогового результата исполнения — текущий синхронный способ.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/transaction/send-tx
- https://docs.fastnear.com/ru/rpcs/transaction/send_tx
- https://docs.fastnear.com/ru/rpcs/transaction/send_tx/other/send_tx
- https://docs.fastnear.com/ru/reference/operation/send_tx
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/transaction/send_tx.yaml`
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
  "method": "send_tx",
  "params": {
    "signed_tx_base64": "ExampleBase64EncodedTransaction",
    "wait_until": "EXECUTED_OPTIMISTIC"
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
    "method": "send_tx",
    "params": {
      "signed_tx_base64": "ExampleBase64EncodedTransaction",
      "wait_until": "EXECUTED_OPTIMISTIC"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `signed_tx_base64` (body, обязательный, string): Подписанная транзакция в кодировке Base64. Её нужно сформировать для аккаунта подписи непосредственно перед отправкой.
- `wait_until` (body, string): Желаемый уровень гарантии статуса исполнения.
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
          "send_tx"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "signed_tx_base64"
        ],
        "properties": [
          {
            "name": "signed_tx_base64",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Подписанная транзакция в кодировке Base64"
            }
          },
          {
            "name": "wait_until",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Желаемый уровень гарантии статуса исполнения",
              "default": "EXECUTED_OPTIMISTIC",
              "enum": [
                "NONE",
                "INCLUDED",
                "INCLUDED_FINAL",
                "EXECUTED",
                "EXECUTED_OPTIMISTIC",
                "FINAL"
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
          "final_execution_status"
        ],
        "properties": [
          {
            "name": "final_execution_status",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Желаемый уровень гарантии статуса исполнения",
              "enum": [
                "NONE",
                "INCLUDED",
                "INCLUDED_FINAL",
                "EXECUTED",
                "EXECUTED_OPTIMISTIC",
                "FINAL"
              ]
            }
          },
          {
            "name": "квитанции",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Квитанции, порождённые транзакцией",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "receipts_outcome",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Результаты исполнения квитанций.",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "статус",
            "required": false,
            "schema": {
              "type": "object",
              "description": "One of multiple possible types"
            }
          },
          {
            "name": "транзакция",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Подписанная транзакция"
            }
          },
          {
            "name": "transaction_outcome",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Результат исполнения подписанной транзакции."
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
