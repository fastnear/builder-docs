---
sidebar_label: Examples
slug: /transfers/examples
title: "Примеры Transfers API"
description: "Практические примеры: фильтрация ленты переводов, пагинация и переход к истории транзакций."
displayed_sidebar: transfersApiSidebar
page_actions:
  - markdown
---

## Примеры

### Какая у этого аккаунта свежая активность по переводам?

`/v0/transfers` всего с `account_id` и `desc: true` возвращает самые свежие переводы, касающиеся этого аккаунта, по всем типам активов, в обоих направлениях сразу. В каждой строке уже есть `human_amount`, `asset_id` и `transaction_id`, так что этот поток заодно служит быстрым сканом активности до того, как вы достанете фильтры.

```bash
ACCOUNT_ID=root.near
FASTNEAR_API_KEY=your_api_key

curl -s "https://transfers.main.fastnear.com/v0/transfers" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{account_id: $account_id, desc: true, limit: 5}')" \
  | jq '{
      recent: [.transfers[] | {
        block_height,
        asset_id,
        human_amount,
        other_account_id,
        transfer_type,
        tx: .transaction_id
      }]
    }'
```

Для `root.near` последние строки смешивают активы `FtTransfer` и `MtTransfer`. `asset_id` использует URI по NEP-стандартам (`native:near`, `nep141:...`, `nep245:...`), так что одно поле уже подсказывает, к какому стандарту тянуться дальше. Положительный `human_amount` означает, что аккаунт получил; отрицательный — что отправил. `other_account_id: null` — норма для multi-token-форм, где контрагент сидит внутри границы контракта, а не как отдельный аккаунт верхнего уровня.

### Отфильтровать и листать ленту переводов одного аккаунта

`/v0/transfers` возвращает отфильтрованную ленту плюс `resume_token`, который вы переиспользуете *без изменения фильтров*, чтобы продолжать листать. В каждой строке уже есть `human_amount`, `usd_amount`, `transaction_id` и `receipt_id` — большинство audit-вопросов закрываются без второго запроса.

```bash
ACCOUNT_ID=root.near
FASTNEAR_API_KEY=your_api_key

FEED="$(curl -s "https://transfers.main.fastnear.com/v0/transfers" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
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

curl -s "https://tx.main.fastnear.com/v0/receipt" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '.receipt | {receipt_id, transaction_hash, receiver_id, predecessor_id, tx_block_height, is_success}'
```

Это тот же переход, что описан в [Превратить один receipt ID в читаемую историю транзакции](/tx/examples#receipt-id-to-readable-story) — один запрос возвращает и квитанцию, и её родительскую транзакцию целиком.

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
