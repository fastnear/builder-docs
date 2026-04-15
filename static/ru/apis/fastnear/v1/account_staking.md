# FastNEAR API - V1 Аккаунт Staking
Поиск indexed staking pools for an аккаунта
Returns staking pool rows for the requested аккаунта. `last_update_block_height` is nullable when FastNEAR has not recorded a recent indexed update for that pool relationship.
## Ссылки на источник
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
- API-ключ через query `apiKey`: Optional API ключ forwarded by embedded portal clients. The public FastNEAR API does not require it.
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
- `account_id` (путь, обязательный, string): NEAR аккаунта ID to inspect.
### Параметры пути

- `account_id` (путь, обязательный, string): NEAR аккаунта ID to inspect.

### Параметры запроса

- `apiKey` (query, string): Optional API ключ forwarded by embedded portal clients. The public FastNEAR API does not require it.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Indexed staking pool rows for the requested аккаунта
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
