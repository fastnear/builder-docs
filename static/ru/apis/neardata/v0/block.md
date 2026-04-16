# NEAR Data API - Финализированный блок
Получить финализированный блок по высоте
Получите полный документ финализированного блока на выбранной высоте — заголовок плюс каждый чанк и данные шарда.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/neardata/v0/block
- https://docs.fastnear.com/ru/apis/neardata/openapi/blocks/get_block
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/block/{block_height}`
- Исходная спецификация: `apis/neardata/v0/block.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/v0/block/9820210
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "block_height": "9820210"
  },
  "query": {}
}
```
### Входные данные
- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.
### Параметры пути

- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.

### Параметры запроса

- `apiKey` (query, string): Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Запрошенный документ или `null`, если выбранный срез отсутствует
### Схема ответа
```json
{
  "type": "object",
  "description": "Полный документ блока, который отдаёт neardata, включая `block` и `shards`.",
  "additionalProperties": true
}
```
