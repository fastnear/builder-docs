**Источник:** [https://docs.fastnear.com/ru/transfers/examples](https://docs.fastnear.com/ru/transfers/examples)

## Быстрый старт

Начните с узкого окна исходящих переводов и сначала выведите строки, а уже потом переходите к receipts.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
FROM_TIMESTAMP_MS=1711929600000
TO_TIMESTAMP_MS=1712016000000

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --argjson from_timestamp_ms "$FROM_TIMESTAMP_MS" \
    --argjson to_timestamp_ms "$TO_TIMESTAMP_MS" '{
      account_id: $account_id,
      direction: "sender",
      from_timestamp_ms: $from_timestamp_ms,
      to_timestamp_ms: $to_timestamp_ms,
      desc: true,
      limit: 10
    }')" \
  | jq '{
      resume_token,
      transfers: [
        .transfers[]
        | {
            transaction_id,
            receipt_id,
            asset_id,
            amount,
            other_account_id,
            block_height
          }
      ]
    }'
```

Это самый короткий путь к вопросу «были ли здесь движения средств и какую строку стоит разбирать дальше?»

## Готовый сценарий

### Отправлял ли этот аккаунт средства в этом окне и какую строку стоит разобрать?

Используйте этот сценарий, когда история звучит так: «мне сначала нужно одно узкое окно исходящих переводов, и только после просмотра строк я решу, нужен ли одной из них follow-up по receipt».

    Стратегия
    Сначала ответьте на вопрос о движении средств, а затем расширяйтесь только если одной строке всё ещё нужен execution-anchor.

    01POST /v0/transfers даёт узкое исходящее окно и конкретное движение, которое стоит догонять.
    02Сначала выведите строки, а затем явно выберите один transfer_index перед тем, как поднимать его receipt_id.
    03POST /v0/receipt — необязательный follow-up, когда вы хотите понять, что именно эта строка перевода сделала on-chain.

**Что вы делаете**

- Запрашиваете ограниченное окно исходящих переводов одного аккаунта в mainnet.
- Сначала выводите строки, а затем выбираете одну строку перевода, которая действительно похожа на нужное вам движение.
- Переиспользуете её `receipt_id` только если нужно перейти от движения актива к истории исполнения.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
FROM_TIMESTAMP_MS=1711929600000
TO_TIMESTAMP_MS=1712016000000
TRANSFER_INDEX=0

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --argjson from_timestamp_ms "$FROM_TIMESTAMP_MS" \
    --argjson to_timestamp_ms "$TO_TIMESTAMP_MS" '{
      account_id: $account_id,
      direction: "sender",
      from_timestamp_ms: $from_timestamp_ms,
      to_timestamp_ms: $to_timestamp_ms,
      desc: true,
      limit: 10
    }')" \
  | tee /tmp/transfers-window.json >/dev/null

jq '{
  resume_token,
  transfers: [
    .transfers
    | to_entries[]
    | {
        transfer_index: .key,
        transaction_id: .value.transaction_id,
        receipt_id: .value.receipt_id,
        asset_id: .value.asset_id,
        amount: .value.amount,
        other_account_id: .value.other_account_id,
        block_height: .value.block_height
      }
  ]
}' /tmp/transfers-window.json

RECEIPT_ID="$(
  jq -r --argjson transfer_index "$TRANSFER_INDEX" \
    '.transfers[$transfer_index].receipt_id // empty' \
    /tmp/transfers-window.json
)"

printf 'Chosen transfer index: %s\n' "$TRANSFER_INDEX"
printf 'Chosen receipt id: %s\n' "$RECEIPT_ID"
```

Этим вы отвечаете на первый вопрос: было ли здесь движение средств и какую строку перевода стоит разбирать дальше?

#### Необязательное продолжение: Что сделала эта строка перевода on-chain?

Переходите к истории receipt только если самой строки перевода уже недостаточно.

```bash
TX_BASE_URL=https://tx.main.fastnear.com

if [ -n "$RECEIPT_ID" ]; then
  curl -s "$TX_BASE_URL/v0/receipt" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
    | jq '{
        receipt_id: .receipt.receipt_id,
        transaction_hash: .receipt.transaction_hash,
        receiver_id: .receipt.receiver_id,
        tx_block_height: .receipt.tx_block_height
      }'
fi
```

**Зачем нужен следующий шаг?**

Запрос переводов быстро отвечает на первый вопрос: отправлял ли этот аккаунт средства в этом окне и кому именно? Переход по `receipt_id` — это необязательный второй вопрос: какая execution-anchor стоит за этой одной строкой? Если после этого всё ещё нужно больше строк, продолжайте пагинацию тем же `resume_token` и теми же фильтрами.

## Частые ошибки

- Использовать Transfers API, когда пользователю на самом деле нужны балансы, активы или сводки аккаунта.
- Считать историю переводов полной историей исполнения.
- Переиспользовать `resume_token` с другими фильтрами.
- Начинать здесь с вопросов про testnet, хотя этот API сегодня работает только в mainnet.

## Полезные связанные страницы

- [Transfers API](https://docs.fastnear.com/ru/transfers)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
