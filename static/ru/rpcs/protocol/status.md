# RPC протокола NEAR: Статус узла
Получить статус узла
Получите версию узла, прогресс синхронизации и последний обработанный блок в одном ответе.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/protocol/status
- https://docs.fastnear.com/ru/rpcs/protocol/status/other/status
- https://docs.fastnear.com/ru/reference/operation/status
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/status.yaml`
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
  "method": "статус",
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
    "method": "статус",
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
          "статус"
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
          "version",
          "chain_id",
          "protocol_version",
          "latest_protocol_version",
          "валидаторы",
          "sync_info",
          "node_public_key",
          "uptime_sec",
          "genesis_hash"
        ],
        "properties": [
          {
            "name": "chain_id",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Unique chain id."
            }
          },
          {
            "name": "detailed_debug_status",
            "required": false,
            "schema": {
              "type": "object",
              "nullable": true,
              "required": [
                "network_info",
                "sync_status",
                "catchup_status",
                "current_head_status",
                "current_header_head_status",
                "block_production_delay_millis"
              ],
              "properties": [
                {
                  "name": "block_production_delay_millis",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "catchup_status",
                  "required": true,
                  "schema": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                },
                {
                  "name": "current_head_status",
                  "required": true,
                  "schema": {
                    "type": "object",
                    "description": "Высота и хеш блока"
                  }
                },
                {
                  "name": "current_header_head_status",
                  "required": true,
                  "schema": {
                    "type": "object",
                    "description": "Высота и хеш блока"
                  }
                },
                {
                  "name": "network_info",
                  "required": true,
                  "schema": {
                    "type": "object"
                  }
                },
                {
                  "name": "sync_status",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                }
              ]
            }
          },
          {
            "name": "genesis_hash",
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
              "description": "Последняя версия протокола, поддерживаемая этим клиентом.",
              "format": "uint32"
            }
          },
          {
            "name": "node_key",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "Публичный ключ с префиксом ed25519: или secp256k1:"
            }
          },
          {
            "name": "node_public_key",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Публичный ключ с префиксом ed25519: или secp256k1:"
            }
          },
          {
            "name": "protocol_version",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Текущая активная версия протокола.",
              "format": "uint32"
            }
          },
          {
            "name": "rpc_addr",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "Адрес RPC-сервера. None, если у узла не включён RPC-эндпоинт."
            }
          },
          {
            "name": "sync_info",
            "required": true,
            "schema": {
              "type": "object",
              "description": "Статус синхронизации узла.",
              "required": [
                "latest_block_hash",
                "latest_block_height",
                "latest_state_root",
                "latest_block_time",
                "syncing"
              ],
              "properties": [
                {
                  "name": "earliest_block_hash",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "nullable": true,
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "earliest_block_height",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "nullable": true,
                    "format": "uint64"
                  }
                },
                {
                  "name": "earliest_block_time",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "nullable": true
                  }
                },
                {
                  "name": "epoch_id",
                  "required": false,
                  "schema": {
                    "type": "string",
                    "nullable": true,
                    "description": "Base58-encoded epoch identifier hash"
                  }
                },
                {
                  "name": "epoch_start_height",
                  "required": false,
                  "schema": {
                    "type": "integer",
                    "nullable": true,
                    "format": "uint64"
                  }
                },
                {
                  "name": "latest_block_hash",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "latest_block_height",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
                  }
                },
                {
                  "name": "latest_block_time",
                  "required": true,
                  "schema": {
                    "type": "string"
                  }
                },
                {
                  "name": "latest_state_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "syncing",
                  "required": true,
                  "schema": {
                    "type": "boolean"
                  }
                }
              ]
            }
          },
          {
            "name": "uptime_sec",
            "required": true,
            "schema": {
              "type": "integer",
              "description": "Uptime of the node.",
              "format": "int64"
            }
          },
          {
            "name": "validator_account_id",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "ID аккаунта NEAR"
            }
          },
          {
            "name": "validator_public_key",
            "required": false,
            "schema": {
              "type": "string",
              "nullable": true,
              "description": "Публичный ключ с префиксом ed25519: или secp256k1:"
            }
          },
          {
            "name": "валидаторы",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Валидаторы текущей эпохи.",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "version",
            "required": true,
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
