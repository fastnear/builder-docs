# RPC протокола NEAR: Конфигурация протокола
Получить конфигурацию протокола
Возвращает конфигурацию на уровне протокола: стоимость газа и хранения, лимиты, флаги возможностей и другие параметры.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/protocol/experimental-protocol-config
- https://docs.fastnear.com/ru/rpcs/protocol/EXPERIMENTAL_protocol_config
- https://docs.fastnear.com/ru/rpcs/protocol/EXPERIMENTAL_protocol_config/other/EXPERIMENTAL_protocol_config
- https://docs.fastnear.com/ru/reference/operation/EXPERIMENTAL_protocol_config
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/EXPERIMENTAL_protocol_config.yaml`
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
  "method": "EXPERIMENTAL_protocol_config",
  "params": {
    "finality": "final"
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
    "method": "EXPERIMENTAL_protocol_config",
    "params": {
      "finality": "final"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
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
          "EXPERIMENTAL_protocol_config"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "финальность"
        ],
        "properties": [
          {
            "name": "финальность",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Блок финальность",
              "enum": [
                "final",
                "near-final",
                "optimistic"
              ]
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
        "properties": [
          {
            "name": "avg_hidden_validator_seats_per_shard",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Expected number of hidden валидаторы per шард.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "block_producer_kickout_threshold",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Threshold for kicking out блока producers, between 0 and 100.",
              "format": "uint8"
            }
          },
          {
            "name": "chain_id",
            "required": false,
            "schema": {
              "type": "string",
              "description": "ID of the блокчейн. This must be unique for every блокчейн.\nIf your testnet blockchains do not have unique chain IDs, you will have a bad time."
            }
          },
          {
            "name": "chunk_producer_kickout_threshold",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Threshold for kicking out chunk producers, between 0 and 100.",
              "format": "uint8"
            }
          },
          {
            "name": "chunk_validator_only_kickout_threshold",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Threshold for kicking out nodes which are only chunk валидаторы, between 0 and 100.",
              "format": "uint8"
            }
          },
          {
            "name": "dynamic_resharding",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Enable dynamic re-sharding."
            }
          },
          {
            "name": "epoch_length",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Epoch length counted in блока heights.",
              "format": "uint64"
            }
          },
          {
            "name": "fishermen_threshold",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Amount in yoctoNEAR"
            }
          },
          {
            "name": "gas_limit",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Газ amount"
            }
          },
          {
            "name": "gas_price_adjustment_rate",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Газ price adjustment rate",
              "items": {
                "type": "integer",
                "format": "int32"
              }
            }
          },
          {
            "name": "genesis_height",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Height of genesis блока.",
              "format": "uint64"
            }
          },
          {
            "name": "genesis_time",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Official time of блокчейн start.",
              "format": "date-time"
            }
          },
          {
            "name": "max_gas_price",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Amount in yoctoNEAR"
            }
          },
          {
            "name": "max_inflation_rate",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Maximum inflation on the total supply every epoch.",
              "items": {
                "type": "integer",
                "format": "int32"
              }
            }
          },
          {
            "name": "max_kickout_stake_perc",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Max stake percentage of the валидаторы we will kick out.",
              "format": "uint8"
            }
          },
          {
            "name": "min_gas_price",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Amount in yoctoNEAR"
            }
          },
          {
            "name": "minimum_stake_divisor",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "The minimum stake required for стейкинг is last seat price divided by this number.",
              "format": "uint64"
            }
          },
          {
            "name": "minimum_stake_ratio",
            "required": false,
            "schema": {
              "type": "array",
              "description": "The lowest ratio s/s_total any блока producer can have.\nSee <https://github.com/near/NEPs/pull/167> for details",
              "items": {
                "type": "integer",
                "format": "int32"
              }
            }
          },
          {
            "name": "minimum_validators_per_shard",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "The minimum number of валидаторы each шард must have",
              "format": "uint64"
            }
          },
          {
            "name": "num_block_producer_seats",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of блока producer seats at genesis.",
              "format": "uint64"
            }
          },
          {
            "name": "num_block_producer_seats_per_shard",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Defines number of shards and number of блока producer seats per each shard at genesis.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "num_blocks_per_year",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Expected number of блоки per year",
              "format": "uint64"
            }
          },
          {
            "name": "online_max_threshold",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Online maximum threshold above which валидатора gets full reward.",
              "items": {
                "type": "integer",
                "format": "int32"
              }
            }
          },
          {
            "name": "online_min_threshold",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Online minimum threshold below which валидатора doesn't receive reward.",
              "items": {
                "type": "integer",
                "format": "int32"
              }
            }
          },
          {
            "name": "protocol_reward_rate",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Протокол treasury rate",
              "items": {
                "type": "integer",
                "format": "int32"
              }
            }
          },
          {
            "name": "protocol_treasury_account",
            "required": false,
            "schema": {
              "type": "string",
              "description": "NEAR аккаунта ID"
            }
          },
          {
            "name": "protocol_upgrade_stake_threshold",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Threshold of stake that needs to indicate that they ready for upgrade.",
              "items": {
                "type": "integer",
                "format": "int32"
              }
            }
          },
          {
            "name": "protocol_version",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Текущая версия протокола",
              "format": "uint32"
            }
          },
          {
            "name": "runtime_config",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Просмотр that preserves JSON format of the runtime конфигурация.",
              "properties": [
                {
                  "name": "account_creation_config",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "The structure describes configuration for creation of new аккаунтов."
                  }
                },
                {
                  "name": "congestion_control_config",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "The configuration for congestion control. More info about congestion [here](https://near.github.io/nearcore/architecture/how/receipt-congestion.html?highlight=congestion#receipt-congestion)"
                  }
                },
                {
                  "name": "storage_amount_per_byte",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "description": "Amount in yoctoNEAR"
                  }
                },
                {
                  "name": "transaction_costs",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "Describes different fees for the runtime"
                  }
                },
                {
                  "name": "wasm_config",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "Конфигурация of wasm operations."
                  }
                },
                {
                  "name": "witness_config",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "Configuration specific to ChunkStateWitness."
                  }
                }
              ]
            }
          },
          {
            "name": "shard_layout",
            "required": false,
            "schema": {
              "type": "object",
              "description": "One of multiple possible types"
            }
          },
          {
            "name": "shuffle_shard_assignment_for_chunk_producers",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "If true, shuffle the chunk producers across shards. In other words, if\nthe шард assignments were `[S_0, S_1, S_2, S_3]` where `S_i` represents\nthe set of chunk producers for шард `i`, if this flag were true, the\nшард assignments might become, for example, `[S_2, S_0, S_3, S_1]`."
            }
          },
          {
            "name": "target_validator_mandates_per_shard",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of target chunk валидатора mandates for each shard.",
              "format": "uint64"
            }
          },
          {
            "name": "transaction_validity_period",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of блоки for which a given транзакции is valid",
              "format": "uint64"
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
