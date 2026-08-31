# RPC протокола NEAR: Состояние контракта
Получить состояние контракта
Получите сырое состояние «ключ-значение», записанное контрактом, с опциональным фильтром по префиксу ключа.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/contract/view_state
- https://docs.fastnear.com/ru/rpcs/contract/view_state/other/view_state
- https://docs.fastnear.com/ru/reference/operation/view_state
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/contract/view_state.yaml`
## Сети
- Mainnet: https://rpc.mainnet.fastnear.com/
- Testnet: https://rpc.testnet.fastnear.com/
## Авторизация
- Bearer-токен через заголовок `Authorization: Bearer <token>`
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
    "request_type": "view_state",
    "finality": "final",
    "account_id": "lockup.near",
    "prefix_base64": "U1RBVEU="
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
      "request_type": "view_state",
      "finality": "final",
      "account_id": "lockup.near",
      "prefix_base64": "U1RBVEU="
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `account_id` (body, обязательный, string): ID аккаунта NEAR.
- `after_key_base64` (body, string): Exclusive start cursor: returns only keys greater than this one. Set to the prior response's `last_key` to page forward; omit to scan from the start of the prefix range.
- `include_proof` (body, boolean): Добавить криптографическое доказательство к ответу.
- `limit` (body, integer): Maximum key/value entries per response (≥ 1). Omit for no client-set bound (subject to node limits).
- `prefix_base64` (body, обязательный, string): Префикс ключа хранилища в кодировке Base64.
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
          "prefix_base64",
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
            "name": "after_key_base64",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "Exclusive start cursor: returns only keys greater than this one. Set to the prior response's `last_key` to page forward; omit to scan from the start of the prefix range."
            }
          },
          {
            "name": "include_proof",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Include a Merkle proof for the queried state alongside the values."
            }
          },
          {
            "name": "limit",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true,
              "description": "Maximum key/value entries per response (≥ 1). Omit for no client-set bound (subject to node limits).",
              "format": "uint32"
            }
          },
          {
            "name": "prefix_base64",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base64-encoded key prefix; returns only trie entries whose key begins with these bytes. Empty string (`\"\"`) removes the filter and returns the entire contract state — expensive on large contracts."
            }
          },
          {
            "name": "request_type",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "view_state"
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
        "description": "Итоговые значения состояния для запроса просмотра состояния",
        "required": [
          "values"
        ],
        "properties": [
          {
            "name": "last_key",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "Continuation cursor — the last key returned. Pass as `after_key_base64` to fetch the next page; absent when the result set is exhausted."
            }
          },
          {
            "name": "доказательство",
            "required": false,
            "schema": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          {
            "name": "values",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "description": "Элемент состояния: ключ и значение сериализованы в Base64, а также приложено доказательство включения этого элемента состояния."
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
