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
## OpenAPI
- Эта операция: https://docs.fastnear.com/openapi/fastnear/account_nft_v0.json (https://docs.fastnear.com/openapi/fastnear/account_nft_v0.yaml)
- Полный документ API: https://docs.fastnear.com/openapi/fastnear.json
- Указатель в полном документе: https://docs.fastnear.com/openapi/fastnear.json#/paths/~1v0~1account~1%7Baccount_id%7D~1nft/get
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- Bearer-токен через заголовок `Authorization: Bearer <token>`
- API-ключ через query `apiKey`: API-ключ FastNEAR в параметре запроса `apiKey`. Удобно для curl и клиентов, которые не могут задавать заголовки, но ключ может попасть в URL, логи и историю команд оболочки.
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
