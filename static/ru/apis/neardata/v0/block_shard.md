# NEAR Data API - Шард блока
Получить шард из финализированного блока
Возвращает объект шарда для запрошенного `shard_id` или `null`, если этот шард отсутствует. В зависимости от топологии деплоя запрос может быть перенаправлен на другой хост, которому принадлежит канонический архивный диапазон.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/neardata/v0/block_shard
- https://docs.fastnear.com/ru/apis/neardata/openapi/blocks/get_shard
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/block/{block_height}/shard/{shard_id}`
- Исходная спецификация: `apis/neardata/v0/block_shard.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/v0/block/9820210/shard/0
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "block_height": "9820210",
    "shard_id": "0"
  },
  "query": {}
}
```
### Входные данные
- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.
- `shard_id` (путь, обязательный, string): Идентификатор шарда, который нужно вернуть.
### Параметры пути

- `block_height` (путь, обязательный, string): Высота блока NEAR для запроса.
- `shard_id` (путь, обязательный, string): Идентификатор шарда, который нужно вернуть.

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
  "description": "Shard object for the requested шард ID.",
  "additionalProperties": true
}
```
