# KV FastData API - История по точному ключу
Получить исторические строки для одного точного ключа в рамках одного вызывающего аккаунта и контракта
Возвращает исторические строки для одного точного ключа, который выбранный вызывающий аккаунт записал в выбранный контракт.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/kv-fastdata/v0/get_history_key
- https://docs.fastnear.com/ru/apis/kv-fastdata/openapi/history/get_history_key
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/history/{current_account_id}/{predecessor_id}/{key}`
- Исходная спецификация: `apis/kv-fastdata/v0/get_history_key.yaml`
## Сети
- Mainnet: https://kv.main.fastnear.com/
- Testnet: https://kv.test.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://kv.main.fastnear.com/v0/history/social.near/james.near/%7Bkey%7D
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "current_account_id": "social.near",
    "predecessor_id": "james.near",
    "key": "graph/follow/sleet.near"
  },
  "query": {}
}
```
### Входные данные
- `current_account_id` (путь, обязательный, string): Аккаунт контракта, для которого были записаны ключи FastData.
- `predecessor_id` (путь, обязательный, string): Вызывающий аккаунт, который записал ключи FastData.
- `ключ` (путь, обязательный, string): Exact FastData ключ to return.
### Параметры пути

- `current_account_id` (путь, обязательный, string): Аккаунт контракта, для которого были записаны ключи FastData.
- `predecessor_id` (путь, обязательный, string): Вызывающий аккаунт, который записал ключи FastData.
- `ключ` (путь, обязательный, string): Exact FastData ключ to return.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Исторические строки для выбранного вызывающего аккаунта, контракта и ключа
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
