# RPC протокола NEAR: Метрики узла
Получить метрики узла
Возвращает метрики узла в формате Prometheus с HTTP-эндпоинта `/metrics`. Требуется API-ключ.
## Ссылки на источник
- https://docs.fastnear.com/ru/rpcs/protocol/metrics
- https://docs.fastnear.com/ru/rpcs/protocol/metrics/other/metrics
- https://docs.fastnear.com/ru/reference/operation/metrics
## Операция
- Транспорт: json-rpc
- Метод: GET
- Путь: `/metrics`
- Исходная спецификация: `rpcs/protocol/metrics.yaml`
## Сети
- Mainnet: https://rpc.mainnet.fastnear.com/
- Testnet: https://rpc.testnet.fastnear.com/
## Авторизация
- API-ключ через query `apiKey`: Контракт OpenAPI описывает API-ключ FastNear как параметр запроса `apiKey`.
- Этот экспорт намеренно не включает локально сохранённые учётные данные
## Текущий запрос
- Сеть: Mainnet
- Финальность: final
- Эндпоинт: https://rpc.mainnet.fastnear.com/
### Тело запроса
```json
{
  "jsonrpc": "2.0",
  "id": "fastnear",
  "method": "metrics",
  "params": {}
}
```
## Справка по запросу
## Справка по ответу
- Статус: 200
- Тип данных: text/plain
- Краткое описание: Успешный ответ
### Схема ответа
```json
{
  "type": "string",
  "description": "Prometheus exposition text",
  "example": "# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.\n# TYPE process_cpu_seconds_total counter\nprocess_cpu_seconds_total 12.34"
}
```
