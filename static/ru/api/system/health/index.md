# FastNear API - Состояние
Проверить состояние сервиса
Возвращает `ok`, когда сервис исправен. Если FastNear деградирует, то это же поле `status` содержит диагностическую строку.
## Ссылки на источник
- https://docs.fastnear.com/ru/api/system/health
- https://docs.fastnear.com/ru/apis/fastnear/system/health
- https://docs.fastnear.com/ru/apis/fastnear/openapi/system/get_health
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/health`
- Исходная спецификация: `apis/fastnear/system/health.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/health
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
- Краткое описание: Строка состояния сервиса
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "статус"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "статус",
      "required": true,
      "schema": {
        "type": "string"
      }
    }
  ],
  "refName": "HealthResponse"
}
```
