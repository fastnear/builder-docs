---
sidebar_label: Examples
slug: /transfers/examples
title: "Примеры Transfers API"
description: "Практические примеры: фильтрация ленты переводов, пагинация и переход к истории транзакций."
displayed_sidebar: transfersApiSidebar
page_actions:
  - markdown
---

## Пример

### Отфильтровать и листать ленту переводов одного аккаунта

`/v0/transfers` возвращает отфильтрованную ленту плюс `resume_token`, который вы переиспользуете *без изменения фильтров*, чтобы продолжать листать. В каждой строке уже есть `human_amount`, `usd_amount`, `transaction_id` и `receipt_id` — большинство audit-вопросов закрываются без второго запроса.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=root.near

FEED="$(curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    account_id: $account_id,
    direction: "receiver",
    asset_id: "native:near",
    min_amount: "1000000000000000000000000",
    desc: true,
    limit: 10
  }')")"

echo "$FEED" | jq '{
  resume_token,
  transfers: [.transfers[] | {block_height, amount, human_amount, usd_amount, other_account_id, transaction_id, receipt_id}]
}'
```

Для зафиксированного аккаунта это возвращает недавние входящие native-NEAR переводы не меньше 1 NEAR — в примерных строках видны native-переводы с `escrow.ai.near` и уже посчитанным USD. Чтобы получить следующую страницу, отправьте то же тело с верхнеуровневым `resume_token: "<value>"`; изменение любого другого фильтра делает токен недействительным.

Когда одной строке нужна точка исполнения, возьмите её `receipt_id` и сразу обратитесь к `/v0/receipt`:

```bash
RECEIPT_ID="$(echo "$FEED" | jq -r '.transfers[0].receipt_id')"

curl -s "$TX_BASE_URL/v0/receipt" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '.receipt | {receipt_id, transaction_hash, receiver_id, predecessor_id, tx_block_height, is_success}'
```

Это тот же переход, что описан в [Превратить один неказистый receipt ID из логов в человекочитаемую историю](/tx/examples#превратить-один-неказистый-receipt-id-из-логов-в-человекочитаемую-историю) — один запрос возвращает и квитанцию, и её родительскую транзакцию целиком.

## Частые ошибки

- Использовать Transfers API, когда пользователю на самом деле нужны балансы, активы или сводки аккаунта.
- Считать историю переводов полной историей исполнения.
- Переиспользовать `resume_token` с другими фильтрами.

## Связанные страницы

- [Transfers API](/transfers)
- [Transactions API](/tx)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
