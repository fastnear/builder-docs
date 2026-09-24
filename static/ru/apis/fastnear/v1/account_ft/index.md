# FastNear API - V1 FT аккаунта
Получить индексированные строки FT-токенов аккаунта
Получите строки балансов FT-токенов аккаунта — каждая с ID контракта, балансом и высотой последнего обновления.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/fastnear/v1/account_ft
- https://docs.fastnear.com/ru/apis/fastnear/openapi/fungible-tokens/account_ft_v1
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v1/account/{account_id}/ft`
## OpenAPI
- Эта операция: https://docs.fastnear.com/openapi/fastnear/account_ft_v1.json (https://docs.fastnear.com/openapi/fastnear/account_ft_v1.yaml)
- Полный документ API: https://docs.fastnear.com/openapi/fastnear.json
- Указатель в полном документе: https://docs.fastnear.com/openapi/fastnear.json#/paths/~1v1~1account~1%7Baccount_id%7D~1ft/get
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
