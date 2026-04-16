# RPC протокола NEAR: Доказательство для лайт-клиента
Получить доказательство для лайт-клиента
Получите Merkle-доказательство того, что транзакция или квитанция была включена и исполнена — для верификации лайт-клиентом.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/protocol/light_client_proof
- https://docs.fastnear.com/ru/rpcs/protocol/light_client_proof/other/light_client_proof
- https://docs.fastnear.com/ru/reference/operation/light_client_proof
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/light_client_proof.yaml`
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
  "method": "light_client_proof",
  "params": {
    "type": "транзакция",
    "transaction_hash": "34E7weKCDqXh3xPKdBgSWRqo44yTWjbka9deMK8JbAxx",
    "sender_id": "escrow.ai.near",
    "light_client_head": "9XN7MtDywZvfGx6TKy1MT2iCZkKuHikJXmNazxdZ4x6T"
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
    "method": "light_client_proof",
    "params": {
      "type": "транзакция",
      "transaction_hash": "34E7weKCDqXh3xPKdBgSWRqo44yTWjbka9deMK8JbAxx",
      "sender_id": "escrow.ai.near",
      "light_client_head": "9XN7MtDywZvfGx6TKy1MT2iCZkKuHikJXmNazxdZ4x6T"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `light_client_head` (body, обязательный, string): Хеш в кодировке Base58.
- `sender_id` (body, string): ID аккаунта NEAR.
- `transaction_hash` (body, string): Хеш в кодировке Base58.
- `type` (body, string)
- `receipt_id` (body, string): Base58-encoded hash
- `receiver_id` (body, string): ID аккаунта NEAR
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
          "light_client_proof"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "light_client_head"
        ],
        "properties": [
          {
            "name": "light_client_head",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "sender_id",
            "required": false,
            "schema": {
              "type": "string",
              "description": "ID аккаунта NEAR"
            }
          },
          {
            "name": "transaction_hash",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "type",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "квитанция"
              ]
            }
          },
          {
            "name": "receipt_id",
            "required": false,
            "schema": {
              "type": "string",
              "description": "Base58-encoded hash"
            }
          },
          {
            "name": "receiver_id",
            "required": false,
            "schema": {
              "type": "string",
              "description": "ID аккаунта NEAR"
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
          "outcome_proof",
          "outcome_root_proof",
          "block_header_lite",
          "block_proof"
        ],
        "properties": [
          {
            "name": "block_header_lite",
            "required": true,
            "schema": {
              "type": "object",
              "required": [
                "prev_block_hash",
                "inner_rest_hash",
                "inner_lite"
              ],
              "properties": [
                {
                  "name": "inner_lite",
                  "required": true,
                  "schema": {
                    "type": "object",
                    "description": "Часть состояния для текущей головы лёгкого клиента. Подробнее [здесь](https://nomicon.io/ChainSpec/LightClient)."
                  }
                },
                {
                  "name": "inner_rest_hash",
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
                }
              ]
            }
          },
          {
            "name": "block_proof",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "outcome_proof",
            "required": true,
            "schema": {
              "type": "object",
              "required": [
                "доказательство",
                "block_hash",
                "id",
                "outcome"
              ],
              "properties": [
                {
                  "name": "block_hash",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "id",
                  "required": true,
                  "schema": {
                    "type": "string",
                    "description": "Base58-encoded hash"
                  }
                },
                {
                  "name": "outcome",
                  "required": true,
                  "schema": {
                    "type": "object"
                  }
                },
                {
                  "name": "доказательство",
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
            "name": "outcome_root_proof",
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
