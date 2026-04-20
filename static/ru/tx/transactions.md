# Транзакции API - Транзакции по хешу
Получить транзакции по хешу
Получите до 20 индексированных транзакций по хешу в одном запросе.
## Ссылки на источник
- https://docs.fastnear.com/ru/tx/transactions
- https://docs.fastnear.com/ru/apis/transactions/v0/transactions
- https://docs.fastnear.com/ru/apis/transactions/openapi/transactions/get_transactions
## Операция
- Транспорт: http
- Метод: POST
- Путь: `/v0/transactions`
- Исходная спецификация: `apis/transactions/v0/transactions.yaml`
## Сети
- Mainnet: https://tx.main.fastnear.com/
- Testnet: https://tx.test.fastnear.com/
## Авторизация
- Авторизация не требуется
## Текущий запрос
- Сеть: Mainnet
- Метод: POST
- URL: https://tx.main.fastnear.com/v0/transactions
- Активный пример: Mainnet
### Тело запроса
```json
{
  "tx_hashes": [
    "FDrh13CdfGPXsmwUpZLfkZCoXWfpQmaFGj4zYWc1qfh",
    "Eq1a46bynaBAjoSxd2XGWdCxkZdrMvN9jMZVdZfPSjM5"
  ]
}
```
## Справка по запросу
### Активный пример
```json
{
  "body": {
    "tx_hashes": [
      "FDrh13CdfGPXsmwUpZLfkZCoXWfpQmaFGj4zYWc1qfh",
      "Eq1a46bynaBAjoSxd2XGWdCxkZdrMvN9jMZVdZfPSjM5"
    ]
  },
  "headers": {},
  "path": {},
  "query": {}
}
```
### Входные данные
- `tx_hashes` (body, обязательный, array): Up to 20 base58-encoded transaction hashes to fetch in one request.
### Схема запроса
```json
{
  "type": "object",
  "required": [
    "tx_hashes"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "tx_hashes",
      "required": true,
      "schema": {
        "type": "array",
        "description": "Up to 20 base58-encoded transaction hashes to fetch in one request.",
        "items": {
          "type": "string"
        }
      }
    }
  ],
  "refName": "TxInput"
}
```
## Справка по ответу
- Статус: 200
- Тип данных: application/json
- Краткое описание: Найденные транзакции
### Схема ответа
```json
{
  "type": "object",
  "required": [
    "транзакции"
  ],
  "additionalProperties": false,
  "properties": [
    {
      "name": "транзакции",
      "required": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": true
        }
      }
    }
  ],
  "refName": "TransactionsResponse"
}
```
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
