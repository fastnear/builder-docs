# RPC протокола NEAR: Чанк по блоку и шарду
Получить чанк по блоку и шарду
Возвращает сведения о чанке по координатам `block_id` и `shard_id`.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/protocol/chunk_by_block_shard
- https://docs.fastnear.com/ru/rpcs/protocol/chunk_by_block_shard/other/chunk_by_block_shard
- https://docs.fastnear.com/ru/reference/operation/chunk_by_block_shard
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/chunk_by_block_shard.yaml`
## Сети
- Mainnet: https://rpc.mainnet.fastnear.com/
- Testnet: https://rpc.testnet.fastnear.com/
## Авторизация
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
  "method": "chunk",
  "params": {
    "block_id": "6sddgq8nkENAz4f8qR72qxRPM25QWNBVMrkYr63DgC2E",
    "shard_id": 10
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
    "method": "chunk",
    "params": {
      "block_id": "6sddgq8nkENAz4f8qR72qxRPM25QWNBVMrkYr63DgC2E",
      "shard_id": 10
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `block_id` (body, обязательный, integer | string): Высота блока (целое число) или хеш блока (строка).
- `shard_id` (body, обязательный, integer): Идентификатор шарда.
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
          "chunk"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "block_id",
          "shard_id"
        ],
        "properties": [
          {
            "name": "block_id",
            "required": true,
            "schema": {
              "description": "Блок height (integer) or блока hash (string)",
              "oneOf": [
                {
                  "type": "integer",
                  "description": "Блок height"
                },
                {
                  "type": "string",
                  "description": "Base58-encoded блока hash"
                }
              ]
            }
          },
          {
            "name": "shard_id",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Shard identifier"
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
          "транзакции",
          "квитанции"
        ],
        "properties": [
          {
            "name": "author",
            "required": true,
            "schema": {
              "type": "string",
              "description": "NEAR аккаунта ID"
            }
          },
          {
            "name": "header",
            "required": true,
            "schema": {
              "type": "object",
              "description": "Contains main info about the chunk.",
              "required": [
                "chunk_hash",
                "prev_block_hash",
                "outcome_root",
                "prev_state_root",
                "encoded_merkle_root",
                "encoded_length",
                "height_created",
                "height_included",
                "shard_id",
                "gas_used",
                "gas_limit",
                "balance_burnt",
                "outgoing_receipts_root",
                "tx_root",
                "validator_proposals",
                "signature"
              ],
              "properties": [
                {
                  "name": "balance_burnt",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Amount in yoctoNEAR"
                  }
                },
                {
                  "name": "bandwidth_requests",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "nullable": true,
                    "description": "One of multiple possible types"
                  }
                },
                {
                  "name": "chunk_hash",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "congestion_info",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "nullable": true,
                    "description": "Stores the congestion level of a шард. More info about congestion [here](https://near.github.io/nearcore/architecture/how/receipt-congestion.html?highlight=congestion#receipt-congestion)"
                  }
                },
                {
                  "name": "encoded_length",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "encoded_merkle_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "gas_limit",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Газ amount"
                  }
                },
                {
                  "name": "gas_used",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Газ amount"
                  }
                },
                {
                  "name": "height_created",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "height_included",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
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
                  "name": "outgoing_receipts_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "prev_block_hash",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
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
                  "name": "rent_paid",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "description": "Amount in yoctoNEAR",
                    "default": "0"
                  }
                },
                {
                  "name": "shard_id",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "description": "Shard identifier"
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
                  "name": "tx_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
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
          },
          {
            "name": "квитанции",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "транзакции",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "object"
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
