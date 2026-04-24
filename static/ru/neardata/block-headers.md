# NEAR Data API - Заголовки блока
Получить объект блока для финализированного блока
Получите только заголовок финализированного блока и сводку по чанкам — без содержимого отдельных шардов.
## Ссылки на источник
- https://docs.fastnear.com/ru/neardata/block-headers
- https://docs.fastnear.com/ru/apis/neardata/v0/block_headers
- https://docs.fastnear.com/ru/apis/neardata/openapi/blocks/get_block_headers
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/block/{block_height}/headers`
- Исходная спецификация: `apis/neardata/v0/block_headers.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/v0/block/9820210/headers
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "block_height": "9820210"
  },
  "query": {}
}
```
### Входные данные
- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.
### Параметры пути

- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.

### Параметры запроса

- `apiKey` (query, string): Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Запрошенный документ или `null`, если выбранный срез отсутствует
### Схема ответа
```json
{
  "type": "object",
  "description": "Block-level payload returned by neardata.",
  "required": [
    "author",
    "chunks",
    "header"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "author",
      "required": true,
      "schema": {
        "type": "string",
        "description": "Block producer account ID."
      }
    },
    {
      "name": "chunks",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "description": "Chunk header object as served by neardata.",
          "additionalProperties": true,
          "properties": [
            {
              "name": "chunk_hash",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "gas_limit",
              "required": false,
              "schema": {
                "type": "integer"
              }
            },
            {
              "name": "gas_used",
              "required": false,
              "schema": {
                "type": "integer"
              }
            },
            {
              "name": "height_created",
              "required": false,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "height_included",
              "required": false,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "outcome_root",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "outgoing_receipts_root",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "prev_block_hash",
              "required": false,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "shard_id",
              "required": false,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "tx_root",
              "required": false,
              "schema": {
                "type": "string"
              }
            }
          ],
          "refName": "ChunkHeader"
        }
      }
    },
    {
      "name": "header",
      "required": true,
      "schema": {
        "type": "object",
        "description": "Block header object as served by neardata.",
        "additionalProperties": true,
        "properties": [
          {
            "name": "chunks_included",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "uint64"
            }
          },
          {
            "name": "epoch_id",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "gas_price",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "hash",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "height",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "uint64"
            }
          },
          {
            "name": "next_epoch_id",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "prev_hash",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "prev_height",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "uint64"
            }
          },
          {
            "name": "timestamp",
            "required": false,
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "timestamp_nanosec",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "total_supply",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "refName": "BlockHeader"
      }
    }
  ],
  "refName": "BlockEnvelope"
}
```
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
