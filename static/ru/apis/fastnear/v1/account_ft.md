# FastNear API - V1 FT аккаунта
Получить индексированные строки FT-токенов аккаунта
Возвращает индексированные строки FT-токенов для указанного аккаунта. Балансы и `last_update_block_height` могут быть `null`, если индекс ещё не записал эти данные.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/fastnear/v1/account_ft
- https://docs.fastnear.com/ru/apis/fastnear/openapi/fungible-tokens/account_ft_v1
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v1/account/{account_id}/ft`
- Исходная спецификация: `apis/fastnear/v1/account_ft.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/v1/account/root.near/ft
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "account_id": "root.near"
  },
  "query": {}
}
```
### Входные данные
- `account_id` (путь, обязательный, string): ID аккаунта NEAR для проверки.
### Параметры пути

- `account_id` (путь, обязательный, string): ID аккаунта NEAR для проверки.

### Параметры запроса

- `apiKey` (query, string): Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Индексированные строки FT-токенов для указанного аккаунта
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "account_id",
    "токены"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "account_id",
      "required": true,
      "schema": {
        "type": "string"
      }
    },
    {
      "name": "токены",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "contract_id",
            "last_update_block_height",
            "balance"
          ],
          "additionalProperties": false,
          "properties": [
            {
              "name": "balance",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "contract_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "last_update_block_height",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            }
          ],
          "refName": "TokenRow"
        }
      }
    }
  ],
  "refName": "V1FtResponse"
}
```
