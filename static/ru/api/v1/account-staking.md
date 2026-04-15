# FastNEAR API — V1 стейкинг аккаунта
Поиск индексированных стейкинг-пулов аккаунта
Возвращает записи стейкинг-пулов для указанного аккаунта. Поле `last_update_block_height` может быть null, если FastNEAR не записал недавнее индексированное обновление для этой связи с пулом.
## Ссылки на источник
- https://docs.fastnear.com/ru/api/v1/account-staking
- https://docs.fastnear.com/ru/apis/fastnear/v1/account_staking
- https://docs.fastnear.com/ru/apis/fastnear/openapi/staking/account_staking_v1
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v1/account/{account_id}/staking`
- Исходная спецификация: `apis/fastnear/v1/account_staking.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ, передаваемый встраиваемыми клиентами портала. Публичный FastNEAR API его не требует.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/v1/account/root.near/staking
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

- `apiKey` (query, string): Необязательный API-ключ, передаваемый встраиваемыми клиентами портала. Публичный FastNEAR API его не требует.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Индексированные записи стейкинг-пулов для указанного аккаунта
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "account_id",
    "pools"
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
      "name": "pools",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "pool_id",
            "last_update_block_height"
          ],
          "additionalProperties": false,
          "properties": [
            {
              "name": "last_update_block_height",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "uint64"
              }
            },
            {
              "name": "pool_id",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "refName": "PoolRow"
        }
      }
    }
  ],
  "refName": "V1StakingResponse"
}
```
