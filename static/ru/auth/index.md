**Источник:** [https://docs.fastnear.com/ru/auth](https://docs.fastnear.com/ru/auth)

# Аутентификация и доступ

Один API-ключ FastNear работает и для [RPC](https://docs.fastnear.com/ru/rpc), и для [REST API](https://docs.fastnear.com/ru/api). Войдите на [dashboard.fastnear.com](https://dashboard.fastnear.com), чтобы получить ключ, и отправляйте его в каждом запросе одним из способов ниже.

Страницы с live-примерами также поддерживают `Copy example URL`, чтобы делиться уже заполненными запросами. Общие URL примеров выполняются автоматически при загрузке, когда в них есть состояние операции, а сохранённые API-ключи и токены никогда не включаются в такие общедоступные URL документации.

## Через заголовок Authorization

```bash
curl "https://rpc.mainnet.fastnear.com" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  --data '{"method":"block","params":{"finality":"final"},"id":1,"jsonrpc":"2.0"}'
```

## Через URL-параметр `?apiKey=`

```bash
curl "https://rpc.mainnet.fastnear.com?apiKey=${API_KEY}" \
  -H "Content-Type: application/json" \
  --data '{"method":"block","params":{"finality":"final"},"id":1,"jsonrpc":"2.0"}'
```
