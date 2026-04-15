# Транзакции API - Поиск блока
Получить блок по высоте или хешу
Возвращает строку блока и, при необходимости, связанные транзакции и квитанции.
## Ссылки на источник
- https://docs.fastnear.com/ru/tx/block
- https://docs.fastnear.com/ru/apis/transactions/v0/block
- https://docs.fastnear.com/ru/apis/transactions/openapi/blocks/get_block
## Операция
- Транспорт: http
- Метод: POST
- Путь: `/v0/block`
- Исходная спецификация: `apis/transactions/v0/block.yaml`
## Сети
- Mainnet: https://tx.main.fastnear.com/
- Testnet: https://tx.test.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: POST
- URL: https://tx.main.fastnear.com/v0/block
- Активный пример: Mainnet
### Тело запроса
```json
{
  "block_id": 193916411,
  "with_receipts": true,
  "with_transactions": true
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "block_id": 193916411,
    "with_receipts": true,
    "with_transactions": true
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `block_id` (body, обязательный, integer | string)
- `with_receipts` (body, boolean)
- `with_transactions` (body, boolean)
### Схема запроса
```json
{
  "type": "object",
  "required": [
    "block_id"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "block_id",
      "required": true,
      "schema": {
        "oneOf": [
          {
            "type": "integer"
          },
          {
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "with_receipts",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    },
    {
      "name": "with_transactions",
      "required": false,
      "schema": {
        "type": "boolean"
      }
    }
  ],
  "refName": "BlockInput"
}
```
## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Результат поиска блока
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "блока",
    "block_txs",
    "block_receipts"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "блока",
      "required": true,
      "schema": {
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
        ]
      }
    },
    {
      "name": "block_receipts",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
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
          ],
          "refName": "ReceiptTxRow"
        }
      }
    },
    {
      "name": "block_txs",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "transaction_hash",
            "signer_id",
            "tx_block_height",
            "tx_index",
            "tx_block_hash",
            "tx_block_timestamp",
            "last_block_height",
            "is_completed",
            "shard_id",
            "receiver_id",
            "signer_public_key",
            "priority_fee",
            "nonce",
            "is_relayed",
            "real_signer_id",
            "real_receiver_id",
            "is_success",
            "gas_burnt",
            "tokens_burnt"
          ],
          "additionalProperties": false,
          "properties": [
            {
              "name": "gas_burnt",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "is_completed",
              "required": true,
              "schema": {
                "type": "boolean"
              }
            },
            {
              "name": "is_relayed",
              "required": true,
              "schema": {
                "type": "boolean"
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
              "name": "last_block_height",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "nonce",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "priority_fee",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "real_receiver_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "real_signer_id",
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
              "name": "signer_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "signer_public_key",
              "required": true,
              "schema": {
                "type": "string"
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
              "name": "transaction_hash",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "tx_block_hash",
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
          ],
          "refName": "BlockTxRow"
        }
      }
    }
  ],
  "refName": "BlockResponse"
}
```
