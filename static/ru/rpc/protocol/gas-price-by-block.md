# RPC протокола NEAR: Цена газа по блоку
Получить цену газа по блоку
Получите общесетевую цену газа на выбранном историческом блоке — по высоте или хешу.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpc/protocol/gas-price-by-block
- https://docs.fastnear.com/ru/rpcs/protocol/gas_price_by_block
- https://docs.fastnear.com/ru/rpcs/protocol/gas_price_by_block/other/gas_price_by_block
- https://docs.fastnear.com/ru/reference/operation/gas_price_by_block
## Операция
- Транспорт: json-rpc
- Метод: POST
- Путь: `/`
- Исходная спецификация: `rpcs/protocol/gas_price_by_block.yaml`
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
  "method": "gas_price",
  "params": {
    "block_id": "9XN7MtDywZvfGx6TKy1MT2iCZkKuHikJXmNazxdZ4x6T"
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
    "method": "gas_price",
    "params": {
      "block_id": "9XN7MtDywZvfGx6TKy1MT2iCZkKuHikJXmNazxdZ4x6T"
    }
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `block_id` (body, обязательный, integer | string): Высота блока (целое число) или хеш блока (строка).
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
          "gas_price"
        ]
      }
    },
    {
      "name": "params",
      "required": true,
      "schema": {
        "type": "object",
        "required": [
          "block_id"
        ],
        "properties": [
          {
            "name": "block_id",
            "required": true,
            "schema": {
              "description": "Высота блока (целое число) или хеш блока (строка)",
              "oneOf": [
                {
                  "type": "integer",
                  "description": "Высота блока"
                },
                {
                  "type": "string",
                  "description": "Хеш блока в кодировке Base58"
                }
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
        "required": [
          "gas_price"
        ],
        "properties": [
          {
            "name": "gas_price",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Amount in yoctoNEAR"
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
