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
              "description": "Финальность блока",
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
              "description": "Ожидаемое количество скрытых валидаторов на шард.",
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
              "description": "Порог исключения производителей блоков, значение от 0 до 100.",
              "format": "uint8"
            }
          },
          {
            "name": "chain_id",
            "required": false,
            "schema": {
              "type": "string",
              "description": "ID блокчейна. Должен быть уникальным для каждого блокчейна.\nЕсли у ваших testnet-блокчейнов chain ID не уникальны, вас ждут проблемы."
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
              "description": "Порог исключения нод, которые являются только валидаторами чанков, значение от 0 до 100.",
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
              "description": "Длина эпохи, измеряемая в высотах блоков.",
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
              "description": "Количество газа"
            }
          },
          {
            "name": "gas_price_adjustment_rate",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Коэффициент корректировки цены газа",
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
              "description": "Высота генезис-блока.",
              "format": "uint64"
            }
          },
          {
            "name": "genesis_time",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Официальное время запуска блокчейна.",
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
              "description": "Максимальный процент стейка валидаторов, которых будем исключать.",
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
              "description": "Минимальный стейк, необходимый для стейкинга, — это последняя цена места, делённая на это число.",
              "format": "uint64"
            }
          },
          {
            "name": "minimum_stake_ratio",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Минимальное отношение s/s_total, которое может быть у производителя блоков.\nПодробнее см. <https://github.com/near/NEPs/pull/167>",
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
              "description": "Минимальное количество валидаторов, которое должно быть в каждом шарде",
              "format": "uint64"
            }
          },
          {
            "name": "num_block_producer_seats",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Количество мест для производителей блоков в генезисе.",
              "format": "uint64"
            }
          },
          {
            "name": "num_block_producer_seats_per_shard",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Задаёт количество шардов и количество мест для производителей блоков на каждый шард в генезисе.",
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
              "description": "Ожидаемое количество блоков в год",
              "format": "uint64"
            }
          },
          {
            "name": "online_max_threshold",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Максимальный порог онлайна, выше которого валидатор получает полную награду.",
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
              "description": "Минимальный порог онлайна, ниже которого валидатор не получает награду.",
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
              "description": "Ставка казны протокола",
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
              "description": "ID аккаунта NEAR"
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
              "description": "Представление, сохраняющее JSON-формат runtime-конфигурации.",
              "properties": [
                {
                  "name": "account_creation_config",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "Структура описывает конфигурацию создания новых аккаунтов."
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
                    "description": "Конфигурация операций wasm."
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
              "description": "Если значение `true`, производители чанков перемешиваются между шардами. Иными словами, если\nраспределение шардов было `[S_0, S_1, S_2, S_3]`, где `S_i` — множество\nпроизводителей чанков для шарда `i`, то при включённом флаге\nраспределение может стать, например, `[S_2, S_0, S_3, S_1]`."
            }
          },
          {
            "name": "target_validator_mandates_per_shard",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Целевое количество мандатов валидаторов чанков для каждого шарда.",
              "format": "uint64"
            }
          },
          {
            "name": "transaction_validity_period",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Количество блоков, в течение которых заданная транзакция действительна",
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
