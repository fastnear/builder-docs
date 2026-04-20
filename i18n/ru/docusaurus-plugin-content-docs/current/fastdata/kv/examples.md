---
sidebar_label: Examples
slug: /fastdata/kv/examples
title: "Примеры KV FastData"
description: "Практические примеры для проверки точных storage-key, чтения индексированной истории записей и подтверждения текущего состояния через RPC."
displayed_sidebar: kvFastDataSidebar
page_actions:
  - markdown
---

## Пример

### Посмотреть индексированные записи одного `predecessor_id`, а затем сузиться до ключа, который изменился

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Ход</span>
    <p className="fastnear-example-strategy__title">Начните с области по `predecessor_id`, переходите к точному ключу только после того, как он заслужил внимание, а RPC оставляйте на самый конец.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">all-by-predecessor</span> даёт последние индексированные строки для одного `predecessor_id` по затронутым контрактам.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">get-history-key</span> или <span className="fastnear-example-strategy__code">history-by-predecessor</span> объясняют, как менялась интересующая строка во времени.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC view_state</span> — это уже необязательное точное чтение, когда нужен именно канонический current state, а не индексированная история.</span></p>
  </div>
</div>

### Shell-сценарий по области предшественника
**Ход**

- Читаете последние индексированные строки для одного `predecessor_id` по затронутым контрактам.
- Поднимаете интересующие `current_account_id` и точный `key` через `jq`.
- Переиспользуете эти значения в документированном маршруте истории по точному ключу.
- Только после этого решаете, нужен ли вам `view_state` для канонического current state.

```bash
KV_BASE_URL=https://kv.main.fastnear.com
PREDECESSOR_ID=james.near

curl -s "$KV_BASE_URL/v0/all/$PREDECESSOR_ID" \
  -H 'content-type: application/json' \
  --data '{"include_metadata":true,"limit":10}' \
  | tee /tmp/kv-predecessor.json >/dev/null

jq '{
  page_token,
  entries: [
    .entries[]
    | {
        current_account_id,
        predecessor_id,
        block_height,
        key,
        value
      }
  ]
}' /tmp/kv-predecessor.json

CURRENT_ACCOUNT_ID="$(jq -r '.entries[0].current_account_id' /tmp/kv-predecessor.json)"
EXACT_KEY="$(jq -r '.entries[0].key' /tmp/kv-predecessor.json)"
ENCODED_KEY="$(jq -rn --arg key "$EXACT_KEY" '$key | @uri')"

curl -s "$KV_BASE_URL/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY" \
  | jq '{
      entries: [
        .entries[]
        | {
            current_account_id,
            predecessor_id,
            block_height,
            key,
            value
          }
      ]
    }'
```

**Когда переходить дальше**

Первый запрос отвечает на вопрос по области: «что этот `predecessor_id` сейчас пишет?». Сужение из этой ленты до одного точного ключа отвечает на более точный вопрос: «как именно эта строка дошла до такого состояния?». Если картина всё ещё шире одного ключа, ещё немного побудьте на [History by Predecessor](/fastdata/kv/history-by-predecessor), а уже потом переходите к точной истории ключа или RPC.

## Частые задачи

### Начать с записей одного `predecessor_id`

**Начните здесь**

- [Всё по `predecessor_id`](/fastdata/kv/all-by-predecessor), когда вы знаете, кто писал строки, но ещё не знаете, какой точный ключ важнее всего.

**Следующая страница при необходимости**

- [История по точному ключу](/fastdata/kv/get-history-key), если одна строка становится настоящим фокусом.
- [История по `predecessor_id`](/fastdata/kv/history-by-predecessor), если более широкая картина записей всё ещё важнее точного ключа.

**Остановитесь, когда**

- Уже можно объяснить, что писал этот `predecessor_id`, и заслуживает ли одна строка более глубокой истории.

**Переходите дальше, когда**

- Пользователю нужно каноническое текущее состояние в цепочке, а не индексированная история записей. Переходите к [View State](/rpc/contract/view-state).

### Превратить один точный ключ в историю изменений

**Начните здесь**

- [История по точному ключу](/fastdata/kv/get-history-key) для поиска истории по пути.
- [History by Key](/fastdata/kv/history-by-key), когда лучше подходит маршрут по полному ключу.

**Следующая страница при необходимости**

- Возвращайтесь к [Последнему по точному ключу](/fastdata/kv/get-latest-key), если нужно увидеть текущее индексированное значение рядом с историей.

**Остановитесь, когда**

- Уже можно объяснить, как ключ менялся со временем.

**Переходите дальше, когда**

- Пользователь спрашивает, совпадает ли последнее индексированное значение с тем, что цепочка возвращает прямо сейчас.

### Проследить записи от одного `predecessor_id`

**Начните здесь**

- [Всё по `predecessor_id`](/fastdata/kv/all-by-predecessor) для последних записей по контрактам, затронутым одним предшественником.
- [История по `predecessor_id`](/fastdata/kv/history-by-predecessor), когда нужна история записей во времени.

**Следующая страница при необходимости**

- Сузьте область до точного ключа, если одна строка становится настоящим фокусом расследования.

**Остановитесь, когда**

- Уже можно ответить, что именно этот предшественник изменил и где.

**Переходите дальше, когда**

- Пользователя перестают интересовать индексированные записи и начинает интересовать текущее состояние в цепочке.

### Пакетно проверить несколько известных ключей

**Начните здесь**

- [Пакетный поиск по ключам](/fastdata/kv/multi), когда уже известен фиксированный набор точных ключей.

**Следующая страница при необходимости**

- Переведите один интересный ключ в [Историю по точному ключу](/fastdata/kv/get-history-key), если batch-ответ вызывает исторический вопрос.

**Остановитесь, когда**

- Пакетный ответ уже показывает, какие ключи действительно важны.

**Переходите дальше, когда**

- У вас больше нет фиксированного списка ключей и нужно смотреть на контракт или предшественника шире.

## Частые ошибки

- Начинать с широких выборок по аккаунту или предшественнику, когда точный ключ уже известен.
- Использовать KV FastData, хотя пользователю на самом деле нужны балансы или активы.
- Путать индексированную историю с точным текущим состоянием в цепочке.
- Переиспользовать токен пагинации или менять фильтры прямо во время просмотра.

## Полезные связанные страницы

- [KV FastData API](/fastdata/kv)
- [RPC Reference](/rpc)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
