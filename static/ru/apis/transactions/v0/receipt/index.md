# Транзакции API - Поиск квитанции
Получить квитанцию по ID
Возвращает строку квитанции и, если она есть, связанные сырые данные транзакции.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/transactions/v0/receipt
- https://docs.fastnear.com/ru/apis/transactions/openapi/receipts/get_receipt
## Операция
- Транспорт: http
- Метод: POST
- Путь: `/v0/receipt`
- Исходная спецификация: `apis/transactions/v0/receipt.yaml`
## Сети
- Mainnet: https://tx.main.fastnear.com/
- Testnet: https://tx.test.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: POST
- URL: https://tx.main.fastnear.com/v0/receipt
- Активный пример: Mainnet
### Тело запроса
```json
{
  "receipt_id": "gzqDSvd3ZMcVUWzBMP7j9KMWz89iZMkkEvW9g8QZjUP"
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "receipt_id": "gzqDSvd3ZMcVUWzBMP7j9KMWz89iZMkkEvW9g8QZjUP"
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `receipt_id` (body, обязательный, string)
### Схема запроса
```json
{
  "type": "object",
  "required": [
    "receipt_id"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "receipt_id",
      "required": true,
      "schema": {
        "type": "string"
      }
    }
  ],
  "refName": "ReceiptInput"
}
```
## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Результат поиска квитанции
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "квитанция",
    "транзакция"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "квитанция",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "receipt_id",
          "block_height",
          "block_timestamp",
          "receipt_index",
          "appear_block_height",
          "appear_receipt_index",
          "transaction_hash",
          "tx_block_height",
          "tx_block_timestamp",
          "tx_index",
          "predecessor_id",
          "receiver_id",
          "receipt_type",
          "priority",
          "shard_id",
          "is_success"
        ],
        "additionalProperties": false,
        "properties": [
          {
            "name": "appear_block_height",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint64"
            }
          },
          {
            "name": "appear_receipt_index",
            "required": true,
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
              "type": "string"
            }
          },
          {
            "name": "is_success",
            "required": true,
            "schema": {
              "type": "boolean"
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
            "name": "priority",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint64"
            }
          },
          {
            "name": "receipt_id",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "receipt_index",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint32"
            }
          },
          {
            "name": "receipt_type",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "receiver_id",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "shard_id",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint64"
            }
          },
          {
            "name": "transaction_hash",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "tx_block_height",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint64"
            }
          },
          {
            "name": "tx_block_timestamp",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "tx_index",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint32"
            }
          }
        ]
      }
    },
    {
      "name": "транзакция",
      "required": true,
      "schema": {
        "type": "object",
        "additionalProperties": true
      }
    }
  ],
  "refName": "ReceiptResponse"
}
```
