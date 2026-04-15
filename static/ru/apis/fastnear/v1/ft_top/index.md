# FastNEAR API - V1 FT Top Holders
Поиск top indexed holders for a fungible token
Returns the top indexed аккаунтов by balance for the requested fungible token.
## Ссылки на источник
- https://docs.fastnear.com/ru/apis/fastnear/v1/ft_top
- https://docs.fastnear.com/ru/apis/fastnear/openapi/fungible-tokens/ft_top_v1
## Операция
- Транспорт: http
- Метод: GET
- Путь: `/v1/ft/{token_id}/top`
- Исходная спецификация: `apis/fastnear/v1/ft_top.yaml`
## Сети
- Mainnet: https://api.fastnear.com/
- Testnet: https://test.api.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Optional API ключ forwarded by embedded portal clients. The public FastNEAR API does not require it.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Метод: GET
- URL: https://api.fastnear.com/v1/ft/wrap.near/top
- Активный пример: Mainnet
## Справка по запросу
### Активный пример
```json
{
  "body": null,
  "headers": {},
  "path": {
    "token_id": "wrap.near"
  },
  "query": {}
}
```
### Входные данные
- `token_id` (путь, обязательный, string): Fungible token контракта аккаунта ID.
### Параметры пути

- `token_id` (путь, обязательный, string): Fungible token контракта аккаунта ID.

### Параметры запроса

- `apiKey` (query, string): Optional API ключ forwarded by embedded portal clients. The public FastNEAR API does not require it.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Indexed top holders for the requested fungible token
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "token_id",
    "аккаунтов"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "аккаунтов",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "account_id",
            "balance"
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
              "name": "balance",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "refName": "AccountBalanceRow"
        }
      }
    },
    {
      "name": "token_id",
      "required": true,
      "schema": {
        "type": "string"
      }
    }
  ],
  "refName": "TokenAccountsResponse"
}
```
