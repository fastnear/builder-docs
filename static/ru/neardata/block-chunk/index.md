# NEAR Data API - Чанк блока
Получить чанк из финализированного блока
Получите один чанк — транзакции и входящие квитанции одного шарда — на выбранной высоте блока.
## Ссылки на источник
- https://docs.fastnear.com/ru/neardata/block-chunk
- https://docs.fastnear.com/ru/apis/neardata/v0/block_chunk
- https://docs.fastnear.com/ru/apis/neardata/openapi/blocks/get_chunk
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/block/{block_height}/chunk/{shard_id}`
- Исходная спецификация: `apis/neardata/v0/block_chunk.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/v0/block/50000000/chunk/0
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "block_height": "50000000",
    "shard_id": "0"
  },
  "query": {}
}
```
### Входные данные
- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.
- `shard_id` (путь, обязательный, string): Идентификатор шарда, чанк которого нужно вернуть.
### Параметры пути

- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.
- `shard_id` (путь, обязательный, string): Идентификатор шарда, чанк которого нужно вернуть.

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
  "description": "Объект чанка для указанного ID шарда.",
  "additionalProperties": true
}
```
