# Транзакции API - Диапазон блоков
Получить список блоков
Получите ограниченный список индексированных блоков, отсортированный по возрастанию или убыванию.
## Ссылки на источник
- https://docs.fastnear.com/ru/tx/blocks
- https://docs.fastnear.com/ru/apis/transactions/v0/blocks
- https://docs.fastnear.com/ru/apis/transactions/openapi/blocks/get_blocks
## Операция
- Транспорт: http
- Метод: POST
- Путь: `/v0/blocks`
- Исходная спецификация: `apis/transactions/v0/blocks.yaml`
## Сети
- Mainnet: https://tx.main.fastnear.com/
- Testnet: https://tx.test.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: POST
- URL: https://tx.main.fastnear.com/v0/blocks
- Активный пример: Mainnet
### Тело запроса
```json
{
  "desc": false,
  "from_block_height": 193916402,
  "limit": 10,
  "to_block_height": 193916411
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "desc": false,
    "from_block_height": 193916402,
    "limit": 10,
    "to_block_height": 193916411
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `desc` (body, boolean): Sort newest-first when true; oldest-first when false or omitted.
- `from_block_height` (body, integer): Inclusive lower bound on block height.
- `limit` (body, integer): Maximum blocks to return in one page (1–100).
- `to_block_height` (body, integer): Exclusive upper bound on block height.
### Схема запроса
```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": [
    {
      "name": "desc",
      "required": false,
      "schema": {
        "type": "boolean",
        "description": "Sort newest-first when true; oldest-first when false or omitted."
      }
    },
    {
      "name": "from_block_height",
      "required": false,
      "schema": {
        "type": "integer",
        "description": "Inclusive lower bound on block height.",
        "format": "uint64"
      }
    },
    {
      "name": "limit",
      "required": false,
      "schema": {
        "type": "integer",
        "description": "Maximum blocks to return in one page (1–100).",
        "format": "uint"
      }
    },
    {
      "name": "to_block_height",
      "required": false,
      "schema": {
        "type": "integer",
        "description": "Exclusive upper bound on block height.",
        "format": "uint64"
      }
    }
  ],
  "refName": "BlocksInput"
}
```
## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Строки блоков
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "блоки"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "блоки",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "block_height",
            "block_hash",
            "prev_block_hash",
            "block_timestamp",
            "epoch_id",
            "next_epoch_id",
            "chunks_included",
            "author_id",
            "protocol_version",
            "gas_price",
            "total_supply",
            "num_transactions",
            "num_receipts",
            "gas_burnt",
            "tokens_burnt"
          ],
          "additionalProperties": false,
          "properties": [
            {
              "name": "author_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "block_hash",
              "required": true,
              "schema": {
                "type": "string"
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
              "name": "block_ordinal",
              "required": false,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "block_timestamp",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "chunks_included",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "epoch_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "gas_burnt",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "gas_price",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "next_epoch_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "num_receipts",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint32"
              }
            },
            {
              "name": "num_transactions",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint32"
              }
            },
            {
              "name": "prev_block_hash",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "prev_block_height",
              "required": false,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "protocol_version",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint32"
              }
            },
            {
              "name": "tokens_burnt",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "total_supply",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "refName": "BlockRow"
        }
      }
    }
  ],
  "refName": "BlocksResponse"
}
```
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
