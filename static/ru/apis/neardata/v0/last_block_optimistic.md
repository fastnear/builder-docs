# NEAR Data API - Последний оптимистичный блок
Перенаправление на последний оптимистичный блок
Возвращает перенаправление на канонический URL последнего оптимистичного блока для текущего деплоя. Клиенты, которые автоматически следуют перенаправлению, вместо этого получат итоговый документ блока.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/neardata/v0/last_block_optimistic
- https://docs.fastnear.com/ru/apis/neardata/openapi/blocks/get_last_block_optimistic
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/last_block/optimistic`
- Исходная спецификация: `apis/neardata/v0/last_block_optimistic.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/v0/last_block/optimistic
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
