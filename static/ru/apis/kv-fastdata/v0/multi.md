# KV FastData API - Пакетный поиск по ключам
Получить последние строки для нескольких полностью квалифицированных ключей
Получите последнюю строку FastData сразу для 100 ключей в одном запросе.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/kv-fastdata/v0/multi
- https://docs.fastnear.com/ru/apis/kv-fastdata/openapi/latest/multi
## Операция
- Транспорт: http
- Метод: POST
- Путь: `/v0/multi`
- Исходная спецификация: `apis/kv-fastdata/v0/multi.yaml`
## Сети
- Mainnet: https://kv.main.fastnear.com/
- Testnet: https://kv.test.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: POST
- URL: https://kv.main.fastnear.com/v0/multi
- Активный пример: Mainnet
### Тело запроса
```json
{
  "include_metadata": true
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "include_metadata": true,
    "keys": [
      "social.near/james.near/graph/follow/sleet.near",
      "social.near/james.near/graph/follow/missing"
    ]
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `include_metadata` (body, boolean): Добавить в каждую запись метаданные квитанции и подписанта.
- `ключи` (body, обязательный, array): Полноквалифицированные ключи в форме current_account_id/predecessor_id/key.
### Схема запроса
```json
{
  "type": "object",
  "required": [
    "ключи"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "include_metadata",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Включать в каждую запись метаданные квитанции и подписанта.",
        "default": false
      }
    },
    {
      "name": "ключи",
      "required": true,
      "schema": {
        "type": "array",
        "description": "Полноквалифицированные ключи в форме current_account_id/predecessor_id/key.",
        "items": {
          "type": "string"
        }
      }
    }
  ],
  "refName": "MultiRequest"
}
```
## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Последние строки для запрошенных ключей
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "entries"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "entries",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "oneOf": [
            {
              "type": "object",
              "required": [
                "predecessor_id",
                "current_account_id",
                "block_height",
                "block_timestamp",
                "ключ",
                "value"
              ],
              "additionalProperties": false,
              "properties": [
                {
                  "name": "action_index",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "format": "uint32"
                  }
                },
                {
                  "name": "block_height",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "block_timestamp",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "current_account_id",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "ключ",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "predecessor_id",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "receipt_id",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "signer_id",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "tx_hash",
                  "required": false,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "value",
                  "required": true,
                  "schema": {
                    "description": "Raw JSON value as stored in FastData."
                  }
                }
              ]
            },
            {
              "enum": [
                null
              ]
            }
          ]
        }
      }
    }
  ],
  "refName": "MultiResponse"
}
```
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
