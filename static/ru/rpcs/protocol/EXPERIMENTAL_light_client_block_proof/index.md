# RPC протокола NEAR: Доказательство блока для лайт-клиента
Получить доказательство блока для лайт-клиента
Возвращает доказательство блока для лайт-клиента.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/protocol/EXPERIMENTAL_light_client_block_proof
- https://docs.fastnear.com/ru/rpcs/protocol/EXPERIMENTAL_light_client_block_proof/other/EXPERIMENTAL_light_client_block_proof
- https://docs.fastnear.com/ru/reference/operation/EXPERIMENTAL_light_client_block_proof
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/EXPERIMENTAL_light_client_block_proof.yaml`
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
  "method": "EXPERIMENTAL_light_client_block_proof",
  "params": {
    "block_hash": "8fbT7nWhBwsBJjPcwhv2uqzseFJSd5Y4XcqfLAWryBsu",
    "light_client_head": "6sddgq8nkENAz4f8qR72qxRPM25QWNBVMrkYr63DgC2E"
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
    "method": "EXPERIMENTAL_light_client_block_proof",
    "params": {
      "block_hash": "8fbT7nWhBwsBJjPcwhv2uqzseFJSd5Y4XcqfLAWryBsu",
      "light_client_head": "6sddgq8nkENAz4f8qR72qxRPM25QWNBVMrkYr63DgC2E"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `block_hash` (body, обязательный, string): Хеш в кодировке Base58.
- `light_client_head` (body, обязательный, string): Хеш в кодировке Base58.
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
          "EXPERIMENTAL_light_client_block_proof"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "block_hash",
          "light_client_head"
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
            "name": "light_client_head",
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
        "required": [
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
