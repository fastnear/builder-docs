# NEAR Data API - Состояние
Проверить состояние сервиса
Проверьте работоспособность сервиса NEAR Data — возвращает `{status: ok}` при успехе, ошибку при проблемах.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/neardata/system/health
- https://docs.fastnear.com/ru/apis/neardata/openapi/system/get_health
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/health`
- Исходная спецификация: `apis/neardata/system/health.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/health
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

- `apiKey` (query, string): Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Поле состояния сервиса
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
