# FastNear API - Статус
Получить статус синхронизации сервиса
Проверьте текущую индексированную высоту блока, задержку и версию развёрнутого сервиса.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/fastnear/system/status
- https://docs.fastnear.com/ru/apis/fastnear/openapi/system/get_status
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/status`
- Исходная спецификация: `apis/fastnear/system/status.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/status
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {},
  "query": {}
}
```
### Параметры запроса

- `apiKey` (query, string): Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Текущий статус синхронизации FastNear API
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "version",
    "sync_block_height",
    "sync_latency_sec",
    "sync_block_timestamp_nanosec",
    "sync_balance_block_height"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "sync_balance_block_height",
      "required": true,
      "schema": {
        "type": "integer",
        "format": "uint64"
      }
    },
    {
      "name": "sync_block_height",
      "required": true,
      "schema": {
        "type": "integer",
        "format": "uint64"
      }
    },
    {
      "name": "sync_block_timestamp_nanosec",
      "required": true,
      "schema": {
        "type": "string"
      }
    },
    {
      "name": "sync_latency_sec",
      "required": true,
      "schema": {
        "type": "number",
        "format": "double"
      }
    },
    {
      "name": "version",
      "required": true,
      "schema": {
        "type": "string"
      }
    }
  ],
  "refName": "StatusResponse"
}
```
