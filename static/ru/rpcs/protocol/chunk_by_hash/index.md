# RPC протокола NEAR: Чанк по хешу
Получить чанк по хешу
Получите транзакции и квитанции одного чанка по его хешу содержимого в кодировке Base58.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/protocol/chunk_by_hash
- https://docs.fastnear.com/ru/rpcs/protocol/chunk_by_hash/other/chunk_by_hash
- https://docs.fastnear.com/ru/reference/operation/chunk_by_hash
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/chunk_by_hash.yaml`
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
    "chunk_id": "349Wr5HMm2Bvyy8GuhExAZ4F353tXCChx1FfAsYnQTAn"
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
      "chunk_id": "349Wr5HMm2Bvyy8GuhExAZ4F353tXCChx1FfAsYnQTAn"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `chunk_id` (body, обязательный, string): Хеш чанка в кодировке Base58.
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
          "chunk_id"
        ],
        "properties": [
          {
            "name": "chunk_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded chunk hash"
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
              "description": "ID аккаунта NEAR"
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
                    "description": "Хранит уровень перегрузки шарда. Подробнее о перегрузке [здесь](https://near.github.io/nearcore/architecture/how/receipt-congestion.html?highlight=congestion#receipt-congestion)"
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
                    "description": "Количество газа"
                  }
                },
                {
                  "name": "gas_used",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Количество газа"
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
