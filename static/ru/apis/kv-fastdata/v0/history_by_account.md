# KV FastData API - История по аккаунту
Получить историю записей «ключ-значение» для одного контракта по всем вызывающим аккаунтам
Получите исторические строки FastData для одного целевого аккаунта по всем вызывающим аккаунтам.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/kv-fastdata/v0/history_by_account
- https://docs.fastnear.com/ru/apis/kv-fastdata/openapi/history/history_by_account
## Операция
- Транспорт: http
- Метод: POST
- Путь: `/v0/history/{current_account_id}`
- Исходная спецификация: `apis/kv-fastdata/v0/history_by_account.yaml`
## Сети
- Mainnet: https://kv.main.fastnear.com/
- Testnet: https://kv.test.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: POST
- URL: https://kv.main.fastnear.com/v0/history/social.near
- Активный пример: Mainnet
### Тело запроса
```json
{
  "asc": true,
  "include_metadata": true,
  "key_prefix": "graph/follow/sleet.near",
  "limit": 10
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "asc": true,
    "include_metadata": true,
    "key_prefix": "graph/follow/sleet.near",
    "limit": 10
  },
  "headers": {},
  "path": {
    "current_account_id": "social.near"
  },
  "query": {}
}
```
### Входные данные
- `current_account_id` (путь, обязательный, string): Аккаунт контракта, для которого были записаны ключи FastData.
- `asc` (body, boolean): Сортировать результаты истории по возрастанию. По умолчанию сначала идут новые записи.
- `include_metadata` (body, boolean): Добавить в каждую запись метаданные квитанции и подписанта.
- `ключ` (body, string): Фильтр по точному ключу. Взаимно исключающий с `key_prefix`.
- `key_prefix` (body, string): Фильтр по префиксу для совпадения пространств имён ключей.
- `limit` (body, integer)
- `page_token` (body, string): Непрозрачный токен страницы из предыдущего ответа с тем же эндпоинтом и набором фильтров.
### Схема запроса
```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": [
    {
      "name": "asc",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Сортировать по возрастанию для эндпоинтов истории. По умолчанию — от новых к старым.",
        "default": false
      }
    },
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
      "name": "ключ",
      "required": false,
      "schema": {
        "type": "string",
        "description": "Фильтр по точному ключу. Взаимно исключающий с `key_prefix`."
      }
    },
    {
      "name": "key_prefix",
      "required": false,
      "schema": {
        "type": "string",
        "description": "Фильтр по префиксу для сопоставления пространств имён ключей."
      }
    },
    {
      "name": "limit",
      "required": false,
      "schema": {
        "type": "integer",
        "format": "int32"
      }
    },
    {
      "name": "page_token",
      "required": false,
      "schema": {
        "type": "string",
        "description": "Непрозрачный токен страницы из предыдущего ответа того же эндпоинта и набора фильтров."
      }
    }
  ],
  "refName": "QueryRequest"
}
```
### Параметры пути

- `current_account_id` (путь, обязательный, string): Аккаунт контракта, для которого были записаны ключи FastData.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Исторические строки для выбранного контракта
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
          ],
          "refName": "KvEntry"
        }
      }
    },
    {
      "name": "page_token",
      "required": false,
      "schema": {
        "type": "string",
        "description": "Opaque pagination cursor for the next page. Absent when there are no more results."
      }
    }
  ],
  "refName": "ListResponse"
}
```
