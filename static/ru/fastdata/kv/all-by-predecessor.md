# KV FastData API - Последние ключи по вызывающему аккаунту
Получить последние строки «ключ-значение» для одного вызывающего аккаунта по всем контрактам
Получите последние значения для всех контрактов, к которым обращался один вызывающий аккаунт.
## Ссылки на источник
- https://docs.fastnear.com/ru/fastdata/kv/all-by-predecessor
- https://docs.fastnear.com/ru/apis/kv-fastdata/v0/all_by_predecessor
- https://docs.fastnear.com/ru/apis/kv-fastdata/openapi/latest/all_by_predecessor
## Операция
- Транспорт: http
- Метод: POST
- Путь: `/v0/all/{predecessor_id}`
- Исходная спецификация: `apis/kv-fastdata/v0/all_by_predecessor.yaml`
## Сети
- Mainnet: https://kv.main.fastnear.com/
- Testnet: https://kv.test.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: POST
- URL: https://kv.main.fastnear.com/v0/all/james.near
- Активный пример: Mainnet
### Тело запроса
```json
{
  "include_metadata": true,
  "limit": 50
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "include_metadata": true,
    "limit": 50
  },
  "headers": {},
  "path": {
    "predecessor_id": "james.near"
  },
  "query": {}
}
```
### Входные данные
- `predecessor_id` (путь, обязательный, string): Вызывающий аккаунт, который записал ключи FastData.
- `include_metadata` (body, boolean): Добавить в каждую запись метаданные квитанции и подписанта.
- `limit` (body, integer): Maximum number of entries to return in one page (1–200, default 50).
- `page_token` (body, string): Непрозрачный токен страницы из предыдущего ответа `/v0/all/{predecessor_id}`.
### Схема запроса
```json
{
  "type": "object",
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
      "name": "limit",
      "required": false,
      "schema": {
        "type": "integer",
        "description": "Maximum number of entries to return in one page (1–200, default 50).",
        "format": "int32"
      }
    },
    {
      "name": "page_token",
      "required": false,
      "schema": {
        "type": "string",
        "description": "Непрозрачный токен страницы из предыдущего ответа `/v0/all/{predecessor_id}`."
      }
    }
  ],
  "refName": "AllRequest"
}
```
### Параметры пути

- `predecessor_id` (путь, обязательный, string): Вызывающий аккаунт, который записал ключи FastData.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Последние строки для выбранного вызывающего аккаунта
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
