# RPC протокола NEAR: Конфигурация генезиса
Получить конфигурацию генезиса
Получите неизменяемую генезис-конфигурацию цепочки — начальные записи, настройки протокола и длину эпохи в блоке 0.
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
              "description": "Ожидаемое количество скрытых валидаторов на шард.",
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
              "description": "Порог исключения производителей блоков, значение от 0 до 100.",
              "format": "uint8"
            }
          },
          {
            "name": "chain_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "ID блокчейна. Должен быть уникальным для каждого блокчейна.\nЕсли у ваших testnet-блокчейнов chain ID не уникальны, вас ждут проблемы."
            }
          },
          {
            "name": "chunk_producer_assignment_changes_limit",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Ограничивает число изменений шардов в распределении производителей чанков,\nесли алгоритм способен выбрать распределение с лучшим балансом\nчисла производителей чанков по шардам.",
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
              "description": "Порог исключения нод, которые являются только валидаторами чанков, значение от 0 до 100.",
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
              "description": "Длина эпохи, измеряемая в высотах блоков.",
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
              "description": "Количество газа"
            }
          },
          {
            "name": "gas_price_adjustment_rate",
            "required": true,
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
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Высота генезис-блока.",
              "format": "uint64"
            }
          },
          {
            "name": "genesis_time",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Официальное время запуска блокчейна.",
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
              "description": "Максимальный процент стейка валидаторов, которых будем исключать.",
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
              "description": "Минимальный стейк, необходимый для стейкинга, — это последняя цена места, делённая на это число.",
              "format": "uint64",
              "default": 10
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
              "format": "uint64",
              "default": 1
            }
          },
          {
            "name": "num_block_producer_seats",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Количество мест для производителей блоков в генезисе.",
              "format": "uint64"
            }
          },
          {
            "name": "num_block_producer_seats_per_shard",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Задаёт количество шардов и количество мест для производителей блоков на каждый шард в генезисе.\nПрим.: не используется с protocol_feature_chunk_only_producers — заменено на minimum_validators_per_shard.\nПрим.: раньше не использовалось, так как все производители блоков выпускали чанки для всех шардов.",
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
              "description": "Ожидаемое количество блоков в год",
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
            "required": true,
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
            "required": true,
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
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Версия протокола, для которой предназначен этот genesis.",
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
              "description": "Если значение `true`, производители чанков перемешиваются между шардами. Иными словами, если\nраспределение шардов было `[S_0, S_1, S_2, S_3]`, где `S_i` — множество\nпроизводителей чанков для шарда `i`, то при включённом флаге\nраспределение может стать, например, `[S_2, S_0, S_3, S_1]`.",
              "default": false
            }
          },
          {
            "name": "target_validator_mandates_per_shard",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Целевое количество мандатов валидаторов чанков для каждого шарда.",
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
              "description": "Количество блоков, в течение которых заданная транзакция действительна",
              "format": "uint64"
            }
          },
          {
            "name": "use_production_config",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Используется только для тестов. Мы жёстко задаём часть конфигурации для mainnet и testnet\nв AllEpochConfig, и нам нужен способ протестировать этот путь в коде. Для этого и служит этот флаг.\nЕсли установить `true`, узел будет использовать тот же путь переопределения конфигурации, что и mainnet и testnet.",
              "default": false
            }
          },
          {
            "name": "валидаторы",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Список начальных валидаторов.",
              "items": {
                "type": "object",
                "description": "Информация об аккаунтах валидаторов"
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
