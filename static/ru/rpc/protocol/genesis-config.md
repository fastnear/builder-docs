# RPC протокола NEAR: Конфигурация генезиса
Получить конфигурацию генезиса
Возвращает начальное состояние и параметры генезис-блока.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/protocol/genesis-config
- https://docs.fastnear.com/ru/rpcs/protocol/genesis_config
- https://docs.fastnear.com/ru/rpcs/protocol/genesis_config/other/genesis_config
- https://docs.fastnear.com/ru/reference/operation/genesis_config
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/genesis_config.yaml`
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
  "method": "genesis_config",
  "params": []
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "jsonrpc": "2.0",
    "id": "fastnear",
    "method": "genesis_config",
    "params": []
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
          "genesis_config"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "array",
        "description": "Empty array as this method takes no parameters",
        "example": []
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
          "protocol_version",
          "genesis_time",
          "chain_id",
          "genesis_height",
          "num_block_producer_seats",
          "num_block_producer_seats_per_shard",
          "avg_hidden_validator_seats_per_shard",
          "dynamic_resharding",
          "epoch_length",
          "gas_limit",
          "min_gas_price",
          "max_gas_price",
          "block_producer_kickout_threshold",
          "chunk_producer_kickout_threshold",
          "gas_price_adjustment_rate",
          "валидаторы",
          "transaction_validity_period",
          "protocol_reward_rate",
          "max_inflation_rate",
          "total_supply",
          "num_blocks_per_year",
          "protocol_treasury_account",
          "fishermen_threshold"
        ],
        "properties": [
          {
            "name": "avg_hidden_validator_seats_per_shard",
            "required": true,
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
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Threshold for kicking out блока producers, between 0 and 100.",
              "format": "uint8"
            }
          },
          {
            "name": "chain_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "ID of the блокчейн. This must be unique for every блокчейн.\nIf your testnet blockchains do not have unique chain IDs, you will have a bad time."
            }
          },
          {
            "name": "chunk_producer_assignment_changes_limit",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Limits the number of шард changes in chunk producer assignments,\nif algorithm is able to choose assignment with better balance of\nnumber of chunk producers for shards.",
              "format": "uint64",
              "default": 5
            }
          },
          {
            "name": "chunk_producer_kickout_threshold",
            "required": true,
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
              "format": "uint8",
              "default": 80
            }
          },
          {
            "name": "dynamic_resharding",
            "required": true,
            "schema": {
              "type": "boolean",
              "description": "Enable dynamic re-sharding."
            }
          },
          {
            "name": "epoch_length",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Epoch length counted in блока heights.",
              "format": "uint64"
            }
          },
          {
            "name": "fishermen_threshold",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Amount in yoctoNEAR"
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
            "name": "gas_price_adjustment_rate",
            "required": true,
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
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Height of genesis блока.",
              "format": "uint64"
            }
          },
          {
            "name": "genesis_time",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Official time of блокчейн start.",
              "format": "date-time"
            }
          },
          {
            "name": "max_gas_price",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Amount in yoctoNEAR"
            }
          },
          {
            "name": "max_inflation_rate",
            "required": true,
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
              "format": "uint8",
              "default": 100
            }
          },
          {
            "name": "min_gas_price",
            "required": true,
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
              "format": "uint64",
              "default": 10
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
              "format": "uint64",
              "default": 1
            }
          },
          {
            "name": "num_block_producer_seats",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Number of блока producer seats at genesis.",
              "format": "uint64"
            }
          },
          {
            "name": "num_block_producer_seats_per_shard",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Defines number of shards and number of блока producer seats per each shard at genesis.\nNote: not used with protocol_feature_chunk_only_producers -- replaced by minimum_validators_per_shard\nNote: not used before as all блока producers produce chunks for all shards",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "num_blocks_per_year",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Expected number of блоки per year",
              "format": "uint64"
            }
          },
          {
            "name": "num_chunk_only_producer_seats",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Deprecated.",
              "format": "uint64",
              "default": 300
            }
          },
          {
            "name": "num_chunk_producer_seats",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of chunk producers.\nDon't mess it up with chunk-only producers feature which is deprecated.",
              "format": "uint64",
              "default": 100
            }
          },
          {
            "name": "num_chunk_validator_seats",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "uint64",
              "default": 300
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
            "required": true,
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
            "required": true,
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
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Протокол version that this genesis works with.",
              "format": "uint32"
            }
          },
          {
            "name": "shard_layout",
            "required": false,
            "schema": {
              "type": "object",
              "description": "One of multiple possible types",
              "default": {
                "V2": {
                  "boundary_accounts": [],
                  "id_to_index_map": {
                    "0": 0
                  },
                  "index_to_id_map": {
                    "0": 0
                  },
                  "shard_ids": [
                    0
                  ],
                  "version": 0
                }
              }
            }
          },
          {
            "name": "shuffle_shard_assignment_for_chunk_producers",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "If true, shuffle the chunk producers across shards. In other words, if\nthe шард assignments were `[S_0, S_1, S_2, S_3]` where `S_i` represents\nthe set of chunk producers for шард `i`, if this flag were true, the\nшард assignments might become, for example, `[S_2, S_0, S_3, S_1]`.",
              "default": false
            }
          },
          {
            "name": "target_validator_mandates_per_shard",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of target chunk валидатора mandates for each shard.",
              "format": "uint64",
              "default": 68
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
            "name": "transaction_validity_period",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Number of блоки for which a given транзакции is valid",
              "format": "uint64"
            }
          },
          {
            "name": "use_production_config",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Используется только для тестов. Мы жёстко задаём часть конфигурации для mainnet и testnet\nв AllEpochConfig, и нам нужен способ протестировать этот путь в коде. Для этого и служит этот флаг.\nЕсли установить `true`, нода будет использовать тот же путь переопределения конфигурации, что и mainnet и testnet.",
              "default": false
            }
          },
          {
            "name": "валидаторы",
            "required": true,
            "schema": {
              "type": "array",
              "description": "List of initial валидаторы.",
              "items": {
                "type": "object",
                "description": "Аккаунт info for validators"
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
