---
sidebar_label: Examples
slug: /transfers/examples
title: "Примеры Transfers API"
description: "Пошаговые сценарии для поиска переводов, пагинации через resume_token и перехода к истории транзакций."
displayed_sidebar: transfersApiSidebar
page_actions:
  - markdown
---

## Готовый сценарий

### Отфильтровать и листать ленту переводов одного аккаунта

Используйте этот сценарий, когда история звучит так: «покажи мне осмысленную ленту переводов этого аккаунта, дай мне спокойно листать её дальше, и только потом, если нужно, помоги догнать одну строку до истории исполнения».

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Стратегия</span>
    <p className="fastnear-example-strategy__title">Сначала соберите саму ленту аккаунта, а `receipt` поднимайте только тогда, когда одна строка действительно требует истории исполнения.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">POST /v0/transfers</span> даёт первую страницу отфильтрованной ленты одного аккаунта.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">jq</span> поднимает сами строки плюс <span className="fastnear-example-strategy__code">resume_token</span>, чтобы вы могли продолжать листать ту же ленту.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">POST /v0/receipt</span> — это уже необязательный следующий шаг, если одной строке нужна её история исполнения.</span></p>
  </div>
</div>

**Сеть**

- только mainnet

**Что вы делаете**

- Забираете первую страницу одной отфильтрованной ленты переводов для выбранного аккаунта.
- Используете сами параметры ленты как главный учебный материал: `account_id`, `direction`, `asset_id`, `min_amount`, `desc` и `limit`.
- Сначала смотрите на строки ответа и `resume_token`, а не прыгаете сразу в историю исполнения.
- Только если какая-то строка действительно требует дополнительной истории, переиспользуете её `receipt_id` в Transactions API.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
ASSET_ID=native:near
MIN_AMOUNT=1000000000000000000000000

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg asset_id "$ASSET_ID" \
    --arg min_amount "$MIN_AMOUNT" '{
      account_id: $account_id,
      direction: "receiver",
      asset_id: $asset_id,
      min_amount: $min_amount,
      desc: true,
      limit: 10
    }')" \
  | tee /tmp/transfers-feed.json >/dev/null

jq '{
  resume_token,
  transfers: [
    .transfers[]
    | {
        transaction_id,
        receipt_id,
        asset_id,
        amount,
        human_amount,
        usd_amount,
        other_account_id,
        block_height
      }
  ]
}' /tmp/transfers-feed.json
```

Необязательный следующий шаг: если одной строке всё-таки нужна её точка исполнения, поднимите её `receipt_id` и один раз перейдите в Transactions API.

```bash
RECEIPT_ID="$(jq -r '.transfers[0].receipt_id' /tmp/transfers-feed.json)"

curl -s "$TX_BASE_URL/v0/receipt" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '{
      receipt_id: .receipt.receipt_id,
      transaction_hash: .receipt.transaction_hash,
      receiver_id: .receipt.receiver_id,
      tx_block_height: .receipt.tx_block_height
    }'
```

**Зачем нужен следующий шаг?**

Запрос переводов напрямую отвечает на первый вопрос: как сейчас выглядит отфильтрованная лента этого аккаунта и как её продолжать без потери места? Только после того как сама лента подскажет, какая строка действительно важна, имеет смысл переходить по `receipt_id` и забирать историю исполнения из `/tx`.

## Частые задачи

### Отфильтровать ленту переводов одного аккаунта

**Начните здесь**

- [Запрос переводов](/transfers/query) с аккаунтом и самым узким стабильным набором фильтров для ленты: направление, актив, сумма и порядок.

**Следующая страница при необходимости**

- Уточните те же фильтры по активу или сумме, если в первой странице всё ещё слишком много лишних строк.

**Остановитесь, когда**

- Уже можно объяснить, как выглядит эта отфильтрованная лента и как листать её дальше.

**Переходите дальше, когда**

- Одна конкретная строка уже требует истории исполнения или следа по receipt. Переходите к [Transactions API](/tx).

### Листать ленту переводов дальше и не потерять своё место

**Начните здесь**

- [Запрос переводов](/transfers/query) для первой страницы недавних событий, используя как можно более узкие и стабильные фильтры.

**Следующая страница при необходимости**

- Переиспользуйте ровно тот `resume_token`, который вернул сервис, чтобы получить следующую страницу с теми же фильтрами.
- Не меняйте фильтры во время пагинации, иначе это уже будет не та же самая лента.

**Остановитесь, когда**

- У вас уже достаточно страниц, чтобы ответить на запрос ленты, поддержки или комплаенса.

**Переходите дальше, когда**

- Пользователь просит метаданные транзакции сверх самих переводов.
- Нужны балансы или активы, а не только движение. Переходите к [FastNear API](/api).

### Перейти от истории переводов к полному расследованию транзакции

**Начните здесь**

- [Запрос переводов](/transfers/query), чтобы выделить конкретные интересующие переводы.

**Следующая страница при необходимости**

- [История аккаунта в Transactions API](/tx/account), если нужна окружающая история исполнения для того же аккаунта.
- [Transactions by Hash](/tx/transactions), когда уже понятно, какую транзакцию смотреть дальше.

**Остановитесь, когда**

- Уже определено правильное событие перевода и понятно, какой API открывать следующим.

**Переходите дальше, когда**

- Пользователю прямо нужны receipt-детали или точное подтверждение через RPC. Сначала переходите к [Transactions API](/tx), затем к [RPC Reference](/rpc), если потребуется.

## Частые ошибки

- Использовать Transfers API, когда пользователю на самом деле нужны балансы, активы или сводки аккаунта.
- Считать историю переводов полной историей исполнения.
- Переиспользовать `resume_token` с другими фильтрами.

## Полезные связанные страницы

- [Transfers API](/transfers)
- [Transactions API](/tx)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
