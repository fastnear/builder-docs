# RPC протокола NEAR: Отправка транзакции (с подтверждением)
Отправить транзакцию и дождаться подтверждения
Отправляет транзакцию и ждёт, пока она будет полностью исполнена и подтверждена в блокчейне. Требуется свежеподписанная транзакция; пример по умолчанию служит только иллюстрацией и не участвует в проверке живых ответов.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/transaction/broadcast-tx-commit
- https://docs.fastnear.com/ru/rpcs/transaction/broadcast_tx_commit
- https://docs.fastnear.com/ru/rpcs/transaction/broadcast_tx_commit/other/broadcast_tx_commit
- https://docs.fastnear.com/ru/reference/operation/broadcast_tx_commit
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/transaction/broadcast_tx_commit.yaml`
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
  "method": "broadcast_tx_commit",
  "params": {
    "signed_tx_base64": "DgAAAG1pa2UubmVhcgCpPJgEEFUwQjFQvL8V3CnZ0h688WG5sVsKE8JYM37ax2cUjgEAAAAAAAAADQAAAG1pa2V0ZXN0Lm5lYXIPfFBmYNAIe2/MicVhDXbvT3w06LxS2OCF0UHIYgjNDQAAAHRlc3RpbmcgbWVtbwEAAAADAQAAAAAAAAAAAAAAAAAAAA=="
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
    "method": "broadcast_tx_commit",
    "params": {
      "signed_tx_base64": "DgAAAG1pa2UubmVhcgCpPJgEEFUwQjFQvL8V3CnZ0h688WG5sVsKE8JYM37ax2cUjgEAAAAAAAAADQAAAG1pa2V0ZXN0Lm5lYXIPfFBmYNAIe2/MicVhDXbvT3w06LxS2OCF0UHIYgjNDQAAAHRlc3RpbmcgbWVtbwEAAAADAQAAAAAAAAAAAAAAAAAAAA=="
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
          "broadcast_tx_commit"
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
              "description": "Подписанная транзакция в кодировке Base64. Её нужно сгенерировать для подписывающего аккаунта непосредственно перед отправкой."
            }
          },
          {
            "name": "wait_until",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Desired level of execution статус guarantee",
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
              "description": "Desired level of execution статус guarantee",
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
              "description": "Receipts generated from the транзакции",
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
              "description": "The execution outcome of квитанции.",
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
            "name": "транзакции",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Signed Транзакция"
            }
          },
          {
            "name": "transaction_outcome",
            "required": false,
            "schema": {
              "type": "object",
              "description": "The execution outcome of the signed транзакции."
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
