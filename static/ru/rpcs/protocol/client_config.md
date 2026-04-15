# RPC протокола NEAR: Конфигурация клиента
Получить конфигурацию клиента
Запрашивает конфигурацию клиента узла.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/protocol/client_config
- https://docs.fastnear.com/ru/rpcs/protocol/client_config/other/client_config
- https://docs.fastnear.com/ru/reference/operation/client_config
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/client_config.yaml`
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
  "method": "client_config",
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
    "method": "client_config",
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
          "client_config"
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
        "description": "ClientConfig where some fields can be updated at runtime.",
        "properties": [
          {
            "name": "archive",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Not clear old data, set `true` for archive nodes."
            }
          },
          {
            "name": "block_fetch_horizon",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Горизонт, после которого вместо получения блока извлекается полное состояние.",
              "format": "uint64"
            }
          },
          {
            "name": "block_header_fetch_horizon",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Behind this horizon header fetch kicks in.",
              "format": "uint64"
            }
          },
          {
            "name": "block_production_tracking_delay",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Интервал проверки необходимости выпустить или пропустить блок.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "catchup_step_period",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Time between check to perform catchup.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "chain_id",
            "required": false,
            "schema": {
              "type": "string",
              "description": "ID цепочки для статуса."
            }
          },
          {
            "name": "chunk_distribution_network",
            "required": false,
            "schema": {
              "type": "object",
              "nullable": true,
              "description": "Конфигурация функции Chunk Distribution Network.\nОна позволяет узлам отправлять и получать чанки через центральный поток.\nПреимущества такого подхода: (1) меньше трафика запросов и ответов\nв одноранговой сети и (2) меньшая задержка для RPC-узлов, индексирующих цепочку.",
              "properties": [
                {
                  "name": "enabled",
                  "required": false,
                  "schema": {
                    "type": "boolean"
                  }
                },
                {
                  "name": "uris",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "URI для функции Chunk Distribution Network."
                  }
                }
              ]
            }
          },
          {
            "name": "chunk_request_retry_period",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Время между проверками на повторный запрос чанков.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "chunk_validation_threads",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of threads for ChunkValidationActor pool.",
              "format": "uint"
            }
          },
          {
            "name": "chunk_wait_mult",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Multiplier for the wait time for all chunks to be received.",
              "items": {
                "type": "integer",
                "format": "int32"
              }
            }
          },
          {
            "name": "chunks_cache_height_horizon",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Height horizon for the chunk cache. A chunk is removed from the cache\nif its height + chunks_cache_height_horizon < largest_seen_height.\nThe default value is DEFAULT_CHUNKS_CACHE_HEIGHT_HORIZON.",
              "format": "uint64"
            }
          },
          {
            "name": "client_background_migration_threads",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Количество потоков, выполняющих фоновые миграционные работы в клиенте.",
              "format": "uint"
            }
          },
          {
            "name": "cloud_archival_writer",
            "required": false,
            "schema": {
              "type": "object",
              "nullable": true,
              "description": "Конфигурация облачного компонента записи архивных данных. Если эта конфигурация задана, компонент включается и\nзаписывает данные, связанные с чанками, на основе отслеживаемых шардов. Эта конфигурация также управляет дополнительным архивным\nповедением, например записью данных блоков и интервалом опроса.",
              "properties": [
                {
                  "name": "archive_block_data",
                  "required": false,
                  "schema": {
                    "type": "boolean",
                    "description": "Определяет, должны ли данные, связанные с блоками, записываться в облачное хранилище.",
                    "default": false
                  }
                },
                {
                  "name": "polling_interval",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "Интервал, с которым система проверяет новые блоки или чанки для архивации.",
                    "default": {
                      "nanos": 0,
                      "secs": 1
                    }
                  }
                }
              ]
            }
          },
          {
            "name": "disable_tx_routing",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Если значение `true`, узел не будет пересылать транзакции следующим производителям чанков."
            }
          },
          {
            "name": "doomslug_step_period",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Time between running doomslug timer.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "enable_early_prepare_transactions",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Если значение `true`, транзакции для следующего чанка будут подготавливаться заранее, сразу после того,\nкак будет готово post-state предыдущего чанка. Это помогает быстрее выпускать чанки в сетях с высокой пропускной способностью.\nТекущая реализация увеличивает задержку в сетях с низкой нагрузкой; это будет исправлено позже.\nПо умолчанию параметр отключён."
            }
          },
          {
            "name": "enable_multiline_logging",
            "required": false,
            "schema": {
              "type": "boolean"
            }
          },
          {
            "name": "enable_statistics_export",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Re-export storage layer statistics as prometheus metrics."
            }
          },
          {
            "name": "epoch_length",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Epoch length.",
              "format": "uint64"
            }
          },
          {
            "name": "epoch_sync",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Options for epoch sync.",
              "properties": [
                {
                  "name": "epoch_sync_horizon_num_epochs",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "description": "Количество эпох от головы сети, за пределами которого узел переключится с header-синхронизации\nна epoch-синхронизацию. На стороне потребителя это значение\nумножается на epoch_length, чтобы получить горизонт в блоках.",
                    "format": "uint64",
                    "default": 2
                  }
                },
                {
                  "name": "timeout_for_epoch_sync",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "Timeout for epoch sync requests. The node will continue retrying indefinitely even\nif this timeout is exceeded."
                  }
                }
              ]
            }
          },
          {
            "name": "expected_shutdown",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Корректное завершение работы на ожидаемой высоте блока."
            }
          },
          {
            "name": "gc",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Configuration for garbage collection.",
              "properties": [
                {
                  "name": "gc_blocks_limit",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "description": "Максимальное количество блоков, собираемых сборщиком мусора\nза один вызов.",
                    "format": "uint64",
                    "default": 2
                  }
                },
                {
                  "name": "gc_fork_clean_step",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "description": "Maximum number of height to go through at each garbage collection step\nwhen cleaning forks during garbage collection.",
                    "format": "uint64",
                    "default": 100
                  }
                },
                {
                  "name": "gc_num_epochs_to_keep",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "description": "Number of epochs for which we keep store data.",
                    "format": "uint64",
                    "default": 5
                  }
                },
                {
                  "name": "gc_step_period",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "description": "How often gc should be run",
                    "default": {
                      "nanos": 500000000,
                      "secs": 0
                    }
                  }
                }
              ]
            }
          },
          {
            "name": "header_sync_expected_height_per_second",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Expected increase of header head height per second during header sync",
              "format": "uint64"
            }
          },
          {
            "name": "header_sync_initial_timeout",
            "required": false,
            "schema": {
              "type": "array",
              "description": "How much time to wait after initial header sync",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "header_sync_progress_timeout",
            "required": false,
            "schema": {
              "type": "array",
              "description": "How much time to wait after some progress is made in header sync",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "header_sync_stall_ban_timeout",
            "required": false,
            "schema": {
              "type": "array",
              "description": "How much time to wait before banning a peer in header sync if sync is too slow",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "log_summary_period",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Period between logging summary information.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "log_summary_style",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Enable coloring of the logs",
              "enum": [
                "plain",
                "colored"
              ]
            }
          },
          {
            "name": "max_block_production_delay",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Максимальное время ожидания подтверждений перед выпуском блока.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "max_block_wait_delay",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Maximum duration before skipping given height.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "max_gas_burnt_view",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "Количество газа"
            }
          },
          {
            "name": "min_block_production_delay",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Минимальная длительность перед выпуском блока.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "min_num_peers",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Minimum number of peers to start syncing.",
              "format": "uint"
            }
          },
          {
            "name": "num_block_producer_seats",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Количество мест для производителей блоков",
              "format": "uint64"
            }
          },
          {
            "name": "orphan_state_witness_max_size",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Максимальный размер state witness в OrphanStateWitnessPool.\nВ пуле сохраняются только orphan-witness, размер которых меньше этого значения.\nЭто ограничивает максимальное потребление памяти пулом OrphanStateWitnessPool.",
              "format": "uint64"
            }
          },
          {
            "name": "orphan_state_witness_pool_size",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "OrphanStateWitnessPool хранит экземпляры ChunkStateWitness, которые нельзя обработать,\nпотому что предыдущий блок недоступен. Эти witness остаются в пуле, пока\nне появится нужный блок. Эта переменная определяет, сколько witness можно хранить в пуле.",
              "format": "uint"
            }
          },
          {
            "name": "produce_chunk_add_transactions_time_limit",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Ограничивает время добавления транзакций в чанк.\nНода формирует чанк, добавляя транзакции из пула транзакций, пока\nне будет достигнут один из лимитов. Этот лимит по времени гарантирует, что добавление транзакций не займёт\nдольше указанной длительности и поможет быстрее выпустить чанк."
            }
          },
          {
            "name": "produce_empty_blocks",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Выпускать пустые блоки; значение `false` используется для тестирования."
            }
          },
          {
            "name": "protocol_version_check",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Определяет, проверяет ли узел совместимость версии сети для следующей или через одну эпохи.",
              "enum": [
                "Next",
                "NextNext"
              ]
            }
          },
          {
            "name": "resharding_config",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "rpc_addr",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "Порт RPC для статуса, на котором слушает узел."
            }
          },
          {
            "name": "save_invalid_witnesses",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Save observed instances of invalid ChunkStateWitness to the database in DBCol::InvalidChunkStateWitnesses.\nSaving invalid witnesses is useful for analysis and debugging.\nThis option can cause extra load on the database and is not recommended for production use."
            }
          },
          {
            "name": "save_latest_witnesses",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Сохраняет наблюдаемые экземпляры ChunkStateWitness в базу данных DBCol::LatestChunkStateWitnesses.\nСохранение последних экземпляров ChunkStateWitness полезно для анализа и отладки.\nЭта опция может создавать дополнительную нагрузку на базу данных и не рекомендуется для продового контура."
            }
          },
          {
            "name": "save_state_changes",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Нужно ли сохранять изменения состояния на диск."
            }
          },
          {
            "name": "save_trie_changes",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "save_trie_changes should be set to true iff\n- archive if false - non-archival nodes need trie changes to perform garbage collection\n- archive is true, cold_store is configured and migration to split_storage is finished - node\nworking in split storage mode needs trie changes in order to do garbage collection on hot."
            }
          },
          {
            "name": "save_tx_outcomes",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Нужно ли сохранять результаты транзакций на диск."
            }
          },
          {
            "name": "save_untracked_partial_chunks_parts",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Whether to persist partial chunk parts for untracked shards or not."
            }
          },
          {
            "name": "skip_sync_wait",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Skip waiting for sync (for testing or single node testnet)."
            }
          },
          {
            "name": "state_request_server_threads",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Number of threads for StateRequestActor pool.",
              "format": "uint"
            }
          },
          {
            "name": "state_request_throttle_period",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Количество секунд между запросами состояния для view-клиента.\nОкно троттлинга для запросов состояния (заголовки и части).",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "state_requests_per_throttle_period",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Максимальное количество запросов состояния, обслуживаемых за период троттлинга",
              "format": "uint"
            }
          },
          {
            "name": "state_sync",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Параметры синхронизации состояния.",
              "properties": [
                {
                  "name": "concurrency",
                  "required": false,
                  "schema": {
                    "type": "object"
                  }
                },
                {
                  "name": "dump",
                  "required": false,
                  "schema": {
                    "type": "object",
                    "nullable": true,
                    "description": "Настраивает способ выгрузки состояния во внешнее хранилище."
                  }
                },
                {
                  "name": "parts_compression_lvl",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "description": "Уровень сжатия Zstd для частей состояния.",
                    "format": "int32",
                    "default": 1
                  }
                },
                {
                  "name": "sync",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "nullable": true,
                    "description": "Синхронизирует состояние от пиров, не читая ничего из внешнего хранилища.",
                    "enum": [
                      "Peers"
                    ]
                  }
                }
              ]
            }
          },
          {
            "name": "state_sync_enabled",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Использовать ли механизм State Sync.\nЕсли отключён, узел будет выполнять Block Sync вместо State Sync."
            }
          },
          {
            "name": "state_sync_external_backoff",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Дополнительное время ожидания после неудачного запроса к внешнему хранилищу",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "state_sync_external_timeout",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Как долго ждать ответа от централизованной синхронизации состояния",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "state_sync_p2p_timeout",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Как долго ждать ответа от p2p-синхронизации состояния",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "state_sync_retry_backoff",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Как долго ждать после неудачного запроса синхронизации состояния",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "sync_check_period",
            "required": false,
            "schema": {
              "type": "array",
              "description": "How often to check that we are not out of sync.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "sync_height_threshold",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Sync height threshold: below this difference in height don't start syncing.",
              "format": "uint64"
            }
          },
          {
            "name": "sync_max_block_requests",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Максимальное количество запросов блоков, отправляемых пирам для синхронизации",
              "format": "uint"
            }
          },
          {
            "name": "sync_step_period",
            "required": false,
            "schema": {
              "type": "array",
              "description": "While syncing, how long to check for each step.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "tracked_shards_config",
            "required": false,
            "schema": {
              "type": "object",
              "description": "One of multiple possible types"
            }
          },
          {
            "name": "transaction_pool_size_limit",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true,
              "description": "Ограничение размера пула транзакций одного шарда в байтах. Если не задано,\nразмер не ограничен.",
              "format": "uint64"
            }
          },
          {
            "name": "transaction_request_handler_threads",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "uint"
            }
          },
          {
            "name": "trie_viewer_state_size_limit",
            "required": false,
            "schema": {
              "type": "integer",
              "nullable": true,
              "description": "Верхняя граница размера состояния контракта в байтах, при котором оно ещё доступно для просмотра. None — без ограничения",
              "format": "uint64"
            }
          },
          {
            "name": "ttl_account_id_router",
            "required": false,
            "schema": {
              "type": "array",
              "description": "Time to persist Accounts Id in the router without removing them.",
              "items": {
                "type": "integer",
                "format": "uint64"
              }
            }
          },
          {
            "name": "tx_routing_height_horizon",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Если узел не является производителем чанков в пределах этого числа блоков,\nмаршрутизировать запросы к будущим производителям чанков.",
              "format": "uint64"
            }
          },
          {
            "name": "version",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Data structure for semver version and github tag or commit.",
              "required": [
                "version",
                "build",
                "commit"
              ],
              "properties": [
                {
                  "name": "build",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "commit",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "rustc_version",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "default": ""
                  }
                },
                {
                  "name": "version",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                }
              ]
            }
          },
          {
            "name": "view_client_threads",
            "required": false,
            "schema": {
              "type": "integer",
              "description": "Количество потоков для пула ViewClientActor.",
              "format": "uint"
            }
          },
          {
            "name": "dynamic_resharding_dry_run",
            "required": false,
            "schema": {
              "type": "boolean",
              "description": "Если значение `true`, рантайм выполнит пробный динамический ресхардинг на последнем блоке каждой эпохи.\nЭто означает вычисление предварительных граничных аккаунтов для разделения отслеживаемых шардов."
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
