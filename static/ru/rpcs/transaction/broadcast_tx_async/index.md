# RPC протокола NEAR: Отправка транзакции (асинхронно)
Отправить транзакцию асинхронно
Отправьте свежеподписанную транзакцию и сразу получите её хеш, без ожидания исполнения. Примеры по умолчанию служат только для иллюстрации и не являются повторно используемыми подписанными пакетами данных.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/transaction/broadcast_tx_async
- https://docs.fastnear.com/ru/rpcs/transaction/broadcast_tx_async/other/broadcast_tx_async
- https://docs.fastnear.com/ru/reference/operation/broadcast_tx_async
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
## OpenAPI
- Эта операция: https://docs.fastnear.com/openapi/rpc/broadcast_tx_async.json (https://docs.fastnear.com/openapi/rpc/broadcast_tx_async.yaml)
- Полный документ API: https://docs.fastnear.com/openapi/rpc.json
- Указатель в полном документе: https://docs.fastnear.com/openapi/rpc.json#/paths/~1broadcast_tx_async/post
## Сети
- Mainnet: https://rpc.mainnet.fastnear.com/
- Testnet: https://rpc.testnet.fastnear.com/
## Авторизация
- Bearer-токен через заголовок `Authorization: Bearer <token>`
- API-ключ через query `apiKey`: API-ключ FastNEAR в параметре запроса `apiKey`. Удобно для curl и клиентов, которые не могут задавать заголовки, но ключ может попасть в URL, логи и историю команд оболочки.
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
  "method": "broadcast_tx_async",
  "params": {
    "signed_tx_base64": "CQAAAG1pa2UubmVhcgCCy5RvHN/3t5Oejtf0aWKCCwJIxXkWWCQKxnaU9nr4nAEAAAAAAAAADQAAAG1pa2V0ZXN0Lm5lYXL6UXoKlIC/UXiHRkiBCYVW69w6N/+7ZXy0+gPAs9TQ5wEAAAADAQAAAAAAAAAAAAAAAAAAAABv/f+CgT7byEQUzraUd1LDQ7ELv5ld7bhFGUYNaxWWRMzl5rAuRhcfkV2jHIqJgu0sfw7B9/npIH69aqsm/GIM"
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
    "method": "broadcast_tx_async",
    "params": {
      "signed_tx_base64": "CQAAAG1pa2UubmVhcgCCy5RvHN/3t5Oejtf0aWKCCwJIxXkWWCQKxnaU9nr4nAEAAAAAAAAADQAAAG1pa2V0ZXN0Lm5lYXL6UXoKlIC/UXiHRkiBCYVW69w6N/+7ZXy0+gPAs9TQ5wEAAAADAQAAAAAAAAAAAAAAAAAAAABv/f+CgT7byEQUzraUd1LDQ7ELv5ld7bhFGUYNaxWWRMzl5rAuRhcfkV2jHIqJgu0sfw7B9/npIH69aqsm/GIM"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `signed_tx_base64` (body, обязательный, string): Подписанная транзакция в кодировке Base64. Сгенерируйте новый подписанный пакет данных для подписывающего аккаунта непосредственно перед отправкой или запросом статуса.
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
          "broadcast_tx_async"
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
        "type": "string",
        "description": "Base58-encoded hash"
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
