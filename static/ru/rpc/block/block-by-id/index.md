# RPC протокола NEAR: Блок по хешу
Получить блок по хешу
Получите заголовок и сводку по чанкам блока по его SHA-256-хешу в кодировке Base58.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/block/block-by-id
- https://docs.fastnear.com/ru/rpcs/block/block_by_id
- https://docs.fastnear.com/ru/rpcs/block/block_by_id/other/block_by_id
- https://docs.fastnear.com/ru/reference/operation/block_by_id
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
## OpenAPI
- Эта операция: https://docs.fastnear.com/openapi/rpc/block_by_id.json (https://docs.fastnear.com/openapi/rpc/block_by_id.yaml)
- Полный документ API: https://docs.fastnear.com/openapi/rpc.json
- Указатель в полном документе: https://docs.fastnear.com/openapi/rpc.json#/paths/~1block_by_id/post
## Сети
- Mainnet: https://archival-rpc.mainnet.fastnear.com/ (archival: Pinned block hash, older than standard RPC retention.)
- Testnet: https://archival-rpc.testnet.fastnear.com/ (archival: Pinned block hash, older than standard RPC retention.)
## Авторизация
- Bearer-токен через заголовок `Authorization: Bearer <token>`
- API-ключ через query `apiKey`: API-ключ FastNEAR в параметре запроса `apiKey`. Удобно для curl и клиентов, которые не могут задавать заголовки, но ключ может попасть в URL, логи и историю команд оболочки.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Финальность: final
- Эндпоинт: https://archival-rpc.mainnet.fastnear.com/
### Тело запроса
```json
{
  "jsonrpc": "2.0",
  "id": "fastnear",
  "method": "блок",
  "params": {
    "block_id": "EPnLgE7iEq9s7yTkos96M3cWymH5avBAPm3qx3NXqR8H"
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
    "method": "блок",
    "params": {
      "block_id": "EPnLgE7iEq9s7yTkos96M3cWymH5avBAPm3qx3NXqR8H"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `block_id` (body, обязательный, string): Хеш блока в кодировке Base58.
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
          "блок"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "block_id"
        ],
        "properties": [
          {
            "name": "block_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Хеш блока в кодировке Base58"
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
        "required": [
          "author",
          "header",
          "chunks"
        ],
        "properties": [
          {
            "name": "author",
            "required": true,
            "schema": {
              "type": "string",
              "description": "ID аккаунта NEAR"
            }
          },
          {
            "name": "chunks",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "description": "Contains main info about the chunk."
              }
            }
          },
          {
            "name": "header",
            "required": true,
            "schema": {
              "type": "object",
              "description": "Contains main info about the block.",
              "required": [
                "height",
                "epoch_id",
                "next_epoch_id",
                "hash",
                "prev_hash",
                "prev_state_root",
                "chunk_receipts_root",
                "chunk_headers_root",
                "chunk_tx_root",
                "outcome_root",
                "chunks_included",
                "challenges_root",
                "timestamp",
                "timestamp_nanosec",
                "random_value",
                "validator_proposals",
                "chunk_mask",
                "gas_price",
                "total_supply",
                "challenges_result",
                "last_final_block",
                "last_ds_final_block",
                "next_bp_hash",
                "block_merkle_root",
                "approvals",
                "signature",
                "latest_protocol_version"
              ],
              "properties": [
                {
                  "name": "approvals",
                  "required": true,
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                },
                {
                  "name": "block_body_hash",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "nullable": true,
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "block_merkle_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "block_ordinal",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "nullable": true,
                    "format": "uint64"
                  }
                },
                {
                  "name": "challenges_result",
                  "required": true,
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                },
                {
                  "name": "challenges_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "chunk_endorsements",
                  "required": false,
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                },
                {
                  "name": "chunk_execution_root",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "nullable": true,
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "chunk_headers_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "chunk_mask",
                  "required": true,
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                },
                {
                  "name": "chunk_receipts_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "chunk_tx_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
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
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "epoch_sync_data_hash",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "nullable": true,
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "gas_price",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Amount in yoctoNEAR"
                  }
                },
                {
                  "name": "hash",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "height",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "last_ds_final_block",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "last_final_block",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "latest_protocol_version",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint32"
                  }
                },
                {
                  "name": "next_bp_hash",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "next_epoch_id",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "outcome_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "prev_hash",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "prev_height",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "nullable": true,
                    "format": "uint64"
                  }
                },
                {
                  "name": "prev_last_certified_block_epoch_id",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "nullable": true,
                    "description": "Base58-encoded epoch identifier hash"
                  }
                },
                {
                  "name": "prev_state_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "random_value",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "rent_paid",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "description": "Amount in yoctoNEAR",
                    "default": "0"
                  }
                },
                {
                  "name": "shard_split",
                  "required": false,
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                },
                {
                  "name": "signature",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded cryptographic signature"
                  }
                },
                {
                  "name": "spice_chunk_endorsement_stats",
                  "required": false,
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                },
                {
                  "name": "timestamp",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "description": "Legacy json number. Should not be used.",
                    "format": "uint64"
                  }
                },
                {
                  "name": "timestamp_nanosec",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "total_supply",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Amount in yoctoNEAR"
                  }
                },
                {
                  "name": "validator_proposals",
                  "required": true,
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                },
                {
                  "name": "validator_reward",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "description": "Amount in yoctoNEAR",
                    "default": "0"
                  }
                }
              ]
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
