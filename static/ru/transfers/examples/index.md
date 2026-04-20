**Источник:** [https://docs.fastnear.com/ru/transfers/examples](https://docs.fastnear.com/ru/transfers/examples)

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

Это тот же переход, что описан в [Превратить один неказистый receipt ID из логов в человекочитаемую историю](https://docs.fastnear.com/ru/tx/examples#%D0%BF%D1%80%D0%B5%D0%B2%D1%80%D0%B0%D1%82%D0%B8%D1%82%D1%8C-%D0%BE%D0%B4%D0%B8%D0%BD-%D0%BD%D0%B5%D0%BA%D0%B0%D0%B7%D0%B8%D1%81%D1%82%D1%8B%D0%B9-receipt-id-%D0%B8%D0%B7-%D0%BB%D0%BE%D0%B3%D0%BE%D0%B2-%D0%B2-%D1%87%D0%B5%D0%BB%D0%BE%D0%B2%D0%B5%D0%BA%D0%BE%D1%87%D0%B8%D1%82%D0%B0%D0%B5%D0%BC%D1%83%D1%8E-%D0%B8%D1%81%D1%82%D0%BE%D1%80%D0%B8%D1%8E) — один запрос возвращает и квитанцию, и её родительскую транзакцию целиком.

## Частые ошибки

- Использовать Transfers API, когда пользователю на самом деле нужны балансы, активы или сводки аккаунта.
- Считать историю переводов полной историей исполнения.
- Переиспользовать `resume_token` с другими фильтрами.

## Связанные страницы

- [Transfers API](https://docs.fastnear.com/ru/transfers)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
