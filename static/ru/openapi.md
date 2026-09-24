**Источник:** [https://docs.fastnear.com/ru/openapi](https://docs.fastnear.com/ru/openapi)

# Спецификации OpenAPI

Каждое семейство API FastNear опубликовано как документ OpenAPI, который можно получить напрямую, а каждая операция опубликована ещё и отдельно. Если вы инструмент или агент, начните с индекса:

```bash
curl -s https://docs.fastnear.com/openapi/index.json
```

## Документы семейств

| Семейство | OpenAPI | Документация |
| --- | --- | --- |
| FastNEAR RPC (JSON-RPC) | [JSON](https://docs.fastnear.com/ru/openapi/rpc.json) · [YAML](https://docs.fastnear.com/ru/openapi/rpc.yaml) | [Справочник RPC](https://docs.fastnear.com/ru/rpc) |
| FastNEAR API | [JSON](https://docs.fastnear.com/ru/openapi/fastnear.json) · [YAML](https://docs.fastnear.com/ru/openapi/fastnear.yaml) | [FastNear API](https://docs.fastnear.com/ru/api) |
| Transactions API | [JSON](https://docs.fastnear.com/ru/openapi/transactions.json) · [YAML](https://docs.fastnear.com/ru/openapi/transactions.yaml) | [Transactions API](https://docs.fastnear.com/ru/tx) |
| Transfers API | [JSON](https://docs.fastnear.com/ru/openapi/transfers.json) · [YAML](https://docs.fastnear.com/ru/openapi/transfers.yaml) | [Transfers API](https://docs.fastnear.com/ru/transfers) |
| KV FastData API | [JSON](https://docs.fastnear.com/ru/openapi/kv-fastdata.json) · [YAML](https://docs.fastnear.com/ru/openapi/kv-fastdata.yaml) | [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv) |
| NEAR Data API | [JSON](https://docs.fastnear.com/ru/openapi/neardata.json) · [YAML](https://docs.fastnear.com/ru/openapi/neardata.yaml) | [NEAR Data API](https://docs.fastnear.com/ru/neardata) |

Каждый документ содержит собственные `servers`, `security` и схемы компонентов, поэтому его можно импортировать в любой инструмент OpenAPI или генератор клиентов как есть. Документ RPC описывает каждый JSON-RPC-метод как отдельный путь, например `/view_account`, и все они отправляются POST-запросом в корень сервера.

## Документы отдельных операций

Каждая операция также доступна как самостоятельный документ по адресу `/openapi/<family>/<operationId>.json` (или `.yaml`), например:

```text
https://docs.fastnear.com/openapi/rpc/view_account.json
https://docs.fastnear.com/openapi/fastnear/account_full_v1.json
```

Индекс перечисляет каждую операцию с её `operationId`, собственным документом, страницей документации и ссылкой-указателем JSON внутрь документа семейства, например `/openapi/rpc.json#/paths/~1view_account/post`.

## Где находятся ссылки

- На каждой странице операции есть строка **OpenAPI** со ссылками на её собственный документ и на документ семейства.
- Каждая обзорная страница семейства ссылается на свой документ в разделе **Базовые URL**.
- В заголовке страниц есть `<link rel="service-desc" type="application/vnd.oai.openapi+json">` для документа семейства и `rel="describedby"` для документа операции, чтобы краулеры и агенты находили спецификацию, не читая страницу.
- Markdown-зеркала, [`llms.txt`](https://docs.fastnear.com/ru/llms.txt) и [граф сайта](https://docs.fastnear.com/ru/structured-data/site-graph.json) содержат те же URL.

## Аутентификация

Передавайте API-ключ FastNear в заголовке `Authorization: Bearer` или в параметре запроса `?apiKey=`; см. [Аутентификацию и доступ](https://docs.fastnear.com/ru/auth). Блок `security` в каждом документе перечисляет обе формы.
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
