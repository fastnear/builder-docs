# FastNear API - V1 NFT аккаунта
Получить индексированные строки NFT аккаунта
Получите строки NFT-контрактов для аккаунта, каждая с метаданными по высоте блока.
## Ссылки на источник
- https://docs.fastnear.com/ru/api/v1/account-nft
- https://docs.fastnear.com/ru/apis/fastnear/v1/account_nft
- https://docs.fastnear.com/ru/apis/fastnear/openapi/non-fungible-tokens/account_nft_v1
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v1/account/{account_id}/nft`
- Исходная спецификация: `apis/fastnear/v1/account_nft.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Необязательный API-ключ, который могут передавать встроенные клиенты портала. Публичный FastNear API не требует его.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/v1/account/root.near/nft
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
- Краткое описание: Индексированные строки NFT-контрактов для указанного аккаунта
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
            "last_update_block_height"
          ],
          "additionalProperties": false,
          "properties": [
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
          "refName": "NftRow"
        }
      }
    }
  ],
  "refName": "V1NftResponse"
}
```
