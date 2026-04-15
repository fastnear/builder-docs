# NEAR Data API - Заголовки блока
Получить объект блока для финализированного блока
Возвращает объект `block`, извлечённый из полного ответа по блоку, а не только вложенный объект `header`. В зависимости от топологии деплоя запрос может быть перенаправлен на другой хост, которому принадлежит канонический архивный диапазон.
## Ссылки на источник
- https://docs.fastnear.com/ru/neardata/block-headers
- https://docs.fastnear.com/ru/apis/neardata/v0/block_headers
- https://docs.fastnear.com/ru/apis/neardata/openapi/blocks/get_block_headers
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/block/{block_height}/headers`
- Исходная спецификация: `apis/neardata/v0/block_headers.yaml`
## Сети
- Mainnet: https://mainnet.neardata.xyz/
- Testnet: https://testnet.neardata.xyz/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ подписки FastNear. Неверные значения могут вернуть `401` до обработки перенаправления.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://mainnet.neardata.xyz/v0/block/9820210/headers
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
  "description": "Блок-level object returned by `/headers`, corresponding to the full ответ's `block` field.",
  "additionalProperties": true
}
```
