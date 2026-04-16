# FastNear API - V1 Поиск по публичному ключу (все)
Найти все индексированные аккаунты по публичному ключу
Получите все аккаунты, связанные с публичным ключом — ключи полного доступа и ключи с ограничениями вместе.
## Ссылки на источник
- https://docs.fastnear.com/ru/api/v1/public-key-all
- https://docs.fastnear.com/ru/apis/fastnear/v1/public_key_lookup_all
- https://docs.fastnear.com/ru/apis/fastnear/openapi/public-key/lookup_by_public_key_all_v1
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v1/public_key/{public_key}/all`
- Исходная спецификация: `apis/fastnear/v1/public_key_lookup_all.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/v1/public_key/ed25519%3ACCaThr3uokqnUs6Z5vVnaDcJdrfuTpYJHJWcAGubDjT/all
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "public_key": "ed25519:CCaThr3uokqnUs6Z5vVnaDcJdrfuTpYJHJWcAGubDjT"
  },
  "query": {}
}
```
### Входные данные
- `public_key` (путь, обязательный, string): Публичный ключ NEAR в формате `ed25519:...` или `secp256k1:...`.
### Параметры пути

- `public_key` (путь, обязательный, string): Публичный ключ NEAR в формате `ed25519:...` или `secp256k1:...`.

### Параметры запроса

- `apiKey` (query, string): Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Подходящие ID аккаунтов для переданного публичного ключа, включая ключи ограниченного доступа
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "public_key",
    "account_ids"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "account_ids",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    {
      "name": "public_key",
      "required": true,
      "schema": {
        "type": "string"
      }
    }
  ],
  "refName": "PublicKeyLookupResponse"
}
```
