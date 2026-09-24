# RPC протокола NEAR: Сведения о сети
Получить сведения о сети
Получите список активных подключений к пирам узла и отслеживаемых им производителей блоков.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/protocol/network_info
- https://docs.fastnear.com/ru/rpcs/protocol/network_info/other/network_info
- https://docs.fastnear.com/ru/reference/operation/network_info
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
## OpenAPI
- Эта операция: https://docs.fastnear.com/openapi/rpc/network_info.json (https://docs.fastnear.com/openapi/rpc/network_info.yaml)
- Полный документ API: https://docs.fastnear.com/openapi/rpc.json
- Указатель в полном документе: https://docs.fastnear.com/openapi/rpc.json#/paths/~1network_info/post
## Сети
- Mainnet: https://rpc.mainnet.fastnear.com/
- Testnet: https://rpc.testnet.fastnear.com/
## Авторизация
- Bearer-токен через заголовок `Authorization: Bearer <token>`
- API-ключ через query `apiKey`: API-ключ FastNEAR в параметре запроса `apiKey`. Удобно для curl и клиентов, которые не могут задавать заголовки, но ключ может попасть в URL, логи и историю команд оболочки.
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
  "method": "network_info",
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
    "method": "network_info",
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
          "network_info"
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
          "active_peers",
          "num_active_peers",
          "peer_max_count",
          "sent_bytes_per_sec",
          "received_bytes_per_sec",
          "known_producers"
        ],
        "properties": [
          {
            "name": "active_peers",
            "required": true,
            "schema": {
              "type": "array",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "known_producers",
            "required": true,
            "schema": {
              "type": "array",
              "description": "Аккаунты известных производителей блоков и чанков из таблицы маршрутизации.",
              "items": {
                "type": "object"
              }
            }
          },
          {
            "name": "num_active_peers",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint"
            }
          },
          {
            "name": "peer_max_count",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint32"
            }
          },
          {
            "name": "received_bytes_per_sec",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "uint64"
            }
          },
          {
            "name": "sent_bytes_per_sec",
            "required": true,
            "schema": {
              "type": "integer",
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
