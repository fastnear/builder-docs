# FastNear API - V0 NFT аккаунта
Получить ID NFT-контрактов аккаунта
Получите ID NFT-контрактов, которых касался аккаунт — только ID, без метаданных по высоте блока.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/fastnear/v0/account_nft
- https://docs.fastnear.com/ru/apis/fastnear/openapi/non-fungible-tokens/account_nft_v0
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v0/account/{account_id}/nft`
- Исходная спецификация: `apis/fastnear/v0/account_nft.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ, который передают встроенные клиенты портала. Публичный FastNear API его не требует.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/v0/account/root.near/nft
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

- `apiKey` (query, string): Необязательный API-ключ, который передают встроенные клиенты портала. Публичный FastNear API его не требует.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: ID NFT-контрактов для запрошенного аккаунта
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "account_id",
    "contract_ids"
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
      "name": "contract_ids",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    }
  ],
  "refName": "V0ContractsResponse"
}
```
