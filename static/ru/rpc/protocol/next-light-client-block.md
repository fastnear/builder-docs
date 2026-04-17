# RPC протокола NEAR: Следующий блок для лайт-клиента
Получить следующий блок для лайт-клиента
Получите следующий заголовок блока для лайт-клиента после известного хеша вершины его верифицированной цепочки в кодировке Base58.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/protocol/next-light-client-block
- https://docs.fastnear.com/ru/rpcs/protocol/next_light_client_block
- https://docs.fastnear.com/ru/rpcs/protocol/next_light_client_block/other/next_light_client_block
- https://docs.fastnear.com/ru/reference/operation/next_light_client_block
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/next_light_client_block.yaml`
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
  "method": "next_light_client_block",
  "params": {
    "last_block_hash": "9XN7MtDywZvfGx6TKy1MT2iCZkKuHikJXmNazxdZ4x6T"
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
    "method": "next_light_client_block",
    "params": {
      "last_block_hash": "9XN7MtDywZvfGx6TKy1MT2iCZkKuHikJXmNazxdZ4x6T"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `last_block_hash` (body, обязательный, string): Хеш в кодировке Base58.
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
          "next_light_client_block"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "last_block_hash"
        ],
        "properties": [
          {
            "name": "last_block_hash",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
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
        "description": "Состояние для текущей головы лёгкого клиента. Подробнее [здесь](https://nomicon.io/ChainSpec/LightClient).",
        "properties": [
          {
            "name": "approvals_after_next",
            "required": false,
            "schema": {
              "type": "array",
              "items": {
                "type": "string",
                "nullable": true,
                "description": "Base58-encoded cryptographic signature"
              }
            }
          },
          {
            "name": "inner_lite",
            "required": false,
            "schema": {
              "type": "object",
              "description": "Часть состояния для текущей головы лёгкого клиента. Подробнее [здесь](https://nomicon.io/ChainSpec/LightClient).",
              "required": [
                "height",
                "epoch_id",
                "next_epoch_id",
                "prev_state_root",
                "outcome_root",
                "timestamp",
                "timestamp_nanosec",
                "next_bp_hash",
                "block_merkle_root"
              ],
              "properties": [
                {
                  "name": "block_merkle_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
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
                  "name": "height",
                  "required": true,
                  "schema": {
                    "type": "integer",
                    "format": "uint64"
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
                  "name": "prev_state_root",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
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
                }
              ]
            }
          },
          {
            "name": "inner_rest_hash",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "next_block_inner_hash",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "next_bps",
            "required": false,
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "description": "One of multiple possible types"
              }
            }
          },
          {
            "name": "prev_block_hash",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
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
