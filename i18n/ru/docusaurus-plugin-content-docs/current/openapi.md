---
title: Спецификации OpenAPI
description: Машиночитаемые документы OpenAPI для каждого семейства API FastNear и каждой операции, а также JSON-индекс для агентов и инструментов.
slug: /openapi
displayed_sidebar: rpcSidebar
page_actions:
  - markdown
keywords:
  - openapi
  - OpenAPI
  - swagger
  - спецификация api
  - json schema
  - агенты
---

# Спецификации OpenAPI

Каждое семейство API FastNear опубликовано как документ OpenAPI, который можно получить напрямую, а каждая операция опубликована ещё и отдельно. Если вы инструмент или агент, начните с индекса:

```bash
curl -s https://docs.fastnear.com/openapi/index.json
```

## Документы семейств

| Семейство | OpenAPI | Документация |
| --- | --- | --- |
| FastNEAR RPC (JSON-RPC) | [JSON](/openapi/rpc.json) · [YAML](/openapi/rpc.yaml) | [Справочник RPC](/rpc) |
| FastNEAR API | [JSON](/openapi/fastnear.json) · [YAML](/openapi/fastnear.yaml) | [FastNear API](/api) |
| Transactions API | [JSON](/openapi/transactions.json) · [YAML](/openapi/transactions.yaml) | [Transactions API](/tx) |
| Transfers API | [JSON](/openapi/transfers.json) · [YAML](/openapi/transfers.yaml) | [Transfers API](/transfers) |
| KV FastData API | [JSON](/openapi/kv-fastdata.json) · [YAML](/openapi/kv-fastdata.yaml) | [KV FastData API](/fastdata/kv) |
| NEAR Data API | [JSON](/openapi/neardata.json) · [YAML](/openapi/neardata.yaml) | [NEAR Data API](/neardata) |

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
- Markdown-зеркала, [`llms.txt`](/llms.txt) и [граф сайта](/structured-data/site-graph.json) содержат те же URL.

## Аутентификация

Передавайте API-ключ FastNear в заголовке `Authorization: Bearer` или в параметре запроса `?apiKey=`; см. [Аутентификацию и доступ](/auth). Блок `security` в каждом документе перечисляет обе формы.
