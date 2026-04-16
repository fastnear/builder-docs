# NEAR Data API - Первый блок
Перенаправление на первый блок после генезиса
Перенаправление на первый блок цепочки после генезиса — стартовый курсор для индексаторов, обходящих цепочку с начала.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/neardata/v0/first_block
- https://docs.fastnear.com/ru/apis/neardata/openapi/blocks/get_first_block
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/first_block`
- Исходная спецификация: `apis/neardata/v0/first_block.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/v0/first_block
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
- Краткое описание: Полный документ блока после автоматического прохождения перенаправления
### Схема ответа
```json
{
  "type": "object",
  "description": "Полный документ блока, который отдаёт neardata, включая `block` и `shards`.",
  "additionalProperties": true
}
```
