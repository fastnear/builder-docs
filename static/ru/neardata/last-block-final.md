# NEAR Data API - Последний финализированный блок
Перенаправление на последний финализированный блок
Возвращает перенаправление на канонический URL последнего финализированного блока для текущего деплоя. Клиенты, которые автоматически проходят перенаправление, вместо этого получат полный документ блока.
## Ссылки на источник
- https://docs.fastnear.com/ru/neardata/last-block-final
- https://docs.fastnear.com/ru/apis/neardata/v0/last_block_final
- https://docs.fastnear.com/ru/apis/neardata/openapi/blocks/get_last_block_final
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/last_block/final`
- Исходная спецификация: `apis/neardata/v0/last_block_final.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/v0/last_block/final
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
