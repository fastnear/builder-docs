# FastNEAR API — V1 топ держателей FT
Поиск индексированных топ-держателей FT-токена
Получите список держателей с наибольшим балансом для FT-контракта, отсортированный по убыванию баланса.
## Ссылки на источник
- https://docs.fastnear.com/ru/api/v1/ft-top
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
- API-ключ через query `apiKey`: Необязательный API-ключ, передаваемый встраиваемыми клиентами портала. Публичный FastNEAR API его не требует.
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
- `token_id` (путь, обязательный, string): ID аккаунта контракта FT-токена.
### Параметры пути

- `token_id` (путь, обязательный, string): ID аккаунта контракта FT-токена.

### Параметры запроса

- `apiKey` (query, string): Необязательный API-ключ, передаваемый встраиваемыми клиентами портала. Публичный FastNEAR API его не требует.

## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Индексированные топ-держатели указанного FT-токена
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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
